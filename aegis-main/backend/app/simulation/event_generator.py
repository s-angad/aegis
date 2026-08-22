"""
AEGIS FLOOD — Stochastic Dynamic Event Generator.
Generates state-consistent disaster events based on the live city grid, water depth,
shelter occupancy, and finite resource constraints.
"""
import random
import uuid
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from datetime import datetime
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from .engine import SimulationEngine


class DynamicDisasterEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"INC-{str(uuid.uuid4())[:6].upper()}")
    type: str
    sector: str
    severity: str  # LOW, MODERATE, HIGH, CRITICAL
    affected_population: int = 0
    required_capabilities: List[str] = Field(default_factory=list)
    urgency: float = 0.5  # 0.0 to 1.0
    description: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StochasticEventGenerator:
    def __init__(self):
        pass

    def generate_events_for_tick(self, engine: "SimulationEngine") -> List[DynamicDisasterEvent]:
        """Generate 1-3 realistic state-driven disaster events for current simulation tick."""
        events: List[DynamicDisasterEvent] = []
        city = engine.city
        tick = engine.tick
        seed = engine.scenario_config.seed if engine.scenario_config else 1010

        # Seed pseudo-random generator with tick + scenario seed for deterministic reproducibility if desired
        rng = random.Random(seed + tick * 100)

        # Measure live state
        all_cells = [cell for row in city.grid for cell in row]
        flooded_cells = [c for c in all_cells if c.flood_level > 0.1]
        
        # 1. Stranded Group Event
        if flooded_cells:
            target_cell = rng.choice(flooded_cells)
            sector_name = target_cell.sector_id
            pop = max(12, int(target_cell.population_density * rng.uniform(0.1, 0.4)))
            events.append(DynamicDisasterEvent(
                type="STRANDED_GROUP",
                sector=sector_name,
                severity="CRITICAL" if target_cell.flood_level > 1.2 else "HIGH",
                affected_population=pop,
                required_capabilities=["WATER_RESCUE"],
                urgency=round(min(0.98, target_cell.flood_level * 0.35 + 0.5), 2),
                description=f"{pop} citizens stranded near {sector_name} (Water depth {target_cell.flood_level:.1f}m)."
            ))

        # 2. Hospital / Infrastructure Threat Event
        hosp_cell = city.get_cell(6, 2)  # Hospital location
        if hosp_cell and hosp_cell.flood_level > 0.05:
            events.append(DynamicDisasterEvent(
                type="HOSPITAL_THREATENED",
                sector="Sector-5",
                severity="CRITICAL",
                affected_population=150,
                required_capabilities=["WATER_PUMPING", "MEDICAL_EVAC"],
                urgency=0.96,
                description="Hospital access road inundated. Water pump & medical evac required."
            ))

        # 3. Shelter Capacity Constraint Event
        for shelter in engine.shelters:
            if shelter.current_occupancy >= int(shelter.capacity * 0.8):
                events.append(DynamicDisasterEvent(
                    type="SHELTER_NEAR_CAPACITY",
                    sector=shelter.sector,
                    severity="HIGH",
                    affected_population=shelter.current_occupancy,
                    required_capabilities=["RELIEF_SUPPLY"],
                    urgency=0.85,
                    description=f"{shelter.name} near capacity ({shelter.current_occupancy}/{shelter.capacity}). Rerouting required."
                ))

        # 4. Resource Capacity Constraint Warning
        active_boats = [r for r in engine.resources if r.type.value == "rescue_boat" and r.status.value in ("dispatched", "en_route", "on_scene", "active")]
        if len(active_boats) >= 8:
            events.append(DynamicDisasterEvent(
                type="RESOURCE_CONSTRAINED",
                sector="Sector-4",
                severity="HIGH",
                affected_population=0,
                required_capabilities=["PRIORITIZATION"],
                urgency=0.88,
                description=f"Water rescue capacity constrained ({len(active_boats)}/10 boats active). Prioritization required."
            ))

        return events


event_generator = StochasticEventGenerator()
