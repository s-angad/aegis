"""
AEGIS FLOOD v2.0 - Phase 3 Canonical Observation Schema
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class FrameImageMeta(BaseModel):
    original_path: str = ""
    rectified_path: str = ""
    original_url: str = ""
    rectified_url: str = ""
    width: int = 0
    height: int = 0


class FloodMetrics(BaseModel):
    coverage_percent: float = 0.0
    mask_path: Optional[str] = None
    mask_url: Optional[str] = None
    confidence: float = 0.0
    flood_pixels: int = 0
    valid_pixels: int = 0


class SectorObservation(BaseModel):
    sector_id: str
    row: int
    column: int
    flood_percentage: float = 0.0
    status: str = "DRY"  # DRY, EARLY_FLOOD, FLOODED, SEVERELY_FLOODED
    confidence: float = 95.0
    flood_pixels: int = 0
    valid_pixels: int = 0


class RoadStatus(BaseModel):
    road_id: str
    sector: str
    status: str = "OPEN"  # OPEN, BLOCKED
    flood_overlap_percent: float = 0.0
    detected_by_cv: bool = True
    derived_from_ground_truth: bool = True


class BridgeStatus(BaseModel):
    bridge_id: str
    sector: str
    status: str = "OPEN"  # OPEN, AT_RISK, BLOCKED, FAILED
    flood_overlap_percent: float = 0.0
    detected_by_cv: bool = True
    derived_from_ground_truth: bool = True


class BuildingStatus(BaseModel):
    building_id: str
    sector: str
    name: str = ""
    status: str = "DRY"  # DRY, AFFECTED, FLOODED, SEVERELY_FLOODED
    flood_overlap_percent: float = 0.0
    detected_by_cv: bool = True
    derived_from_ground_truth: bool = True


class InfrastructureObservation(BaseModel):
    roads: List[RoadStatus] = Field(default_factory=list)
    bridges: List[BridgeStatus] = Field(default_factory=list)
    buildings: List[BuildingStatus] = Field(default_factory=list)


class ChangeObservation(BaseModel):
    coverage_delta: float = 0.0
    newly_affected_sectors: List[str] = Field(default_factory=list)
    recovered_sectors: List[str] = Field(default_factory=list)
    sector_changes: Dict[str, str] = Field(default_factory=dict)
    newly_blocked_roads: List[str] = Field(default_factory=list)
    bridge_status_changed: bool = False


class QualityObservation(BaseModel):
    image_valid: bool = True
    calibration_valid: bool = True
    analysis_valid: bool = True
    error_message: Optional[str] = None


class Phase3Observation(BaseModel):
    observation_id: str = Field(default_factory=lambda: f"OBS-{uuid.uuid4().hex[:8]}")
    frame_id: str
    device_id: str = "PHONE-01"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    processing_state: str = "COMPLETED"  # RECEIVED, VALIDATING, PROCESSING, ANALYZED, COMPLETED, FAILED

    image: FrameImageMeta = Field(default_factory=FrameImageMeta)
    flood: FloodMetrics = Field(default_factory=FloodMetrics)
    sectors: List[SectorObservation] = Field(default_factory=list)
    infrastructure: InfrastructureObservation = Field(default_factory=InfrastructureObservation)
    change: ChangeObservation = Field(default_factory=ChangeObservation)
    quality: QualityObservation = Field(default_factory=QualityObservation)

    pipeline_version: str = "phase3-v1"
