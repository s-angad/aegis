from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class IncidentType(str, Enum):
    FLOOD = "flood"
    STRUCTURAL_DAMAGE = "structural_damage"
    MEDICAL_EMERGENCY = "medical_emergency"
    EVACUATION_NEEDED = "evacuation_needed"
    ROAD_BLOCKED = "road_blocked"
    WILDFIRE = "wildfire"
    HAZARDOUS_SMOKE = "hazardous_smoke"
    CYCLONE_WIND = "cyclone_wind"
    INFRASTRUCTURE_FAILURE = "infrastructure_failure"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentSource(str, Enum):
    CITIZEN_REPORT = "citizen_report"
    SENSOR = "sensor"
    WEATHER_FEED = "weather_feed"
    SOCIAL_MEDIA = "social_media"
    EMERGENCY_CALL = "emergency_call"


class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: IncidentType
    sector: str
    lat: float
    lng: float
    severity: Severity = Severity.MEDIUM
    confidence: int = Field(ge=0, le=100, default=75)
    source: IncidentSource = IncidentSource.CITIZEN_REPORT
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    verified: bool = False
    assigned_resources: List[str] = Field(default_factory=list)
    reporter_name: Optional[str] = None
    water_level: float = 0.0
    population_affected: int = 0
    is_active: bool = True


class RawReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    message: str
    location: str
    sector: str
    lat: float
    lng: float
    reporter_name: str
    phone: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: IncidentSource = IncidentSource.CITIZEN_REPORT
    is_duplicate: bool = False
    is_false: bool = False
