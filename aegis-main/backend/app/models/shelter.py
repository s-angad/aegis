from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class ShelterStatus(str, Enum):
    STANDBY = "standby"
    ACTIVE = "active"
    FULL = "full"
    CLOSED = "closed"


class Shelter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    lat: float
    lng: float
    sector: str
    capacity: int
    current_occupancy: int = 0
    status: ShelterStatus = ShelterStatus.STANDBY
    address: str = ""
    contact: str = ""
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    @property
    def occupancy_pct(self) -> float:
        if self.capacity == 0:
            return 0.0
        return (self.current_occupancy / self.capacity) * 100

    @property
    def available_capacity(self) -> int:
        return max(0, self.capacity - self.current_occupancy)
