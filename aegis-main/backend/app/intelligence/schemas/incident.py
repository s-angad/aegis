"""
AEGIS FLOOD v2.0 - Incident Model Schema & State (Phase 4A)
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class Incident(BaseModel):
    """
    Represents an ongoing disaster incident spanning multiple continuous frames.
    """
    incident_id: str = Field(default_factory=lambda: f"INC-{uuid.uuid4().hex[:6].upper()}")
    type: str = "FLOOD"
    status: str = "ACTIVE"  # ACTIVE, CONTAINED, CLOSED
    started_at: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    last_frame_id: Optional[str] = None
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    frames_processed: List[str] = Field(default_factory=list)

    def record_frame(self, frame_id: str, severity: Optional[str] = None):
        self.last_frame_id = frame_id
        if frame_id not in self.frames_processed:
            self.frames_processed.append(frame_id)
        if severity:
            self.severity = severity


class ActiveIncidentManager:
    """Manages the current operational incident instance."""

    def __init__(self):
        self._current_incident: Incident = Incident(incident_id="INC-001", type="FLOOD", severity="HIGH")

    def get_current_incident(self) -> Incident:
        return self._current_incident


    def reset_incident(self, incident_id: Optional[str] = None) -> Incident:
        self._current_incident = Incident(
            incident_id=incident_id or f"INC-{uuid.uuid4().hex[:6].upper()}",
            type="FLOOD",
            severity="HIGH"
        )
        return self._current_incident


active_incident_manager = ActiveIncidentManager()
