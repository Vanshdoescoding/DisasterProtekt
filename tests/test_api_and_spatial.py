from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from services.api.main import create_app
from services.sim_core.spatial import RoadGraphLoader, latlon_to_h3


def _client(tmp_path: Path) -> TestClient:
    db_path = tmp_path / "test.db"
    app = create_app(f"sqlite+pysqlite:///{db_path}")
    return TestClient(app)


def test_schema_validation_rejects_invalid_payloads(tmp_path: Path):
    base_time = datetime.now(timezone.utc).isoformat()
    client = _client(tmp_path)
    with client:
        run = client.post(
            "/runs",
            json={"city_id": "phoenix", "base_time": base_time, "seed": 7},
        ).json()

        snapshot = client.post(
            f"/runs/{run['run_id']}/snapshots",
            json={
                "city_state": {
                    "city_id": "phoenix",
                    "timestamp": base_time,
                    "h3_resolution": 8,
                    "layers": {},
                    "road_state": {},
                    "infra_state": {},
                    "facilities_state": {},
                    "last_signals_index": {},
                    "applied_decisions": [],
                    "applied_placements": [],
                    "causal_notes": [],
                    "uncertainty": {},
                    "schema_version": "0.1.0",
                },
                "spatial_refs": {
                    "road_graph_ref": "data/sample/roads.json",
                    "facilities_ref": "data/sample/facilities.geojson",
                    "h3_resolution": 8,
                },
            },
        ).json()

        branch = client.post(
            f"/runs/{run['run_id']}/branches",
            json={"base_snapshot_id": snapshot["snapshot_id"], "label": "test"},
        ).json()

        invalid_signal = client.post(
            f"/runs/{run['run_id']}/branches/{branch['branch_id']}/events",
            json={
                "event_type": "SIGNAL_INGESTED",
                "occurred_at": base_time,
                "actor": "test",
                "provenance": {"source": "unit-test"},
                "payload": {
                    "signal_id": str(uuid4()),
                    "signal_type": "WEATHER",
                    "ingested_at": base_time,
                    "source": "unit",
                    "units": "celsius",
                    "location": {"h3": "8928308280fffff"},
                    "payload": {"temp": 40},
                    "quality": {
                        "latency_ms": 10,
                        "is_stale": False,
                        "missing_fields": [],
                        "reliability_score": 0.8,
                        "quality_flags": [],
                    },
                    "raw_payload_sha256": "demo",
                    "schema_version": "0.1.0",
                },
            },
        )
        assert invalid_signal.status_code == 422

        invalid_decision = client.post(
            f"/runs/{run['run_id']}/branches/{branch['branch_id']}/events",
            json={
                "event_type": "DECISION_APPLIED",
                "occurred_at": base_time,
                "actor": "test",
                "provenance": {"source": "unit-test"},
                "payload": {
                    "decision_id": str(uuid4()),
                    "issued_at": base_time,
                    "parameters": {"within_minutes": 30},
                    "constraints_version": "0.1",
                    "schema_version": "0.1.0",
                },
            },
        )
        assert invalid_decision.status_code == 422


def test_spatial_backbone_loads_offline_files():
    root = Path(__file__).resolve().parents[1]
    graph_path = root / "data" / "sample" / "roads.json"
    graph = RoadGraphLoader.load(graph_path)
    assert graph.number_of_nodes() > 0
    cell = latlon_to_h3(33.4484, -112.0740, resolution=8)
    assert isinstance(cell, str)
