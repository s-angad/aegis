"""
AEGIS FLOOD v2.0 - Phase 3 Backend Recon Adapter
Links Backend Recon endpoints to Phase 3 Observation pipeline data.
"""
import logging
from typing import Optional, Dict, Any, List

import sys
from pathlib import Path

# Ensure iot directory is importable
IOT_DIR = Path(__file__).resolve().parent.parent.parent.parent / "iot"
if str(IOT_DIR) not in sys.path:
    sys.path.insert(0, str(IOT_DIR))

try:
    from cv.temporal import temporal_state_manager
    from cv.schema import Phase3Observation
    HAS_PHASE3 = True
except Exception as e:
    logging.getLogger("aegis-recon-adapter").warning(f"Phase 3 CV module not yet loaded: {e}")
    HAS_PHASE3 = False


def get_phase3_latest_observation() -> Optional[Dict[str, Any]]:
    if not HAS_PHASE3:
        return None
    latest = temporal_state_manager.get_latest()
    return latest.model_dump(mode="json") if latest else None


def get_phase3_history(limit: int = 30) -> List[Dict[str, Any]]:
    if not HAS_PHASE3:
        return []
    history = temporal_state_manager.get_history(limit)
    return [obs.model_dump(mode="json") for obs in history]
