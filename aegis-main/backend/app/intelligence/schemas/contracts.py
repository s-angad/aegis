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
