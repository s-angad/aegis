"""
AEGIS FLOOD v2.0 — IoT Physical Testbed Gateway (Phase 2B)
Continuous Smartphone Photo Capture — 5 Second Interval Gateway
"""

import base64
import json
import logging
import re
import socket
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Configure structured console logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("aegis-iot-gateway")

import asyncio
import sys

# Directory Paths for Frame Storage
BASE_DIR = Path(__file__).resolve().parent.parent
FRAMES_DIR = BASE_DIR / "frames"
INCOMING_DIR = FRAMES_DIR / "incoming"
PROCESSING_DIR = FRAMES_DIR / "processing"
COMPLETED_DIR = FRAMES_DIR / "completed"

# Ensure frame directories exist on disk
for d in [INCOMING_DIR, PROCESSING_DIR, COMPLETED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Add parent iot directory to sys.path for Phase 3 CV module imports
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from cv.pipeline import pipeline_instance
    from cv.calibration import camera_calibrator
    from cv.temporal import temporal_state_manager
    from cv.testbed_config import testbed_config
    from digital_twin.digital_twin import digital_twin_manager
    HAS_CV_PIPELINE = True
except Exception as _e:
    logger.warning(f"Phase 3 CV imports delayed: {_e}")
    HAS_CV_PIPELINE = False

ROOT_PROJECT_DIR = BASE_DIR.parent
if str(ROOT_PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_PROJECT_DIR))

try:
    from backend.app.intelligence.orchestration.engine import ooda_engine
    from backend.app.intelligence.orchestration.state import intelligence_state_manager
    from backend.app.intelligence.orchestration.events import event_bus, IntelligenceEvent
    from backend.app.intelligence.schemas.frame_state import frame_tracker, FrameState
    HAS_PHASE4A = True
    HAS_FRAME_TRACKER = True
except Exception as _e4:
    logger.warning(f"Phase 4A Intelligence imports delayed: {_e4}")
    HAS_PHASE4A = False
    HAS_FRAME_TRACKER = False


async def process_frame_closed_loop(frame_id: str, file_path: Path, device_id: str, timestamp_str: str, phone_ws: WebSocket):
    """
    Executes Phase 4B Closed-Loop pipeline:
    1. RECEIVED -> QUEUED -> PROCESSING
    2. Runs Phase 3 CV Pipeline (saves original.jpg, rectified.jpg, water-mask.png, water-overlay.jpg, analysis.json)
    3. Runs Phase 4B 5-Agent OODA Pipeline (RECON -> VERIFIER -> PREDICTOR -> ORCHESTRATOR -> ROUTER_DISPATCH)
    4. Saves individual agent result JSON files in frame folder (recon.json, verifier.json, predictor.json, orchestrator.json, dispatch.json)
    5. Updates Digital Twin State
    6. Streams real-time agent execution events to Dashboard
    7. Updates Dashboard with completed result upon full completion
    8. Sends ACK_NEXT to Smartphone WebSocket ONLY AFTER all 5 agents complete
    """
    if HAS_FRAME_TRACKER:
        frame_tracker.set_state(frame_id, FrameState.PROCESSING)

    frame_folder = INCOMING_DIR / frame_id
    frame_folder.mkdir(parents=True, exist_ok=True)

    image_url = f"/frames/incoming/{frame_id}/original.jpg"
    coverage_meta = camera_calibrator.calculate_coverage(800, 800) if HAS_CV_PIPELINE else {
        "visible_percent": 100, "visible_width_cm": 80, "visible_height_cm": 80, "visible_area_cm2": 6400, "sectors_visible": "16 / 16", "status": "FULL"
    }
    image_meta = {
        "original_url": f"/frames/incoming/{frame_id}/original.jpg",
        "rectified_url": f"/frames/incoming/{frame_id}/rectified.jpg",
        "water_mask_url": f"/frames/incoming/{frame_id}/water-mask.png",
        "water_overlay_url": f"/frames/incoming/{frame_id}/water-overlay.jpg",
        "width": 800,
        "height": 800,
        "original": True
    }

    # 1. Notify Dashboard that frame processing has started
    await device_manager.broadcast({
        "type": "photo_received_processing",
        "frame_id": frame_id,
        "device_id": device_id,
        "image_url": image_url,
        "timestamp": timestamp_str,
        "status": "PROCESSING",
        "image": image_meta,
        "camera_coverage": coverage_meta,
        "total_frames": len(device_manager.frame_history)
    })

    obs_dict = {}
    if HAS_CV_PIPELINE:
        try:
            obs = pipeline_instance.process_frame(frame_id, file_path, device_id, timestamp_str)
            obs_dict = obs.model_dump(mode="json")
            await device_manager.broadcast({
                "type": "phase3_observation",
                "frame_id": frame_id,
                "observation": obs_dict
            })
        except Exception as e:
            logger.error(f"Error running Phase 3 CV pipeline for {frame_id}: {e}")

    pipeline_res = {}
    if HAS_PHASE4A:
        try:
            pipeline_res = await ooda_engine.run_pipeline(frame_id, obs_dict)
        except Exception as e:
            logger.error(f"Error running Phase 4B OODA pipeline for {frame_id}: {e}")

    # 4. Save per-frame agent result JSON files in frame directory
    agent_results = pipeline_res.get("results", {}) if isinstance(pipeline_res, dict) else {}
    
    with open(frame_folder / "recon.json", "w", encoding="utf-8") as f:
        json.dump(agent_results.get("RECON", {}), f, indent=2)
    with open(frame_folder / "verifier.json", "w", encoding="utf-8") as f:
        json.dump(agent_results.get("VERIFIER", {}), f, indent=2)
    with open(frame_folder / "predictor.json", "w", encoding="utf-8") as f:
        json.dump(agent_results.get("PREDICTOR", {}), f, indent=2)
    with open(frame_folder / "orchestrator.json", "w", encoding="utf-8") as f:
        json.dump(agent_results.get("ORCHESTRATOR", {}), f, indent=2)
    with open(frame_folder / "dispatch.json", "w", encoding="utf-8") as f:
        json.dump(agent_results.get("ROUTER_DISPATCH", {}), f, indent=2)

    if HAS_FRAME_TRACKER:
        frame_tracker.set_state(frame_id, FrameState.COMPLETED)

    # Fetch updated Digital Twin state
    dt_state = digital_twin_manager.get_state_dict() if HAS_CV_PIPELINE else {}

    completed_payload = {
        "frame_id": frame_id,
        "device_id": device_id,
        "image_url": image_url,
        "timestamp": timestamp_str,
        "status": "COMPLETED",
        "image": image_meta,
        "camera_coverage": coverage_meta,
        "physical_state": obs_dict,
        "observation": obs_dict,
        "digital_twin": dt_state,
        "pipeline": pipeline_res,
        "agents": agent_results,
        "total_frames": len(device_manager.frame_history)
    }

    # Record complete frame with per-frame agent results
    device_manager.record_frame(completed_payload)

    # 2. Broadcast completed intelligence results to Dashboard
    await device_manager.broadcast({
        "type": "photo_received_complete",
        **completed_payload
    })

    # 3. Send ACK_NEXT back to smartphone to authorize next capture
    if phone_ws:
        try:
            await phone_ws.send_json({
                "type": "photo_ack",
                "frame_id": frame_id,
                "device_id": device_id,
                "status": "COMPLETED",
                "frame_state": "ACKED",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "next_capture_authorized": True
            })
            if HAS_FRAME_TRACKER:
                frame_tracker.set_state(frame_id, FrameState.ACKED)
            logger.info(f"✓ ACK_NEXT sent to {device_id} for {frame_id} (All 5 agents completed)")
        except Exception as e:
            logger.error(f"Failed to send ACK_NEXT to {device_id} for {frame_id}: {e}")



async def _on_intelligence_event(event: IntelligenceEvent):
    """Bridge event_bus events to WebSocket broadcast."""
    await device_manager.broadcast({
        "type": "intelligence_event",
        "event_type": event.event_type,
        "frame_id": event.frame_id,
        "source": event.source,
        "payload": event.payload,
        "agent_statuses": intelligence_state_manager.get_agent_statuses()
    })

if HAS_PHASE4A:
    event_bus.subscribe("*", _on_intelligence_event)




def get_local_ipv4_addresses() -> List[str]:
    """
    Detect usable local network private IPv4 addresses of the host laptop.
    Excludes loopback (127.0.0.1) and non-private IPs.
    """
    addresses = []
    
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            addresses.append(ip)
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ip not in addresses:
                addresses.append(ip)
    except Exception:
        pass

    return addresses


class FrameManager:
    """Manages sequential Frame IDs and disk storage."""

    def __init__(self):
        self.frame_count = self._count_existing_frames()

    def _count_existing_frames(self) -> int:
        count = 0
        if INCOMING_DIR.exists():
            for f in INCOMING_DIR.glob("FRAME-*.jpg"):
                match = re.search(r"FRAME-(\d+)\.jpg", f.name)
                if match:
                    count = max(count, int(match.group(1)))
        return count

    def get_next_frame_id(self) -> str:
        self.frame_count += 1
        return f"FRAME-{self.frame_count:06d}"

    def save_base64_image(self, frame_id: str, base64_data: str) -> Path:
        # Strip Data URL header if present (e.g. data:image/jpeg;base64,...)
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]

        # Ensure string is clean ascii
        base64_clean = base64_data.encode("ascii", errors="ignore").decode("ascii")

        # Fix base64 padding if needed
        missing_padding = len(base64_clean) % 4
        if missing_padding:
            base64_clean += "=" * (4 - missing_padding)

        image_bytes = base64.b64decode(base64_clean)
        file_path = INCOMING_DIR / f"{frame_id}.jpg"
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        return file_path


frame_manager = FrameManager()


class DeviceManager:
    """In-memory manager tracking connected smartphone devices & dashboard clients."""
    
    def __init__(self):
        self.active_sockets: Set[WebSocket] = set()
        self.device_sockets: Dict[str, WebSocket] = {}
        self.device_info: Dict[str, Dict[str, Any]] = {}
        self.latest_frame: Dict[str, Any] = {}
        self.frame_history: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_sockets.add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_sockets:
            self.active_sockets.remove(websocket)
        
        device_id_to_remove = None
        for dev_id, ws in self.device_sockets.items():
            if ws == websocket:
                device_id_to_remove = dev_id
                break

        if device_id_to_remove:
            del self.device_sockets[device_id_to_remove]
            if device_id_to_remove in self.device_info:
                self.device_info[device_id_to_remove]["status"] = "disconnected"
            logger.info(f"[{datetime.now().strftime('%H:%M:%S')}] {device_id_to_remove} disconnected")

    def register_device(self, device_id: str, websocket: WebSocket):
        self.device_sockets[device_id] = websocket
        self.device_info[device_id] = {
            "device_id": device_id,
            "status": "connected",
            "connected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "last_heartbeat": datetime.now().strftime("%H:%M:%S")
        }
        logger.info(f"[{datetime.now().strftime('%H:%M:%S')}] {device_id} connected")
        logger.info(f"[{datetime.now().strftime('%H:%M:%S')}] {device_id} registered")

    def update_heartbeat(self, device_id: str) -> str:
        now_str = datetime.now().strftime("%H:%M:%S")
        if device_id in self.device_info:
            self.device_info[device_id]["last_heartbeat"] = now_str
            self.device_info[device_id]["status"] = "connected"
        return now_str

    def record_frame(self, frame_info: Dict[str, Any]):
        self.latest_frame = frame_info
        self.frame_history.insert(0, frame_info)
        if len(self.frame_history) > 30:
            self.frame_history = self.frame_history[:30]

    async def broadcast(self, message: dict):
        """Send JSON message to all connected clients (phone & laptop dashboard)."""
        stale_sockets = set()
        for ws in self.active_sockets:
            try:
                await ws.send_json(message)
            except Exception:
                stale_sockets.add(ws)
        
        for ws in stale_sockets:
            self.disconnect(ws)

    def get_status_summary(self) -> Dict[str, Any]:
        connected_devices = [
            info for info in self.device_info.values()
            if info.get("status") == "connected"
        ]
        return {
            "gateway": "online",
            "connected_devices": len(connected_devices),
            "devices": [
                {
                    "device_id": info["device_id"],
                    "status": info["status"],
                    "last_heartbeat": info.get("last_heartbeat")
                }
                for info in connected_devices
            ],
            "latest_frame": self.latest_frame,
            "total_frames_captured": len(self.frame_history),
            "recent_history": self.frame_history[:10]
        }


device_manager = DeviceManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan banner printing on gateway startup."""
    local_ips = get_local_ipv4_addresses()
    
    print("\n" + "=" * 60)
    print(" AEGIS FLOOD - IoT GATEWAY (Phase 2B)")
    print(" Automatic Rear Camera Capture - 5 Second Interval")
    print("=" * 60)
    print("\nLocal HTTP Gateway:")
    print("  http://localhost:8100")
    print("  http://0.0.0.0:8100")
    print("\nLaptop Display Dashboard:")
    print("  http://localhost:8100/dashboard")
    print("\nCloudflare Quick Tunnel (Run in Terminal 2 for Mobile HTTPS):")
    print("  cloudflared tunnel --url http://localhost:8100")
    print("  (or .\\cloudflared.exe tunnel --url http://localhost:8100)")
    print("\n  Open the generated HTTPS URL on Android Chrome / iPhone Safari:")
    print("  https://xxxxx.trycloudflare.com/")
    print("\nDefault Stream Interval:")
    print("  5000 ms (5 seconds)")
    print("\nStatus:")
    print("  Waiting for device streaming...\n")
    print("=" * 60 + "\n")
    
    yield


app = FastAPI(
    title="AEGIS FLOOD — IoT Physical Testbed Gateway",
    version="0.3.0",
    description="Phase 2B Continuous Photo Capture — 5 Second Interval Gateway",
    lifespan=lifespan
)

# CORS configuration for local network prototype
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frames folder for laptop browser image serving
app.mount("/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")


@app.get("/health")
async def health_check():
    """Phase 2B Health Endpoint."""
    return JSONResponse({
        "status": "ok",
        "service": "aegis-iot-gateway",
        "version": "0.3.0",
        "camera_enabled": True,
        "frame_capture_enabled": True,
        "phase": "2B",
        "default_capture_interval_ms": 5000
    })


@app.get("/device-status")
async def device_status():
    """Connected devices & latest frame status summary."""
    return JSONResponse(device_manager.get_status_summary())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for smartphone connectivity, photo uploads, heartbeats, and laptop dashboard updates.
    """
    await device_manager.connect(websocket)
    assigned_device_id = "PHONE-01"

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.warning("Received invalid JSON payload over WebSocket")
                continue

            msg_type = data.get("type")
            device_id = data.get("device_id", assigned_device_id)

            if msg_type == "device_register":
                assigned_device_id = device_id
                device_manager.register_device(assigned_device_id, websocket)
                
                await websocket.send_json({
                    "type": "device_registered",
                    "device_id": assigned_device_id,
                    "status": "connected",
                    "gateway": "AEGIS-IOT-GATEWAY",
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })

            elif msg_type == "heartbeat":
                hb_time = device_manager.update_heartbeat(device_id)
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "device_id": device_id,
                    "timestamp": hb_time
                })

            elif msg_type == "connection_test":
                logger.info(f"[{datetime.now().strftime('%H:%M:%S')}] Connection test received from {device_id}")
                logger.info(f"[{datetime.now().strftime('%H:%M:%S')}] Connection test passed")
                
                await websocket.send_json({
                    "type": "connection_test_result",
                    "device_id": device_id,
                    "status": "success",
                    "message": "Phone -> Wi-Fi -> Laptop Gateway connection verified",
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })

            elif msg_type == "photo_upload":
                frame_id = data.get("frame_id") or frame_manager.get_next_frame_id()
                base64_img = data.get("image_data")
                timestamp_str = data.get("timestamp") or datetime.now().strftime("%H:%M:%S")

                if not base64_img:
                    await websocket.send_json({
                        "type": "photo_error",
                        "device_id": device_id,
                        "message": "Missing image_data payload"
                    })
                    continue

                # Save frame image to incoming directory
                file_path = frame_manager.save_base64_image(frame_id, base64_img)
                image_url = f"/frames/incoming/{frame_id}.jpg"

                if HAS_FRAME_TRACKER:
                    frame_tracker.set_state(frame_id, FrameState.RECEIVED)
                    frame_tracker.set_state(frame_id, FrameState.QUEUED)

                frame_info = {
                    "frame_id": frame_id,
                    "device_id": device_id,
                    "image_url": image_url,
                    "timestamp": timestamp_str,
                    "saved_path": str(file_path),
                    "state": "QUEUED"
                }
                device_manager.record_frame(frame_info)

                logger.info(f"{frame_id} RECEIVED from {device_id} - Queued for 5-Agent Intelligence Pipeline")

                # Trigger Phase 4B Closed-Loop pipeline (CV -> 5 Agents -> Dashboard -> ACK_NEXT to Phone)
                asyncio.create_task(process_frame_closed_loop(frame_id, file_path, device_id, timestamp_str, websocket))

    except WebSocketDisconnect:
        device_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for {assigned_device_id}: {e}")
        device_manager.disconnect(websocket)


@app.get("/api/calibration")
@app.get("/api/iot/camera/calibration")
async def get_calibration():
    """Retrieve 4-corner perspective calibration configuration & physical testbed footprint."""
    if not HAS_CV_PIPELINE:
        return JSONResponse({"status": "unavailable"})
    return JSONResponse(camera_calibrator.get_config_dict())


@app.post("/api/calibration")
@app.post("/api/iot/camera/calibration")
async def save_calibration(request: Request):
    """Update 4-corner camera calibration points & physical testbed dimensions."""
    if not HAS_CV_PIPELINE:
        return JSONResponse({"status": "unavailable"})
    data = await request.json()
    testbed_cfg = data.get("testbed", {})
    calib_cfg = data.get("calibration", {})
    saved = camera_calibrator.save_config(
        top_left=data.get("top_left") or calib_cfg.get("top_left", [50, 50]),
        top_right=data.get("top_right") or calib_cfg.get("top_right", [750, 50]),
        bottom_right=data.get("bottom_right") or calib_cfg.get("bottom_right", [750, 750]),
        bottom_left=data.get("bottom_left") or calib_cfg.get("bottom_left", [50, 750]),
        target_width=data.get("target_width", 800),
        target_height=data.get("target_height", 800),
        model_width_cm=data.get("model_width_cm") or testbed_cfg.get("width_cm", 80),
        model_height_cm=data.get("model_height_cm") or testbed_cfg.get("height_cm", 80)
    )
    return JSONResponse({"status": "success", "config": camera_calibrator.get_config_dict()})


@app.get("/api/observation/latest")
async def get_latest_observation():
    """Retrieve latest canonical Phase 3 Observation."""
    if not HAS_CV_PIPELINE:
        return JSONResponse({"status": "no_observations", "observation": None})
    latest = temporal_state_manager.get_latest()
    if not latest:
        return JSONResponse({"status": "no_observations", "observation": None})
    return JSONResponse({"status": "ok", "observation": latest.model_dump(mode="json")})


@app.get("/api/digital-twin/state")
async def get_digital_twin_state():
    """Retrieve current synchronized Digital Twin state dict."""
    if not HAS_CV_PIPELINE:
        return JSONResponse({"status": "unavailable"})
    return JSONResponse({"status": "ok", "digital_twin": digital_twin_manager.get_state_dict()})


@app.get("/api/mode")
async def get_system_mode():
    """Get current experiment mode (PHYSICAL_TESTBED_LIVE vs DEMO_SIMULATION_REPLAY)."""
    return JSONResponse({"mode": digital_twin_manager.mode})


@app.post("/api/mode")
async def set_system_mode(request: Request):
    """Set experiment mode."""
    data = await request.json()
    new_mode = data.get("mode", "PHYSICAL_TESTBED_LIVE")
    digital_twin_manager.mode = new_mode
    logger.info(f"System experiment mode changed to: {new_mode}")
    return JSONResponse({"status": "success", "mode": digital_twin_manager.mode})


demo_step = 0

@app.post("/api/demo/trigger_frame")
async def trigger_demo_simulation_frame():
    """
    Triggers a Demo Simulation Frame replaying physical flood progression
    (S2 -> S6 -> S7 -> S11 -> S15) for demonstration when physical water is not being poured live.
    """
    global demo_step
    demo_step += 1
    frame_id = f"FRAME-DEMO-{demo_step:04d}"
    timestamp_str = datetime.now().strftime("%H:%M:%S")

    frame_folder = INCOMING_DIR / frame_id
    frame_folder.mkdir(parents=True, exist_ok=True)
    file_path = frame_folder / "original.jpg"

    # Create synthetic cardboard testbed image with progressive blue water
    img = np.zeros((800, 800, 3), dtype=np.uint8)
    img[:] = (35, 45, 55) # Dark cardboard testbed baseline

    # Draw city sector grid lines
    for i in range(1, 4):
        cv2.line(img, (i * 200, 0), (i * 200, 800), (80, 80, 80), 1)
        cv2.line(img, (0, i * 200), (800, i * 200), (80, 80, 80), 1)

    # Draw River
    river_pts = np.array([[240, 0], [360, 0], [380, 200], [580, 240], [560, 400], [580, 600], [540, 800], [440, 800]], np.int32)
    cv2.polylines(img, [river_pts], True, (120, 120, 120), 2)

    # Flood sectors based on demo_step progression
    # Step 1: River Overflow (S2, S6)
    # Step 2: Bridge & Central City (S6, S7)
    # Step 3: Evacuation Warning (S6, S7, S10, S11)
    # Step 4+: Major Inundation (S6, S7, S10, S11, S15)
    if demo_step >= 1:
        cv2.rectangle(img, (200, 0), (400, 400), (220, 100, 20), -1) # Blue water in S2, S6
    if demo_step >= 2:
        cv2.rectangle(img, (400, 200), (600, 400), (220, 100, 20), -1) # Blue water in S7
    if demo_step >= 3:
        cv2.rectangle(img, (200, 400), (600, 600), (220, 100, 20), -1) # Blue water in S10, S11
    if demo_step >= 4:
        cv2.rectangle(img, (400, 600), (600, 800), (220, 100, 20), -1) # Blue water in S15

    cv2.imwrite(str(file_path), img)

    # Execute Closed-Loop pipeline asynchronously
    asyncio.create_task(process_frame_closed_loop(frame_id, file_path, "DEMO-NODE", timestamp_str, None))

    return JSONResponse({
        "status": "success",
        "frame_id": frame_id,
        "demo_step": demo_step,
        "mode": "DEMO_SIMULATION_REPLAY"
    })



@app.get("/api/intelligence/state")
async def get_intelligence_state_gateway():
    """Retrieve Phase 4A Multi-Agent Intelligence state, active incident, and agent execution metrics."""
    if not HAS_PHASE4A:
        return JSONResponse({"status": "unavailable"})
    return JSONResponse(intelligence_state_manager.get_full_state())




@app.get("/", response_class=HTMLResponse)
async def get_mobile_ui(request: Request):
    """
    Mobile Smartphone UI for Phase 2B — Fully Automatic Aerial Sensing Node.
    Automatically connects WebSocket, starts rear camera, captures frames continuously
    with closed-loop ACK backpressure & Camera Coverage HUD telemetry.
    """
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AEGIS FLOOD — Remote Sensing Node</title>
    <style>
        :root {
            --bg-dark: #070b14;
            --panel-bg: rgba(13, 20, 36, 0.88);
            --panel-border: rgba(6, 182, 212, 0.3);
            --cyan-primary: #06b6d4;
            --cyan-bright: #22d3ee;
            --emerald-accent: #10b981;
            --amber-accent: #f59e0b;
            --rose-accent: #f43f5e;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
                radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
            background-attachment: fixed;
        }

        .container {
            width: 100%;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        /* HEADER */
        .brand-header {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .brand-shield {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2));
            border: 1px solid var(--cyan-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
        }

        .brand-shield svg {
            width: 22px;
            height: 22px;
            fill: none;
            stroke: var(--cyan-bright);
            stroke-width: 2;
        }

        .title {
            font-size: 19px;
            font-weight: 900;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #ffffff, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 10px;
            font-family: monospace;
            font-weight: 700;
            letter-spacing: 2px;
            color: var(--cyan-primary);
            text-transform: uppercase;
        }

        /* CARD */
        .card {
            background: var(--panel-bg);
            border: 1px solid var(--panel-border);
            border-radius: 20px;
            padding: 16px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .node-tag {
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            letter-spacing: 1px;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .status-connecting {
            background: rgba(245, 158, 11, 0.15);
            color: var(--amber-accent);
            border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .status-connected {
            background: rgba(16, 185, 129, 0.15);
            color: var(--emerald-accent);
            border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .status-disconnected {
            background: rgba(244, 63, 94, 0.15);
            color: var(--rose-accent);
            border: 1px solid rgba(244, 63, 94, 0.4);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: currentColor;
        }

        /* CAMERA VIEW CONTAINER WITH FOOTPRINT HUD OVERLAY */
        .camera-container {
            width: 100%;
            height: 230px;
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(6, 182, 212, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* CAMERA COVERAGE & FOOTPRINT OVERLAY */
        .camera-hud-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 10px;
            z-index: 5;
        }

        .hud-bounding-box {
            position: absolute;
            top: 10%;
            left: 10%;
            right: 10%;
            bottom: 10%;
            border: 2px solid var(--emerald-accent);
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.4), inset 0 0 12px rgba(16, 185, 129, 0.15);
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .hud-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .hud-bottom-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }

        .hud-tag {
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            color: var(--cyan-bright);
            background: rgba(7, 11, 20, 0.85);
            padding: 3px 7px;
            border-radius: 4px;
            border: 1px solid rgba(6, 182, 212, 0.4);
        }

        .hud-status-badge {
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            color: var(--emerald-accent);
            background: rgba(16, 185, 129, 0.2);
            padding: 3px 8px;
            border-radius: 4px;
            border: 1px solid var(--emerald-accent);
        }

        .hud-chip {
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            color: #fff;
            background: rgba(7, 11, 20, 0.85);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .camera-error-banner {
            position: absolute;
            inset: 0;
            padding: 20px;
            text-align: center;
            color: var(--rose-accent);
            background: rgba(7, 11, 20, 0.95);
            font-size: 11px;
            font-family: monospace;
            line-height: 1.5;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            z-index: 10;
        }

        /* INTERVAL SETTING BADGE */
        .interval-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-radius: 12px;
            background: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.25);
            font-size: 11px;
            font-family: monospace;
            font-weight: 800;
            color: var(--cyan-bright);
        }

        /* STREAM CONTROLS */
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .btn-stream {
            width: 100%;
            padding: 14px;
            border-radius: 16px;
            color: var(--text-main);
            font-size: 13px;
            font-family: monospace;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .btn-stream.stop-mode {
            border: 1px solid rgba(244, 63, 94, 0.6);
            background: linear-gradient(135deg, rgba(244, 63, 94, 0.35), rgba(245, 158, 11, 0.35));
            box-shadow: 0 4px 20px rgba(244, 63, 94, 0.3);
        }

        .btn-stream.resume-mode {
            border: 1px solid rgba(16, 185, 129, 0.6);
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.35));
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }

        .btn-stream:active {
            transform: scale(0.97);
        }

        /* TELEMETRY CARD */
        .telemetry-card {
            background: rgba(7, 11, 20, 0.6);
            border: 1px solid rgba(6, 182, 212, 0.25);
            border-radius: 14px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .telemetry-card-title {
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            letter-spacing: 1px;
            color: var(--cyan-bright);
            text-transform: uppercase;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* METRICS LIST */
        .metrics-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            border-radius: 8px;
            background: rgba(7, 11, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .metric-label {
            font-size: 9px;
            font-family: monospace;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .metric-value {
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            color: var(--text-main);
        }

        .metric-value.highlight { color: var(--cyan-bright); }
        .metric-value.active { color: var(--emerald-accent); }
        .metric-value.error { color: var(--rose-accent); }

        /* RESULT BANNER */
        .result-banner {
            padding: 10px 14px;
            border-radius: 12px;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: var(--emerald-accent);
            font-size: 11px;
            font-family: monospace;
            font-weight: 800;
            text-align: center;
            display: none;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        canvas { display: none; }
    </style>
</head>
<body>

    <div class="container">
        
        <!-- HEADER -->
        <div class="brand-header">
            <div class="brand-shield">
                <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>
            <div class="title">AEGIS FLOOD</div>
            <div class="subtitle">AUTOMATIC AERIAL SENSOR NODE (PHASE 2B)</div>
        </div>

        <!-- MAIN CARD -->
        <div class="card">
            
            <div class="card-header">
                <div class="node-tag">IoT CAPTURE NODE</div>
                <div id="statusBadge" class="status-badge status-connecting">
                    <span class="status-dot"></span>
                    <span id="statusText">CONNECTING...</span>
                </div>
            </div>

            <!-- CAMERA PREVIEW WITH HUD OVERLAY -->
            <div class="camera-container">
                <video id="videoPreview" autoplay playsinline muted></video>
                <div class="hud-bounding-box" id="hudBoundingBox"></div>
                <div class="camera-hud-overlay">
                    <div class="hud-top-bar">
                        <span class="hud-tag">AERIAL CAM</span>
                        <span id="hudStatusTag" class="hud-status-badge">✓ TESTBED FULLY VISIBLE</span>
                    </div>
                    <div class="hud-bottom-bar">
                        <span class="hud-chip" id="hudCoveragePct">100% COVERED</span>
                        <span class="hud-chip" id="hudDim">80 cm × 80 cm</span>
                        <span class="hud-chip" id="hudArea">0.64 m²</span>
                        <span class="hud-chip" id="hudSectors">16 / 16 SECTORS</span>
                    </div>
                </div>
                <div id="cameraErrorBanner" class="camera-error-banner"></div>
            </div>

            <!-- CAMERA FOOTPRINT TELEMETRY CARD -->
            <div class="telemetry-card">
                <div class="telemetry-card-title">📐 CAMERA COVERAGE & FOOTPRINT HUD</div>
                <div class="metrics-grid">
                    <div class="metric-row">
                        <span class="metric-label">PHYSICAL COVERAGE</span>
                        <span class="metric-value highlight" id="telemetryDimVal">80 cm × 80 cm</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">SURFACE AREA</span>
                        <span class="metric-value highlight" id="telemetryAreaVal">0.64 m² (6,400 cm²)</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">VISIBLE SECTORS</span>
                        <span class="metric-value active" id="telemetrySectorsVal">16 / 16 Sectors</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">ALIGNMENT STATE</span>
                        <span class="metric-value active" id="telemetryStatusVal">● FULL / ALIGNED</span>
                    </div>
                </div>
            </div>

            <!-- INTERVAL BAR -->
            <div class="interval-bar">
                <span>CAPTURE INTERVAL</span>
                <span id="intervalVal">5 SECONDS</span>
            </div>

            <!-- STREAM CONTROL ACTION -->
            <div class="control-group">
                <button id="stopStreamBtn" class="btn-stream stop-mode" onclick="toggleStopResume()">
                    🛑 STOP STREAM
                </button>
            </div>

            <!-- RESULT DISPLAY -->
            <div id="resultBanner" class="result-banner">
                <div id="resultTitle">✓ FRAME SENT</div>
                <div id="resultSubtitle" style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Frame: FRAME-000001</div>
            </div>

            <!-- SYSTEM METRICS GRID -->
            <div class="metrics-grid">
                <div class="metric-row">
                    <span class="metric-label">DEVICE</span>
                    <span class="metric-value highlight">PHONE-01</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">SECURE CONTEXT</span>
                    <span id="secureCtxVal" class="metric-value">CHECKING...</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">CAMERA API</span>
                    <span id="camApiVal" class="metric-value">CHECKING...</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">STREAM STATUS</span>
                    <span id="streamStatusVal" class="metric-value active">● STARTING</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">FRAMES SENT</span>
                    <span id="sentCountVal" class="metric-value">0</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">LAST SENT FRAME</span>
                    <span id="lastFrameVal" class="metric-value">Waiting</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">LAST TRANSMISSION</span>
                    <span id="lastTxVal" class="metric-value">STANDBY</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">LAST HEARTBEAT</span>
                    <span id="heartbeatVal" class="metric-value">--:--:--</span>
                </div>
            </div>

        </div>

    </div>

    <!-- Hidden canvas for automatic video frame extraction -->
    <canvas id="hiddenCanvas"></canvas>

    <script>
        const CAPTURE_INTERVAL_MS = 5000;

        let ws = null;
        let heartbeatInterval = null;
        let streamIntervalTimer = null;
        let isStreaming = false;
        let isProcessingFrame = false;
        let cameraStream = null;
        let streamActive = false;
        
        const deviceId = "PHONE-01";
        let frameCounter = 0;
        let framesSentCount = 0;

        const videoElem = document.getElementById("videoPreview");
        const errorBanner = document.getElementById("cameraErrorBanner");
        const stopStreamBtn = document.getElementById("stopStreamBtn");

        document.getElementById("intervalVal").innerText = (CAPTURE_INTERVAL_MS / 1000) + " SECONDS";

        async function fetchCalibrationCoverage() {
            try {
                const res = await fetch("/api/calibration");
                const data = await res.json();
                if (data && data.coverage) {
                    updateCoverageHUD(data.coverage);
                }
            } catch (e) {
                console.warn("Could not fetch calibration coverage:", e);
            }
        }

        function updateCoverageHUD(cov) {
            if (!cov) return;
            const statusStr = cov.status || "FULL";
            const isFull = statusStr === "FULL" || statusStr === "ALIGNED";
            
            document.getElementById("hudStatusTag").innerText = isFull ? "✓ TESTBED FULLY VISIBLE" : ("⚠ " + statusStr);
            document.getElementById("hudCoveragePct").innerText = (cov.visible_percent || 100) + "% COVERED";
            document.getElementById("hudDim").innerText = (cov.visible_width_cm || 80) + " cm × " + (cov.visible_height_cm || 80) + " cm";
            const areaM2 = ((cov.visible_area_cm2 || 6400) / 10000).toFixed(2);
            document.getElementById("hudArea").innerText = areaM2 + " m²";
            document.getElementById("hudSectors").innerText = (cov.sectors_visible || "16 / 16") + " SECTORS";

            document.getElementById("telemetryDimVal").innerText = (cov.visible_width_cm || 80) + " cm × " + (cov.visible_height_cm || 80) + " cm";
            document.getElementById("telemetryAreaVal").innerText = areaM2 + " m² (" + (cov.visible_area_cm2 || 6400).toLocaleString() + " cm²)";
            document.getElementById("telemetrySectorsVal").innerText = (cov.sectors_visible || "16 / 16") + " Sectors";
            document.getElementById("telemetryStatusVal").innerText = isFull ? "● FULL / ALIGNED" : ("⚠ " + statusStr);
            document.getElementById("telemetryStatusVal").className = isFull ? "metric-value active" : "metric-value error";
        }

        function updateDiagnostics() {
            const isSecure = window.isSecureContext;
            const secureElem = document.getElementById("secureCtxVal");
            secureElem.innerText = isSecure ? "● YES (HTTPS)" : "✕ NO (HTTP)";
            secureElem.className = isSecure ? "metric-value active" : "metric-value error";

            const hasCamApi = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            const apiElem = document.getElementById("camApiVal");
            apiElem.innerText = hasCamApi ? "● AVAILABLE" : "✕ NOT SUPPORTED";
            apiElem.className = hasCamApi ? "metric-value active" : "metric-value error";
        }

        function connectWebSocket() {
            updateDiagnostics();
            fetchCalibrationCoverage();

            const statusBadge = document.getElementById("statusBadge");
            const statusText = document.getElementById("statusText");

            statusBadge.className = "status-badge status-connecting";
            statusText.innerText = "CONNECTING...";

            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = protocol + "//" + window.location.host + "/ws";

            ws = new WebSocket(wsUrl);

            ws.onopen = function() {
                console.log("WebSocket connected");
                statusBadge.className = "status-badge status-connected";
                statusText.innerText = "CONNECTED";

                ws.send(JSON.stringify({
                    type: "device_register",
                    device_id: deviceId,
                    device_type: "smartphone",
                    mode: "physical-testbed"
                }));

                if (heartbeatInterval) clearInterval(heartbeatInterval);
                heartbeatInterval = setInterval(sendHeartbeat, 3000);

                startCameraAndStream();
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "heartbeat_ack") {
                        document.getElementById("heartbeatVal").innerText = data.timestamp || new Date().toLocaleTimeString();
                    } else if (data.type === "photo_ack") {
                        onPhotoAck(data);
                    }
                } catch (e) {
                    console.error("Error parsing WS message:", e);
                }
            };

            ws.onclose = function() {
                statusBadge.className = "status-badge status-disconnected";
                statusText.innerText = "DISCONNECTED";
                document.getElementById("streamStatusVal").innerText = "● DISCONNECTED";
                document.getElementById("streamStatusVal").className = "metric-value error";

                if (heartbeatInterval) clearInterval(heartbeatInterval);
                if (streamIntervalTimer) {
                    clearInterval(streamIntervalTimer);
                    streamIntervalTimer = null;
                }
                isStreaming = false;

                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = function(err) {
                console.error("WebSocket error:", err);
                ws.close();
            };
        }

        function sendHeartbeat() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "heartbeat", device_id: deviceId }));
            }
        }

        async function startCameraAndStream() {
            if (streamActive && isStreaming) return;

            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("navigator.mediaDevices.getUserMedia is unavailable. Access via HTTPS.");
                }

                let stream = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                } catch (e1) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                    } catch (e2) {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }
                }

                cameraStream = stream;
                videoElem.srcObject = stream;
                await videoElem.play().catch(e => console.warn("Video play exception:", e));

                await waitForVideoReady();

                streamActive = true;
                errorBanner.style.display = "none";
                startCaptureLoop();
            } catch (err) {
                console.error("Camera access failed:", err);
                streamActive = false;
                const errName = err.name || "Camera Error";
                const errDetail = err.message || String(err);

                document.getElementById("streamStatusVal").innerText = "○ " + errName;
                document.getElementById("streamStatusVal").className = "metric-value error";

                errorBanner.style.display = "flex";
                errorBanner.innerHTML = `
                    <div style="font-weight: 800; font-size: 12px;">⚠ CAMERA INITIALIZATION FAILED</div>
                    <div style="font-size: 11px; color: #f59e0b; font-family: monospace; word-break: break-all; margin: 2px 0;">
                        ${errName}: ${errDetail}
                    </div>
                    <button onclick="startCameraAndStream()" style="margin-top: 6px; padding: 6px 12px; background: rgba(6, 182, 212, 0.3); border: 1px solid #06b6d4; color: #fff; border-radius: 8px; font-family: monospace; font-size: 10px; cursor: pointer;">
                        🔄 RETRY ACCESS
                    </button>
                `;
            }
        }

        function waitForVideoReady() {
            return new Promise((resolve) => {
                if (videoElem.videoWidth > 0 && videoElem.videoHeight > 0) {
                    resolve();
                    return;
                }
                videoElem.onloadedmetadata = () => { setTimeout(resolve, 300); };
                setTimeout(resolve, 1000);
            });
        }

        let captureStartTime = 0;

        function startCaptureLoop() {
            if (isStreaming) return;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            if (!streamActive) return;

            isStreaming = true;
            document.getElementById("streamStatusVal").innerText = "● ACK-BASED STREAM";
            document.getElementById("streamStatusVal").className = "metric-value active";
            stopStreamBtn.innerText = "🛑 STOP STREAM";
            stopStreamBtn.className = "btn-stream stop-mode";

            triggerFrameCapture();
        }

        function stopStream() {
            isStreaming = false;
            if (streamIntervalTimer) {
                clearTimeout(streamIntervalTimer);
                streamIntervalTimer = null;
            }

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            streamActive = false;
            videoElem.srcObject = null;

            document.getElementById("streamStatusVal").innerText = "○ STOPPED";
            document.getElementById("streamStatusVal").className = "metric-value";
            
            stopStreamBtn.innerText = "🟢 RESUME STREAM";
            stopStreamBtn.className = "btn-stream resume-mode";
        }

        function toggleStopResume() {
            if (isStreaming || streamActive) {
                stopStream();
            } else {
                startCameraAndStream();
            }
        }

        async function triggerFrameCapture() {
            if (!isStreaming) return;
            if (isProcessingFrame) {
                console.warn("Skipping capture frame: waiting for server 5-agent pipeline ACK_NEXT");
                return;
            }

            if (!streamActive || videoElem.videoWidth === 0) {
                console.warn("Video frame not ready yet.");
                return;
            }

            isProcessingFrame = true;
            captureStartTime = Date.now();

            try {
                frameCounter++;
                const frameId = "FRAME-" + String(frameCounter).padStart(6, '0');
                document.getElementById("lastFrameVal").innerText = frameId;
                document.getElementById("lastTxVal").innerText = "SENDING...";

                const resultBanner = document.getElementById("resultBanner");
                resultBanner.style.display = "block";
                resultBanner.style.background = "rgba(245, 158, 11, 0.15)";
                resultBanner.style.borderColor = "rgba(245, 158, 11, 0.4)";
                resultBanner.style.color = "var(--amber-accent)";
                document.getElementById("resultTitle").innerText = "⌛ PROCESSING (5 AGENTS)";
                document.getElementById("resultSubtitle").innerText = "Frame: " + frameId + " | Waiting for OODA completion...";

                const canvas = document.getElementById("hiddenCanvas");
                const ctx = canvas.getContext("2d");
                
                const maxDim = 800;
                let w = videoElem.videoWidth;
                let h = videoElem.videoHeight;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(videoElem, 0, 0, w, h);
                const base64Jpeg = canvas.toDataURL("image/jpeg", 0.8);

                ws.send(JSON.stringify({
                    type: "photo_upload",
                    frame_id: frameId,
                    device_id: deviceId,
                    timestamp: new Date().toLocaleTimeString(),
                    capture_interval_ms: CAPTURE_INTERVAL_MS,
                    image_data: base64Jpeg
                }));
                document.getElementById("lastTxVal").innerText = "AWAITING ACK";
            } catch (err) {
                console.error("Frame capture error:", err);
                isProcessingFrame = false;
                document.getElementById("lastTxVal").innerText = "ERROR";
            }
        }

        function onPhotoAck(data) {
            isProcessingFrame = false;
            framesSentCount++;
            
            document.getElementById("sentCountVal").innerText = framesSentCount;
            document.getElementById("lastFrameVal").innerText = data.frame_id;
            document.getElementById("lastTxVal").innerText = "ACK_NEXT RECEIVED";

            const resultBanner = document.getElementById("resultBanner");
            resultBanner.style.display = "block";
            resultBanner.style.background = "rgba(16, 185, 129, 0.15)";
            resultBanner.style.borderColor = "rgba(16, 185, 129, 0.4)";
            resultBanner.style.color = "var(--emerald-accent)";
            document.getElementById("resultTitle").innerText = "✓ 5-AGENT PIPELINE COMPLETE";
            document.getElementById("resultSubtitle").innerText = "Frame: " + data.frame_id + " | Next Frame Authorized";

            const elapsed = Date.now() - captureStartTime;
            const remaining = Math.max(500, CAPTURE_INTERVAL_MS - elapsed);

            console.log(`[Closed-Loop ACK] Frame ${data.frame_id} completed in ${elapsed}ms. Next capture in ${remaining}ms.`);

            if (streamIntervalTimer) clearTimeout(streamIntervalTimer);
            if (isStreaming) {
                streamIntervalTimer = setTimeout(triggerFrameCapture, remaining);
            }
        }

        window.addEventListener("DOMContentLoaded", () => {
            connectWebSocket();
        });
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)


@app.get("/dashboard", response_class=HTMLResponse)
async def get_laptop_dashboard(request: Request):
    """
    Laptop Display Dashboard for AEGIS Physical Testbed — Chronological Frame Evidence Timeline.
    Renders vertically scrollable evidence cards for each captured frame with complete original photo
    (object-fit: contain), view mode tabs (Original, Rectified, Water Mask, Sector Analysis),
    temporal delta comparison (+7.7% from FRAME-000003), per-frame 5-agent OODA results accordion,
    and AI Action Plan cards.
    """
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AEGIS FLOOD — Chronological Frame Evidence Timeline</title>
    <style>
        :root {
            --bg-dark: #070b14;
            --panel-bg: rgba(13, 20, 36, 0.92);
            --panel-border: rgba(6, 182, 212, 0.3);
            --cyan-primary: #06b6d4;
            --cyan-bright: #22d3ee;
            --emerald-accent: #10b981;
            --amber-accent: #f59e0b;
            --rose-accent: #f43f5e;
            --purple-accent: #a855f7;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 70%),
                radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
            background-attachment: fixed;
        }

        /* HEADER */
        .dash-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 20px;
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(7, 11, 20, 0.95);
            backdrop-filter: blur(12px);
            padding-top: 10px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(16, 185, 129, 0.25));
            border: 1px solid var(--cyan-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
        }

        .brand-icon svg {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: var(--cyan-bright);
            stroke-width: 2;
        }

        .dash-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #ffffff, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .dash-sub {
            font-size: 10px;
            font-family: monospace;
            font-weight: 700;
            letter-spacing: 2px;
            color: var(--cyan-primary);
            text-transform: uppercase;
        }

        .status-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            background: rgba(13, 20, 36, 0.85);
            border: 1px solid var(--panel-border);
        }

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: var(--emerald-accent);
            box-shadow: 0 0 8px var(--emerald-accent);
        }

        .btn-calib {
            padding: 6px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(168, 85, 247, 0.25));
            border: 1px solid var(--cyan-bright);
            color: #fff;
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-calib:hover {
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
            transform: translateY(-1px);
        }

        /* TIMELINE CONTAINER */
        .timeline-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        }

        .empty-timeline {
            text-align: center;
            padding: 60px 20px;
            background: var(--panel-bg);
            border: 1px dashed var(--panel-border);
            border-radius: 20px;
            color: var(--text-muted);
            font-family: monospace;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }

        /* FRAME EVIDENCE CARD */
        .frame-card {
            background: var(--panel-bg);
            border: 1px solid var(--panel-border);
            border-radius: 20px;
            padding: 20px;
            backdrop-filter: blur(16px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: border-color 0.3s ease;
        }

        .frame-card.processing {
            border-color: var(--amber-accent);
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
        }

        .frame-card.completed {
            border-color: rgba(6, 182, 212, 0.4);
        }

        /* FRAME CARD HEADER */
        .card-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-wrap: wrap;
            gap: 10px;
        }

        .frame-id-tag {
            font-size: 16px;
            font-family: monospace;
            font-weight: 900;
            color: var(--cyan-bright);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .frame-meta-chips {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .chip {
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            background: rgba(7, 11, 20, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
        }

        .chip.highlight {
            color: var(--cyan-bright);
            border-color: rgba(6, 182, 212, 0.3);
        }

        .chip.status-proc {
            background: rgba(245, 158, 11, 0.15);
            color: var(--amber-accent);
            border-color: rgba(245, 158, 11, 0.4);
        }

        .chip.status-done {
            background: rgba(16, 185, 129, 0.15);
            color: var(--emerald-accent);
            border-color: rgba(16, 185, 129, 0.4);
        }

        .view-mode-tabs {
            display: flex;
            gap: 4px;
            background: rgba(7, 11, 20, 0.8);
            padding: 3px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .view-tab {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            color: var(--text-muted);
            cursor: pointer;
            background: transparent;
            border: none;
            transition: all 0.2s ease;
        }

        .view-tab.active {
            background: var(--cyan-primary);
            color: #fff;
        }

        /* FRAME CARD GRID */
        .frame-card-grid {
            display: grid;
            grid-template-columns: 520px 1fr;
            gap: 20px;
        }

        @media (max-width: 1100px) {
            .frame-card-grid {
                grid-template-columns: 1fr;
            }
        }

        /* LEFT: FULL PHOTO DISPLAY & SECTOR GRID OVERLAY */
        .frame-photo-container {
            width: 100%;
            height: 440px;
            background: #000;
            border-radius: 16px;
            border: 1px solid rgba(6, 182, 212, 0.3);
            overflow: hidden;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
        }

        /* CRITICAL REQUIREMENT: object-fit contain (no cropping/stretching) */
        .frame-photo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }

        /* 16-SECTOR SPATIAL GRID OVERLAY */
        .sector-grid-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 2px;
            pointer-events: none;
            padding: 4px;
        }

        .sector-cell {
            border: 1px dashed rgba(34, 211, 238, 0.4);
            border-radius: 4px;
            padding: 4px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: monospace;
            transition: all 0.3s ease;
            background: rgba(0, 0, 0, 0.25);
        }

        .sector-cell.dry {
            background: rgba(16, 185, 129, 0.12);
            border-color: rgba(16, 185, 129, 0.4);
        }
        .sector-cell.early_flood {
            background: rgba(245, 158, 11, 0.3);
            border-color: rgba(245, 158, 11, 0.7);
        }
        .sector-cell.flooded {
            background: rgba(249, 115, 22, 0.45);
            border-color: rgba(249, 115, 22, 0.85);
        }
        .sector-cell.severely_flooded {
            background: rgba(244, 63, 94, 0.6);
            border-color: rgba(244, 63, 94, 0.95);
        }

        .cell-id {
            font-size: 10px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 0 4px #000;
        }
        .cell-pct {
            font-size: 9px;
            font-weight: 800;
            align-self: flex-end;
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
            padding: 1px 4px;
            border-radius: 3px;
        }

        /* RIGHT: TELEMETRY & 5-AGENT OODA ACCORDION */
        .frame-details-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .section-title {
            font-size: 10px;
            font-family: monospace;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: var(--cyan-bright);
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 4px;
            margin-top: 2px;
        }

        .metrics-grid-3col {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        .info-box {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 10px;
            border-radius: 8px;
            background: rgba(7, 11, 20, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-label {
            font-size: 9px;
            font-family: monospace;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .info-val {
            font-size: 12px;
            font-family: monospace;
            font-weight: 800;
            color: var(--text-main);
        }

        .info-val.highlight { color: var(--cyan-bright); }
        .info-val.emerald { color: var(--emerald-accent); }
        .info-val.amber { color: var(--amber-accent); }
        .info-val.rose { color: var(--rose-accent); }

        /* PER-FRAME 5-AGENT ACCORDION */
        .agents-accordion {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .agent-card {
            background: rgba(7, 11, 20, 0.65);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .agent-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .agent-name {
            font-size: 10px;
            font-family: monospace;
            font-weight: 900;
            color: var(--cyan-bright);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .agent-status-badge {
            font-size: 9px;
            font-family: monospace;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 4px;
            background: rgba(16, 185, 129, 0.15);
            color: var(--emerald-accent);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .agent-content {
            font-size: 10px;
            font-family: monospace;
            color: var(--text-main);
            line-height: 1.4;
        }

        /* ACTION PLAN BANNER */
        .action-plan-card {
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.12));
            border: 1px solid rgba(6, 182, 212, 0.4);
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .action-plan-title {
            font-size: 10px;
            font-family: monospace;
            font-weight: 900;
            color: var(--cyan-bright);
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .action-plan-text {
            font-size: 11px;
            font-family: monospace;
            color: #fff;
            line-height: 1.4;
        }

        /* CALIBRATION MODAL */
        .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        .modal-box {
            background: var(--panel-bg);
            border: 1px solid var(--cyan-primary);
            border-radius: 20px;
            padding: 24px;
            width: 100%;
            max-width: 500px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        }
        .modal-title {
            font-size: 16px;
            font-weight: 900;
            color: var(--cyan-bright);
            font-family: monospace;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .calib-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .calib-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .calib-field label {
            font-size: 10px;
            font-family: monospace;
            color: var(--text-muted);
        }
        .calib-field input {
            padding: 8px;
            border-radius: 8px;
            background: rgba(7, 11, 20, 0.8);
            border: 1px solid var(--panel-border);
            color: var(--cyan-bright);
            font-family: monospace;
            font-size: 12px;
            font-weight: 700;
        }
        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .btn-modal {
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 11px;
            font-family: monospace;
            font-weight: 800;
            cursor: pointer;
            border: none;
        }
        .btn-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
        }
        .btn-save {
            background: var(--cyan-primary);
            color: #fff;
        }
    </style>
</head>
<body>

    <!-- DASHBOARD HEADER -->
    <div class="dash-header">
        <div class="brand">
            <div class="brand-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>
            <div>
                <div class="dash-title">AEGIS FLOOD</div>
                <div class="dash-sub">FRAME EVIDENCE & FIVE-AGENT OODA PIPELINE</div>
            </div>
        </div>

        <div class="status-pills">
            <div class="pill">
                <span class="dot"></span>
                <span>GATEWAY: ONLINE</span>
            </div>
            <div class="pill">
                <span style="color: var(--emerald-accent);" id="streamPill">STREAM: READY</span>
            </div>
            <div class="pill" id="modePill">
                <span style="color: var(--cyan-bright);" id="modeText">PHYSICAL TESTBED ● LIVE</span>
            </div>
            <div class="pill">
                <span style="color: var(--cyan-bright);" id="framesCountPill">FRAMES: 0</span>
            </div>
            <div class="pill" id="pill-recon"><span style="color: var(--text-muted);">○ RECON</span></div>
            <div class="pill" id="pill-verifier"><span style="color: var(--text-muted);">○ VERIFIER</span></div>
            <div class="pill" id="pill-predictor"><span style="color: var(--text-muted);">○ PREDICTOR</span></div>
            <div class="pill" id="pill-orchestrator"><span style="color: var(--text-muted);">○ ORCHESTRATOR</span></div>
            <div class="pill" id="pill-router"><span style="color: var(--text-muted);">○ ROUTER</span></div>
            <button class="btn-calib" id="btnTriggerDemo" style="display:none; background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(244, 63, 94, 0.3)); border-color: var(--amber-accent);" onclick="triggerDemoStep()">▶ TRIGGER DEMO STEP</button>
            <button class="btn-calib" onclick="toggleMode()">🔄 TOGGLE MODE</button>
            <button class="btn-calib" onclick="openCalibrationModal()">📐 CALIBRATION</button>
        </div>
    </div>

    <!-- SIMULATION NOTICE BANNER (SECTION 24 REQUIREMENT) -->
    <div style="padding: 8px 16px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; font-size: 11px; font-family: monospace; font-weight: 800; color: var(--amber-accent); text-align: center; margin-bottom: 16px; max-width: 1400px; margin-left: auto; margin-right: auto;">
        ⚠️ SIMULATION MODE — Real Smartphone Evidence Photos + Synchronized Digital Twin + Simulated 5-Agent Intelligence Pipeline
    </div>

    <!-- TIMELINE CONTAINER -->
    <div class="timeline-container" id="frameTimeline">
        <div class="empty-timeline" id="emptyPlaceholder">
            <div style="font-size: 36px; opacity: 0.6;">🎥</div>
            <div>WAITING FOR FRAME STREAM FROM SMARTPHONE...</div>
            <div style="font-size: 11px; opacity: 0.6;">Captured photos will automatically appear here as full-evidence timeline cards with per-frame 5-agent OODA results.</div>
        </div>
    </div>

    <!-- CALIBRATION MODAL DIALOG -->
    <div id="calibModal" class="modal-backdrop">
        <div class="modal-box">
            <div class="modal-title">
                <span>📐 4-CORNER PERSPECTIVE CALIBRATION</span>
                <button onclick="closeCalibrationModal()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px;">✕</button>
            </div>
            <p style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
                Adjust pixel coordinates of testbed city corners on raw smartphone image.
            </p>
            <div class="calib-inputs">
                <div class="calib-field">
                    <label>TOP-LEFT (X, Y)</label>
                    <input id="calibTL" type="text" value="50, 50">
                </div>
                <div class="calib-field">
                    <label>TOP-RIGHT (X, Y)</label>
                    <input id="calibTR" type="text" value="750, 50">
                </div>
                <div class="calib-field">
                    <label>BOTTOM-RIGHT (X, Y)</label>
                    <input id="calibBR" type="text" value="750, 750">
                </div>
                <div class="calib-field">
                    <label>BOTTOM-LEFT (X, Y)</label>
                    <input id="calibBL" type="text" value="50, 750">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-modal btn-cancel" onclick="resetCalibrationDefaults()">RESTORE DEFAULTS</button>
                <button class="btn-modal btn-save" onclick="saveCalibrationConfig()">SAVE CALIBRATION</button>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let framesMap = {}; // Keyed by frame_id
        let framesOrder = []; // Reverse chronological order (newest first)
        let activeViewModes = {}; // Keyed by frame_id ('raw', 'rectified', 'mask', 'sector')
        let currentSystemMode = "PHYSICAL_TESTBED_LIVE";

        function connectDashboardWS() {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = protocol + "//" + window.location.host + "/ws";

            ws = new WebSocket(wsUrl);

            ws.onopen = function() {
                console.log("Dashboard WS Connected");
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "photo_received" || data.type === "photo_received_processing") {
                        onPhotoProcessingStarted(data);
                    } else if (data.type === "photo_received_complete") {
                        onPhotoReceivedComplete(data);
                    } else if (data.type === "phase3_observation") {
                        onPhase3Observation(data);
                    } else if (data.type === "intelligence_event") {
                        onIntelligenceEvent(data);
                    } else if (data.type === "phase4a_pipeline_complete") {
                        onPhase4aPipelineComplete(data);
                    }
                } catch (e) {
                    console.error("Error parsing WS message:", e);
                }
            };

            ws.onclose = function() {
                document.getElementById("streamPill").innerText = "STREAM: RECONNECTING";
                setTimeout(connectDashboardWS, 3000);
            };
        }

        function toggleMode() {
            const newMode = (currentSystemMode === "PHYSICAL_TESTBED_LIVE") ? "DEMO_SIMULATION_REPLAY" : "PHYSICAL_TESTBED_LIVE";
            fetch("/api/mode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: newMode })
            })
            .then(r => r.json())
            .then(d => {
                currentSystemMode = d.mode;
                updateModeUI();
            })
            .catch(e => console.error("Error toggling mode:", e));
        }

        function updateModeUI() {
            const modeText = document.getElementById("modeText");
            const btnDemo = document.getElementById("btnTriggerDemo");
            if (currentSystemMode === "DEMO_SIMULATION_REPLAY") {
                modeText.innerText = "DEMO SIMULATION ● REPLAY";
                modeText.style.color = "var(--amber-accent)";
                btnDemo.style.display = "inline-block";
            } else {
                modeText.innerText = "PHYSICAL TESTBED ● LIVE";
                modeText.style.color = "var(--cyan-bright)";
                btnDemo.style.display = "none";
            }
        }

        function triggerDemoStep() {
            fetch("/api/demo/trigger_frame", { method: "POST" })
                .then(r => r.json())
                .then(d => {
                    console.log("Demo frame triggered:", d.frame_id);
                })
                .catch(e => console.error("Error triggering demo frame:", e));
        }

        function onPhotoProcessingStarted(data) {
            document.getElementById("streamPill").innerText = "STREAM: PROCESSING (" + data.frame_id + ")";
            
            if (!framesMap[data.frame_id]) {
                framesMap[data.frame_id] = {
                    frame_id: data.frame_id,
                    device_id: data.device_id || "PHONE-01",
                    image_url: data.image_url,
                    timestamp: data.timestamp || new Date().toLocaleTimeString(),
                    status: "PROCESSING",
                    observation: null,
                    pipeline: null,
                    digital_twin: null
                };
                framesOrder.unshift(data.frame_id);
            } else {
                framesMap[data.frame_id].status = "PROCESSING";
            }
            
            updateAgentPills({ 'recon': 'running', 'verifier': 'idle', 'predictor': 'idle', 'orchestrator': 'idle', 'router_dispatch': 'idle' });
            renderTimeline();
        }

        function onPhotoReceivedComplete(data) {
            document.getElementById("streamPill").innerText = "STREAM: READY (ACK SENT)";
            
            if (!framesMap[data.frame_id]) {
                framesOrder.unshift(data.frame_id);
            }
            
            framesMap[data.frame_id] = {
                frame_id: data.frame_id,
                device_id: data.device_id || "PHONE-01",
                image_url: data.image_url,
                timestamp: data.timestamp,
                status: "COMPLETED",
                camera_coverage: data.camera_coverage,
                observation: data.observation || data.physical_state,
                digital_twin: data.digital_twin,
                pipeline: data.pipeline,
                agents: data.agents
            };

            if (data.pipeline && data.pipeline.agent_statuses) {
                updateAgentPills(data.pipeline.agent_statuses);
            }

            renderTimeline();
        }

        function onPhase3Observation(data) {
            const frameId = data.frame_id;
            if (framesMap[frameId]) {
                framesMap[frameId].observation = data.observation;
                renderTimeline();
            }
        }

        function onIntelligenceEvent(data) {
            if (data.agent_statuses) {
                updateAgentPills(data.agent_statuses);
            }
        }

        function onPhase4aPipelineComplete(data) {
            const frameId = data.frame_id || (framesOrder.length > 0 ? framesOrder[0] : null);
            if (frameId && framesMap[frameId]) {
                framesMap[frameId].pipeline = data.pipeline || data;
                renderTimeline();
            }
        }

        function switchFrameViewMode(frameId, mode) {
            activeViewModes[frameId] = mode;
            renderTimeline();
        }

        function renderTimeline() {
            const container = document.getElementById("frameTimeline");
            document.getElementById("framesCountPill").innerText = "FRAMES: " + framesOrder.length;

            if (framesOrder.length === 0) {
                container.innerHTML = `
                    <div class="empty-timeline" id="emptyPlaceholder">
                        <div style="font-size: 36px; opacity: 0.6;">🎥</div>
                        <div>WAITING FOR FRAME STREAM FROM SMARTPHONE...</div>
                        <div style="font-size: 11px; opacity: 0.6;">Captured photos will automatically appear here as full-evidence timeline cards with per-frame 5-agent OODA results.</div>
                    </div>
                `;
                return;
            }

            let html = "";
            for (let i = 0; i < framesOrder.length; i++) {
                const frameId = framesOrder[i];
                const frame = framesMap[frameId];
                const prevFrame = (i < framesOrder.length - 1) ? framesMap[framesOrder[i + 1]] : null;
                html += generateFrameCardHTML(frame, prevFrame);
            }
            container.innerHTML = html;
        }

        function generateFrameCardHTML(frame, prevFrame) {
            const mode = activeViewModes[frame.frame_id] || "raw";
            const obs = frame.observation || {};
            const flood = obs.flood || {};
            const change = obs.change || {};
            const pipe = frame.pipeline || {};
            const results = frame.agents || pipe.results || pipe.agent_results || {};
            const dt = frame.digital_twin || {};

            // Determine image URL based on mode
            let displayImgUrl = frame.image_url;
            if (obs.image) {
                if (mode === "rectified" && obs.image.rectified_url) displayImgUrl = obs.image.rectified_url;
                else if (mode === "mask" && obs.flood && obs.flood.mask_url) displayImgUrl = obs.flood.mask_url;
            }

            // Calculate temporal delta
            let deltaStr = "--";
            let deltaClass = "highlight";
            if (prevFrame && prevFrame.observation && prevFrame.observation.flood) {
                const prevCov = prevFrame.observation.flood.coverage_percent || 0;
                const currCov = flood.coverage_percent || 0;
                const delta = currCov - prevCov;
                const sign = delta > 0 ? "+" : "";
                deltaStr = `${sign}${delta.toFixed(1)}% from ${prevFrame.frame_id}`;
                deltaClass = delta > 0 ? "rose" : (delta < 0 ? "emerald" : "highlight");
            } else if (change.coverage_delta !== undefined) {
                const delta = change.coverage_delta;
                const sign = delta > 0 ? "+" : "";
                deltaStr = `${sign}${delta.toFixed(1)}%`;
                deltaClass = delta > 0 ? "rose" : (delta < 0 ? "emerald" : "highlight");
            }

            // Flooded sectors calculation & 16 sector cells
            let floodedCount = 0;
            let sectorCellsHtml = "";
            const sectors = obs.sectors || [];
            
            for (let sIdx = 1; sIdx <= 16; sIdx++) {
                const sId = "S" + sIdx;
                const secMatch = sectors.find(s => s.sector_id === sId);
                const pct = secMatch ? secMatch.flood_percentage.toFixed(0) + "%" : "0%";
                const status = secMatch ? secMatch.status.toLowerCase() : "dry";
                if (secMatch && secMatch.status !== "DRY") floodedCount++;
                
                sectorCellsHtml += `
                    <div class="sector-cell ${status}">
                        <span class="cell-id">${sId}</span>
                        <span class="cell-pct">${pct}</span>
                    </div>
                `;
            }

            const showSectorOverlay = (mode === "sector" || mode === "rectified");

            // Extract Digital Twin Infrastructure Statuses
            const affB = dt.affected_buildings || [];
            const blkR = dt.blocked_roads || [];
            const bridgeSt = (dt.bridge && dt.bridge.status) ? dt.bridge.status : "OPEN";
            const forecast = dt.propagation_forecast || {};

            // Extract 5-Agent outputs
            const reconRes = results.RECON || (results.recon ? results.recon.recon_result : null);
            const verifierRes = results.VERIFIER || (results.verifier ? results.verifier.verification_result : null);
            const predictorRes = results.PREDICTOR || (results.predictor ? results.predictor.prediction_result : null);
            const orchRes = results.ORCHESTRATOR || (results.orchestrator ? results.orchestrator.action_plan : null);
            const routerRes = results.ROUTER_DISPATCH || (results.router_dispatch ? results.router_dispatch.dispatch_plan : null);

            // Agent 1: RECON Text
            let reconText = "Awaiting physical observation...";
            if (reconRes) {
                const affS = reconRes.affected_sectors || [];
                const covP = (reconRes.flood_coverage_percent !== undefined) ? reconRes.flood_coverage_percent : (reconRes.flood_coverage || 0);
                if (reconRes.flood_detected || affS.length > 0 || covP > 0.5) {
                    reconText = `⚠️ FLOOD DETECTED | Coverage: ${covP.toFixed(1)}% | Sectors: ${affS.join(', ') || 'S6'} | Blocked Roads: ${(reconRes.blocked_roads || []).join(', ') || 'None'}`;
                } else {
                    reconText = `✓ NO FLOOD DETECTED | Coverage: 0.0% | All 16 sectors clear | Bridge: OPEN`;
                }
            }

            // Agent 2: VERIFIER Text
            let verifierText = "Awaiting physical cross-verification...";
            if (verifierRes) {
                const sev = verifierRes.severity || (verifierRes.verified_severity) || "NORMAL";
                const newS = verifierRes.newly_affected_sectors || [];
                const chg = (verifierRes.flood_change_percent !== undefined) ? verifierRes.flood_change_percent : 0.0;
                if (sev !== "NORMAL" || newS.length > 0) {
                    verifierText = `Status: VERIFIED | Severity: ${sev} | Newly Affected: ${newS.join(', ') || 'None'} | Delta: +${chg.toFixed(1)}%`;
                } else {
                    verifierText = `✓ OBSERVATION VERIFIED | Severity: NORMAL | Change: 0.0% | Temporal match: CONSISTENT`;
                }
            }

            // Agent 3: PREDICTOR Text
            let predictorText = "Awaiting spatial trend prediction...";
            if (predictorRes) {
                const rsk = predictorRes.current_risk || "NORMAL";
                const pSec = predictorRes.predicted_sectors || [];
                const pCov = predictorRes.predicted_flood_coverage || 0.0;
                if (rsk !== "NORMAL" && pSec.length > 0) {
                    predictorText = `Risk Level: ${rsk} | Projected Expansion: +${(predictorRes.predicted_flood_expansion_percent || 0).toFixed(1)}% | At Risk: ${pSec.join(', ')}`;
                } else {
                    predictorText = `✓ NO ACTIVE FLOOD | Risk Level: NORMAL | No immediate flood expansion predicted`;
                }
            }

            // Agent 4: ORCHESTRATOR Text & Action Plan Banner
            let orchText = "Awaiting strategic action plan...";
            let actionPlanBanner = "⌛ 5-Agent OODA pipeline standing by...";
            if (orchRes) {
                const pri = orchRes.priority || "NORMAL";
                const reas = orchRes.reasoning_summary || orchRes.reasoning || "Routine surveillance active.";
                orchText = `Priority: ${pri} | Rationale: ${reas}`;
                const acts = orchRes.actions || [];
                if (acts.length > 0) {
                    actionPlanBanner = acts.map(a => `⚡ ${a.action} ${a.sector ? '(Sector ' + a.sector + ')' : ''} ${a.reason ? '— ' + a.reason : ''}`).join(' | ');
                } else {
                    actionPlanBanner = `✓ PRIORITY ${pri}: Continue monitoring physical testbed`;
                }
            }

            // Agent 5: ROUTER_DISPATCH Text
            let routerText = "Awaiting route & dispatch calculations...";
            if (routerRes) {
                const stVal = routerRes.dispatch_status || "STANDBY";
                const netVal = routerRes.network_status || "CLEAR";
                const blk = routerRes.blocked_roads || blkR || [];
                const dsps = routerRes.dispatches || [];
                if (stVal !== "STANDBY" && dsps.length > 0) {
                    let dStr = dsps.map(d => `${d.resource || d.unit_id} ➔ ${d.destination || d.target_sector}`).join(', ');
                    routerText = `Status: ${stVal} | Network: ${netVal} | Dispatch: ${dStr} | Blocked Roads: ${blk.join(', ') || 'None'}`;
                } else {
                    routerText = `✓ STANDBY | Network Status: CLEAR | No emergency routing required`;
                }
            }

            const isProc = (frame.status === "PROCESSING");

            return `
                <div class="frame-card ${isProc ? 'processing' : 'completed'}">
                    
                    <!-- CARD HEADER -->
                    <div class="card-header-bar">
                        <div class="frame-id-tag">
                            <span>📷 ${frame.frame_id}</span>
                            <div class="frame-meta-chips">
                                <span class="chip highlight">${frame.device_id}</span>
                                <span class="chip">${frame.timestamp}</span>
                                <span class="chip">800 × 800 px</span>
                                <span class="chip ${isProc ? 'status-proc' : 'status-done'}">
                                    ${isProc ? '⌛ PROCESSING (5 AGENTS)' : '✓ 5-AGENT OODA COMPLETE'}
                                </span>
                            </div>
                        </div>

                        <div class="view-mode-tabs">
                            <button class="view-tab ${mode === 'raw' ? 'active' : ''}" onclick="switchFrameViewMode('${frame.frame_id}', 'raw')">ORIGINAL</button>
                            <button class="view-tab ${mode === 'rectified' ? 'active' : ''}" onclick="switchFrameViewMode('${frame.frame_id}', 'rectified')">RECTIFIED</button>
                            <button class="view-tab ${mode === 'mask' ? 'active' : ''}" onclick="switchFrameViewMode('${frame.frame_id}', 'mask')">WATER MASK</button>
                            <button class="view-tab ${mode === 'sector' ? 'active' : ''}" onclick="switchFrameViewMode('${frame.frame_id}', 'sector')">16-SECTOR GRID</button>
                            <button class="view-tab ${mode === 'json' ? 'active' : ''}" onclick="switchFrameViewMode('${frame.frame_id}', 'json')">DEBUG JSON</button>
                        </div>
                    </div>

                    <!-- CARD BODY GRID -->
                    <div class="frame-card-grid">
                        
                        <!-- LEFT: FULL ORIGINAL PHOTOGRAPH, MASK & DEBUG JSON OVERLAY -->
                        <div class="frame-photo-container">
                            ${mode === 'json' ? `
                                <pre style="background: #090d16; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 12px; height: 100%; width: 100%; overflow: auto; border: 1px solid var(--border-color); border-radius: 6px; text-align: left; white-space: pre-wrap;">${JSON.stringify({frame_id: frame.frame_id, observation: obs, digital_twin: dt, agents: results}, null, 2)}</pre>
                            ` : `
                                <img src="${displayImgUrl}?t=${new Date().getTime()}" alt="${frame.frame_id}">
                                <div class="sector-grid-overlay" style="display: ${showSectorOverlay ? 'grid' : 'none'};">
                                    ${sectorCellsHtml}
                                </div>
                            `}
                        </div>

                        <!-- RIGHT: METRICS, DIGITAL TWIN & 5-AGENT RESULTS -->
                        <div class="frame-details-panel">
                            
                            <div class="section-title">FRAME TELEMETRY & TEMPORAL DELTA</div>
                            <div class="metrics-grid-3col">
                                <div class="info-box">
                                    <span class="info-label">FLOOD COVERAGE</span>
                                    <span class="info-val rose">${(flood.coverage_percent || 0).toFixed(1)}%</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">TEMPORAL DELTA</span>
                                    <span class="info-val ${deltaClass}">${deltaStr}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">FLOODED SECTORS</span>
                                    <span class="info-val amber">${floodedCount} / 16</span>
                                </div>
                            </div>

                            <div class="section-title">SYNCHRONIZED DIGITAL TWIN STATE</div>
                            <div class="metrics-grid-3col">
                                <div class="info-box">
                                    <span class="info-label">BRIDGE-01</span>
                                    <span class="info-val ${bridgeSt === 'OPEN' ? 'emerald' : 'rose'}">${bridgeSt}</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">BLOCKED ROADS</span>
                                    <span class="info-val amber">${blkR.length} (${blkR.slice(0, 2).join(', ') || 'None'})</span>
                                </div>
                                <div class="info-box">
                                    <span class="info-label">AFFECTED BUILDINGS</span>
                                    <span class="info-val rose">${affB.length} (${affB.slice(0, 2).join(', ') || 'None'})</span>
                                </div>
                            </div>
                            ${forecast.projected_next_sectors ? `<div style="font-size: 9px; font-family: monospace; color: var(--cyan-bright);">🔮 Digital Twin Forecast: Projected expansion ➔ ${forecast.projected_next_sectors.join(', ') || 'Stable'} (${forecast.rate_of_spread || '+0%/min'})</div>` : ''}

                            <div class="section-title">FIVE-AGENT OODA PIPELINE RESULTS</div>
                            <div class="agents-accordion">
                                
                                <div class="agent-card">
                                    <div class="agent-card-header">
                                        <span class="agent-name">👁️ RECON AGENT</span>
                                        <span class="agent-status-badge">RECON_COMPLETE</span>
                                    </div>
                                    <div class="agent-content">${reconText}</div>
                                </div>

                                <div class="agent-card">
                                    <div class="agent-card-header">
                                        <span class="agent-name">🛡️ VERIFIER AGENT</span>
                                        <span class="agent-status-badge">VERIFICATION_COMPLETE</span>
                                    </div>
                                    <div class="agent-content">${verifierText}</div>
                                </div>

                                <div class="agent-card">
                                    <div class="agent-card-header">
                                        <span class="agent-name">📈 PREDICTOR AGENT</span>
                                        <span class="agent-status-badge">PREDICTION_COMPLETE</span>
                                    </div>
                                    <div class="agent-content">${predictorText}</div>
                                </div>

                                <div class="agent-card">
                                    <div class="agent-card-header">
                                        <span class="agent-name">🧠 ORCHESTRATOR AGENT</span>
                                        <span class="agent-status-badge">ORCHESTRATION_COMPLETE</span>
                                    </div>
                                    <div class="agent-content">${orchText}</div>
                                </div>

                                <div class="agent-card">
                                    <div class="agent-card-header">
                                        <span class="agent-name">🚑 ROUTER & DISPATCH AGENT</span>
                                        <span class="agent-status-badge">DISPATCH_COMPLETE</span>
                                    </div>
                                    <div class="agent-content">${routerText}</div>
                                </div>

                            </div>

                            <!-- AI ACTION PLAN SUMMARY CARD -->
                            <div class="action-plan-card">
                                <div class="action-plan-title">⚡ RECOMMENDED EMERGENCY ACTION PLAN</div>
                                <div class="action-plan-text">${actionPlanBanner}</div>
                            </div>

                        </div>

                    </div>

                </div>
            `;
        }

        function updateAgentPills(statuses) {
            if (!statuses) return;
            const mapping = {
                'recon': { id: 'pill-recon', name: 'RECON' },
                'verifier': { id: 'pill-verifier', name: 'VERIFIER' },
                'predictor': { id: 'pill-predictor', name: 'PREDICTOR' },
                'orchestrator': { id: 'pill-orchestrator', name: 'ORCHESTRATOR' },
                'router_dispatch': { id: 'pill-router', name: 'ROUTER' }
            };
            Object.keys(mapping).forEach(key => {
                const info = mapping[key];
                const status = (statuses[key] || 'idle').toLowerCase();
                const pillElem = document.getElementById(info.id);
                if (pillElem) {
                    let dot = '○';
                    let color = 'var(--text-muted)';
                    if (status === 'running') {
                        dot = '●';
                        color = 'var(--amber-accent)';
                    } else if (status === 'success' || status === 'completed') {
                        dot = '✓';
                        color = 'var(--emerald-accent)';
                    } else if (status === 'failed' || status === 'error') {
                        dot = '✕';
                        color = 'var(--rose-accent)';
                    }
                    pillElem.innerHTML = `<span style="color: ${color};"><span style="margin-right:3px;">${dot}</span> ${info.name}</span>`;
                }
            });
        }

        /* CALIBRATION MODAL FUNCTIONS */
        function openCalibrationModal() {
            fetch("/api/calibration")
                .then(r => r.json())
                .then(data => {
                    if (data.top_left) document.getElementById("calibTL").value = data.top_left.join(", ");
                    if (data.top_right) document.getElementById("calibTR").value = data.top_right.join(", ");
                    if (data.bottom_right) document.getElementById("calibBR").value = data.bottom_right.join(", ");
                    if (data.bottom_left) document.getElementById("calibBL").value = data.bottom_left.join(", ");
                    document.getElementById("calibModal").style.display = "flex";
                })
                .catch(e => console.error("Error fetching calibration config:", e));
        }

        function closeCalibrationModal() {
            document.getElementById("calibModal").style.display = "none";
        }

        function resetCalibrationDefaults() {
            document.getElementById("calibTL").value = "50, 50";
            document.getElementById("calibTR").value = "750, 50";
            document.getElementById("calibBR").value = "750, 750";
            document.getElementById("calibBL").value = "50, 750";
        }

        function saveCalibrationConfig() {
            const parseCoord = (str) => str.split(',').map(n => parseInt(n.trim(), 10) || 0);

            const payload = {
                top_left: parseCoord(document.getElementById("calibTL").value),
                top_right: parseCoord(document.getElementById("calibTR").value),
                bottom_right: parseCoord(document.getElementById("calibBR").value),
                bottom_left: parseCoord(document.getElementById("calibBL").value),
                target_width: 800,
                target_height: 800
            };

            fetch("/api/calibration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
                alert("✓ Calibration configuration saved successfully!");
                closeCalibrationModal();
            })
            .catch(e => {
                alert("Failed to save calibration configuration");
                console.error(e);
            });
        }

        // Restore past frames and mode on page startup
        async function loadInitialState() {
            try {
                const mRes = await fetch("/api/mode");
                const mData = await mRes.json();
                if (mData && mData.mode) {
                    currentSystemMode = mData.mode;
                    updateModeUI();
                }
            } catch (e) {}

            try {
                const res = await fetch("/device-status");
                const status = await res.json();
                if (status && status.recent_history && status.recent_history.length > 0) {
                    status.recent_history.forEach(frame => {
                        if (frame.frame_id) {
                            if (!framesMap[frame.frame_id]) {
                                framesOrder.push(frame.frame_id);
                            }
                            framesMap[frame.frame_id] = frame;
                        }
                    });
                    renderTimeline();
                }
            } catch (e) {
                console.error("Error loading initial device status history:", e);
            }
        }

        window.addEventListener("DOMContentLoaded", () => {
            loadInitialState();
            connectDashboardWS();
        });
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)



