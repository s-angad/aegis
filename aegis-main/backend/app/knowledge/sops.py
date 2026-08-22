"""
AEGIS AI Emergency Standard Operating Procedures (SOPs).
Agents reference these when making decisions.
"""

SOPS = {
    "SOP-001": {
        "id": "SOP-001",
        "title": "Flood Alert Classification",
        "category": "Classification",
        "content": (
            "Flood Alert Classification Criteria: "
            "CRITICAL: Water level >3.0m OR structural collapse risk OR hospital access blocked. "
            "HIGH: Water level >2.0m OR more than 100 people trapped OR evacuation route blocked. "
            "MEDIUM: Water level 1.0-2.0m OR 10-100 people affected OR road partially flooded. "
            "LOW: Water level <1.0m OR isolated flooding OR minor road obstruction. "
            "Confidence threshold for verification: >40% minimum. >70% for immediate action."
        ),
        "trigger": "Any incident requiring classification",
        "authority": "Sentinel + Severity Agent",
    },
    "SOP-002": {
        "id": "SOP-002",
        "title": "Evacuation Trigger Criteria",
        "category": "Evacuation",
        "content": (
            "Mandatory evacuation when: (1) Sector severity reaches HIGH or CRITICAL. "
            "(2) Predicted time-to-impact < 60 minutes for adjacent sectors. "
            "(3) Water level exceeds 1.5m in residential areas. "
            "(4) Bridge failure isolates sector. "
            "(5) Hospital access threatened. "
            "Evacuation Routes: Primary via main roads (every 4th row/col). "
            "Secondary via park paths. Tertiary via boat rescue if roads flooded >0.5m."
        ),
        "trigger": "HIGH/CRITICAL incident OR time-to-impact < 60 min",
        "authority": "Severity Agent + Communication Agent",
    },
    "SOP-003": {
        "id": "SOP-003",
        "title": "Resource Dispatch Priority",
        "category": "Resource Management",
        "content": (
            "Resource dispatch priority order: "
            "1. CRITICAL medical emergencies (ambulance + helicopter). "
            "2. CRITICAL flood rescue (rescue boats + teams). "
            "3. HIGH severity incidents (preferred resource type matching). "
            "4. MEDIUM severity when critical resources available. "
            "Resource type matching: Flood → Rescue Boat. Medical → Ambulance. "
            "Evacuation → Helicopter or Boat. Structural → Rescue Team. "
            "Distance tiebreaker: nearest resource dispatched first. "
            "Never leave all resources deployed — maintain 20% reserve if possible."
        ),
        "trigger": "Any verified incident requiring response",
        "authority": "Allocation Agent",
    },
    "SOP-004": {
        "id": "SOP-004",
        "title": "Bridge Failure Protocol",
        "category": "Infrastructure",
        "content": (
            "On confirmed bridge failure: "
            "1. Immediately mark bridge as blocked in routing graph. "
            "2. Recalculate ALL active routes via alternative bridges. "
            "3. Alert all responders currently using failed bridge route. "
            "4. Issue public alert for affected sectors on both sides. "
            "5. Reroute civilian evacuation to alternative crossings. "
            "6. Deploy water rescue for stranded civilians. "
            "Alternative bridge priority: Row-4 bridge (north) or Row-12 bridge (south). "
            "If both alternatives are also blocked, activate helicopter evacuation protocol."
        ),
        "trigger": "Bridge flood level >2.5m OR structural failure event",
        "authority": "Routing Agent + Communication Agent",
    },
    "SOP-005": {
        "id": "SOP-005",
        "title": "Shelter Capacity Management",
        "category": "Shelter Operations",
        "content": (
            "Shelter activation: Activate when adjacent sector reaches HIGH severity. "
            "Capacity thresholds: "
            "STANDBY → ACTIVE: When sector within 1km reaches HIGH. "
            "ACTIVE → FULL intake closed: At 90% capacity. "
            "FULL overflow: Route to next nearest shelter. "
            "Priority groups: Medical cases, pregnant women, elderly, children under 12. "
            "Shelter supplies: Pre-positioned for 72-hour self-sufficiency. "
            "Medical support: At least one first-aid trained staff per 50 evacuees."
        ),
        "trigger": "Adjacent sector severity HIGH or predicted impact",
        "authority": "Allocation Agent + Communication Agent",
    },
    "SOP-006": {
        "id": "SOP-006",
        "title": "Communication Escalation Matrix",
        "category": "Communications",
        "content": (
            "Alert escalation by severity: "
            "CRITICAL: Full broadcast (radio, SMS, public address). Mandatory evacuation orders. "
            "HIGH: Area-specific alert + SMS to registered residents. Advisory to evacuate. "
            "MEDIUM: District advisory via official channels. Preparedness instructions. "
            "LOW: Monitor and update status. No public action required yet. "
            "Situation Reports (SITREPs): Every 5 ticks or on significant status change. "
            "Executive Summary: At operation end or every 20 ticks. "
            "Language: Plain, actionable. Avoid technical jargon. Include: location, action required, shelter destination."
        ),
        "trigger": "Any verified incident or significant status change",
        "authority": "Communication Agent",
    },
}


def get_sop(sop_id: str) -> dict:
    return SOPS.get(sop_id, {"id": sop_id, "title": "Unknown SOP", "content": ""})


def get_all_sops() -> list:
    return list(SOPS.values())
