from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from services.sim_core.hashing import compute_event_hash, compute_snapshot_hash
from services.sim_core.replay import replay
from services.sim_core.schemas import (
    CityState,
    DecisionPrimitive,
    DecisionType,
    EventRecord,
    EventType,
    GeoJSONPoint,
    LocationRef,
    OpPlacement,
    Signal,
    SignalType,
    TickEvent,
)


def _base_state(base_time: datetime) -> CityState:
    return CityState(
        city_id="phoenix",
        timestamp=base_time,
        h3_resolution=8,
        layers={},
        road_state={},
        infra_state={},
        facilities_state={},
        last_signals_index={},
        applied_decisions=[],
        applied_placements=[],
        causal_notes=[],
        uncertainty={},
        schema_version="0.1.0",
    )


def _event_record(
    run_id,
    branch_id,
    seq_no,
    event_type,
    payload_model,
    occurred_at,
    prev_event_hash,
):
    event_id = uuid4()
    event_core = {
        "event_id": event_id,
        "run_id": run_id,
        "branch_id": branch_id,
        "seq_no": seq_no,
        "event_type": event_type.value,
        "occurred_at": occurred_at,
        "actor": "test",
        "provenance": {"source": "unit-test"},
        "payload": payload_model.model_dump(mode="json"),
        "schema_version": "0.1.0",
    }
    event_hash = compute_event_hash(event_core, prev_event_hash)
    return EventRecord(
        event_id=event_id,
        run_id=run_id,
        branch_id=branch_id,
        seq_no=seq_no,
        event_type=event_type,
        occurred_at=occurred_at,
        actor="test",
        provenance={"source": "unit-test"},
        payload=payload_model.model_dump(mode="json"),
        prev_event_hash=prev_event_hash,
        event_hash=event_hash,
        schema_version="0.1.0",
    )


def test_deterministic_replay():
    base_time = datetime.now(timezone.utc)
    run_id = uuid4()
    branch_id = uuid4()

    state = _base_state(base_time)
    snapshot_core = {
        "snapshot_id": uuid4(),
        "created_at": base_time,
        "city_id": "phoenix",
        "seed": 42,
        "base_time": base_time,
        "spatial_refs": {
            "road_graph_ref": "data/sample/roads.json",
            "facilities_ref": "data/sample/facilities.geojson",
            "h3_resolution": 8,
        },
        "normalized_inputs_ref": None,
        "state": state,
        "schema_version": "0.1.0",
    }
    snapshot_sha256 = compute_snapshot_hash(snapshot_core)

    signal = Signal(
        signal_id=uuid4(),
        signal_type=SignalType.WEATHER,
        observed_at=base_time,
        ingested_at=base_time,
        source="unit",
        units="celsius",
        location=LocationRef(h3="8928308280fffff"),
        payload={"temp": 42},
        quality={
            "latency_ms": 100,
            "is_stale": False,
            "missing_fields": [],
            "reliability_score": 0.9,
            "quality_flags": [],
        },
        raw_payload_sha256="demo",
        schema_version="0.1.0",
    )
    decision = DecisionPrimitive(
        decision_id=uuid4(),
        decision_type=DecisionType.OPEN_COOLING_CENTER,
        issued_at=base_time,
        parameters={"within_minutes": 30},
        target=None,
        constraints_version="0.1",
        schema_version="0.1.0",
    )
    placement = OpPlacement(
        placement_id=uuid4(),
        asset_type="COOLING_CENTER",
        placed_at=base_time,
        location=GeoJSONPoint(type="Point", coordinates=[-112.0740, 33.4484]),
        start_time=base_time,
        parameters={"capacity": 120},
        assumption_notes=None,
        schema_version="0.1.0",
    )

    events = []
    prev_hash = None
    events.append(
        _event_record(run_id, branch_id, 1, EventType.SIGNAL_INGESTED, signal, base_time, prev_hash)
    )
    prev_hash = events[-1].event_hash
    events.append(
        _event_record(run_id, branch_id, 2, EventType.DECISION_APPLIED, decision, base_time, prev_hash)
    )
    prev_hash = events[-1].event_hash
    events.append(
        _event_record(run_id, branch_id, 3, EventType.PLACEMENT_ADDED, placement, base_time, prev_hash)
    )
    prev_hash = events[-1].event_hash
    tick_payload = TickEvent(step_minutes=5, schema_version="0.1.0")
    events.append(_event_record(run_id, branch_id, 4, EventType.TICK, tick_payload, base_time, prev_hash))

    state_a, hash_a = replay(state, snapshot_sha256, events, seed=42)
    state_b, hash_b = replay(state, snapshot_sha256, events, seed=42)

    assert hash_a == hash_b
    assert state_a.model_dump(mode="json") == state_b.model_dump(mode="json")


def test_hash_chain_stability():
    base_time = datetime.now(timezone.utc)
    event_core = {
        "event_id": uuid4(),
        "run_id": uuid4(),
        "branch_id": uuid4(),
        "seq_no": 1,
        "event_type": "NOTE",
        "occurred_at": base_time,
        "actor": "unit",
        "provenance": {"source": "unit-test"},
        "payload": {"note": "stable", "schema_version": "0.1.0"},
        "schema_version": "0.1.0",
    }
    hash_a = compute_event_hash(event_core, None)
    hash_b = compute_event_hash(event_core, None)
    assert hash_a == hash_b

    event_core_next = dict(event_core)
    event_core_next["seq_no"] = 2
    hash_c = compute_event_hash(event_core_next, hash_a)
    assert hash_c != hash_a
