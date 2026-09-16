"""
AEGIS FLOOD v2.0 - Frame Processing Pipeline & State Machine
"""
import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, Optional
import cv2
import numpy as np

from .schema import (
    Phase3Observation,
    FrameImageMeta,
    FloodMetrics,
    SectorObservation,
    QualityObservation
)
from .calibration import camera_calibrator
from .sector_mapping import sector_mapper
from .segmentation import flood_segmenter
from .water_detector import water_detector_instance
from .infrastructure import infrastructure_analyzer
from .temporal import temporal_state_manager
from .testbed_config import testbed_config
try:
    from ..digital_twin.digital_twin import digital_twin_manager
except (ImportError, ValueError):
    from digital_twin.digital_twin import digital_twin_manager

logger = logging.getLogger("aegis-cv-pipeline")

BASE_DIR = Path(__file__).resolve().parent.parent
FRAMES_DIR = BASE_DIR / "frames"
INCOMING_DIR = FRAMES_DIR / "incoming"
PROCESSING_DIR = FRAMES_DIR / "processing"
COMPLETED_DIR = FRAMES_DIR / "completed"

for d in [INCOMING_DIR, PROCESSING_DIR, COMPLETED_DIR]:
    d.mkdir(parents=True, exist_ok=True)


class FrameProcessingPipeline:
    """
    State machine and processing execution engine for Phase 3 CV Pipeline.
    Stores both original.jpg and rectified.jpg alongside water-mask.png, water-overlay.jpg,
    and analysis.json in frame-specific directories.
    """

    def __init__(self):
        self.calibrator = camera_calibrator
        self.mapper = sector_mapper
        self.water_detector = water_detector_instance
        self.infrastructure = infrastructure_analyzer
        self.state_manager = temporal_state_manager
        self.testbed_config = testbed_config

    def process_frame(
        self,
        frame_id: str,
        image_path: Path,
        device_id: str = "PHONE-01",
        timestamp: str = ""
    ) -> Phase3Observation:
        """
        Executes computer vision analysis synchronously on an ingested image file.
        Creates frame folder: iot/frames/incoming/<frame_id>/
        Stores: original.jpg, rectified.jpg, water-mask.png, water-overlay.jpg, analysis.json
        """
        start_time = time.time()
        logger.info(f"[{frame_id}] Beginning Physical Testbed CV Pipeline execution...")

        # Create Frame Folder
        frame_folder = INCOMING_DIR / frame_id
        frame_folder.mkdir(parents=True, exist_ok=True)

        # 1. Image Validation
        if not image_path.exists():
            return self._build_failed_obs(frame_id, device_id, timestamp, "Image file does not exist")

        img = cv2.imread(str(image_path))
        if img is None or img.size == 0:
            return self._build_failed_obs(frame_id, device_id, timestamp, "Failed to decode image file")

        orig_h, orig_w = img.shape[:2]

        # 1a. Store original.jpg evidence (Never overwrite!)
        orig_dest_path = frame_folder / "original.jpg"
        if image_path.resolve() != orig_dest_path.resolve():
            cv2.imwrite(str(orig_dest_path), img)

        # 2. Perspective Correction Calibration
        try:
            rectified_img, transform_matrix = self.calibrator.rectify_image(img)
            calibration_valid = True
        except Exception as e:
            logger.error(f"[{frame_id}] Calibration warping error: {e}")
            rectified_img = cv2.resize(img, (800, 800))
            calibration_valid = False

        rectified_path = frame_folder / "rectified.jpg"
        cv2.imwrite(str(rectified_path), rectified_img)
        rectified_url = f"/frames/incoming/{frame_id}/rectified.jpg"

        # 3. Water Detection (Classical HSV Segmentation + Overlay)
        det_result = self.water_detector.detect(rectified_img)
        flood_mask = det_result["mask"]
        water_overlay = det_result["overlay"]

        mask_path = frame_folder / "water-mask.png"
        cv2.imwrite(str(mask_path), flood_mask)
        mask_url = f"/frames/incoming/{frame_id}/water-mask.png"

        overlay_path = frame_folder / "water-overlay.jpg"
        cv2.imwrite(str(overlay_path), water_overlay)
        overlay_url = f"/frames/incoming/{frame_id}/water-overlay.jpg"

        # 4. 16-Sector Grid Statistics
        sector_obs_list = []
        for s_num in range(1, 17):
            s_id = f"S{s_num}"
            s_stats = self.mapper.get_sector_statistics(flood_mask, s_id)
            sector_obs_list.append(SectorObservation(
                sector_id=s_id,
                row=s_stats["row"],
                column=s_stats["column"],
                flood_percentage=s_stats["flood_percentage"],
                status=s_stats["status"],
                confidence=det_result["confidence"],
                flood_pixels=s_stats["flood_pixels"],
                valid_pixels=s_stats["valid_pixels"]
            ))

        # 5. Infrastructure Impact Evaluation (Roads, Bridges, Buildings)
        infra_obs = self.infrastructure.evaluate(flood_mask)

        # 6. Draft Observation for Temporal Change Comparison
        draft_obs = Phase3Observation(
            frame_id=frame_id,
            device_id=device_id,
            timestamp=timestamp,
            processing_state="ANALYZED",
            image=FrameImageMeta(
                original_path=str(orig_dest_path),
                rectified_path=str(rectified_path),
                original_url=f"/frames/incoming/{frame_id}/original.jpg",
                rectified_url=rectified_url,
                width=orig_w,
                height=orig_h
            ),
            flood=FloodMetrics(
                coverage_percent=det_result["coverage_percent"],
                mask_path=str(mask_path),
                mask_url=mask_url,
                confidence=det_result["confidence"],
                flood_pixels=det_result["flood_pixels"],
                valid_pixels=det_result["total_pixels"]
            ),
            sectors=sector_obs_list,
            infrastructure=infra_obs,
            quality=QualityObservation(
                image_valid=True,
                calibration_valid=calibration_valid,
                analysis_valid=True
            )
        )

        # 7. Compute Temporal Change (N-1 vs N)
        change_obs = self.state_manager.compute_change(draft_obs)
        draft_obs.change = change_obs
        draft_obs.processing_state = "COMPLETED"

        # 8. Record in temporal history buffer & update Digital Twin
        self.state_manager.add_observation(draft_obs)
        obs_dict = draft_obs.model_dump(mode="json")
        digital_twin_manager.update_from_physical_observation(obs_dict, frame_id, timestamp)

        # 9. Save physical state analysis.json inside frame directory
        analysis_payload = {
            "frame_id": frame_id,
            "device_id": device_id,
            "timestamp": timestamp,
            "perception": {
                "water_detected": det_result["coverage_percent"] > 0.5 or det_result.get("river_water_present", False),
                "flood_detected": det_result["coverage_percent"] > 0.5,
                "river_water_present": det_result.get("river_water_present", False),
                "flood_coverage_percent": det_result["coverage_percent"],
                "flood_pixels": det_result["flood_pixels"],
                "confidence": det_result["confidence"]
            },
            "flood_coverage_percent": det_result["coverage_percent"],
            "affected_sectors": [s.sector_id for s in sector_obs_list if s.status != "DRY"],
            "affected_buildings": [b.building_id for b in infra_obs.buildings if b.status != "DRY"],
            "blocked_roads": [r.road_id for r in infra_obs.roads if r.status == "BLOCKED"],
            "bridge_status": infra_obs.bridges[0].status if infra_obs.bridges else "OPEN",
            "camera_coverage": self.calibrator.calculate_coverage()
        }
        with open(frame_folder / "analysis.json", "w", encoding="utf-8") as f:
            json.dump(analysis_payload, f, indent=2)

        elapsed = round((time.time() - start_time) * 1000, 1)
        logger.info(f"[{frame_id}] CV Pipeline complete in {elapsed}ms | Coverage: {det_result['coverage_percent']}%")

        return draft_obs

    def _build_failed_obs(self, frame_id: str, device_id: str, timestamp: str, error_msg: str) -> Phase3Observation:
        obs = Phase3Observation(
            frame_id=frame_id,
            device_id=device_id,
            timestamp=timestamp,
            processing_state="FAILED",
            quality=QualityObservation(
                image_valid=False,
                calibration_valid=False,
                analysis_valid=False,
                error_message=error_msg
            )
        )
        self.state_manager.add_observation(obs)
        return obs


pipeline_instance = FrameProcessingPipeline()

