from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime


class Prediction(BaseModel):
    id: str = ""
    affected_sectors: List[str] = Field(default_factory=list)
    impact_radius_km: float = 0.0
    spread_direction: str = "South-East"
    risk_heatmap: Dict[str, float] = Field(default_factory=dict)  # sector -> risk 0-1
    time_to_impact_minutes: float = 0.0
    description: str = ""
    peak_flood_level: float = 0.0
    population_at_risk: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence_pct: int = 85
    next_3_ticks: List[Dict] = Field(default_factory=list)
