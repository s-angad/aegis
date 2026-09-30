"""
AEGIS FLOOD v2.0 - Agent Payload Contracts (Phase 4A)
Defines explicit Pydantic models for the 5 specialized agent outputs.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ReconResult(BaseModel):
    situation_summary: str = ""
    affected_sectors: List[str] = Field(default_factory=list)
    critical_sectors: List[str] = Field(default_factory=list)
    affected_infrastructure: List[str] = Field(default_factory=list)
    flood_coverage: float = 0.0
    confidence: float = Field(default=0.94, ge=0.0, le=1.0)
    observations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class VerificationResult(BaseModel):
    verified: bool = True
    confidence: float = Field(default=0.96, ge=0.0, le=1.0)
    newly_affected_sectors: List[str] = Field(default_factory=list)
    anomalies: List[str] = Field(default_factory=list)
    inconsistencies: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    verification_summary: str = ""


class PredictionResult(BaseModel):
    horizon_seconds: float = 900.0  # 15 minutes default
    predicted_sectors: List[str] = Field(default_factory=list)
    predicted_flood_coverage: float = 0.0
    risk_levels: Dict[str, str] = Field(default_factory=dict)  # sector -> risk
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    model_version: str = "trend-extrapolation-v1"
    assumptions: List[str] = Field(default_factory=list)


class ActionPlan(BaseModel):
    """RECOMMENDATION ONLY - Must NOT directly execute any actions."""
    priority: str = "HIGH"
    situation: str = ""
    objectives: List[str] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    resources_requested: List[str] = Field(default_factory=list)
    sectors: List[str] = Field(default_factory=list)
    requires_approval: bool = True
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    rationale: str = ""


class DispatchPlan(BaseModel):
    """RECOMMENDATION ONLY - Must NOT directly dispatch resources."""
    dispatches: List[Dict[str, Any]] = Field(default_factory=list)
    routes: List[Dict[str, Any]] = Field(default_factory=list)
    blocked_roads: List[str] = Field(default_factory=list)
    alternative_routes: List[Dict[str, Any]] = Field(default_factory=list)
    estimated_times: Dict[str, float] = Field(default_factory=dict)
    confidence: float = Field(default=0.88, ge=0.0, le=1.0)


# ============================================================
# GPT-5.6 Luna Real Agent Structured Output Schemas
# ============================================================

class GPTReconOutput(BaseModel):
    agent: str = "recon"
    status: str = Field(default="NORMAL", description="NORMAL | ALERT | CRITICAL")
    summary: str = Field(default="", description="Concise situational summary")
    flood_detected: bool = Field(default=False)
    affected_sectors: List[str] = Field(default_factory=list)
    affected_infrastructure: List[str] = Field(default_factory=list)
    severity: str = Field(default="LOW", description="LOW | MEDIUM | HIGH | CRITICAL")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    session_id: str = ""
    source_frame: str = ""
    source_observation_id: str = ""
    image_hash: str = ""
    model: str = "gpt-5.6-luna"


class GPTVerifierOutput(BaseModel):
    agent: str = "verifier"
    verification_status: str = Field(default="PASS", description="PASS | WARNING | CONFLICT")
    summary: str = Field(default="", description="Temporal & logical consistency summary")
    newly_affected_sectors: List[str] = Field(default_factory=list)
    recovered_sectors: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    severity: str = Field(default="LOW", description="LOW | MEDIUM | HIGH")
    confidence: float = Field(default=0.96, ge=0.0, le=1.0)
    session_id: str = ""
    source_frame: str = ""
    source_observation_id: str = ""
    image_hash: str = ""
    model: str = "gpt-5.6-luna"


class GPTPredictorOutput(BaseModel):
    agent: str = "predictor"
    prediction_status: str = Field(default="NO_ACTIVE_FLOOD", description="NO_ACTIVE_FLOOD | STABLE | ESCALATING | UNCERTAIN")
    summary: str = Field(default="", description="Near-term risk forecast summary")
    forecast_horizon_seconds: float = Field(default=60.0)
    projected_risk: str = Field(default="LOW", description="LOW | MEDIUM | HIGH | CRITICAL")
    projected_sectors: List[str] = Field(default_factory=list)
    drivers: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    session_id: str = ""
    source_frame: str = ""
    source_observation_id: str = ""
    image_hash: str = ""
    model: str = "gpt-5.6-luna"


class GPTOrchestratorOutput(BaseModel):
    agent: str = "orchestrator"
    priority: str = Field(default="STANDBY", description="STANDBY | LOW | MEDIUM | HIGH | CRITICAL")
    decision: str = Field(default="", description="Strategic action recommendation")
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    resources_required: List[str] = Field(default_factory=list)
    approval_required: bool = Field(default=True)
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    session_id: str = ""
    source_frame: str = ""
    source_observation_id: str = ""
    image_hash: str = ""
    model: str = "gpt-5.6-luna"


class GPTRouterDispatchOutput(BaseModel):
    agent: str = "router_dispatch"
    dispatch_status: str = Field(default="STANDBY", description="STANDBY | READY | ROUTE_PLANNED | BLOCKED")
    routes: List[Dict[str, Any]] = Field(default_factory=list)
    resources: List[str] = Field(default_factory=list)
    destination: Optional[str] = None
    blocked_reasons: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.88, ge=0.0, le=1.0)
    session_id: str = ""
    source_frame: str = ""
    source_observation_id: str = ""
    image_hash: str = ""
    model: str = "gpt-5.6-luna"

