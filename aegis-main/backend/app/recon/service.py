"""
High-level Reconnaissance Service.
Processes incoming base64 canvas frames, interacts with the FrameStore,
and exposes analytical telemetry for the FastAPI endpoints and WebSocket broadcaster.
"""
from typing import Optional, Dict, Any
from datetime import datetime

from .models import ReconFrameRequest, ReconObservation
from .vision import decode_base64_image, analyze_frame_cv
from .frame_store import frame_store


class ReconService:
    def __init__(self):
        self.is_active: bool = True

    async def process_frame(
        self,
        request: ReconFrameRequest,
        ground_truth_state: Optional[Dict[str, Any]] = None
    ) -> ReconObservation:
        """
        Process an incoming base64 frame, execute CV analysis, store history,
        and return the generated ReconObservation.
        """
        img = decode_base64_image(request.image)

        if img is None:
            # Fallback observation if image decoding fails (graceful error handling)
            obs = ReconObservation(
                confidence=50.0,
                anomaly_detected=True,
                anomaly_description="Frame decoding warning: utilizing cached telemetry",
                image_data_url=request.image if len(request.image) < 200000 else None,
            )
            frame_store.add_observation(obs)
            return obs

        # Perform Computer Vision analysis
        obs = analyze_frame_cv(
            img=img,
            disaster_type=request.disaster_type or "flood",
            ground_truth_state=ground_truth_state,
            image_data_url=request.image,
        )

        # Store in rolling history buffer
        frame_store.add_observation(obs)
        return obs

    def get_latest_observation(self) -> Optional[ReconObservation]:
        return frame_store.get_latest()

    def get_history(self, limit: int = 30):
        return frame_store.get_history(limit)

    def get_metrics_timeline(self):
        return frame_store.get_metrics_timeline()

    def reset(self):
        frame_store.clear()


recon_service = ReconService()
