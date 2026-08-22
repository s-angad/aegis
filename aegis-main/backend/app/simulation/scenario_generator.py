"""
AEGIS FLOOD — Dynamic Seedable Scenario Generator Module.
Generates physically plausible, reproducible flood disaster scenarios.
Supports 6 distinct scenario archetypes with randomized rainfall profiles,
river baselines, flood origins, drainage efficiencies, bridge failures, and citizen reports.
"""
import random
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict

@dataclass
class ScenarioConfig:
    seed: int
    seed_str: str
    scenario_type: str               # "Rapid River Overflow", "Urban Cloudburst", "Dual Front Flood", "Bridge Failure Scenario", "Slow Rising Flood", "Extreme Storm"
    description: str
    river_baseline: float            # 0.8 to 3.5 m
    rainfall_peak: float             # 15 to 115 mm/hr
    rainfall_profile: List[float]    # 20-tick rain intensity multiplier (0.0 to 1.0)
    sector_rainfall_map: Dict[str, float] # sector rainfall multiplier
    flood_origins: List[Dict[str, Any]]   # [{"row": r, "col": c, "type": "river_overflow" | "cloudburst" | "drainage_failure"}]
    drainage_efficiencies: Dict[str, float] # per sector (0.3 to 0.9)
    vulnerable_bridges: List[int]    # e.g. [3, 7, 11]
    bridge_fail_tick: int           # tick 6 to 14
    false_report_rate: float        # 0.05 to 0.15
    duplicate_report_rate: float    # 0.10 to 0.30
    citizen_reports: List[Dict[str, Any]]
    available_resources: Dict[str, int]
    primary_threat_sectors: List[string] if False else List[str]


def generate_scenario(seed: Optional[int] = None) -> ScenarioConfig:
    if seed is None:
        seed = random.randint(100000, 999999)

    rng = random.Random(seed)
    seed_str = f"SIM-2026-{seed}"

    archetypes = [
        "Rapid River Overflow",
        "Urban Cloudburst",
        "Dual Front Flood",
        "Bridge Failure Scenario",
        "Slow Rising Flood",
        "Extreme Storm"
    ]
    weights = [0.30, 0.25, 0.20, 0.12, 0.08, 0.05]
    scenario_type = rng.choices(archetypes, weights=weights)[0]

    # Initialize sector maps
    sector_rainfall_map = {}
    drainage_efficiencies = {}
    for r in range(4):
        for c in range(4):
            sector_name = f"Sector-{r*4 + c + 1}"
            sector_rainfall_map[sector_name] = round(0.5 + rng.random() * 0.9, 2)
            drainage_efficiencies[sector_name] = round(0.35 + rng.random() * 0.5, 2)

    # Configure parameters per archetype
    if scenario_type == "Rapid River Overflow":
        river_baseline = round(2.2 + rng.random() * 0.8, 2)
        rainfall_peak = round(45 + rng.random() * 25, 1)
        flood_origins = [
            {"row": 3, "col": 12, "type": "river_overflow", "sector": "Sector-4"},
            {"row": 7, "col": 12, "type": "river_overflow", "sector": "Sector-8"},
        ]
        description = "High river baseline combined with moderate rainfall triggers rapid embankment overflow along eastern river sectors."
        vulnerable_bridges = [7, 11]
        bridge_fail_tick = rng.randint(8, 14)
        primary_sectors = ["Sector-4", "Sector-8", "Sector-12"]

    elif scenario_type == "Urban Cloudburst":
        river_baseline = round(1.8 + rng.random() * 0.4, 2)
        rainfall_peak = round(80 + rng.random() * 35, 1)
        flood_origins = [
            {"row": 7, "col": 12, "type": "river_overflow", "sector": "Sector-8"},
            {"row": 11, "col": 12, "type": "river_overflow", "sector": "Sector-12"},
        ]
        description = "Extreme localized cloudburst overwhelms municipal drainage infrastructure in central commercial districts."
        vulnerable_bridges = [3]
        bridge_fail_tick = rng.randint(10, 15)
        primary_sectors = ["Sector-6", "Sector-7", "Sector-10"]

    elif scenario_type == "Dual Front Flood":
        river_baseline = round(1.8 + rng.random() * 0.6, 2)
        rainfall_peak = round(60 + rng.random() * 25, 1)
        flood_origins = [
            {"row": 3, "col": 12, "type": "river_overflow", "sector": "Sector-4"},
            {"row": 11, "col": 12, "type": "river_overflow", "sector": "Sector-12"},
        ]
        description = "Simultaneous riverbank overflow and heavy rainfall accumulation create two active disaster fronts."
        vulnerable_bridges = [3, 7]
        bridge_fail_tick = rng.randint(7, 12)
        primary_sectors = ["Sector-3", "Sector-4", "Sector-13"]

    elif scenario_type == "Bridge Failure Scenario":
        river_baseline = round(1.9 + rng.random() * 0.5, 2)
        rainfall_peak = round(50 + rng.random() * 20, 1)
        flood_origins = [
            {"row": 7, "col": 12, "type": "river_overflow", "sector": "Sector-8"},
        ]
        description = "River swelling places critical structural strain on major transport bridges, threatening access routes."
        vulnerable_bridges = [7]
        bridge_fail_tick = rng.randint(6, 9)
        primary_sectors = ["Sector-7", "Sector-8", "Sector-11"]

    elif scenario_type == "Slow Rising Flood":
        river_baseline = round(1.6 + rng.random() * 0.4, 2)
        rainfall_peak = round(25 + rng.random() * 15, 1)
        flood_origins = [
            {"row": 11, "col": 12, "type": "river_overflow", "sector": "Sector-12"},
        ]
        description = "Gradual water level accumulation providing an opportunity for proactive pre-emptive evacuations."
        vulnerable_bridges = [11]
        bridge_fail_tick = 14
        primary_sectors = ["Sector-12", "Sector-16"]

    else:  # Extreme Storm
        river_baseline = round(2.8 + rng.random() * 0.7, 2)
        rainfall_peak = round(95 + rng.random() * 20, 1)
        flood_origins = [
            {"row": 3, "col": 7, "type": "river_overflow", "sector": "Sector-4"},
            {"row": 7, "col": 8, "type": "river_overflow", "sector": "Sector-8"},
            {"row": 10, "col": 5, "type": "cloudburst", "sector": "Sector-10"},
        ]
        description = "Severe cyclone-driven storm surge and record rainfall cause widespread inundation and multiple infrastructure closures."
        vulnerable_bridges = [3, 7, 11]
        bridge_fail_tick = rng.randint(6, 10)
        primary_sectors = ["Sector-4", "Sector-8", "Sector-10", "Sector-12"]

    # 20-tick rainfall intensity curve (fast disaster escalation)
    rainfall_profile = []
    for t in range(1, 21):
        if t <= 3:
            val = round(0.45 + (t / 3.0) * 0.35, 2)
        elif t <= 9:
            val = round(0.80 + ((t - 3) / 6.0) * 0.20, 2)
        elif t <= 14:
            val = round(1.0 - ((t - 9) / 5.0) * 0.3, 2)
        else:
            val = round(0.7 - ((t - 14) / 6.0) * 0.5, 2)
        rainfall_profile.append(max(0.15, min(1.0, val)))

    # Randomized Citizen Reports
    citizen_report_templates = [
        {"sector": primary_sectors[0], "message": f"Water rising rapidly near {primary_sectors[0]} main street.", "type": "water_level"},
        {"sector": primary_sectors[0], "message": f"Road underwater, vehicles stuck in {primary_sectors[0]}.", "type": "road_block"},
        {"sector": primary_sectors[min(1, len(primary_sectors)-1)], "message": "Basement flooding reported in residential complex.", "type": "building_damage"},
        {"sector": "Sector-7", "message": "Bridge structure shaking due to high water current.", "type": "bridge_hazard"},
        {"sector": primary_sectors[-1], "message": "Water ankle deep and rising quickly.", "type": "water_level"},
        {"sector": "Sector-1", "message": "Minor puddle accumulation, situation normal.", "type": "false_alarm"},
    ]

    # Randomized Resources
    available_resources = {
        "rescue_boat": rng.randint(3, 6),
        "ambulance": rng.randint(3, 5),
        "rescue_team": rng.randint(4, 8),
        "fire_engine": rng.randint(3, 6),
    }

    return ScenarioConfig(
        seed=seed,
        seed_str=seed_str,
        scenario_type=scenario_type,
        description=description,
        river_baseline=river_baseline,
        rainfall_peak=rainfall_peak,
        rainfall_profile=rainfall_profile,
        sector_rainfall_map=sector_rainfall_map,
        flood_origins=flood_origins,
        drainage_efficiencies=drainage_efficiencies,
        vulnerable_bridges=vulnerable_bridges,
        bridge_fail_tick=bridge_fail_tick,
        false_report_rate=round(0.05 + rng.random() * 0.10, 2),
        duplicate_report_rate=round(0.10 + rng.random() * 0.20, 2),
        citizen_reports=citizen_report_templates,
        available_resources=available_resources,
        primary_threat_sectors=primary_sectors,
    )
