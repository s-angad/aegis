"""
AEGIS FLOOD v2.0 - Testbed Configuration Manager
Loads, manages, and saves persistent physical testbed geometry & dimensions.
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import cv2

logger = logging.getLogger("aegis-testbed-config")

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "testbed_config.json"


class TestbedConfig:
    """
    Manages persistent physical testbed geometry definitions:
    - Model dimensions (width_cm, height_cm)
    - 4 calibration corner points
    - Water detection thresholds (HSV min/max)
    - Polygons for River, Sectors S1-S16, Buildings B01-B16, Roads R01-R20, Bridge, Shelters, Hospital, EOC HQ
    """

    def __init__(self, config_path: Path = CONFIG_PATH):
        self.config_path = config_path
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.data: Dict[str, Any] = {}
        self.load()

    def load(self) -> Dict[str, Any]:
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    logger.info("Loaded persistent physical testbed configuration.")
                    return self.data
            except Exception as e:
                logger.error(f"Failed to load testbed config: {e}")

        # Fallback default configuration if missing
        self.data = {
            "device_id": "PHONE-01",
            "model_dimensions": {"width_cm": 80, "height_cm": 80, "area_cm2": 6400, "area_m2": 0.64},
            "target_size": {"width": 800, "height": 800},
            "calibration_corners": {
                "top_left": [100, 80],
                "top_right": [1180, 80],
                "bottom_right": [1180, 640],
                "bottom_left": [100, 640]
            },
            "water_detection_thresholds": {
                "hsv_min": [85, 40, 40],
                "hsv_max": [135, 255, 255],
                "color_distance_threshold": 45,
                "min_contour_area": 50
            },
            "river": {"id": "RIVER-01", "polygon": [[240, 0], [360, 0], [380, 200], [580, 240], [560, 400], [580, 600], [540, 800], [440, 800]]},
            "bridge": {"id": "BRIDGE-01", "sector": "S7", "polygon": [[420, 280], [580, 280], [580, 320], [420, 320]]},
            "buildings": [],
            "roads": []
        }
        return self.data

    def save(self) -> bool:
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
            logger.info("Saved persistent testbed configuration.")
            return True
        except Exception as e:
            logger.error(f"Failed to save testbed config: {e}")
            return False

    @property
    def model_width_cm(self) -> float:
        return self.data.get("model_dimensions", {}).get("width_cm", 80)

    @property
    def model_height_cm(self) -> float:
        return self.data.get("model_dimensions", {}).get("height_cm", 80)

    @property
    def total_area_cm2(self) -> float:
        return self.model_width_cm * self.model_height_cm

    @property
    def total_area_m2(self) -> float:
        return round(self.total_area_cm2 / 10000.0, 3)

    @property
    def hsv_min(self) -> Tuple[int, int, int]:
        val = self.data.get("water_detection_thresholds", {}).get("hsv_min", [85, 40, 40])
        return tuple(val)

    @property
    def hsv_max(self) -> Tuple[int, int, int]:
        val = self.data.get("water_detection_thresholds", {}).get("hsv_max", [135, 255, 255])
        return tuple(val)

    def get_building_polygons(self) -> List[Dict[str, Any]]:
        return self.data.get("buildings", [])

    def get_road_polygons(self) -> List[Dict[str, Any]]:
        return self.data.get("roads", [])

    def get_bridge_polygon(self) -> Dict[str, Any]:
        return self.data.get("bridge", {})

    def get_river_polygon(self) -> Dict[str, Any]:
        return self.data.get("river", {})


testbed_config = TestbedConfig()
