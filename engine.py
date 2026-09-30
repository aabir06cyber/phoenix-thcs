import os
import json
import warnings
import numpy as np
import pandas as pd
import cv2
import requests
import torch
import ee
from PIL import Image
from datetime import datetime

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Global Constants & Thresholds
# ---------------------------------------------------------------------------
PERSIST_MIN_ACTIVE_DAYS = 3      
PERSIST_MIN_DENSITY = 2.0        
BRIGHTNESS_SATURATION_K = 366.0  

HYPOTHESIS_PROMPTS = {
    "Wildfire / Forest Fire": "top down satellite view of forest wildfire with dense smoke and natural trees",
    "Stubble Burning": "top down satellite view of crop residue burning in open agricultural fields",
    "Industrial Activity": "top down satellite view of an oil refinery with storage tanks and flare stacks",
    "Mining Activity": "top down satellite view of open pit mining and quarry excavation site",
    "Uncertain / Ambiguous Event": "top down satellite view of open land",
}

INFRA_TYPE_PROMPTS = {
    "quarry": ("Mining Activity", "top down satellite view of open pit mining and quarry excavation site"),
    "power": ("Industrial Activity", "top down satellite view of a power plant with cooling towers and transmission infrastructure"),
    "factory": ("Industrial Activity", "top down satellite view of a factory building complex with industrial rooftops"),
    "industrial": ("Industrial Activity", "top down satellite view of an oil refinery with storage tanks and flare stacks"),
}

CLASSIFY_INFRA_BUFFER_M = 1000.0
INFRA_DIST_TO_TYPE = {
    "dist_to_quarry_m": "quarry",
    "dist_to_power_m": "power",
    "dist_to_factory_m": "factory",
    "dist_to_industrial_m": "industrial",
}

FOREST_LULC = {"Trees", "Rangeland", "Flooded Vegetation"}
CROP_LULC = {"Crops"}

VIIRS_PIXEL_M = 375.0
VIIRS_GEOLOCATION_UNCERTAINTY_M = 150.0
BASE_CROP_SIDE_M = 2.0 * (VIIRS_PIXEL_M + 2 * VIIRS_GEOLOCATION_UNCERTAINTY_M)
BASE_HALF_SIDE_M = BASE_CROP_SIDE_M / 2
INFRA_FACILITY_MARGIN_M = 300.0
MAX_HALF_SIDE_M = 3000.0
CROP_PX = 512

S2_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
CLOUD_PROB_COLLECTION = "COPERNICUS/S2_CLOUD_PROBABILITY"
SEARCH_WINDOW_DAYS = 20
GSD_M = 10

BLUR_VAR_CAP = 800.0
LATE_FUSION_VIS_WEIGHT = 0.40
FAST_LANE_MIN_CONFIDENCE = 0.75
UNUSABLE_IMAGE_Q_IMG = 0.15

QWEN_MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"
SYNTH_SYSTEM_PROMPT = (
    "You are a remote-sensing event classifier for a fire/spatial-event monitoring system. "
    "Resolve any disagreements and respond with ONLY a single JSON object, no extra text, "
    "with exactly these keys: 'cluster_id' (string), 'final_class' (string), 'confidence' (float 0-1), "
    "'is_persistent_source' (bool), 'reasoning' (one short sentence)."
)

TEMP_IMG_DIR = "/tmp/cluster_images"
os.makedirs(TEMP_IMG_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def nearest_infra_type(row, buffer_m: float = CLASSIFY_INFRA_BUFFER_M):
    candidates = []
    for col, itype in INFRA_DIST_TO_TYPE.items():
        d = row.get(col, np.nan)
        if pd.notna(d) and d < buffer_m:
            candidates.append((d, itype))
    if not candidates:
        return None, None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1], candidates[0][0]

def stream1_hypothesis(row):
    infra_type, _ = nearest_infra_type(row)
    if row.get("is_persistent_source", False):
        if infra_type is not None:
            cls, prompt = INFRA_TYPE_PROMPTS[infra_type]
            return cls, 0.85, prompt
        return "Industrial Activity", 0.75, HYPOTHESIS_PROMPTS["Industrial Activity"]

    if infra_type is not None:
        cls, prompt = INFRA_TYPE_PROMPTS[infra_type]
        return cls, 0.78, prompt

    lulc = row.get("esri_lulc_label", None)
    active_days = row.get("active_days_count", 1)
    frp = row.get("mean_frp_mw", 0.0)
    ndvi = row.get("ndvi", np.nan)
    duration_h = row.get("duration_hours", np.nan)

    short_lived = (active_days <= 2) and (pd.isna(duration_h) or duration_h <= 48)

    if lulc in CROP_LULC and short_lived:
        conf = 0.88 if pd.notna(ndvi) and ndvi <= 0.35 else (0.85 if pd.isna(ndvi) and frp < 15 else 0.72)
        return "Stubble Burning", conf, HYPOTHESIS_PROMPTS["Stubble Burning"]

    if lulc in FOREST_LULC:
        conf = 0.85 if pd.notna(ndvi) and ndvi >= 0.40 else (0.81 if pd.isna(ndvi) and frp >= 5 else 0.68)
        return "Wildfire / Forest Fire", conf, HYPOTHESIS_PROMPTS["Wildfire / Forest Fire"]

    if lulc in CROP_LULC:
        return "Stubble Burning", 0.60, HYPOTHESIS_PROMPTS["Stubble Burning"]

    return "Uncertain / Ambiguous Event", 0.50, HYPOTHESIS_PROMPTS["Uncertain / Ambiguous Event"]

def get_crop_half_side_m(row) -> float:
    dist = row.get("nearest_infra_dist_m", np.nan)
    if pd.isna(dist):
        return BASE_HALF_SIDE_M
    return float(np.clip(1.5 * dist + INFRA_FACILITY_MARGIN_M, BASE_HALF_SIDE_M, MAX_HALF_SIDE_M))

def fetch_s2_crop(ee_module, cluster_id, lat, lon, first_seen, half_side_m, out_dir):
    region = ee_module.Geometry.Point([lon, lat]).buffer(half_side_m).bounds()
    center_date = ee_module.Date(first_seen.isoformat() if isinstance(first_seen, datetime) else str(first_seen))
    
    s2 = (ee_module.ImageCollection(S2_COLLECTION).filterBounds(region)
          .filterDate(center_date.advance(-SEARCH_WINDOW_DAYS, "day"), center_date.advance(SEARCH_WINDOW_DAYS, "day"))
          .sort("CLOUDY_PIXEL_PERCENTAGE"))

    if s2.size().getInfo() == 0:
        return None

    best = s2.first()
    cloud_prob = best.get("CLOUDY_PIXEL_PERCENTAGE").getInfo() / 100.0

    url = best.select(["B4", "B3", "B2"]).resample("bicubic").visualize(min=0, max=3000).getThumbURL({"region": region, "scale": GSD_M, "format": "png"})
    resp = requests.get(url, timeout=60)
    if resp.status_code != 200:
        return None

    native_path = os.path.join(out_dir, f"{cluster_id}_native.png")
    with open(native_path, "wb") as f:
        f.write(resp.content)

    img = cv2.imread(native_path)
    if img is None:
        return None

    out_path = os.path.join(out_dir, f"{cluster_id}.png")
    cv2.imwrite(out_path, cv2.resize(img, (CROP_PX, CROP_PX), interpolation=cv2.INTER_LANCZOS4))
    os.remove(native_path)

    return {"image_path": out_path, "cloud_prob": cloud_prob}

def compute_q_img(row):
    cp = row.get("cloud_prob", 0.5) if pd.notna(row.get("cloud_prob")) else 0.5
    img = cv2.imread(row["image_path"])
    bm = cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() / BLUR_VAR_CAP if img is not None else 0.0
    return pd.Series({"B_m": bm, "Q_img": float(np.clip((1.0 - cp) * min(bm, 1.0), 0.0, 1.0))})

def assign_lane(row) -> str:
    if row["Q_img"] < UNUSABLE_IMAGE_Q_IMG:
        return "fast" if row["S_spatial"] >= FAST_LANE_MIN_CONFIDENCE else "slow"
    return "fast" if (row["visual_agrees_with_stream1"] and row["C_final"] >= FAST_LANE_MIN_CONFIDENCE) else "slow"


# ---------------------------------------------------------------------------
# ML Model Classes
# ---------------------------------------------------------------------------
class RemoteClipScorer:
    def __init__(self, device: str | None = None):
        import open_clip
        from huggingface_hub import hf_hub_download
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.clip_model, _, self.clip_preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained=None)
        self.clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
        self.clip_model.load_state_dict(torch.load(hf_hub_download("chendelong/RemoteCLIP", "RemoteCLIP-ViT-B-32.pt"), map_location="cpu"))
        self.clip_model = self.clip_model.to(self.device).eval()
        self.all_classes = list(HYPOTHESIS_PROMPTS.keys())
        
        with torch.no_grad():
            text_tokens = self.clip_tokenizer(list(HYPOTHESIS_PROMPTS.values())).to(self.device)
            self.all_text_features = self.clip_model.encode_text(text_tokens)
            self.all_text_features /= self.all_text_features.norm(dim=-1, keepdim=True)
        print("RemoteCLIP loaded.")

    @torch.no_grad()
    def score(self, image_path: str, target_prompt: str):
        image = self.clip_preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(self.device)
        img_feat = self.clip_model.encode_image(image)
        img_feat /= img_feat.norm(dim=-1, keepdim=True)

        sims01 = ((img_feat @ self.all_text_features.T).squeeze(0) + 1.0) / 2.0
        scores = {cls: float(s) for cls, s in zip(self.all_classes, sims01)}
        top_class = max(scores, key=scores.get)

        target_feat = self.clip_model.encode_text(self.clip_tokenizer([target_prompt]).to(self.device))
        target_sim01 = float((img_feat @ (target_feat / target_feat.norm(dim=-1, keepdim=True)).T).item() + 1.0) / 2.0
        return target_sim01, top_class, scores[top_class], scores

class QwenSynthesizer:
    def __init__(self):
        from transformers import Qwen2VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
        self.model = Qwen2VLForConditionalGeneration.from_pretrained(
            QWEN_MODEL_ID, device_map="auto",
            quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
        )
        self.processor = AutoProcessor.from_pretrained(QWEN_MODEL_ID)
        print("Qwen2-VL loaded.")

    @torch.no_grad()
    def synthesize(self, row):
        from qwen_vl_utils import process_vision_info
        text_prompt = (
            f"cluster_id: {row['cluster_id']}\nstream1_class: {row['hypothesis_class']} (S_spatial={row['S_spatial']:.2f})\n"
            f"clip_class: {row['visual_top_class']} (score={row['visual_top_score']:.2f})\n"
            f"Q_img: {row['Q_img']:.2f}\nC_final: {row['C_final']:.2f}\n"
            f"LULC: {row['esri_lulc_label']}, ndvi: {row['ndvi']}, frp: {row.get('mean_frp_mw', 0)}\nReturn JSON verdict."
        )
        messages = [{"role": "system", "content": SYNTH_SYSTEM_PROMPT}, {"role": "user", "content": [{"type": "image", "image": row["image_path"]}, {"type": "text", "text": text_prompt}]}]
        text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        img_in, vid_in = process_vision_info(messages)
        inputs = self.processor(text=[text], images=img_in, videos=vid_in, padding=True, return_tensors="pt").to(self.model.device)
        
        output_text = self.processor.batch_decode([out[len(inp):] for inp, out in zip(inputs.input_ids, self.model.generate(**inputs, max_new_tokens=200))], skip_special_tokens=True)[0]
        try:
            return json.loads(output_text.strip().strip("`").replace("json\n", "").strip())
        except Exception:
            return {"cluster_id": row["cluster_id"], "final_class": row["hypothesis_class"], "confidence": row["C_final"], "is_persistent_source": row["is_persistent_source"], "reasoning": "JSON parse fallback"}


# ---------------------------------------------------------------------------
# Pipeline Evaluator
# ---------------------------------------------------------------------------
def evaluate_cluster(cluster_dict: dict, clip_scorer: RemoteClipScorer, qwen_synthesizer: QwenSynthesizer) -> dict:
    row = pd.Series(cluster_dict)
    
    # Calculate exact duration
    row["duration_hours"] = (row["last_seen"] - row["first_seen"]).total_seconds() / 3600.0 if pd.notna(row.get("last_seen")) else 0.0
    
    # Re-apply strict physics-based persistent check
    recurrent = row.get("active_days_count", 1) >= PERSIST_MIN_ACTIVE_DAYS
    dense = (row.get("total_detections_in_month", 1) / max(row.get("active_days_count", 1), 1)) >= PERSIST_MIN_DENSITY
    high_intensity = row.get("max_brightness_kelvin", 0) >= BRIGHTNESS_SATURATION_K or row.get("max_frp_mw", 0) >= 15.0
    row["is_persistent_source"] = bool(recurrent and (dense or high_intensity))

    # Run Stream 1
    row["hypothesis_class"], row["S_spatial"], row["dynamic_prompt"] = stream1_hypothesis(row)

    # Fetch Image
    s2_res = fetch_s2_crop(ee, row["cluster_id"], row["centroid_latitude"], row["centroid_longitude"], row["first_seen"], get_crop_half_side_m(row), TEMP_IMG_DIR)
    local_img = s2_res["image_path"] if s2_res else None

    # Proceed if image exists
    if local_img and os.path.exists(local_img):
        row["image_path"], row["cloud_prob"] = local_img, s2_res["cloud_prob"]
        
        iqa = compute_q_img(row)
        row["B_m"], row["Q_img"] = iqa["B_m"], iqa["Q_img"]

        row["S_visual"], row["visual_top_class"], row["visual_top_score"], _ = clip_scorer.score(row["image_path"], row["dynamic_prompt"])
        row["visual_agrees_with_stream1"] = (row["visual_top_class"] == row["hypothesis_class"])

        w_vis = LATE_FUSION_VIS_WEIGHT * row["Q_img"]
        row["C_final"] = ((1.0 - w_vis) * row["S_spatial"]) + (w_vis * row["S_visual"])
        
        lane = assign_lane(row)
        verdict = qwen_synthesizer.synthesize(row) if lane == "slow" and qwen_synthesizer else {
            "cluster_id": row["cluster_id"], "final_class": row["hypothesis_class"], 
            "confidence": row["C_final"], "is_persistent_source": row["is_persistent_source"]
        }
        verdict["route"] = lane

        try:
            os.remove(local_img)
        except OSError:
            pass
    else:
        verdict = {
            "cluster_id": row["cluster_id"], "final_class": row["hypothesis_class"], 
            "confidence": row["S_spatial"], "is_persistent_source": row["is_persistent_source"], 
            "route": "fast", "reasoning": "Fallback (GEE imagery unavailable)"
        }

    return verdict