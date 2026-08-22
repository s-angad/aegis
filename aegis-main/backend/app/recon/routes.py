"""
FastAPI REST routes for Reconnaissance & Visual Frame Processing.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional

from .models import ReconFrameRequest, ReconObservation, ReconConfig
from .service import recon_service
from .frame_store import frame_store
from ..websocket.manager import manager

router = APIRouter(prefix="/api/recon", tags=["Reconnaissance"])


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_frame(request: ReconFrameRequest):
    """
    Ingest aerial/canvas frame from simulation client, run OpenCV computer vision analysis,
    generate a structured ReconObservation, update frame history, and broadcast to all connected command decks.
    """
    if not request.image:
        raise HTTPException(status_code=400, detail="Missing base64 image data")

    # Ingest and analyze frame
    obs = await recon_service.process_frame(request)

    # Broadcast live recon observation to all WebSocket clients
    await manager.broadcast("recon_observation", obs.model_dump(mode="json"))

    return {
        "status": "success",
        "observation": obs.model_dump(mode="json"),
        "frame_number": obs.frame_number,
    }


@router.get("/latest", response_model=Dict[str, Any])
async def get_latest_recon():
    """Retrieve the most recent aerial recon observation."""
    latest = recon_service.get_latest_observation()
    if not latest:
        return {"status": "no_frames", "observation": None}
    return {"status": "ok", "observation": latest.model_dump(mode="json")}


@router.get("/history")
async def get_recon_history(limit: int = 30):
    """Retrieve historical observation telemetry for graph plotting and scrubbing."""
    history = recon_service.get_history(limit)
    timeline = recon_service.get_metrics_timeline()
    return {
        "status": "ok",
        "count": len(history),
        "history": [obs.model_dump(mode="json") for obs in history],
        "timeline": timeline,
    }


@router.get("/status")
async def get_recon_status():
    """Retrieve current Recon Service operational health and configurations."""
    return {
        "status": "active" if recon_service.is_active else "inactive",
        "total_frames_processed": frame_store.frame_counter,
        "config": frame_store.config.model_dump(mode="json"),
        "latest_confidence": frame_store.get_latest().confidence if frame_store.get_latest() else 100.0,
    }


@router.post("/config")
async def update_recon_config(config: ReconConfig):
    """Update Recon Service settings (e.g. recon interval 1s, 3s, 5s)."""
    frame_store.config = config
    await manager.broadcast("recon_config", config.model_dump(mode="json"))
    return {"status": "updated", "config": config.model_dump(mode="json")}
