from sqlalchemy import Column, Float, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database_orm import Base

class clusters(Base):
    __tablename__ = "clusters"
    cluster_id = Column(String, primary_key=True, index=True)
    centroid_latitude = Column(Float, nullable=False)
    centroid_longitude = Column(Float, nullable=False)

    total_detections_in_month = Column(Integer, nullable=False)
    active_days_count = Column(Integer, nullable=False)
    mean_frp_mw = Column(Float)
    max_frp_mw = Column(Float)
    max_brightness_kelvin = Column(Float)
    first_seen = Column(DateTime, nullable=False)
    last_seen = Column(DateTime, nullable=False)

    dist_to_industrial_m = Column(Float)
    is_near_industrial = Column(Boolean, nullable=False)
    dist_to_quarry_m = Column(Float)
    is_near_quarry = Column(Boolean, nullable=False)
    dist_to_power_m = Column(Float)
    is_near_power = Column(Boolean, nullable=False)
    dist_to_factory_m = Column(Float)
    is_near_factory = Column(Boolean, nullable=False)
    
    esri_lulc_code = Column(String)
    esri_lulc_label = Column(String)
    ndvi = Column(Float)

    analysis_bp = relationship("analysis_history", back_populates="cluster_bp", uselist=False)

class analysis_history(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cluster_id = Column(String, ForeignKey(clusters.cluster_id), unique=True)

    #Storing the Processed output
    final_class = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    is_persistant = Column(Boolean, nullable=False)
    route = Column(String)

    cluster_bp = relationship("clusters", back_populates="analysis_bp")
