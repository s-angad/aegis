# AEGIS FLOOD — Smartphone Node Guide (Phase 1)

This guide explains how to connect a smartphone to the AEGIS FLOOD Physical Testbed Gateway over a local Wi-Fi network.

---

## Prerequisites

1. Laptop running the IoT Gateway (`python -m uvicorn main:app --host 0.0.0.0 --port 8100`).
2. Smartphone connected to the **SAME Wi-Fi network** as the laptop.

---

## Step-by-Step Connection Instructions

### 1. Find Laptop Private IPv4 Address
When the gateway starts on the laptop, the console displays its private IPv4 address, for example:
```text
Local network addresses:
  http://192.168.1.10:8100
```

### 2. Open Address on Phone Browser
Open Chrome, Safari, or Firefox on the phone and enter the URL:
```text
http://<LAPTOP_PRIVATE_IP>:8100
```
*Example: `http://192.168.1.10:8100`*

### 3. Verify Connection
The page will load the AEGIS Mobile Node Interface and establish a WebSocket connection.

- **Status**: Changes from `● CONNECTING...` to `● CONNECTED`.
- **Device ID**: Displays `PHONE-01`.
- **Last Heartbeat**: Updates every 3 seconds with server timestamp.

### 4. Test Connection
Tap the **`TEST CONNECTION`** button on the phone.

- **UI Response**: `✓ CONNECTION TEST PASSED (Phone → Wi-Fi → Laptop Gateway)`
- **Laptop Terminal Output**:
  ```text
  [19:37:05] Connection test received from PHONE-01
  [19:37:05] Connection test passed
  ```

---

## Future Phase 2 Camera Setup

In Phase 2, the phone will be mounted above a physical cardboard flood model. The phone browser will request camera permissions (`getUserMedia`) to capture 1-second aerial observation frames and stream them to the IoT Gateway.
