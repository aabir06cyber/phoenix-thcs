"""
Phoenix ML worker on Modal (T4 GPU).

Runs the full evaluate_cluster() pipeline from engine.py:
  Sentinel-2 crop (Earth Engine) -> image quality -> RemoteCLIP -> late fusion
  -> Qwen2-VL (slow lane only) -> verdict dict

Railway never imports engine.py. It only calls Evaluator.evaluate() (see router.py).

Setup (once):
    pip install modal
    modal setup
    # Dashboard -> Secrets -> Create -> Custom, name it "phoenix-gee", with two keys:
    #   GEE_SERVICE_ACCOUNT_JSON = <entire service-account key file, pasted as-is>
    #   GEE_PROJECT              = <your Earth Engine / Google Cloud project id>

Deploy:      modal deploy modal_app.py
Smoke test:  modal run modal_app.py        (first run downloads ~5 GB of weights)
"""
import json
import os
from datetime import datetime

import modal

APP_NAME = "phoenix-ml"            # must match MODAL_APP_NAME in router.py
SECRET_NAME = "phoenix-gee"
CACHE_VOLUME_NAME = "phoenix-hf-cache"
CACHE_DIR = "/cache"

app = modal.App(APP_NAME)

# Hugging Face weights (RemoteCLIP, Qwen2-VL) persist here, so only the first start downloads them.
hf_cache = modal.Volume.from_name(CACHE_VOLUME_NAME, create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "transformers>=4.45",
        "accelerate",
        "bitsandbytes",
        "qwen-vl-utils",
        "open_clip_torch",
        "huggingface_hub",
        "opencv-python-headless",
        "numpy",
        "pandas",
        "pillow",
        "requests",
        "earthengine-api",
    )
    .env({"HF_HOME": f"{CACHE_DIR}/hf"})
    .add_local_python_source("engine")  # ships engine.py into the container; keep this last
)


def _init_earth_engine(ee) -> None:
    key_json = os.environ["GEE_SERVICE_ACCOUNT_JSON"]
    email = json.loads(key_json)["client_email"]
    creds = ee.ServiceAccountCredentials(email, key_data=key_json)
    ee.Initialize(credentials=creds, project=os.environ["GEE_PROJECT"])
    print("Earth Engine initialized (service account).")


def _as_bool(value) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes"}
    return bool(value)


def _plain_verdict(v: dict, cluster_id: str) -> dict:
    """Return only plain Python types so the result unpickles cleanly on Railway."""
    try:
        confidence = float(v.get("confidence"))
    except (TypeError, ValueError):
        confidence = 0.0
    if confidence != confidence:  # NaN
        confidence = 0.0
    confidence = min(max(confidence, 0.0), 1.0)

    reasoning = v.get("reasoning")
    return {
        "cluster_id": str(v.get("cluster_id") or cluster_id),
        "final_class": str(v.get("final_class") or "Uncertain / Ambiguous Event"),
        "confidence": confidence,
        "is_persistent_source": _as_bool(v.get("is_persistent_source", False)),
        "route": str(v.get("route") or "fast"),
        "reasoning": str(reasoning) if reasoning else None,
    }


@app.cls(
    image=image,
    gpu="T4",
    secrets=[modal.Secret.from_name(SECRET_NAME)],
    volumes={CACHE_DIR: hf_cache},
    timeout=900,           # per evaluate() call
    startup_timeout=1200,  # model load; the very first start downloads the weights
    scaledown_window=300,  # stay warm 5 min after the last call (a run handles clusters one by one)
    max_containers=1,
)
class Evaluator:
    @modal.enter()
    def load(self):
        import ee
        import engine  # imported here so `modal deploy` on your laptop doesn't need torch

        self.engine = engine
        _init_earth_engine(ee)

        self.clip = engine.RemoteClipScorer()
        try:
            self.qwen = engine.QwenSynthesizer()
        except Exception as exc:  # slow lane degrades to the fast verdict instead of failing everything
            print(f"Qwen2-VL failed to load ({exc!r}); slow-lane clusters will use the fast verdict.")
            self.qwen = None

        try:
            hf_cache.commit()  # persist freshly downloaded weights
        except Exception as exc:
            print(f"Volume commit skipped: {exc!r}")

    @modal.method()
    def evaluate(self, cluster: dict) -> dict:
        verdict = self.engine.evaluate_cluster(cluster, self.clip, self.qwen)
        return _plain_verdict(verdict, cluster["cluster_id"])


@app.local_entrypoint()
def smoke_test():
    """modal run modal_app.py  -> evaluates one made-up cluster end to end."""
    cluster = {
        "cluster_id": "SMOKE_TEST_0001",
        "centroid_latitude": 21.56127,
        "centroid_longitude": 76.43035,
        "total_detections_in_month": 4,
        "active_days_count": 1,
        "mean_frp_mw": 4.2,
        "max_frp_mw": 8.0,
        "max_brightness_kelvin": 330.0,
        "first_seen": datetime(2026, 4, 20, 5, 10),
        "last_seen": datetime(2026, 4, 20, 5, 40),
        "dist_to_industrial_m": None,
        "is_near_industrial": False,
        "dist_to_quarry_m": None,
        "is_near_quarry": False,
        "dist_to_power_m": None,
        "is_near_power": False,
        "dist_to_factory_m": None,
        "is_near_factory": False,
        "esri_lulc_code": "2",
        "esri_lulc_label": "Trees",
        "ndvi": 0.55,
    }
    print(Evaluator().evaluate.remote(cluster))
