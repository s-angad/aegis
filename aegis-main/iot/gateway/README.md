# AEGIS FLOOD — IoT Gateway (Phase 2B Cloudflare HTTPS Enabled)

The **AEGIS IoT Gateway** provides local network connectivity and continuous aerial photo streaming between physical smartphone sensing nodes (Android Chrome & iPhone Safari) and the laptop host server.

---

## System Architecture

```text
               LAPTOP (Host)

        AEGIS IoT Gateway (FastAPI)
             http://localhost:8100
                       │
                       │ localhost HTTP
                       ▼
             CLOUDFLARE QUICK TUNNEL
                       │
                  HTTPS / WSS
                       ▼
             PUBLIC TRUSTED HTTPS URL
          https://xxxxx.trycloudflare.com
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
     ANDROID PHONE             iPHONE
     (Chrome)                  (Safari)
           │                       │
           └───────────┬───────────┘
                       │
                🔐 ALLOW CAMERA
                       │
                 🎥 REAR CAMERA
                       │
             📸 AUTOMATIC CAPTURE (5s)
                       │
                  HTTPS / WSS
                       ▼
             AEGIS IoT GATEWAY (:8100)
                       │
             🖥️ LAPTOP DASHBOARD
        http://localhost:8100/dashboard
```

---

## Phase 2B Development Startup (2 Terminal Workflow)

### Terminal 1: Start FastAPI IoT Gateway (Plain HTTP)
```powershell
cd iot/gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8100
```
- **Local Laptop Dashboard**: `http://localhost:8100/dashboard`

---

### Terminal 2: Start Cloudflare Quick Tunnel for Mobile HTTPS
```powershell
cd iot/gateway
cloudflared tunnel --url http://localhost:8100
```
*(or `.\cloudflared.exe tunnel --url http://localhost:8100` if using the local binary)*

Cloudflare outputs a public HTTPS URL:
```text
https://xxxxx.trycloudflare.com
```

---

## Smartphone Remote Sensing Node Setup

1. Open the generated HTTPS URL (`https://xxxxx.trycloudflare.com`) on **Android Chrome** or **iPhone Safari**.
2. **Zero Certificate Setup**: **NO** certificate downloads, CA installation, or device profiles are required on your phone.
3. **Camera Permission**: Tap **Allow** when prompted for camera permissions.
4. **Hands-Free Streaming**:
   - The rear camera preview initializes automatically.
   - `FRAME-000001` captures and uploads automatically.
   - Subsequent frames (`FRAME-000002`, `FRAME-000003`, ...) stream every 5 seconds to the Laptop Dashboard (`http://localhost:8100/dashboard`) **100% hands-free**.

---

## Endpoints Summary

| Endpoint | Type | Description |
| :--- | :--- | :--- |
| `https://xxxxx.trycloudflare.com/` | HTTPS GET | Mobile Smartphone UI with rear camera preview & 5s auto-stream |
| `http://localhost:8100/dashboard` | HTTP GET | Laptop Display Dashboard showing real-time photo stream & frame history |
| `http://localhost:8100/health` | HTTP GET | Gateway health check (`phase: 2B`, `default_capture_interval_ms: 5000`) |
| `http://localhost:8100/device-status` | HTTP GET | Connected devices, total frame counter, and frame history |
| `wss://xxxxx.trycloudflare.com/ws` | Secure WS | Secure WebSocket for device registration, heartbeats & photo upload |



