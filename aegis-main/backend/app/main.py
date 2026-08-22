"""
AEGIS AI — FastAPI Main Application
REST API + WebSocket endpoint + Simulation Engine integration + Recon CV Module.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Any, Optional, Dict, List
import asyncio

from .simulation.engine import SimulationEngine, create_fresh_simulation, validate_fresh_simulation_state
from .agents.orchestrator import CommandOrchestrator
from .websocket.manager import manager
from .knowledge.sops import get_all_sops, get_sop
from .recon.routes import router as recon_router
from .recon.service import recon_service
from .recon.frame_store import frame_store

app = FastAPI(
    title="AEGIS FLOOD — Closed-Loop Autonomous Command Center",
    version="2.0.0",
    description="Closed-loop multi-agent disaster response platform with Computer Vision frame analysis",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Recon endpoints
app.include_router(recon_router)

# Global instances
sim_engine = create_fresh_simulation()
orchestrator = CommandOrchestrator()


async def _broadcast_cb(event_type: str, data: Any):
    await manager.broadcast(event_type, data)


async def _agent_cb(engine: SimulationEngine):
    await orchestrator.run_pipeline(engine)


@app.on_event("startup")
async def startup():
    sim_engine.set_broadcast_callback(_broadcast_cb)
    sim_engine.set_agent_callback(_agent_cb)
    orchestrator.set_broadcast_callback(_broadcast_cb)


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state
        await manager.send_to(websocket, "initial_state", {
            "city_geojson": sim_engine.city.to_geojson(),
            "shelters": [s.model_dump(mode="json") for s in sim_engine.shelters],
            "resources": [r.model_dump(mode="json") for r in sim_engine.resources],
            "simulation": sim_engine.get_state_summary(),
            "sops": get_all_sops(),
            "latest_recon": recon_service.get_latest_observation().model_dump(mode="json") if recon_service.get_latest_observation() else None,
        })

        # Keep connection alive, handle client messages
        while True:
            data = await websocket.receive_text()
            import json as _json
            msg = _json.loads(data)
            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await manager.send_to(websocket, "pong", {"status": "ok"})
            elif msg_type == "get_state":
                state = orchestrator.get_full_state()
                state["simulation"] = sim_engine.get_state_summary()
                latest_recon = recon_service.get_latest_observation()
                if latest_recon:
                    state["latest_recon"] = latest_recon.model_dump(mode="json")
                await manager.send_to(websocket, "full_state", state)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ─── Simulation Control ───────────────────────────────────────────────────────

@app.post("/api/simulation/create_run")
async def create_run(run_type: str = "aegis", seed: Optional[int] = None):
    global sim_engine, orchestrator
    sim_engine.stop()
    sim_engine = create_fresh_simulation(disaster_type="flood", seed=seed)
    sim_engine.run_type = run_type
    sim_engine.is_aegis_enabled = (run_type == "aegis")
    recon_service.reset()
    orchestrator = CommandOrchestrator()
    sim_engine.set_broadcast_callback(_broadcast_cb)
    sim_engine.set_agent_callback(_agent_cb)
    orchestrator.set_broadcast_callback(_broadcast_cb)

    await manager.broadcast("simulation_control", {"action": "reset", "disaster_type": "flood", "scenario": sim_engine.get_state_summary()["scenario"]})
    await manager.broadcast("initial_state", {
        "city_geojson": sim_engine.city.to_geojson(),
        "shelters": [s.model_dump(mode="json") for s in sim_engine.shelters],
        "resources": [r.model_dump(mode="json") for r in sim_engine.resources],
        "simulation": sim_engine.get_state_summary(),
        "sops": get_all_sops(),
        "latest_recon": None,
    })
    return {"status": "created", "run_type": run_type, "scenario": sim_engine.get_state_summary()["scenario"]}


@app.post("/api/simulation/start")
async def start_simulation(disaster_type: str = "flood", seed: Optional[int] = None, run_type: str = "baseline", force_new_run: bool = False):
    global sim_engine, orchestrator

    if force_new_run or seed is not None or sim_engine.tick >= 20 or sim_engine.tick == 0:
        sim_engine.stop()
        sim_engine = create_fresh_simulation(disaster_type=disaster_type, seed=seed)
        sim_engine.run_type = run_type
        sim_engine.is_aegis_enabled = (run_type == "aegis")
        recon_service.reset()
        orchestrator = CommandOrchestrator()
        sim_engine.set_broadcast_callback(_broadcast_cb)
        sim_engine.set_agent_callback(_agent_cb)
        orchestrator.set_broadcast_callback(_broadcast_cb)

        await manager.broadcast("simulation_control", {"action": "reset", "disaster_type": disaster_type, "scenario": sim_engine.get_state_summary()["scenario"]})
        await manager.broadcast("initial_state", {
            "city_geojson": sim_engine.city.to_geojson(),
            "shelters": [s.model_dump(mode="json") for s in sim_engine.shelters],
            "resources": [r.model_dump(mode="json") for r in sim_engine.resources],
            "simulation": sim_engine.get_state_summary(),
            "sops": get_all_sops(),
            "latest_recon": None,
        })
    elif sim_engine.is_paused:
        sim_engine.resume()
        await manager.broadcast("simulation_control", {"action": "resumed", "tick": sim_engine.tick, "disaster_type": sim_engine.disaster_type})
        return {"status": "resumed", "tick": sim_engine.tick}
    elif sim_engine.is_running:
        return {"status": "already_running", "tick": sim_engine.tick}

    sim_engine.start(seed)
    await manager.broadcast("simulation_control", {
        "action": "started",
        "tick": sim_engine.tick,
        "disaster_type": sim_engine.disaster_type,
        "scenario": sim_engine.get_state_summary()["scenario"]
    })
    return {
        "status": "started",
        "tick": sim_engine.tick,
        "disaster_type": sim_engine.disaster_type,
        "scenario": sim_engine.get_state_summary()["scenario"]
    }


@app.post("/api/simulation/pause")
async def pause_simulation():
    sim_engine.pause()
    await manager.broadcast("simulation_control", {"action": "paused", "tick": sim_engine.tick})
    return {"status": "paused", "tick": sim_engine.tick}


@app.post("/api/simulation/resume")
async def resume_simulation():
    sim_engine.resume()
    await manager.broadcast("simulation_control", {"action": "resumed", "tick": sim_engine.tick})
    return {"status": "resumed", "tick": sim_engine.tick}


@app.post("/api/simulation/reset")
async def reset_simulation(disaster_type: str = "flood", seed: Optional[int] = None):
    global sim_engine, orchestrator
    sim_engine.stop()
    sim_engine = create_fresh_simulation(disaster_type=disaster_type, seed=seed)
    recon_service.reset()
    orchestrator = CommandOrchestrator()
    sim_engine.set_broadcast_callback(_broadcast_cb)
    sim_engine.set_agent_callback(_agent_cb)
    orchestrator.set_broadcast_callback(_broadcast_cb)

    await manager.broadcast("simulation_control", {"action": "reset", "disaster_type": disaster_type, "scenario": sim_engine.get_state_summary()["scenario"]})
    await manager.broadcast("initial_state", {
        "city_geojson": sim_engine.city.to_geojson(),
        "shelters": [s.model_dump(mode="json") for s in sim_engine.shelters],
        "resources": [r.model_dump(mode="json") for r in sim_engine.resources],
        "simulation": sim_engine.get_state_summary(),
        "sops": get_all_sops(),
        "latest_recon": None,
    })
    return {"status": "reset", "disaster_type": disaster_type, "scenario": sim_engine.get_state_summary()["scenario"]}


@app.post("/api/simulation/counterfactual")
async def evaluate_counterfactual(target_sector: str = "Sector-4"):
    from .agents.counterfactual import counterfactual_engine
    evaluation = counterfactual_engine.evaluate_options(sim_engine, target_sector=target_sector)
    await manager.broadcast("counterfactual_evaluated", evaluation.model_dump(mode="json"))
    return evaluation.model_dump(mode="json")


@app.post("/api/simulation/speed")
async def set_speed(speed: float = 1.0):
    sim_engine.set_speed(speed)
    await manager.broadcast("simulation_control", {"action": "speed_change", "speed": speed})
    return {"status": "ok", "speed": sim_engine.speed}


# ─── Data Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/state")
async def get_state():
    state = orchestrator.get_full_state()
    state["simulation"] = sim_engine.get_state_summary()
    state["flood_geojson"] = sim_engine.city.to_flood_geojson()
    latest_recon = recon_service.get_latest_observation()
    if latest_recon:
        state["latest_recon"] = latest_recon.model_dump(mode="json")
    return state


@app.get("/api/city")
async def get_city():
    return sim_engine.city.to_geojson()


@app.get("/api/city/flood")
async def get_flood():
    return sim_engine.city.to_flood_geojson()


@app.get("/api/incidents")
async def get_incidents():
    return [i.model_dump(mode="json") for i in orchestrator.all_verified_incidents]


@app.get("/api/resources")
async def get_resources():
    return [r.model_dump(mode="json") for r in sim_engine.resources]


@app.get("/api/shelters")
async def get_shelters():
    return [s.model_dump(mode="json") for s in sim_engine.shelters]


@app.get("/api/predictions")
async def get_predictions():
    return orchestrator.current_prediction.model_dump(mode="json")


@app.get("/api/timeline")
async def get_timeline():
    return sim_engine.timeline


@app.get("/api/sops")
async def get_sops():
    return get_all_sops()


@app.get("/api/sops/{sop_id}")
async def get_sop_detail(sop_id: str):
    sop = get_sop(sop_id)
    if not sop.get("title"):
        raise HTTPException(status_code=404, detail="SOP not found")
    return sop


@app.get("/api/decisions")
async def get_decisions():
    return [d.model_dump(mode="json") for d in orchestrator.all_decisions[-50:]]


@app.get("/api/alerts")
async def get_alerts():
    return [a.model_dump(mode="json") for a in orchestrator.all_alerts[-20:]]


# ─── Briefing Center Endpoints ───────────────────────────────────────────────

@app.post("/api/reports/generate")
async def generate_report(report_type: str = "situation"):
    from datetime import datetime
    tick = sim_engine.tick
    dtype = sim_engine.disaster_type.upper()
    active_incidents = sum(1 for i in orchestrator.all_verified_incidents if i.is_active)
    flooded_sectors = len(sim_engine.city.get_flooded_sectors())
    
    active_shelters = [s for s in sim_engine.shelters if s.status.value in ("active", "full")]
    total_sheltered = sum(s.current_occupancy for s in sim_engine.shelters)
    deployed_units = sum(1 for r in sim_engine.resources if r.status.value != "available")

    lives_risk = sim_engine.projected_lives_at_risk
    lives_saved = sim_engine.lives_saved
    efficiency = sim_engine.risk_reduction_pct

    est_damage = round((flooded_sectors * 35.0 + tick * 8.5) * 1000000)

    latest_recon = recon_service.get_latest_observation()
    recon_str = f"- Visual CV Recon Coverage: {latest_recon.flood_area_percent:.1f}% flooded, expansion rate {latest_recon.expansion_rate:+.1f}%/s.\n" if latest_recon else ""
    
    if report_type == "briefing":
        briefing = f"""CLASSIFICATION: RESTRICTED // EMERGENCY MANAGEMENT DECK
EVENT TYPOLOGY: {dtype}
MUNICIPAL OPERATIONAL TICK: T+{tick}
LIVES PROTECTED GAUGE: {lives_saved} / {lives_risk} ({efficiency}% Risk Mitigation)

1. SITUATIONAL PROFILE:
- Sector Inundations/Hotspots: {flooded_sectors} sectors reporting critical hazard levels.
{recon_str}- Active verified incidents: {active_incidents} logged.
- Estimated economic loss: ₹{est_damage / 10000000:.1f} Crore.

2. COMMAND INTERVENTIONS:
- Activated Shelters: {len(active_shelters)} safehouses operational ({total_sheltered} citizens housed).
- Resource deployments: {deployed_units} responding assets en-route or on-scene.
- Bridge crossway statuses: Central Structure Row-8 is {"FAILED (CLOSED)" if any(c.bridge_failed for row in sim_engine.city.grid for c in row if c.is_bridge) else "STABLE (MONITORED)"}.

3. RECOMMENDED OPERATIONS:
- Priority 1: Maintain suppression and rescue loops in high-inundation quadrants.
- Priority 2: Pre-stage utility repair crew to restore grid networks on secondary routes.
- Priority 3: Transition low-occupancy safezones to standby status if hazard recedes."""
        return {"report": briefing}

    elif report_type == "media":
        press = f"""OFFICIAL PRESS STATEMENT // FOR IMMEDIATE RELEASE
EOC OPERATIONS DECK // {dtype} RESPONSE INITIATIVE
DATE: {datetime.utcnow().strftime('%Y-%m-%d')} // STATUS: OPERATIONAL ACTIVE

The AEGIS Emergency Operations Center announces active containment efforts for the ongoing {dtype} disaster.

As of operational cycle {tick}, EOC teams have successfully protected {lives_saved} citizens out of an estimated {lives_risk} who were in high-threat sectors, representing a {efficiency}% efficiency rate in casualty prevention.

A total of {deployed_units} emergency response vehicles are deployed. We advise citizens to avoid travel near the Central Bridge area which is currently closed. Shelters are fully active and stocked with food, water, and medical resources.

Members of the public are requested to remain indoors, follow instructions from local authorities, and transmit emergency beacons only through authorized channels.
"""
        return {"report": press}

    elif report_type == "alert":
        alert_msg = f"""🚨 AEGIS OS EMERGENCY CITIZEN ADVISORY
TYPE: {dtype} URGENT OUTREACH
ALERT LEVEL: LEVEL-3 (CRITICAL)

- Sectors affected: {flooded_sectors} operational sectors.
- Shelters status: Open and accepting evacuees.
- Transport: Central Bridge area is CLOSED. DO NOT attempt crossing.
- Advice: Secure valuables, stay in safe shelters, and monitor EOC feeds. If stranded, activate cell beacon for drone recon location.
"""
        return {"report": alert_msg}

    else:
        sitrep = f"""📊 AEGIS OS EXECUTIVE SITUATION REPORT (SITREP)
OPERATIONAL SYSTEM CYCLE: T+{tick} // STATUS: ACTIVE COMMAND
DISASTER BASELINE: {dtype} SIMULATION

=========================================
LIVES AT RISK: {lives_risk}
LIVES PROTECTED: {lives_saved}
RISK MITIGATION: {efficiency}%
=========================================

- Active Crisis Reports: {active_incidents} verified emergencies.
- Land-Use Blockages: {flooded_sectors} sectors experiencing grid inundations.
- Activated Safehouses: {len(active_shelters)} shelter locations active.
- Deployments in Field: {deployed_units} units dispatched.
- Estimated Infrastructure Loss: ₹{est_damage:,.0f} INR.

DIRECTIVES PENDING APPROVAL:
1. Dispatch auxiliary teams to blocked arterial roads.
2. Route drone patrol DRONE-RECON-ALPHA to check Sector-5 boundaries.
"""
        return {"report": sitrep}


@app.get("/health")
async def health():
    return {
        "status": "operational",
        "tick": sim_engine.tick,
        "is_running": sim_engine.is_running,
        "ws_connections": manager.connection_count,
        "recon_frames_processed": frame_store.frame_counter,
    }
