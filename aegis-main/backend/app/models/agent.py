from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class AgentName(str, Enum):
    SENTINEL = "Sentinel"
    VERIFIER = "Verifier"
    SEVERITY = "Severity"
    PREDICTOR = "Predictor"
    ALLOCATOR = "Allocator"
    ROUTER = "Router"
    COMMUNICATOR = "Communicator"
    ORCHESTRATOR = "Orchestrator"
    DRONE_RECON = "DroneRecon"
    POLICY_COMMANDER = "PolicyCommander"


class AgentDecision(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    agent_name: AgentName
    action: str
    description: str
    reasoning: str = ""
    sop_reference: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    related_incident_id: Optional[str] = None
    severity: str = "info"  # info, warning, critical


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: str  # PUBLIC_ALERT, EVACUATION_ORDER, SITUATION_REPORT, EXECUTIVE_SUMMARY
    priority: str  # LOW, MEDIUM, HIGH, CRITICAL
    title: str
    message: str
    affected_sectors: list = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    channel: str = "broadcast"
