from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        if user_id in self._connections and websocket in self._connections[user_id]:
            self._connections[user_id].remove(websocket)
            if not self._connections[user_id]:
                del self._connections[user_id]

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for connection in self._connections.get(user_id, set()):
            try:
                await connection.send_json(payload)
            except Exception:
                dead.append(connection)

        for connection in dead:
            self.disconnect(user_id, connection)


manager = ConnectionManager()


async def emit_user_event(user_id: int, event_type: str, data: dict[str, Any]) -> None:
    await manager.send_to_user(user_id, {"event": event_type, "data": data})
