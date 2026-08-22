"""
Citizen report generator for flood disaster simulation.
Produces realistic, noisy emergency reports based on current city state.
"""
import random
import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .city import CityGrid

from ..models.incident import RawReport, IncidentSource

FIRST_NAMES = [
    "Ravi", "Priya", "Amit", "Sunita", "Rahul", "Deepa", "Suresh",
    "Kavita", "Ankit", "Meera", "Vijay", "Pooja", "Sanjay", "Neha",
    "Rohit", "Shweta", "Manoj", "Divya", "Arjun", "Shreya",
]
LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Verma", "Kumar", "Gupta", "Joshi",
    "Mehta", "Shah", "Rao", "Nair", "Reddy", "Pillai", "Mishra",
]

FLOOD_TEMPLATES = [
    "Water is entering my house! Level rising fast at {location}.",
    "Emergency! Family of {n} trapped on rooftop near {location}.",
    "Road completely flooded near {location}, cannot evacuate.",
    "Please send help! Water chest deep at {location}.",
    "Elderly woman stuck in first floor at {location}, needs rescue.",
    "Car swept away near {location}. We need boats urgently.",
    "Water level at {location} is rising very fast, knee deep now.",
    "My neighbors are stranded! {location} is completely flooded.",
    "Basement flooding at {location}, electrical risk!",
    "Bridge near {location} looks dangerous, cracks visible.",
    "At least 20 people stranded at {location}, send help ASAP.",
    "Drainage overflowing, {location} main road submerged.",
]

MEDICAL_TEMPLATES = [
    "Man collapsed near {location}, possibly drowned, need ambulance.",
    "Child injured while evacuating {location}, need medical help.",
    "Old woman with heart condition stranded at {location}.",
    "Pregnant woman needs evacuation from {location} urgently.",
]

STRUCTURAL_TEMPLATES = [
    "Wall crack appearing in building at {location}, people inside!",
    "Building foundation exposed at {location}, risk of collapse.",
    "Bridge structure at {location} making cracking sounds.",
]

DUPLICATE_TEMPLATES = [
    "Yes confirming, {location} is badly flooded.",
    "I also see flooding at {location}, same situation.",
    "{location} flood situation is real, confirmed by multiple residents.",
]

FALSE_TEMPLATES = [
    "Small puddle near {location}, might need to check.",
    "Mild waterlogging at {location}, not serious.",
]


def _random_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def _random_phone() -> str:
    return f"+91-{random.randint(7000000000, 9999999999)}"


def generate_citizen_reports(city: "CityGrid", tick: int, rain_rate: float) -> List[RawReport]:
    """
    Generate citizen reports based on current flood state.
    More reports from flooded sectors. Some duplicates. ~10% false.
    """
    reports: List[RawReport] = []
    flood_cells = [c for row in city.grid for c in row if c.flood_level > 0.5]

    if not flood_cells or rain_rate < 0.1:
        return reports

    # Number of reports scales with flood intensity and tick
    base_count = max(1, int(len(flood_cells) * 0.15 * rain_rate))
    report_count = min(base_count + random.randint(0, 3), 12)

    # Choose source cells (prefer heavily flooded)
    weights = [c.flood_level ** 2 for c in flood_cells]
    total_w = sum(weights) or 1
    weights = [w / total_w for w in weights]

    generated_sectors = []
    for _ in range(report_count):
        cell = random.choices(flood_cells, weights=weights)[0]
        sector = cell.sector_id
        loc = f"{sector} (near block {cell.row}-{cell.col})"
        is_dup = sector in generated_sectors and random.random() < 0.35
        is_false = random.random() < 0.10

        if is_false:
            msg = random.choice(FALSE_TEMPLATES).format(location=sector)
            source = random.choice([IncidentSource.CITIZEN_REPORT, IncidentSource.SOCIAL_MEDIA])
        elif is_dup:
            msg = random.choice(DUPLICATE_TEMPLATES).format(location=sector)
            source = IncidentSource.CITIZEN_REPORT
        else:
            if cell.population_density > 200 and random.random() < 0.2:
                tmpl = random.choice(MEDICAL_TEMPLATES)
            elif cell.flood_level > 2.5 and random.random() < 0.15:
                tmpl = random.choice(STRUCTURAL_TEMPLATES)
            else:
                tmpl = random.choice(FLOOD_TEMPLATES)
            n = random.randint(2, 8)
            msg = tmpl.format(location=loc, n=n)
            source = random.choice([
                IncidentSource.CITIZEN_REPORT,
                IncidentSource.EMERGENCY_CALL,
                IncidentSource.SOCIAL_MEDIA,
            ])

        report = RawReport(
            id=str(uuid.uuid4())[:8],
            message=msg,
            location=loc,
            sector=sector,
            lat=round(cell.center_lat, 6),
            lng=round(cell.center_lng, 6),
            reporter_name=_random_name(),
            phone=_random_phone(),
            timestamp=datetime.utcnow(),
            source=source,
            is_duplicate=is_dup,
            is_false=is_false,
        )
        reports.append(report)
        generated_sectors.append(sector)

    return reports
