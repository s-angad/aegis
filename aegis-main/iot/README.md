# AEGIS FLOOD v2.0 — Physical Testbed & IoT Layer

The **AEGIS FLOOD IoT Layer** bridges physical disaster models with the AEGIS Autonomous Emergency Intelligence Platform using smartphone aerial sensing.

---

## 1. System Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                   EXISTING AEGIS PLATFORM                        │
│                                                                  │
│  frontend/ (:3000)                   backend/ (:8000)            │
│  Next.js Digital Twin                FastAPI Core Simulation     │
│                                                                  │
│  (100% UNTOUCHED & PRESERVED)                                    │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                    NEW PHYSICAL IoT LAYER                        │
│                                                                  │
│  📱 SMARTPHONE NODE                💻 LAPTOP DASHBOARD           │
│  http://<IP>:8100/                 http://localhost:8100/dashboard
│          │                                   ▲                   │
│          │ Photo Upload via WS               │ photo_received WS │
│          ▼                                   │                   │
│  ┌───────────────────────────────────────────┴────────────────┐  │
│  │               IoT GATEWAY SERVER (:8100)                  │  │
│  │  - Saves JPEG to iot/frames/incoming/FRAME-XXXXXX.jpg     │  │
│  │  - Serves static image files via GET /frames/...          │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 2B Scope & Capabilities

**Phase 2B Goal**: 
> **Fully Automatic Smartphone Rear Camera Capture via Cloudflare HTTPS Tunnel — 5-Second Interval (`5000ms`)**

- **Zero Phone Certificate Setup**: Smartphone opens `https://xxxxx.trycloudflare.com` directly in **Android Chrome** or **iPhone Safari**. No CA downloads, certificate installations, or security profiles required on the mobile device.
- **Trusted Secure Context**: Cloudflare provides a trusted public HTTPS layer (`window.isSecureContext === true`), enabling rear camera access via `navigator.mediaDevices.getUserMedia()`.
- **Automatic Startup Workflow**: Opening the trycloudflare HTTPS URL automatically connects WebSocket (`wss://`), requests camera permissions, starts rear camera, captures `FRAME-000001` automatically, and streams continuous frames every 5 seconds.
- **Zero Manual Shutter**: No `START CAPTURE` or `TAKE PHOTO` buttons required. No native camera app launch or manual shutter clicks required.
- **Single Stop Stream Button**: `[ 🛑 STOP STREAM ]` button allows pausing stream and halting camera hardware tracks.
- **Disk Storage**: Gateway saves incoming images sequentially into `iot/frames/incoming/FRAME-XXXXXX.jpg`.
- **Real-Time Laptop Dashboard (`http://localhost:8100/dashboard`)**: Live updates with latest photo display, total frame counter, and rolling 30-frame session history without page reloads.

---

## 3. Directory Structure

```text
iot/
├── gateway/
│   ├── main.py          # FastAPI Gateway server, Mobile UI & Laptop Dashboard
│   ├── cloudflared.exe  # Cloudflare Tunnel executable (optional local binary)
│   ├── requirements.txt # Dependencies (fastapi, uvicorn, websockets)
│   └── README.md        # Gateway server documentation & HTTPS Tunnel guide
├── start-phase2b.ps1    # PowerShell launcher script for Phase 2B
├── phone/
│   └── README.md        # Smartphone node camera guide
├── protocol/
│   └── README.md        # Protocol specification & message schemas
├── frames/              # Disk storage for frame captures
│   ├── incoming/        # Received JPEG frames (FRAME-XXXXXX.jpg)
│   ├── processing/
│   └── completed/
└── README.md            # Main IoT layer documentation
```

---

## 4. Endpoints Overview

| Endpoint | Type | Description |
| :--- | :--- | :--- |
| `https://xxxxx.trycloudflare.com/` | HTTPS GET | Mobile Smartphone UI with rear camera preview & 5s auto-stream |
| `http://localhost:8100/dashboard` | HTTP GET | Laptop Display Dashboard showing real-time captured stream & frame history |
| `http://localhost:8100/frames/...` | Static HTTP | Serves saved JPEG images from `iot/frames/` |
| `http://localhost:8100/health` | HTTP GET | Gateway health check (`phase: 2B`, `default_capture_interval_ms: 5000`) |
| `http://localhost:8100/device-status` | HTTP GET | Connected devices, total frames, & latest frame status JSON |
| `wss://xxxxx.trycloudflare.com/ws` | Secure WS | Real-time device registration, heartbeat & photo broadcast |

---

## 5. Phase 2B Execution & Test Procedure

### Step 1: Start Gateway (Terminal 1)
In `iot/gateway/`:
```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8100
```

### Step 2: Start Cloudflare Quick Tunnel (Terminal 2)
In `iot/gateway/`:
```powershell
cloudflared tunnel --url http://localhost:8100
```
Copy the generated public HTTPS URL: `https://xxxxx.trycloudflare.com`

### Step 3: Open Laptop Dashboard
On laptop browser open:
```text
http://localhost:8100/dashboard
```

### Step 4: Open Smartphone Node (Android Chrome / iPhone Safari)
On smartphone open:
```text
https://xxxxx.trycloudflare.com
```

### Step 5: Verify Automatic Hands-Free Capture
1. Tap **Allow** when prompted for camera permissions.
2. The rear camera preview will start automatically and stream `FRAME-000001`, `FRAME-000002`, ... every 5 seconds completely hands-free!
3. Laptop Dashboard automatically updates with each incoming photo!



