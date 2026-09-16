"""
AEGIS FLOOD v2.0 - 16-Sector Pixel Mapping Utility
"""
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import cv2

from .ground_truth import ground_truth_city


class SectorMapper:
    """
    Utility for mapping rectified image pixels (800x800) to the 16-sector physical city grid (S1-S16).
    """

    def __init__(self, city=ground_truth_city):
        self.city = city

    def get_sector_from_pixel(self, x: float, y: float) -> Optional[str]:
        """Given (x, y) coordinate on 800x800 rectified image, return sector ID e.g. 'S7'."""
        if x < 0 or x >= self.city.width or y < 0 or y >= self.city.height:
            return None

        c = int(x / self.city.cell_w)
        r = int(y / self.city.cell_h)

        c = max(0, min(3, c))
        r = max(0, min(3, r))

        sector_num = r * 4 + c + 1
        return f"S{sector_num}"

    def get_sector_polygon(self, sector_id: str) -> List[List[int]]:
        """Returns 4 corner points of sector boundary polygon."""
        sector_data = self.city.sectors.get(sector_id)
        if not sector_data:
            return []
        return sector_data["boundary"]

    def get_sector_mask(self, sector_id: str, image_shape: Tuple[int, int] = (800, 800)) -> np.ndarray:
        """Returns binary mask (uint8 0/255) for the given sector."""
        mask = np.zeros(image_shape, dtype=np.uint8)
        sector_data = self.city.sectors.get(sector_id)
        if sector_data:
            x1, y1 = sector_data["x1"], sector_data["y1"]
            x2, y2 = sector_data["x2"], sector_data["y2"]
            mask[y1:y2, x1:x2] = 255
        return mask

    def get_sector_center(self, sector_id: str) -> Tuple[float, float]:
        """Returns center point (x, y) of sector."""
        sector_data = self.city.sectors.get(sector_id)
        if not sector_data:
            return (0.0, 0.0)
        return sector_data["center"]

    def get_sector_statistics(self, flood_mask: np.ndarray, sector_id: str) -> Dict[str, Any]:
        """
        Calculates sector flood statistics:
        - sector_id
        - flood_pixels
        - valid_pixels
        - flood_percentage
        - status: DRY (<5%), EARLY_FLOOD (5-20%), FLOODED (20-50%), SEVERELY_FLOODED (>50%)
        """
        sector_data = self.city.sectors.get(sector_id)
        if not sector_data:
            return {
                "sector_id": sector_id,
                "flood_pixels": 0,
                "valid_pixels": 0,
                "flood_percentage": 0.0,
                "status": "DRY"
            }

        x1, y1 = sector_data["x1"], sector_data["y1"]
        x2, y2 = sector_data["x2"], sector_data["y2"]

        sector_roi = flood_mask[y1:y2, x1:x2]
        valid_pixels = sector_roi.size
        flood_pixels = int(cv2.countNonZero(sector_roi)) if valid_pixels > 0 else 0

        pct = (flood_pixels / float(valid_pixels) * 100.0) if valid_pixels > 0 else 0.0
        pct = round(pct, 1)

        # Categorize status based on thresholds
        if pct < 5.0:
            status = "DRY"
        elif pct < 20.0:
            status = "EARLY_FLOOD"
        elif pct < 50.0:
            status = "FLOODED"
        else:
            status = "SEVERELY_FLOODED"

        return {
            "sector_id": sector_id,
            "row": sector_data["row"],
            "column": sector_data["column"],
            "flood_pixels": flood_pixels,
            "valid_pixels": valid_pixels,
            "flood_percentage": pct,
            "status": status
        }


sector_mapper = SectorMapper()
