"""
Pre-built disaster scenarios for AEGIS OS.
Contains 20-tick scripted timelines for Floods, Wildfires, and Cyclones.
"""
from typing import List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class ScenarioTick:
    tick: int
    rain_rate: float          # 0.0 - 1.0 (serves as hazard intensity)
    description: str
    events: List[Dict[str, Any]] = field(default_factory=list)
    narrative: str = ""


# ─── FLOOD SCENARIO ───
FLOOD_SCENARIO: List[ScenarioTick] = [
    ScenarioTick(tick=1, rain_rate=0.0, description="Normal conditions", narrative="City operations normal. All systems monitoring meteorological feeds."),
    ScenarioTick(tick=2, rain_rate=0.15, description="Light rain begins", narrative="Drizzle detected across the municipal area. Weather advisory issued.", events=[{"type": "sensor_alert", "message": "Rainfall threshold exceeded: 12mm/hr", "sector": "Sector-6"}]),
    ScenarioTick(tick=3, rain_rate=0.30, description="Rain intensifying", narrative="Precipitation rising. River Krishna gauge level climbing.", events=[{"type": "sensor_alert", "message": "River level +0.8m above baseline", "sector": "Sector-7"}]),
    ScenarioTick(tick=4, rain_rate=0.50, description="Heavy rain, river rising fast", narrative="Heavy rainfall causing runoffs. Initial localized citizen reports incoming.", events=[{"type": "sensor_alert", "message": "River level critical: +2.1m", "sector": "Sector-7"}]),
    ScenarioTick(tick=5, rain_rate=0.65, description="River overflow begins", narrative="River overflowing banks. Low-elevation sectors beginning to submerge.", events=[{"type": "shelter_activate", "shelter_name": "Shelter Alpha"}, {"type": "shelter_activate", "shelter_name": "Shelter Beta"}]),
    ScenarioTick(tick=6, rain_rate=0.70, description="Flooding spreading, roads blocked", narrative="Flooding spreading rapidly. Emergency dispatches initiated. Drone Recon launching.", events=[{"type": "sensor_alert", "message": "Main road submerged. Blockages reported.", "sector": "Sector-10"}]),
    ScenarioTick(tick=7, rain_rate=0.75, description="High-priority incidents logged", narrative="Multiple distress calls verified. Allocation agents dispatching boats.", events=[]),
    ScenarioTick(tick=8, rain_rate=0.80, description="Peak rainfall — critical stage", narrative="Extreme precipitation. River structures under intense physical pressure.", events=[{"type": "sensor_alert", "message": "Central bridge structural strain detected", "sector": "Sector-10"}, {"type": "shelter_activate", "shelter_name": "Shelter Gamma"}]),
    ScenarioTick(tick=9, rain_rate=0.82, description="Widespread inundation", narrative="Predictor Agent maps 4 down-slope sectors facing high inundation risk.", events=[]),
    ScenarioTick(tick=10, rain_rate=0.80, description="Resources fully deployed", narrative="Boats and response teams engaged in active extractions.", events=[]),
    ScenarioTick(tick=11, rain_rate=0.78, description="Hospital route threatened", narrative="Water encroaching on Sector-5 hospital zone. Router prioritizing secondary links.", events=[{"type": "sensor_alert", "message": "Hospital main link submerged; routing backup", "sector": "Sector-5"}]),
    ScenarioTick(tick=12, rain_rate=0.75, description="Precipitation slowing", narrative="Rainfall slowing down. Accumulation levels remain extreme.", events=[]),
    ScenarioTick(tick=13, rain_rate=0.70, description="Bridge failure imminent", narrative="Central bridge support columns damaged. Rerouting protocols pre-staged.", events=[{"type": "sensor_alert", "message": "Row-8 Bridge integrity <15%", "sector": "Sector-10"}, {"type": "shelter_activate", "shelter_name": "Shelter Delta"}]),
    ScenarioTick(tick=14, rain_rate=0.65, description="BRIDGE COLLAPSE — Emergency Reroute", narrative="Central bridge collapsed. OS routing graphs modified. Rerouting all vehicles.", events=[{"type": "bridge_fail", "bridge_row": 8, "message": "BRIDGE FAILURE: Central Bridge Row-8 has COLLAPSED"}]),
    ScenarioTick(tick=15, rain_rate=0.60, description="Stabilizing routes", narrative="Response assets successfully rerouted via north and south crossings.", events=[]),
    ScenarioTick(tick=16, rain_rate=0.50, description="Water stabilization", narrative="Rainwater draining. Shelters reporting high occupancies.", events=[{"type": "sensor_alert", "message": "Shelter Alpha at capacity; routing overflow to Shelter Beta", "sector": "Sector-1"}]),
    ScenarioTick(tick=17, rain_rate=0.35, description="Evacuation operations peak", narrative="System coordinating final evacuations. Lives protected tally rising.", events=[]),
    ScenarioTick(tick=18, rain_rate=0.20, description="Receding water levels", narrative="Water receding. Damage inspection teams beginning fieldwork.", events=[]),
    ScenarioTick(tick=19, rain_rate=0.10, description="Recovery operations initiated", narrative="Cleanups and utility restoration crews dispatching to clean roads.", events=[]),
    ScenarioTick(tick=20, rain_rate=0.05, description="Operation completed", narrative="All citizens sheltered or rescued. Executive sitrep generated.", events=[{"type": "executive_summary", "message": "Flood response operations completed successfully."}]),
]


# ─── WILDFIRE SCENARIO ───
WILDFIRE_SCENARIO: List[ScenarioTick] = [
    ScenarioTick(tick=1, rain_rate=0.0, description="Extreme dryness warning", narrative="Meteorological sensors report 8% humidity. High wind advisories active."),
    ScenarioTick(tick=2, rain_rate=0.15, description="Ignition reported", narrative="Smoke plumes detected near the Sector-9 dry vegetation reserve.", events=[{"type": "sensor_alert", "message": "Hotspot detected: Thermal anomaly >300°C", "sector": "Sector-9"}]),
    ScenarioTick(tick=3, rain_rate=0.30, description="Flame front expanding", narrative="Winds pushing flames eastward. Fire intensifies in dry grassy areas.", events=[{"type": "sensor_alert", "message": "Fire front moving East at 22km/hr", "sector": "Sector-9"}]),
    ScenarioTick(tick=4, rain_rate=0.50, description="Crown fire active", narrative="Flames reach tree canopy. Sector-10 residential boundaries threatened.", events=[{"type": "sensor_alert", "message": "Radiant heat threat within 300m of residential zones", "sector": "Sector-10"}]),
    ScenarioTick(tick=5, rain_rate=0.65, description="Evacuation triggers active", narrative="Mandatory evacuations ordered for Sector-9 and 10. SafeZones opened.", events=[{"type": "shelter_activate", "shelter_name": "Shelter Alpha"}, {"type": "shelter_activate", "shelter_name": "Shelter Beta"}]),
    ScenarioTick(tick=6, rain_rate=0.70, description="Fireballs & spot fires", narrative="Burning embers create localized spot fires downwind. Roads closed.", events=[{"type": "sensor_alert", "message": "Road blockage: Smoke opacity blocking visibility on highway", "sector": "Sector-10"}]),
    ScenarioTick(tick=7, rain_rate=0.75, description="Fire engines dispatched", narrative="Engines deploying foam barriers. Helicopter fire-bombing active.", events=[]),
    ScenarioTick(tick=8, rain_rate=0.80, description="Containment line established", narrative="Crews bulldozing firebreaks to protect the hospital in Sector-5.", events=[{"type": "shelter_activate", "shelter_name": "Shelter Gamma"}]),
    ScenarioTick(tick=9, rain_rate=0.82, description="Hospital boundary threatened", narrative="Predictor Agent spots wind gusts threatening containment lines near Sector-5.", events=[]),
    ScenarioTick(tick=10, rain_rate=0.80, description="Air drop deployments", narrative="Aerial suppression assets dropping fire retardants along flanks.", events=[]),
    ScenarioTick(tick=11, rain_rate=0.78, description="Utility infrastructure safe", narrative="Defensive crews successfully steer flames away from gas substations.", events=[{"type": "sensor_alert", "message": "Substation cooling systems active, perimeter secure", "sector": "Sector-12"}]),
    ScenarioTick(tick=12, rain_rate=0.75, description="Wind speeds reducing", narrative="Wind speeds dropping, giving crews a suppression window.", events=[]),
    ScenarioTick(tick=13, rain_rate=0.70, description="Firebreak overrun", narrative="Critical firebreak breached in Sector-10. Hotspots leaping river lines.", events=[{"type": "sensor_alert", "message": "Embers breached river containment boundary", "sector": "Sector-10"}, {"type": "shelter_activate", "shelter_name": "Shelter Delta"}]),
    ScenarioTick(tick=14, rain_rate=0.65, description="BRIDGE ENGULFED — Rerouting assets", narrative="Central bridge engulfed in flames. Rerouting all evacuation transport.", events=[{"type": "bridge_fail", "bridge_row": 8, "message": "FIREBREAK OVERRUN: Central Bridge Row-8 is ENGULFED IN FLAMES"}]),
    ScenarioTick(tick=15, rain_rate=0.60, description="Flank containment active", narrative="Tactical crews containing fire leaps in southern sectors.", events=[]),
    ScenarioTick(tick=16, rain_rate=0.50, description="Suppression progress", narrative="Containment reaches 65%. High occupancy in northern safezones.", events=[]),
    ScenarioTick(tick=17, rain_rate=0.35, description="Smoldering control", narrative="Open flames suppressed. Operations shift to hot-spot dousing.", events=[]),
    ScenarioTick(tick=18, rain_rate=0.20, description="Containment secure", narrative="Containment lines fully secure. Ash cooling monitoring active.", events=[]),
    ScenarioTick(tick=19, rain_rate=0.10, description="Evacuation lifted", narrative="Safe sectors cleared for re-entry. Local crews mop-up debris.", events=[]),
    ScenarioTick(tick=20, rain_rate=0.05, description="Fire fully contained", narrative="Aravali forest fire fully contained. Damage report logged.", events=[{"type": "executive_summary", "message": "Wildfire suppression operations completed."}]),
]


# ─── CYCLONE SCENARIO ───
CYCLONE_SCENARIO: List[ScenarioTick] = [
    ScenarioTick(tick=1, rain_rate=0.0, description="Cyclone storm watch active", narrative="Deep depression in Bay of Bengal coordinates. Warning level: Orange."),
    ScenarioTick(tick=2, rain_rate=0.15, description="Gale force winds arrive", narrative="Outer wind bands make landfall. Wind gusts reaching 75km/hr.", events=[{"type": "sensor_alert", "message": "Wind speed threshold exceeded: 65km/hr", "sector": "Sector-16"}]),
    ScenarioTick(tick=3, rain_rate=0.30, description="Torrential rain starts", narrative="Storm walls hitting land. Severe structural threat due to wind loads.", events=[{"type": "sensor_alert", "message": "Coastal radar tracks cyclone center 80km out", "sector": "Sector-12"}]),
    ScenarioTick(tick=4, rain_rate=0.50, description="Storm surge inundation", narrative="Coastal surge rising. Coastal sectors reporting sea-wall breaches.", events=[{"type": "sensor_alert", "message": "Storm surge warning: Sea level +1.8m", "sector": "Sector-16"}]),
    ScenarioTick(tick=5, rain_rate=0.65, description="Eyewall landing, evacuations", narrative="Eyewall makes direct landfall. Extreme wind speeds. Safehouses activated.", events=[{"type": "shelter_activate", "shelter_name": "Shelter Alpha"}, {"type": "shelter_activate", "shelter_name": "Shelter Beta"}]),
    ScenarioTick(tick=6, rain_rate=0.70, description="Infrastructure collapse", narrative="High winds topple transmission towers. Roads blocked by poles and trees.", events=[{"type": "sensor_alert", "message": "Road blockage: Power lines down across Sector-12 main street", "sector": "Sector-12"}]),
    ScenarioTick(tick=7, rain_rate=0.75, description="Utility crews dispatch", narrative="Utility trucks clearing lines. Ambulances active for trauma incidents.", events=[]),
    ScenarioTick(tick=8, rain_rate=0.80, description="Max winds over central grid", narrative="Extreme pressure. Structures in central sector facing major stress.", events=[{"type": "sensor_alert", "message": "Structural alert: Telecom mast in Sector-10 showing yaw drift", "sector": "Sector-10"}, {"type": "shelter_activate", "shelter_name": "Shelter Gamma"}]),
    ScenarioTick(tick=9, rain_rate=0.82, description="River flooding triggered", narrative="Cyclone storm surge swells the central river. Predictor maps overflow risk.", events=[]),
    ScenarioTick(tick=10, rain_rate=0.80, description="Active rescues ongoing", narrative="Rescue units traversing wind-wrecked streets. Helicopter on standby.", events=[]),
    ScenarioTick(tick=11, rain_rate=0.78, description="Essential grid secured", narrative="Secondary power loops activated. Medical centers remain operational.", events=[{"type": "sensor_alert", "message": "Hospital loops online; main grids isolated", "sector": "Sector-5"}]),
    ScenarioTick(tick=12, rain_rate=0.75, description="Eye passing over city", narrative="Storm eye passing. Localized calm. Crews utilizing gap for evacuations.", events=[]),
    ScenarioTick(tick=13, rain_rate=0.70, description="Rear eyewall strikes", narrative="Winds swap direction. Extreme turbulence. Critical structures toppled.", events=[{"type": "sensor_alert", "message": "High winds: Telecom mast structural collapse", "sector": "Sector-10"}, {"type": "shelter_activate", "shelter_name": "Shelter Delta"}]),
    ScenarioTick(tick=14, rain_rate=0.65, description="MAST COLLAPSE — Route severed", narrative="Telecom mast collapsed on bridge. All vehicles rerouting via backup roads.", events=[{"type": "bridge_fail", "bridge_row": 8, "message": "INFRASTRUCTURE COLLAPSE: Telecom Mast has collapsed across Bridge Row-8"}]),
    ScenarioTick(tick=15, rain_rate=0.60, description="Rerouting disaster teams", narrative="Alternative routes successfully engaged. Debris clearance teams moving.", events=[]),
    ScenarioTick(tick=16, rain_rate=0.50, description="Winds receding", narrative="Cyclone center moving inland. Wind speeds dropping to 60km/hr.", events=[]),
    ScenarioTick(tick=17, rain_rate=0.35, description="Clearance operations peak", narrative="Utility trucks restoring communication lines. Shelters active.", events=[]),
    ScenarioTick(tick=18, rain_rate=0.20, description="Storm leaves district", narrative="Blue skies appearing. Systematic survey of outer sectors active.", events=[]),
    ScenarioTick(tick=19, rain_rate=0.10, description="Re-entry programs started", narrative="Safe zones clearing families. Structural engineers inspect homes.", events=[]),
    ScenarioTick(tick=20, rain_rate=0.05, description="Cyclone response complete", narrative="Grid restored. Response actions completed.", events=[{"type": "executive_summary", "message": "Cyclone response operations completed."}]),
]


def get_scenario_tick(tick: int, disaster_type: str = "flood") -> ScenarioTick:
    sc = FLOOD_SCENARIO
    if disaster_type == "wildfire":
        sc = WILDFIRE_SCENARIO
    elif disaster_type == "cyclone":
        sc = CYCLONE_SCENARIO

    idx = max(0, min(tick - 1, len(sc) - 1))
    return sc[idx]


def get_rain_rate(tick: int, disaster_type: str = "flood") -> float:
    return get_scenario_tick(tick, disaster_type).rain_rate
