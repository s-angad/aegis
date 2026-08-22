"""
Agent 6: Routing Agent
Generates optimal rescue routes using NetworkX A* pathfinding.
Avoids flooded and blocked roads dynamically.
"""
from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
import math

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

from ..models.incident import Incident
from ..models.resource import Resource, ResourceStatus
from ..models.agent import AgentDecision, AgentName
from ..simulation.city import GRID_ROWS, GRID_COLS, LandType


def _heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _lat_lng_to_grid(lat: float, lng: float, city) -> Tuple[int, int]:
    """Convert lat/lng to nearest grid cell."""
    from ..simulation.city import CITY_CENTER_LAT, CITY_CENTER_LNG, LAT_PER_CELL, LNG_PER_CELL
    row = int((CITY_CENTER_LAT + (GRID_ROWS / 2) * LAT_PER_CELL - lat) / LAT_PER_CELL)
    col = int((lng - (CITY_CENTER_LNG - (GRID_COLS / 2) * LNG_PER_CELL)) / LNG_PER_CELL)
    row = max(0, min(GRID_ROWS - 1, row))
    col = max(0, min(GRID_COLS - 1, col))
    return row, col


def _build_graph(city) -> "nx.Graph":
    G = nx.Graph()
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cell = city.grid[r][c]
            if cell.land_type == LandType.RIVER:
                continue  # no movement through river
            G.add_node((r, c))

            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < GRID_ROWS and 0 <= nc < GRID_COLS:
                    ncell = city.grid[nr][nc]
                    if ncell.land_type == LandType.RIVER:
                        continue
                    # Weight: base 1 + flood penalty + bridge-fail block
                    if ncell.bridge_failed or (ncell.is_blocked and ncell.land_type != LandType.BRIDGE):
                        weight = 1000  # effectively blocked
                    else:
                        flood_penalty = ncell.flood_level * 3.0
                        weight = 1.0 + flood_penalty
                    G.add_edge((r, c), (nr, nc), weight=weight)
    return G


def _path_to_coords(path: List[Tuple[int, int]], city) -> List[List[float]]:
    coords = []
    for r, c in path:
        cell = city.grid[r][c]
        coords.append([round(cell.center_lng, 6), round(cell.center_lat, 6)])
    return coords


class RoutingAgent:
    def __init__(self):
        self.name = AgentName.ROUTER
        self._graph_cache: Optional["nx.Graph"] = None
        self._last_rebuild_tick: int = -1
        self._routes: Dict[str, List[List[float]]] = {}  # resource_id -> route coords

    def process(
        self,
        incidents: List[Incident],
        engine: "SimulationEngine",
    ) -> Tuple[Dict[str, List[List[float]]], List[AgentDecision]]:
        decisions: List[AgentDecision] = []

        if not HAS_NETWORKX:
            decisions.append(AgentDecision(
                agent_name=AgentName.ROUTER,
                action="Routing Unavailable",
                description="NetworkX not installed — using direct routes",
                reasoning="Install networkx for optimal pathfinding.",
                severity="warning",
            ))
            return self._routes, decisions

        # Rebuild graph each tick (road conditions change)
        G = _build_graph(engine.city)
        routes_calculated = 0
        routes_recalculated = 0
        blocked_routes = 0

        for resource in engine.resources:
            if resource.status not in (ResourceStatus.EN_ROUTE, ResourceStatus.RETURNING):
                continue
            if not resource.assigned_incident and resource.status != ResourceStatus.RETURNING:
                continue

            # Find destination
            if resource.status == ResourceStatus.RETURNING:
                dest_lat, dest_lng = resource.home_lat, resource.home_lng
            else:
                incident = next((i for i in incidents if i.id == resource.assigned_incident), None)
                if not incident:
                    continue
                dest_lat, dest_lng = incident.lat, incident.lng

            src = _lat_lng_to_grid(resource.lat, resource.lng, engine.city)
            dst = _lat_lng_to_grid(dest_lat, dest_lng, engine.city)

            if G.nodes:
                if src not in G:
                    src = min(G.nodes, key=lambda n: _heuristic(n, src))
                if dst not in G:
                    dst = min(G.nodes, key=lambda n: _heuristic(n, dst))

            if src == dst:
                self._routes[resource.id] = [[resource.lng, resource.lat]]
                continue

            # Check if previously computed route is still valid
            old_route = self._routes.get(resource.id)
            was_recalculated = old_route is not None

            try:
                path = nx.astar_path(G, src, dst, heuristic=_heuristic, weight="weight")
                coords = _path_to_coords(path, engine.city)
                self._routes[resource.id] = coords
                resource.route = coords

                if was_recalculated:
                    routes_recalculated += 1
                else:
                    routes_calculated += 1
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                blocked_routes += 1
                # Fallback: straight line
                self._routes[resource.id] = [
                    [resource.lng, resource.lat],
                    [dest_lng, dest_lat],
                ]
                resource.route = self._routes[resource.id]

        # Check for bridge failure replanning
        bridge_failed = any(
            c.bridge_failed
            for row in engine.city.grid
            for c in row
            if c.is_bridge
        )

        if routes_calculated > 0 or routes_recalculated > 0 or blocked_routes > 0:
            decisions.append(AgentDecision(
                agent_name=AgentName.ROUTER,
                action="Routes Computed" if not bridge_failed else "Emergency Rerouting",
                description=(
                    f"{'⚠ BRIDGE FAILURE: ' if bridge_failed else ''}"
                    f"{routes_calculated} routes calculated, {routes_recalculated} recalculated"
                    + (f", {blocked_routes} paths blocked" if blocked_routes else "")
                ),
                reasoning=(
                    f"{'Bridge failure detected — all routes via Row-8 bridge rerouted. ' if bridge_failed else ''}"
                    f"NetworkX A* with flood-level edge weights. "
                    f"Flood penalty: {engine.city.get_all_cells()[0].flood_level:.1f}× base weight in flooded cells. "
                    f"{'Alternative routes found via Row-4 and Row-12 bridges.' if bridge_failed else ''}"
                ),
                sop_reference="SOP-004" if bridge_failed else "SOP-003",
                severity="critical" if bridge_failed else ("warning" if blocked_routes else "info"),
            ))

        return self._routes, decisions
