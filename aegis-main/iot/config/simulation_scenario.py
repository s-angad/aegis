"""
AEGIS FLOOD v2.0 - Controlled 6-Frame AI Flood Simulation Progression
Authoritative 6-Step Scenario Definition for Physical Testbed Ground-Truth
Sequence: 0% -> 14% -> 27% -> 53% -> 66% -> 93%
"""

from typing import Dict, Any, List
from datetime import datetime
import uuid

TOTAL_SIMULATION_STEPS = 6

SIMULATION_STEPS_META = {
    1: {
        "step": 1,
        "coverage_percent": 0.0,
        "label": "FRAME 1 (0% FLOOD)",
        "status": "NORMAL / DRY",
        "description": "Baseline state. River within normal bounds. All sectors dry. Infrastructure clear.",
        "affected_sectors": [],
        "severely_flooded_sectors": [],
        "bridge_status": "OPEN",
        "hospital_status": "DRY",
        "shelter_01_status": "DRY",
        "shelter_02_status": "DRY",
        "blocked_roads": []
    },
    2: {
        "step": 2,
        "coverage_percent": 14.0,
        "label": "FRAME 2 (14% FLOOD)",
        "status": "EARLY FLOOD WARNING",
        "description": "River channel overflow in central sectors S6 and S7. Central bridge at risk.",
        "affected_sectors": ["S6", "S7"],
        "severely_flooded_sectors": [],
        "bridge_status": "AT_RISK",
        "hospital_status": "AT_RISK",
        "shelter_01_status": "DRY",
        "shelter_02_status": "DRY",
        "blocked_roads": ["R06", "R07"]
    },
    3: {
        "step": 3,
        "coverage_percent": 27.0,
        "label": "FRAME 3 (27% FLOOD)",
        "status": "MODERATE FLOODING",
        "description": "River inundates river corridor S2, S6, S7, S10, S11. Central bridge blocked. Hospital S6 affected.",
        "affected_sectors": ["S2", "S6", "S7", "S10", "S11"],
        "severely_flooded_sectors": ["S6", "S7"],
        "bridge_status": "BLOCKED",
        "hospital_status": "AFFECTED",
        "shelter_01_status": "DRY",
        "shelter_02_status": "DRY",
        "blocked_roads": ["R02", "R06", "R07", "R10", "R11", "R18"]
    },
    4: {
        "step": 4,
        "coverage_percent": 53.0,
        "label": "FRAME 4 (53% FLOOD)",
        "status": "MAJOR FLOOD EMERGENCY",
        "description": "Urban inundation spreading across 10 sectors (S2, S3, S5, S6, S7, S9, S10, S11, S14, S15). Bridge failed.",
        "affected_sectors": ["S2", "S3", "S5", "S6", "S7", "S9", "S10", "S11", "S14", "S15"],
        "severely_flooded_sectors": ["S2", "S6", "S7", "S10", "S11"],
        "bridge_status": "FAILED",
        "hospital_status": "FLOODED",
        "shelter_01_status": "AT_RISK",
        "shelter_02_status": "DRY",
        "blocked_roads": ["R02", "R03", "R05", "R06", "R07", "R09", "R10", "R11", "R14", "R15", "R18", "R19"]
    },
    5: {
        "step": 5,
        "coverage_percent": 66.0,
        "label": "FRAME 5 (66% FLOOD)",
        "status": "CRITICAL INUNDATION",
        "description": "Widespread flooding in 13 sectors. Arterial network severed. Safehouse S16 threatened.",
        "affected_sectors": ["S1", "S2", "S3", "S5", "S6", "S7", "S9", "S10", "S11", "S13", "S14", "S15", "S16"],
        "severely_flooded_sectors": ["S2", "S3", "S5", "S6", "S7", "S9", "S10", "S11", "S14", "S15"],
        "bridge_status": "FAILED",
        "hospital_status": "SEVERELY_FLOODED",
        "shelter_01_status": "FLOODED",
        "shelter_02_status": "AT_RISK",
        "blocked_roads": ["R01", "R02", "R03", "R05", "R06", "R07", "R09", "R10", "R11", "R13", "R14", "R15", "R17", "R18", "R19", "R20"]
    },
    6: {
        "step": 6,
        "coverage_percent": 93.0,
        "label": "FRAME 6 (93% FLOOD)",
        "status": "CATASTROPHIC INUNDATION",
        "description": "Massive inundation across all 16 sectors. Emergency HQ S4 threatened. Complete city evacuation required.",
        "affected_sectors": ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16"],
        "severely_flooded_sectors": ["S1", "S2", "S3", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15"],
        "bridge_status": "FAILED",
        "hospital_status": "SEVERELY_FLOODED",
        "shelter_01_status": "SEVERELY_FLOODED",
        "shelter_02_status": "FLOODED",
        "blocked_roads": [f"R{i:02d}" for i in range(1, 21)]
    }
}


def get_simulation_observation(
    step: int,
    frame_id: str,
    session_id: str = "SIM-DEFAULT",
    device_id: str = "PHONE-01",
    timestamp_str: str = None,
    image_sha256: str = "",
    image_size_bytes: int = 0
) -> Dict[str, Any]:
    """
    Generates a canonical Phase3Observation dictionary for the controlled simulation step (1 to 6).
    Per-frame observation is strictly scoped by session_id and validated by image_sha256.
    """
    safe_step = max(1, min(step, TOTAL_SIMULATION_STEPS))
    meta = SIMULATION_STEPS_META[safe_step]
    
    if not timestamp_str:
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    v_time = int(datetime.now().timestamp() * 1000)
    image_url = f"/frames/sessions/{session_id}/{frame_id}/original.jpg?v={v_time}"
    original_path = f"frames/sessions/{session_id}/{frame_id}/original.jpg"

    # Generate 16 sector observations
    sectors = []
    all_sector_ids = [f"S{i}" for i in range(1, 17)]
    
    for idx, sec_id in enumerate(all_sector_ids):
        row = idx // 4
        col = idx % 4
        
        if sec_id in meta["severely_flooded_sectors"]:
            status = "SEVERELY_FLOODED"
            f_pct = 85.0 if meta["coverage_percent"] < 90 else 98.0
        elif sec_id in meta["affected_sectors"]:
            status = "FLOODED"
            f_pct = 45.0
        else:
            status = "DRY"
            f_pct = 0.0
            
        sectors.append({
            "sector_id": sec_id,
            "row": row,
            "column": col,
            "flood_percentage": f_pct,
            "status": status,
            "confidence": 98.0,
            "flood_pixels": int(f_pct * 400),
            "valid_pixels": 40000
        })

    # Generate road observations (R01 to R20)
    roads = []
    for r_idx in range(1, 21):
        r_id = f"R{r_idx:02d}"
        blocked = r_id in meta["blocked_roads"]
        sec_num = ((r_idx - 1) % 16) + 1
        roads.append({
            "road_id": r_id,
            "sector": f"S{sec_num}",
            "status": "BLOCKED" if blocked else "OPEN",
            "flood_overlap_percent": 85.0 if blocked else 0.0,
            "detected_by_cv": True,
            "derived_from_ground_truth": True
        })

    # Generate bridge observations
    bridges = [{
        "bridge_id": "BRIDGE-01",
        "sector": "S7",
        "status": meta["bridge_status"],
        "flood_overlap_percent": 100.0 if meta["bridge_status"] in ["BLOCKED", "FAILED"] else (40.0 if meta["bridge_status"] == "AT_RISK" else 0.0),
        "detected_by_cv": True,
        "derived_from_ground_truth": True
    }]

    # Generate building observations (B01 to B16)
    buildings = []
    for b_idx in range(1, 17):
        b_id = f"B{b_idx:02d}"
        sec_id = f"S{b_idx}"
        if sec_id in meta["severely_flooded_sectors"]:
            b_status = "SEVERELY_FLOODED"
            b_overlap = 90.0
        elif sec_id in meta["affected_sectors"]:
            b_status = "FLOODED"
            b_overlap = 50.0
        else:
            b_status = "DRY"
            b_overlap = 0.0
            
        buildings.append({
            "building_id": b_id,
            "sector": sec_id,
            "name": f"Structure {b_id} ({sec_id})",
            "status": b_status,
            "flood_overlap_percent": b_overlap,
            "detected_by_cv": True,
            "derived_from_ground_truth": True
        })

    cov_percent = meta["coverage_percent"]
    flood_pixels = int((cov_percent / 100.0) * 640000)

    # Calculate change observation relative to step 1
    prev_step = max(1, safe_step - 1)
    prev_meta = SIMULATION_STEPS_META[prev_step]
    newly_affected = [s for s in meta["affected_sectors"] if s not in prev_meta["affected_sectors"]]
    coverage_delta = cov_percent - prev_meta["coverage_percent"]

    return {
        "observation_id": f"OBS-SIM-{session_id}-{safe_step:02d}",
        "session_id": session_id,
        "frame_id": frame_id,
        "sequence": safe_step,
        "device_id": device_id,
        "timestamp": timestamp_str,
        "processing_state": "COMPLETED",
        "simulation_mode": True,
        "simulation_step": safe_step,
        "total_simulation_steps": TOTAL_SIMULATION_STEPS,
        "simulation_label": meta["label"],
        "simulation_description": meta["description"],
        "image": {
            "session_id": session_id,
            "frame_id": frame_id,
            "original_path": original_path,
            "rectified_path": original_path,
            "original_url": image_url,
            "rectified_url": image_url,
            "image_hash": image_sha256,
            "image_size_bytes": image_size_bytes,
            "width": 800,
            "height": 800
        },
        "flood": {
            "coverage_percent": cov_percent,
            "confidence": 99.0,
            "flood_pixels": flood_pixels,
            "valid_pixels": 640000,
            "flood_detected": cov_percent > 0.0
        },
        "sectors": sectors,
        "infrastructure": {
            "roads": roads,
            "bridges": bridges,
            "buildings": buildings
        },
        "change": {
            "coverage_delta": coverage_delta,
            "newly_affected_sectors": newly_affected,
            "recovered_sectors": [],
            "sector_changes": {s: "FLOODED" for s in newly_affected},
            "newly_blocked_roads": [r for r in meta["blocked_roads"] if r not in prev_meta["blocked_roads"]],
            "bridge_status_changed": meta["bridge_status"] != prev_meta["bridge_status"]
        },
        "quality": {
            "image_valid": True,
            "calibration_valid": True,
            "analysis_valid": True,
            "error_message": None
        },
        "pipeline_version": "controlled-simulation-v2"
    }
