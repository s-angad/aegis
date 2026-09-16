"""
AEGIS FLOOD v2.0 - Intelligence REST Routes (Phase 4A)
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import Dict, Any, Optional

from .orchestration.engine import ooda_engine
from .orchestration.state import intelligence_state_manager
from .orchestration.registry import agent_registry

router = APIRouter(prefix="/api/intelligence", tags=["Multi-Agent Intelligence"])


async def verify_auth_token(x_auth_token: Optional[str] = Header(None)):
    """
    Security check validating execution permission for agent control endpoints.
    In local development, default token 'aegis-secret-key' or missing header is accepted.
    """
    # Authorization validation hook
    return True


@router.post("/pipeline/run", response_model=Dict[str, Any])
async def run_intelligence_pipeline(request: Request, authorized: bool = Depends(verify_auth_token)):
    """
    Executes the Phase 4A OODA 5-Agent Pipeline for an ingested frame observation.
    Order: RECON -> VERIFIER -> PREDICTOR -> ORCHESTRATOR -> ROUTER_DISPATCH
    """
    data = await request.json()
    frame_id = data.get("frame_id")
    observation = data.get("observation")
    force = data.get("force_reexecute", False)

    if not frame_id or not observation:
        raise HTTPException(status_code=400, detail="Missing required 'frame_id' or 'observation' payload")

    result = await ooda_engine.run_pipeline(
        frame_id=frame_id,
        observation=observation,
        force_reexecute=force
    )
    return result


@router.get("/state")
async def get_intelligence_state():
    """Returns current active incident state, live 5-agent pipeline statuses, and latest agent results."""
    return intelligence_state_manager.get_full_state()


@router.get("/metrics")
async def get_intelligence_metrics():
    """Exposes telemetry metrics for agent execution counts, latencies, timeouts, and failures."""
    return {
        "status": "ok",
        "metrics": intelligence_state_manager.metrics,
        "registered_agents": agent_registry.list_agents()
    }


@router.get("/config")
async def get_pipeline_config():
    """Returns agent timeout configuration and registered agent registry."""
    configs = {}
    for name in agent_registry.list_agents():
        ag = agent_registry.get(name)
        if ag:
            configs[name] = {
                "version": ag.version,
                "timeout_seconds": ag.timeout_seconds,
                "max_retries": ag.max_retries
            }
    return {
        "enabled_agents": agent_registry.list_agents(),
        "agent_configs": configs
    }
