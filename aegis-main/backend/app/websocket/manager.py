"""
WebSocket Connection Manager for AEGIS AI.
Manages multiple client connections and broadcasts events.
"""
import json
from typing import Set, Any
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, event_type: str, data: Any):
        if not self.active_connections:
            return
        message = json.dumps({"type": event_type, "data": data, "ts": __import__("time").time()})
        dead = set()
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections.discard(ws)

    async def send_to(self, websocket: WebSocket, event_type: str, data: Any):
        message = json.dumps({"type": event_type, "data": data})
        await websocket.send_text(message)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


manager = ConnectionManager()
