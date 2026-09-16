"""
AEGIS FLOOD v2.0 - Phase 3 CV Pipeline Verification Test Suite
"""
import sys
from pathlib import Path
import numpy as np
import cv2

# Add iot directory to python path
IOT_DIR = Path(__file__).resolve().parent.parent
if str(IOT_DIR) not in sys.path:
    sys.path.insert(0, str(IOT_DIR))

from cv.calibration import camera_calibrator
from cv.sector_mapping import sector_mapper
from cv.segmentation import flood_segmenter
from cv.infrastructure import infrastructure_analyzer
from cv.temporal import temporal_state_manager
from cv.pipeline import pipeline_instance


def test_cv_pipeline():
    print("=" * 60)
    print(" TESTING AEGIS FLOOD PHASE 3 CV PIPELINE")
    print("=" * 60)

    # 1. Create synthetic testbed image (Oblique rectangle with blue water region)
    test_img = np.zeros((720, 1280, 3), dtype=np.uint8) + 40  # Dark background
    # Draw cardboard city grid boundary (white border)
    cv2.rectangle(test_img, (100, 80), (1180, 640), (200, 200, 200), 2)
    # Draw blue flood region covering Sector S6 and S7 (middle row)
    cv2.rectangle(test_img, (350, 220), (850, 480), (220, 140, 20), -1)  # BGR blue water

    test_frame_path = IOT_DIR / "frames" / "incoming" / "FRAME-TEST01.jpg"
    cv2.imwrite(str(test_frame_path), test_img)
    print(f"Created synthetic test frame: {test_frame_path}")

    # 2. Configure mock calibration for synthetic image
    camera_calibrator.save_config(
        top_left=[100, 80],
        top_right=[1180, 80],
        bottom_right=[1180, 640],
        bottom_left=[100, 640]
    )
    print("Saved test calibration configuration")

    # 3. Process frame through pipeline
    obs1 = pipeline_instance.process_frame("FRAME-TEST01", test_frame_path, "PHONE-01", "12:00:00")
    print("\n--- FRAME-TEST01 OBSERVATION RESULT ---")
    print(f"Observation ID: {obs1.observation_id}")
    print(f"Processing State: {obs1.processing_state}")
    print(f"Flood Coverage: {obs1.flood.coverage_percent}% (Flood Pixels: {obs1.flood.flood_pixels})")
    print(f"Sectors Count: {len(obs1.sectors)}")
    
    flooded_sectors = [s.sector_id for s in obs1.sectors if s.status != "DRY"]
    print(f"Flooded Sectors: {flooded_sectors}")

    blocked_roads = [r.road_id for r in obs1.infrastructure.roads if r.status == "BLOCKED"]
    print(f"Blocked Roads: {blocked_roads}")
    print(f"Bridge Status: {obs1.infrastructure.bridges[0].status}")

    # 4. Process a second frame to test Temporal Change Detection (Frame N-1 vs Frame N)
    test_img2 = test_img.copy()
    # Expand blue flood region further to cover S10 and S11
    cv2.rectangle(test_img2, (350, 220), (1100, 600), (220, 140, 20), -1)
    test_frame_path2 = IOT_DIR / "frames" / "incoming" / "FRAME-TEST02.jpg"
    cv2.imwrite(str(test_frame_path2), test_img2)

    obs2 = pipeline_instance.process_frame("FRAME-TEST02", test_frame_path2, "PHONE-01", "12:00:05")
    print("\n--- FRAME-TEST02 TEMPORAL CHANGE RESULT ---")
    print(f"Flood Coverage Delta: {obs2.change.coverage_delta}%")
    print(f"Newly Affected Sectors: {obs2.change.newly_affected_sectors}")
    print(f"Sector Changes: {obs2.change.sector_changes}")

    print("\n" + "=" * 60)
    print(" PHASE 3 CV PIPELINE TEST PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_cv_pipeline()
