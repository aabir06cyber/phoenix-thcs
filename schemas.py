#DATABASE SCHEMAS
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ResponseModel(BaseModel):
    final_class: str
    confidence: float
    is_persistant: bool
    route: str|None = None
    model_config = ConfigDict(from_attributes=True)

class ClusterModel(BaseModel):
    cluster_id: str
    centroid_latitude: float
    centroid_longitude: float

    total_detections_in_month: int
    active_days_count: int
    mean_frp_mw: float|None = None
    max_frp_mw: float|None = None
    max_brightness_kelvin: float|None = None
    first_seen: datetime
    last_seen: datetime

    dist_to_industrial_m: float|None = None
    is_near_industrial: bool
    dist_to_quarry_m: float|None = None
    is_near_quarry: bool
    dist_to_power_m: float|None = None
    is_near_power: bool
    dist_to_factory_m: float|None = None
    is_near_factory: bool
    
    esri_lulc_code: str|None = None
    esri_lulc_label: str|None = None
    ndvi: float|None = None

    analysis_bp: ResponseModel|None = None
    model_config = ConfigDict(from_attributes=True)    
