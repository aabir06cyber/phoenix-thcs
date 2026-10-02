import asyncio
import io
import httpx
import numpy as np
import pandas as pd
from datetime import timedelta, datetime
from sklearn.cluster import DBSCAN
import ee
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
import db_models
from config import settings

ESRI_LULC_CLASSES = {
    1: "Water", 2: "Trees", 3: "Flooded Vegetation", 4: "Crops",
    5: "Built Area", 6: "Bare Ground", 7: "Snow/Ice", 8: "Clouds", 9: "Rangeland"
}

async def fetch_and_cluster_firms(db: AsyncSession, country_bbox: str = "68,6,98,37", day_range: int = 1) -> list[dict]:
    # 1. Temporal Optimization: Get the latest timestamp from the database
    latest_query = await db.execute(select(func.max(db_models.clusters.last_seen)))
    last_processed_time = latest_query.scalar()

    # 2. Strictly NOAA-20 and NOAA-21 (SNPP is completely removed)
    sources = {"N20": "VIIRS_NOAA20_NRT", "N21": "VIIRS_NOAA21_NRT"}
    
    async def fetch_source(sat_label, source_id):
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{settings.firms_map_key}/{source_id}/{country_bbox}/{day_range}"
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200 and "latitude" in resp.text:
                df = pd.read_csv(io.StringIO(resp.text))
                if not df.empty:
                    df["sat_label"] = sat_label
                    return df
        return pd.DataFrame()

    # Fetch concurrently from both satellites
    results = await asyncio.gather(*[fetch_source(label, src) for label, src in sources.items()])
    df = pd.concat(results, ignore_index=True)

    if df.empty:
        return []

    # Combine FIRMS date and time into a proper datetime object
    df["acq_timestamp"] = pd.to_datetime(
        df["acq_date"] + " " + df["acq_time"].astype(str).str.zfill(4),
        format="%Y-%m-%d %H%M"
    )

    # 3. Filter out points we already processed (Timezone-Naive comparison fix)
    if last_processed_time:
        if last_processed_time.tzinfo is not None:
            last_processed_time = last_processed_time.replace(tzinfo=None)
            
        df = df[df["acq_timestamp"] > last_processed_time]

    if df.empty or len(df) < 2:
        return []

    # 4. DBSCAN Spatial Clustering
    coords = np.radians(df[["latitude", "longitude"]])
    db_scan = DBSCAN(eps=1.5 / 6371.0088, min_samples=2, metric="haversine").fit(coords)
    df["cluster_label"] = db_scan.labels_
    
    clusters = []
    for label, group in df[df["cluster_label"] != -1].groupby("cluster_label"):
        # Match your exact requested format: CLST_YYYYMM_SAT_0000
        sat_id = group["sat_label"].iloc[0]
        ym = group['acq_timestamp'].min().strftime('%Y%m%dH%H')
        cluster_id = f"CLST_{ym}_{sat_id}_{label:04d}"
        
        clusters.append({
            "cluster_id": cluster_id,
            "centroid_latitude": float(group["latitude"].mean()),
            "centroid_longitude": float(group["longitude"].mean()),
            "total_detections_in_month": int(len(group)),
            "active_days_count": int(group["acq_date"].nunique()),
            "mean_frp_mw": float(group["frp"].mean()) if "frp" in group else 0.0,
            "max_frp_mw": float(group["frp"].max()) if "frp" in group else 0.0,
            "max_brightness_kelvin": float(group["bright_ti4"].max()) if "bright_ti4" in group else 300.0,
            "first_seen": group["acq_timestamp"].min().to_pydatetime(),
            "last_seen": group["acq_timestamp"].max().to_pydatetime(),
        })
    return clusters


async def enrich_cluster_features(lat: float, lon: float, first_seen: datetime, db: AsyncSession) -> dict:
    # 1. PostGIS Infrastructure Distances
    query = text("""
        SELECT 
            MIN(CASE WHEN type = 'industrial' THEN distance END) as dist_to_industrial_m,
            MIN(CASE WHEN type = 'quarry' THEN distance END) as dist_to_quarry_m,
            MIN(CASE WHEN type = 'power' THEN distance END) as dist_to_power_m,
            MIN(CASE WHEN type = 'factory' THEN distance END) as dist_to_factory_m
        FROM (
            SELECT type, ST_Distance(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, geom::geography) as distance
            FROM infrastructure_polygons
            WHERE ST_DWithin(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, geom::geography, 5000)
        ) AS nearby_infra;
    """)
    result = await db.execute(query, {"lon": lon, "lat": lat})
    row = result.mappings().first()

    def safe_float(val):
        # Explicitly trap NaNs and None
        return float(val) if val is not None and not pd.isna(val) else None

    d_ind = safe_float(row.get("dist_to_industrial_m"))
    d_qua = safe_float(row.get("dist_to_quarry_m"))
    d_pow = safe_float(row.get("dist_to_power_m"))
    d_fac = safe_float(row.get("dist_to_factory_m"))

    # 2. GEE Point Sampling (LULC & NDVI) — wrapped safely against uninitialized GEE
    lulc_code, lulc_label, ndvi_val = None, "Uncertain / Ambiguous Event", None
    try:
        pt = ee.Geometry.Point([lon, lat])
        esri = ee.ImageCollection("projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS").filterBounds(pt).first()
        code = esri.select("b1").remap([1, 2, 4, 5, 7, 8, 9, 10, 11], [1, 2, 3, 4, 5, 6, 7, 8, 9]).reduceRegion(ee.Reducer.first(), pt, scale=10).get("remapped").getInfo()
        if code is not None:
            lulc_code = int(code)
            lulc_label = ESRI_LULC_CLASSES.get(lulc_code, "Uncertain / Ambiguous Event")

        t_start = (first_seen - timedelta(days=20)).strftime("%Y-%m-%d")
        t_end = (first_seen + timedelta(days=20)).strftime("%Y-%m-%d")
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterBounds(pt).filterDate(t_start, t_end).sort("CLOUDY_PIXEL_PERCENTAGE").first()
        ndvi_dict = s2.normalizedDifference(["B8", "B4"]).rename("ndvi").reduceRegion(ee.Reducer.mean(), pt, scale=10).getInfo()
        ndvi_val = safe_float(ndvi_dict.get("ndvi")) if ndvi_dict else None
    except Exception as ee_err:
        # If GEE is uninitialized or times out, proceed gracefully without crashing the pipeline
        print(f"[GEE ERROR] Failed to fetch LULC/NDVI for ({lat},{lon}): {ee_err}")
        

    return {
        "dist_to_industrial_m": d_ind, "is_near_industrial": bool(d_ind and d_ind < 1000.0),
        "dist_to_quarry_m": d_qua, "is_near_quarry": bool(d_qua and d_qua < 1000.0),
        "dist_to_power_m": d_pow, "is_near_power": bool(d_pow and d_pow < 1000.0),
        "dist_to_factory_m": d_fac, "is_near_factory": bool(d_fac and d_fac < 1000.0),
        "esri_lulc_code": str(lulc_code) if lulc_code is not None else None,
        "esri_lulc_label": lulc_label,
        "ndvi": ndvi_val
    }
