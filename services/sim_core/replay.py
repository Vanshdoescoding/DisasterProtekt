from __future__ import annotations

from copy import deepcopy
from datetime import timedelta
from datetime import datetime
from typing import Iterable, Optional, Tuple

from .hashing import compute_output_hash
from .schemas import CityState, EventRecord, EventType, parse_event_payload


def _deterministic_note(seed: int, seq_no: int) -> str:
    token = f"{seed}:{seq_no}"
    return f"tick::{token}"


def _apply_event(state: CityState, event: EventRecord, seed: int) -> None:
    payload_model = parse_event_payload(event.event_type, event.payload)

    if event.event_type == EventType.SIGNAL_INGESTED:
        signal_type = payload_model.signal_type.value
        state.last_signals_index[signal_type] = str(payload_model.signal_id)
    elif event.event_type == EventType.DECISION_APPLIED:
        state.applied_decisions.append(payload_model.decision_id)
        flags = state.infra_state.setdefault("decision_flags", {})
        flags[payload_model.decision_type.value] = str(payload_model.decision_id)
    elif event.event_type == EventType.PLACEMENT_ADDED:
        state.applied_placements.append(payload_model.placement_id)
        placements = state.facilities_state.setdefault("placements", [])
        placements.append(
            {"placement_id": str(payload_model.placement_id), "asset_type": payload_model.asset_type.value}
        )
    elif event.event_type == EventType.TICK:
        state.timestamp = state.timestamp + timedelta(minutes=payload_model.step_minutes)
        state.causal_notes.append(_deterministic_note(seed, event.seq_no))
    elif event.event_type == EventType.NOTE:
        state.causal_notes.append(payload_model.note)
    elif event.event_type == EventType.SNAPSHOT_CREATED:
        state.causal_notes.append(f"snapshot::{payload_model.snapshot_id}")


def replay(
    snapshot_state: CityState,
    snapshot_sha256: str,
    events: Iterable[EventRecord],
    seed: int,
    until_time: Optional[datetime] = None,
    max_events: Optional[int] = None,
) -> Tuple[CityState, str]:
    state = deepcopy(snapshot_state)
    ordered_events = sorted(events, key=lambda e: e.seq_no)

    last_event_hash = None
    applied = 0
    for event in ordered_events:
        if until_time and event.occurred_at > until_time:
            break
        _apply_event(state, event, seed)
        last_event_hash = event.event_hash or last_event_hash
        applied += 1
        if max_events is not None and applied >= max_events:
            break

    output_hash = compute_output_hash(state, last_event_hash, snapshot_sha256)
    return state, output_hash
