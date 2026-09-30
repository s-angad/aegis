# AEGIS FLOOD v2.0 — Backend Intelligence & OpenAI GPT-5.6 Luna Agents

## Hybrid Disaster-Management Architecture

AEGIS FLOOD v2.0 combines deterministic computer vision perception with advanced multi-agent reasoning:

```text
Physical Testbed (Cardboard Model)
       │
       ▼
Smartphone Camera Node (Continuous Capture)
       │
       ▼
IoT Gateway (FastAPI / WebSockets)
       │
       ▼
OpenCV Perception Engine (Perspective Rectification, HSV Water Segmentation, River Baseline Masking)
       │
       ▼
PhysicalObservation (Authoritative Ground Truth Schema)
       │
       ▼
5 Sequential OpenAI GPT-5.6 Luna AI Agents
  ├── RECON Agent (Situational Interpretation)
  ├── VERIFIER Agent (Temporal & Logical Consistency)
  ├── PREDICTOR Agent (Near-Term Risk & Flood Expansion Forecast)
  ├── ORCHESTRATOR Agent (Strategic Action Plan Formulation)
  └── ROUTER & DISPATCH Agent (Operational Routing over Network Graph)
       │
       ▼
Deterministic Policy Validation Layer (Ground-truth constraint enforcement)
       │
       ▼
Dashboard UI & ACK_NEXT Control (Authorized next photo capture)
```

> [!IMPORTANT]
> - **OpenAI API Billing Notice**: OpenAI API usage (`gpt-5.6-luna`) is billed separately per API token request from standard ChatGPT subscriptions.
> - **Backend-Only Security**: `OPENAI_API_KEY` is loaded and processed strictly on the backend. It is never exposed to browser client JavaScript, React components, WebSocket events, or Git repositories.
> - **Ground-Truth Authority**: GPT agents are reasoning engines, NOT primary physical sensors. They cannot override or invent physical measurements (`PhysicalObservation`).

---

## Environment Variables (`.env`)

Create a `.env` file in the root directory (copied from `.env.example`):

```env
# Backend OpenAI API Configuration (Secrets - NEVER commit to git)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_AGENT_MODEL=gpt-5.6-luna
OPENAI_AGENT_REASONING_EFFORT=medium
OPENAI_AGENT_TIMEOUT_SECONDS=30
OPENAI_AGENT_MAX_RETRIES=2

# Agent Intelligence Mode: REAL (Calls GPT-5.6 Luna API) | SIMULATION (Rule-based state machine)
AGENT_MODE=REAL
```

---

## Operating Modes

1. **REAL Mode (`AGENT_MODE=REAL`)**:
   - Executes live OpenAI API requests using `OPENAI_AGENT_MODEL=gpt-5.6-luna`.
   - Sends compact, structured JSON payloads derived from OpenCV CV perception to 5 sequential GPT agent calls per frame.
   - Leverages Pydantic structured output validation.
   - UI Chip: `🤖 GPT-POWERED (gpt-5.6-luna)`.

2. **SIMULATION Mode (`AGENT_MODE=SIMULATION`)**:
   - Isolates deterministic rule-based state machines without invoking external API calls.
   - UI Chip: `⚙️ SIMULATION MODE`.

---

## How to Start Backend Services

1. Install Python dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```

2. Run unit tests:
   ```powershell
   python -m unittest backend.app.intelligence.tests.test_phase4a_pipeline
   ```

3. Launch IoT Gateway service:
   ```powershell
   cd iot/gateway
   python -m uvicorn main:app --host 0.0.0.0 --port 8100
   ```
