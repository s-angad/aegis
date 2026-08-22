from pydantic import BaseModel, Field
from typing import Optional, List, Tuple
from datetime import datetime
from enum import Enum
import uuid


class ResourceType(str, Enum):
    RESCUE_BOAT = "rescue_boat"
    AMBULANCE = "ambulance"
    RESCUE_TEAM = "rescue_team"
    HELICOPTER = "helicopter"
    WATER_PUMP = "water_pump"
    RELIEF_TEAM = "relief_team"
    NGO_VOLUNTEER = "ngo_volunteer"
    FIRE_ENGINE = "fire_engine"
    HAZMAT_UNIT = "hazmat_unit"
    UTILITY_TRUCK = "utility_truck"


class ResourceStatus(str, Enum):
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    ACTIVE = "active"
    RETURNING = "returning"
    UNAVAILABLE = "unavailable"


class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: ResourceType
    name: str
    status: ResourceStatus = ResourceStatus.AVAILABLE
    lat: float
    lng: float
    home_lat: float
    home_lng: float
    assigned_incident: Optional[str] = None
    route: List[List[float]] = Field(default_factory=list)
    route_progress: float = 0.0  # 0.0 to 1.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    capacity: int = 1
    crew_count: int = 2
