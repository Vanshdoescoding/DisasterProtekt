from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from pydantic import BaseModel


def _normalize(obj: Any) -> Any:
    if isinstance(obj, BaseModel):
        return _normalize(obj.model_dump(mode="json"))
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {str(k): _normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_normalize(v) for v in obj]
    return obj


def canonical_json(data: Any) -> str:
    normalized = _normalize(data)
    return json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_event_hash(event_core: Dict[str, Any], prev_event_hash: str | None) -> str:
    payload = dict(event_core)
    payload["prev_event_hash"] = prev_event_hash
    return sha256_hex(canonical_json(payload))


def compute_snapshot_hash(snapshot_core: Dict[str, Any]) -> str:
    return sha256_hex(canonical_json(snapshot_core))


def compute_output_hash(state: Any, last_event_hash: str | None, snapshot_sha256: str) -> str:
    payload = {
        "state": state,
        "last_event_hash": last_event_hash,
        "snapshot_sha256": snapshot_sha256,
    }
    return sha256_hex(canonical_json(payload))
