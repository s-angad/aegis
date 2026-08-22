"""
Computer Vision Service using OpenCV and NumPy for aerial frame analysis.
Analyzes base64 canvas frames, extracts flood contours, measures pixel coverage,
calculates flood expansion rates, velocity, and maps grid coordinates.
"""
import base64
import cv2
import numpy as np
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional

from .models import ReconObservation
from .frame_store import frame_store


def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    """Decode a Base64 data URL string into an OpenCV BGR image array."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[RECON CV ERROR] Failed to decode image: {e}")
        return None


def analyze_frame_cv(
    img: np.ndarray,
    disaster_type: str = "flood",
    ground_truth_state: Optional[Dict[str, Any]] = None,
    image_data_url: Optional[str] = None
) -> ReconObservation:
    """
    Perform computer vision analysis on the decoded frame.
    Separates OBSERVATION from GROUND TRUTH while accurately processing visual features.
    """
    h, w, _ = img.shape
    total_pixels = h * w

    # Convert to HSV color space for color segmentation
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    if disaster_type == "wildfire":
        # Flame / Heat mask (Orange/Red/Yellow in HSV)
        lower_fire1 = np.array([0, 100, 100])
        upper_fire1 = np.array([25, 255, 255])
        lower_fire2 = np.array([165, 100, 100])
        upper_fire2 = np.array([180, 255, 255])
        mask1 = cv2.inRange(hsv, lower_fire1, upper_fire1)
        mask2 = cv2.inRange(hsv, lower_fire2, upper_fire2)
        hazard_mask = cv2.bitwise_or(mask1, mask2)
    elif disaster_type == "cyclone":
        # Storm surge / gale grey-teal mask
        lower_surge = np.array([80, 40, 50])
        upper_surge = np.array([125, 255, 220])
        hazard_mask = cv2.inRange(hsv, lower_surge, upper_surge)
    else:  # Flood (default)
        # Blue / Cyan water flood mask
        lower_blue = np.array([90, 50, 50])
        upper_blue = np.array([135, 255, 255])
        hazard_mask = cv2.inRange(hsv, lower_blue, upper_blue)

    # Calculate hazard coverage
    hazard_pixels = cv2.countNonZero(hazard_mask)
    flood_area_pct = round((hazard_pixels / float(total_pixels)) * 100.0, 1)

    # Grid mapping (16x16 cells)
    grid_rows, grid_cols = 16, 16
    cell_h = h / float(grid_rows)
    cell_w = w / float(grid_cols)

    affected_cells: List[Dict[str, int]] = []
    blocked_roads: List[str] = []
    
    for r in range(grid_rows):
        for c in range(grid_cols):
            y1, y2 = int(r * cell_h), int((r + 1) * cell_h)
            x1, x2 = int(c * cell_w), int((c + 1) * cell_w)
            cell_roi = hazard_mask[y1:y2, x1:x2]
            if cell_roi.size > 0:
                cell_coverage = cv2.countNonZero(cell_roi) / float(cell_roi.size)
                if cell_coverage > 0.15:  # Cell is visually flooded (>15% covered)
                    sector_num = (r // 4) * 4 + (c // 4) + 1
                    sector_name = f"Sector-{sector_num}"
                    affected_cells.append({"row": r, "col": c, "sector": sector_name})
                    if (r % 4 == 0 or c % 4 == 0) and cell_coverage > 0.35:
                        blocked_roads.append(f"{sector_name}-Road({r},{c})")

    # Find contours for bounding box and centroid tracking
    contours, _ = cv2.findContours(hazard_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    centroid_x, centroid_y = 0.0, 0.0
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        M = cv2.moments(largest_contour)
        if M["m00"] > 0:
            centroid_x = M["m10"] / M["m00"]
            centroid_y = M["m01"] / M["m00"]

    # Compare with previous frame observation for expansion & velocity
    prev_obs = frame_store.get_latest()
    now = datetime.utcnow()
    
    expansion_rate = 0.0
    estimated_velocity = 0.0

    if prev_obs and prev_obs.timestamp:
        dt = (now - prev_obs.timestamp).total_seconds()
        if dt > 0.1:
            d_area = flood_area_pct - prev_obs.flood_area_percent
            expansion_rate = round(d_area / dt, 2)

            # Estimate velocity based on centroid displacement
            # 8000m total grid width / image width pixels
            meters_per_pixel = 8000.0 / max(1, w)
            if hasattr(prev_obs, '_centroid') and prev_obs._centroid:
                px_dist = np.sqrt((centroid_x - prev_obs._centroid[0])**2 + (centroid_y - prev_obs._centroid[1])**2)
                meters_dist = px_dist * meters_per_pixel
                estimated_velocity = round(meters_dist / dt, 2)
            else:
                # Fallback estimation based on expansion rate
                estimated_velocity = round(abs(expansion_rate) * 0.12, 2)

    # Estimate depth with perception variation (differs slightly from ground truth)
    base_depth = min(4.5, (flood_area_pct / 100.0) * 4.2)
    # Add small visual perception delta (0.05m to 0.12m)
    perception_noise = np.random.uniform(-0.08, 0.08)
    estimated_depth = round(max(0.0, base_depth + perception_noise), 2)

    # Ground truth vs observation comparison if ground truth is supplied
    gt_delta = None
    if ground_truth_state:
        gt_flooded_cells = ground_truth_state.get("total_flooded_cells", len(affected_cells))
        gt_max_depth = ground_truth_state.get("max_flood_level", estimated_depth)
        gt_delta = {
            "depth_error_m": round(abs(estimated_depth - gt_max_depth), 2),
            "cell_count_error": abs(len(affected_cells) - gt_flooded_cells),
        }

    # Calculate confidence based on contour clarity and area
    confidence = round(min(98.0, max(75.0, 92.0 + (5.0 if contours else -10.0) - abs(perception_noise * 10))), 1)

    # Check for anomaly
    anomaly_detected = expansion_rate > 4.0 or flood_area_pct > 65.0
    anomaly_desc = "SURGE ANOMALY: Rapid flood expansion detected" if anomaly_detected else None

    # Estimate population affected visually
    affected_pop = len(affected_cells) * 140

    obs = ReconObservation(
        timestamp=now,
        flood_area_percent=flood_area_pct,
        estimated_water_level=estimated_depth,
        estimated_velocity=max(0.05, estimated_velocity),
        expansion_rate=expansion_rate,
        affected_cells=affected_cells,
        blocked_roads=list(set(blocked_roads)),
        affected_buildings=len(affected_cells) * 4,
        affected_population=affected_pop,
        critical_infrastructure=[
            f"Sector-{c['sector'].split('-')[1]}" for c in affected_cells[:3]
        ],
        confidence=confidence,
        anomaly_detected=anomaly_detected,
        anomaly_description=anomaly_desc,
        image_data_url=image_data_url,
        ground_truth_delta=gt_delta,
    )
    # Cache centroid on observation instance for next frame velocity comparison
    obs._centroid = (centroid_x, centroid_y)
    return obs
