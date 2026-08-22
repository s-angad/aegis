from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid


class ReconObservation(BaseModel):
    observation_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    frame_number: int = 0
    flood_area_percent: float = 0.0          # Observed flood coverage (0-100%)
    estimated_water_level: float = 0.0        # Estimated depth in meters
    estimated_velocity: float = 0.0           # Estimated flood front velocity (m/s)
    expansion_rate: float = 0.0               # Area growth rate (% / sec)
    affected_cells: List[Dict[str, Any]] = Field(default_factory=list) # [{row, col, sector}]
    blocked_roads: List[str] = Field(default_factory=list)              # List of sector/road names
    affected_buildings: int = 0
    affected_population: int = 0
    critical_infrastructure: List[str] = Field(default_factory=list)
    confidence: float = 94.0                   # Confidence percentage (0-100%)
    anomaly_detected: bool = False
    anomaly_description: Optional[str] = None
    image_data_url: Optional[str] = None      # Compressed JPEG base64 data URL for UI display
    ground_truth_delta: Optional[Dict[str, float]] = None # Perception error margin for demonstration


class ReconFrameRequest(BaseModel):
    image: str                                # Base64 encoded JPEG/PNG image data URL
    frame_number: Optional[int] = None
    timestamp: Optional[str] = None
    simulation_tick: Optional[int] = None
    disaster_type: Optional[str] = "flood"


class ReconConfig(BaseModel):
    recon_interval_seconds: float = 3.0       # 1s, 3s, 5s
    enabled: bool = True
    confidence_threshold: float = 70.0
    model_width_meters: float = 8000.0         # 16 cells * 500m = 8000m
    model_height_meters: float = 8000.0
