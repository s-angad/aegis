"""
AEGIS FLOOD v2.0 - Camera Calibration & Perspective Correction Module
"""
import json
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
import cv2
import numpy as np

logger = logging.getLogger("aegis-cv-calibration")

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "calibration.json"


class CameraCalibrator:
    """
    Handles 4-corner perspective transformation to convert oblique smartphone imagery
    into a top-down / bird's-eye rectified view.
    """

    def __init__(self, config_path: Path = CONFIG_PATH):
        self.config_path = config_path
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.target_width = 800
        self.target_height = 800
        self.model_width_cm = 80
        self.model_height_cm = 80
        self.corners: List[List[int]] = []
        self.is_calibrated = False
        self.load_config()

    def load_config(self) -> Dict[str, Any]:
        """Load calibration corner points and physical testbed dimensions from JSON config file."""
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.target_width = data.get("target_width", 800)
                    self.target_height = data.get("target_height", 800)
                    self.model_width_cm = data.get("model_width_cm", 80)
                    self.model_height_cm = data.get("model_height_cm", 80)
                    top_left = data.get("top_left", [50, 50])
                    top_right = data.get("top_right", [750, 50])
                    bottom_right = data.get("bottom_right", [750, 750])
                    bottom_left = data.get("bottom_left", [50, 750])
                    self.corners = [top_left, top_right, bottom_right, bottom_left]
                    self.is_calibrated = data.get("is_calibrated", True)
                    logger.info(f"Loaded camera calibration corners: {self.corners} ({self.model_width_cm}x{self.model_height_cm} cm)")
                    return data
            except Exception as e:
                logger.error(f"Error reading calibration config: {e}")

        # Fallback default corners
        self.corners = [
            [50, 50],
            [750, 50],
            [750, 750],
            [50, 750]
        ]
        self.is_calibrated = False
        return self.get_config_dict()

    def save_config(
        self,
        top_left: List[int],
        top_right: List[int],
        bottom_right: List[int],
        bottom_left: List[int],
        target_width: int = 800,
        target_height: int = 800,
        model_width_cm: int = 80,
        model_height_cm: int = 80
    ) -> Dict[str, Any]:
        """Save updated 4 corner points and physical dimensions to JSON config."""
        self.corners = [top_left, top_right, bottom_right, bottom_left]
        self.target_width = target_width
        self.target_height = target_height
        self.model_width_cm = model_width_cm
        self.model_height_cm = model_height_cm
        self.is_calibrated = True

        data = {
            "top_left": top_left,
            "top_right": top_right,
            "bottom_right": bottom_right,
            "bottom_left": bottom_left,
            "target_width": target_width,
            "target_height": target_height,
            "model_width_cm": model_width_cm,
            "model_height_cm": model_height_cm,
            "is_calibrated": True
        }

        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved new camera calibration configuration: {model_width_cm}x{model_height_cm} cm")
        except Exception as e:
            logger.error(f"Failed to save calibration configuration: {e}")

        return data

    def get_config_dict(self) -> Dict[str, Any]:
        coverage = self.calculate_coverage()
        return {
            "device_id": "PHONE-01",
            "top_left": self.corners[0],
            "top_right": self.corners[1],
            "bottom_right": self.corners[2],
            "bottom_left": self.corners[3],
            "target_width": self.target_width,
            "target_height": self.target_height,
            "model_width_cm": self.model_width_cm,
            "model_height_cm": self.model_height_cm,
            "is_calibrated": self.is_calibrated,
            "testbed": {
                "width_cm": self.model_width_cm,
                "height_cm": self.model_height_cm
            },
            "calibration": {
                "top_left": self.corners[0],
                "top_right": self.corners[1],
                "bottom_right": self.corners[2],
                "bottom_left": self.corners[3]
            },
            "coverage": coverage
        }

    def calculate_coverage(self, img_width: int = 800, img_height: int = 800) -> Dict[str, Any]:
        """
        Calculates physical testbed camera coverage metrics based on corner calibration.
        Returns: visible_percent, visible_width_cm, visible_height_cm, visible_area_cm2, sectors_visible, status
        """
        if not self.corners or len(self.corners) < 4:
            return {
                "visible_percent": 0,
                "visible_width_cm": 0,
                "visible_height_cm": 0,
                "visible_area_cm2": 0,
                "sectors_visible": "0 / 16",
                "status": "CALIBRATION_REQUIRED"
            }

        # Check bounds in image coordinates
        all_in_bounds = True
        margin = 10
        for x, y in self.corners:
            if x < -margin or x > (img_width + margin) or y < -margin or y > (img_height + margin):
                all_in_bounds = False

        pts = np.array(self.corners, dtype=np.float32)
        poly_area = cv2.contourArea(pts)
        max_possible_area = (self.target_width * 0.9) * (self.target_height * 0.9)
        
        ratio = min(1.0, poly_area / max_possible_area) if max_possible_area > 0 else 1.0
        vis_pct = 100 if all_in_bounds else max(50, min(99, int(ratio * 100)))

        vis_w = round(self.model_width_cm * (vis_pct / 100.0), 1)
        vis_h = round(self.model_height_cm * (vis_pct / 100.0), 1)
        area_cm2 = round(vis_w * vis_h, 1)

        if vis_pct >= 95 and all_in_bounds:
            status = "FULL"
            sec_visible = "16 / 16"
        elif vis_pct >= 70:
            status = "PARTIAL"
            sec_visible = f"{max(11, int(16 * vis_pct / 100))} / 16"
        else:
            status = "MISALIGNED"
            sec_visible = f"{max(6, int(16 * vis_pct / 100))} / 16"

        return {
            "visible_percent": vis_pct,
            "visible_width_cm": vis_w,
            "visible_height_cm": vis_h,
            "visible_area_cm2": area_cm2,
            "sectors_visible": sec_visible,
            "status": status
        }

    def rectify_image(self, img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Applies cv2.getPerspectiveTransform and cv2.warpPerspective
        to output a top-down rectified image.
        Returns: (rectified_image, perspective_matrix)
        """
        h, w = img.shape[:2]

        # Source 4 corner points
        pts_src = np.float32(self.corners)

        # Destination rectangle points
        pts_dst = np.float32([
            [0, 0],
            [self.target_width - 1, 0],
            [self.target_width - 1, self.target_height - 1],
            [0, self.target_height - 1]
        ])

        # Compute transformation matrix
        matrix = cv2.getPerspectiveTransform(pts_src, pts_dst)

        # Warp image into bird's-eye perspective
        rectified = cv2.warpPerspective(
            img,
            matrix,
            (self.target_width, self.target_height),
            flags=cv2.INTER_LINEAR
        )

        return rectified, matrix


camera_calibrator = CameraCalibrator()
