# AEGIS FLOOD — IoT Protocol Specification

This document details the communication protocol and data payload structures between the Smartphone Sensing Node, IoT Gateway, and Laptop Dashboard.

---

## Phase 1, Phase 2A & Phase 2B Protocol

### 1. Device Registration (`Client -> Gateway`)
```json
{
  "type": "device_register",
  "device_id": "PHONE-01",
  "device_type": "smartphone",
  "mode": "physical-testbed"
}
```

### 2. Device Registered Response (`Gateway -> Client`)
```json
{
  "type": "device_registered",
  "device_id": "PHONE-01",
  "status": "connected",
  "gateway": "AEGIS-IOT-GATEWAY",
  "timestamp": "20:30:00"
}
```

### 3. Heartbeat (`Client -> Gateway`)
```json
{
  "type": "heartbeat",
  "device_id": "PHONE-01"
}
```

### 4. Heartbeat ACK (`Gateway -> Client`)
```json
{
  "type": "heartbeat_ack",
  "device_id": "PHONE-01",
  "timestamp": "20:30:00"
}
```

### 5. Continuous / Single Photo Upload (`Phone Client -> Gateway`)
Sent every 5000ms during stream mode, or on manual photo trigger.
```json
{
  "type": "photo_upload",
  "frame_id": "FRAME-000001",
  "device_id": "PHONE-01",
  "timestamp": "20:30:00",
  "capture_interval_ms": 5000,
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 6. Photo ACK (`Gateway -> Phone Client`)
```json
{
  "type": "photo_ack",
  "frame_id": "FRAME-000001",
  "device_id": "PHONE-01",
  "status": "success",
  "total_frames": 1,
  "timestamp": "20:30:00"
}
```

### 7. Photo Received Broadcast (`Gateway -> Laptop Dashboard`)
```json
{
  "type": "photo_received",
  "frame_id": "FRAME-000001",
  "device_id": "PHONE-01",
  "image_url": "/frames/incoming/FRAME-000001.jpg",
  "total_frames": 1,
  "timestamp": "20:30:00"
}
```

---

## Future Phase 3 Protocol (Specification Only — Not Implemented in Phase 2B)

### Future AI Analysis Complete Payload (`Backend -> Gateway -> Dashboard`)

```json
{
  "type": "frame_analysis_complete",
  "frame_id": "FRAME-000002",
  "timestamp": "2026-09-15T20:30:02Z",
  "captured_image_url": "/frames/incoming/FRAME-000002.jpg",
  "agents": {
    "recon": { "detected_breaches": 1, "flooded_cells_count": 42 },
    "verifier": { "verified": true, "anomalies_detected": 0 },
    "predictor": { "predicted_surge_depth_m": 2.4 },
    "orchestrator": { "ooda_stage": "ACT", "policy_action": "DEPLOY_RESCUE_BOATS" },
    "router_dispatch": { "units_dispatched": ["UNIT-12", "UNIT-05"] }
  }
}
```

