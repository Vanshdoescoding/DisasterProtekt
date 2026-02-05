from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.db import DEFAULT_DB_URL, Database
from services.api.deps import get_db
from services.api.models import Branch, Event, Run, Snapshot
from services.api.schemas import (
    BranchCreate,
    BranchRead,
    EventCreate,
    EventRead,
    ReplayRequest,
    ReplayResponse,
    RunCreate,
    RunRead,
    SnapshotCreate,
    SnapshotRead,
)
from services.sim_core.hashing import compute_event_hash, compute_snapshot_hash
from services.sim_core.replay import replay
from services.sim_core.schemas import CityState, EventRecord, EventType, parse_event_payload
from services.sim_core.version import SCHEMA_VERSION


def create_app(database_url: str | None = None) -> FastAPI:
    app = FastAPI(title="DisasterProtekt API", version="0.1.0")
    app.state.db = Database(url=database_url or DEFAULT_DB_URL)

    @app.on_event("startup")
    def _startup() -> None:
        app.state.db.create_all()

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.post("/runs", response_model=RunRead, status_code=status.HTTP_201_CREATED)
    def create_run(payload: RunCreate, db: Session = Depends(get_db)) -> RunRead:
        run = Run(
            run_id=uuid4(),
            city_id=payload.city_id,
            base_time=payload.base_time,
            seed=payload.seed,
            created_at=datetime.now(timezone.utc),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return RunRead(
            run_id=run.run_id,
            city_id=run.city_id,
            base_time=run.base_time,
            seed=run.seed,
            created_at=run.created_at,
        )

    @app.post("/runs/{run_id}/snapshots", response_model=SnapshotRead, status_code=status.HTTP_201_CREATED)
    def create_snapshot(
        run_id: UUID, payload: SnapshotCreate, db: Session = Depends(get_db)
    ) -> SnapshotRead:
        run = db.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        snapshot_id = uuid4()
        created_at = datetime.now(timezone.utc)
        state_ref = f"db://snapshots/{snapshot_id}"

        snapshot_core = {
            "snapshot_id": snapshot_id,
            "created_at": created_at,
            "city_id": run.city_id,
            "seed": run.seed,
            "base_time": run.base_time,
            "spatial_refs": payload.spatial_refs,
            "normalized_inputs_ref": payload.normalized_inputs_ref,
            "state": payload.city_state,
            "schema_version": SCHEMA_VERSION,
        }
        snapshot_sha256 = compute_snapshot_hash(snapshot_core)

        snapshot = Snapshot(
            snapshot_id=snapshot_id,
            run_id=run.run_id,
            created_at=created_at,
            city_id=run.city_id,
            seed=run.seed,
            base_time=run.base_time,
            spatial_refs=payload.spatial_refs.model_dump(mode="json"),
            normalized_inputs_ref=payload.normalized_inputs_ref,
            state_json=payload.city_state.model_dump(mode="json"),
            state_ref=state_ref,
            snapshot_sha256=snapshot_sha256,
            schema_version=SCHEMA_VERSION,
        )
        db.add(snapshot)
        db.commit()

        return SnapshotRead(
            snapshot_id=snapshot.snapshot_id,
            run_id=snapshot.run_id,
            created_at=snapshot.created_at,
            city_id=snapshot.city_id,
            seed=snapshot.seed,
            base_time=snapshot.base_time,
            spatial_refs=payload.spatial_refs,
            normalized_inputs_ref=snapshot.normalized_inputs_ref,
            state_ref=snapshot.state_ref,
            snapshot_sha256=snapshot.snapshot_sha256,
            schema_version=snapshot.schema_version,
        )

    @app.post("/runs/{run_id}/branches", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
    def create_branch(
        run_id: UUID, payload: BranchCreate, db: Session = Depends(get_db)
    ) -> BranchRead:
        run = db.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        snapshot = db.get(Snapshot, payload.base_snapshot_id)
        if not snapshot or snapshot.run_id != run_id:
            raise HTTPException(status_code=404, detail="Base snapshot not found for run")

        branch = Branch(
            branch_id=uuid4(),
            run_id=run_id,
            parent_branch_id=payload.parent_branch_id,
            base_snapshot_id=payload.base_snapshot_id,
            created_at=datetime.now(timezone.utc),
            label=payload.label,
            head_event_id=None,
            schema_version=SCHEMA_VERSION,
        )
        db.add(branch)
        db.commit()
        db.refresh(branch)
        return BranchRead(
            branch_id=branch.branch_id,
            run_id=branch.run_id,
            parent_branch_id=branch.parent_branch_id,
            base_snapshot_id=branch.base_snapshot_id,
            created_at=branch.created_at,
            label=branch.label,
            head_event_id=branch.head_event_id,
            schema_version=branch.schema_version,
        )

    @app.post(
        "/runs/{run_id}/branches/{branch_id}/events",
        response_model=EventRead,
        status_code=status.HTTP_201_CREATED,
    )
    def append_event(
        run_id: UUID, branch_id: UUID, payload: EventCreate, db: Session = Depends(get_db)
    ) -> EventRead:
        run = db.get(Run, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        branch = db.get(Branch, branch_id)
        if not branch or branch.run_id != run_id:
            raise HTTPException(status_code=404, detail="Branch not found")

        if "schema_version" not in payload.payload:
            raise HTTPException(status_code=400, detail="Missing payload schema_version")

        try:
            validated_payload = parse_event_payload(payload.event_type, payload.payload)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        if getattr(validated_payload, "schema_version", None) != SCHEMA_VERSION:
            raise HTTPException(status_code=400, detail="Invalid payload schema_version")

        last_event = db.execute(
            select(Event).where(Event.branch_id == branch_id).order_by(Event.seq_no.desc()).limit(1)
        ).scalar_one_or_none()
        next_seq_no = 1 if not last_event else int(last_event.seq_no) + 1
        prev_event_hash = last_event.event_hash if last_event else None

        event_id = uuid4()
        event_core = {
            "event_id": event_id,
            "run_id": run_id,
            "branch_id": branch_id,
            "seq_no": next_seq_no,
            "event_type": payload.event_type.value,
            "occurred_at": payload.occurred_at,
            "actor": payload.actor,
            "provenance": payload.provenance.model_dump(mode="json"),
            "payload": validated_payload.model_dump(mode="json"),
            "schema_version": SCHEMA_VERSION,
        }
        event_hash = compute_event_hash(event_core, prev_event_hash)

        record = Event(
            event_id=event_id,
            run_id=run_id,
            branch_id=branch_id,
            seq_no=next_seq_no,
            event_type=payload.event_type.value,
            occurred_at=payload.occurred_at,
            actor=payload.actor,
            provenance=payload.provenance.model_dump(mode="json"),
            payload=validated_payload.model_dump(mode="json"),
            prev_event_hash=prev_event_hash,
            event_hash=event_hash,
            schema_version=SCHEMA_VERSION,
        )
        db.add(record)
        branch.head_event_id = event_id
        db.commit()

        return EventRead(
            event_id=record.event_id,
            run_id=record.run_id,
            branch_id=record.branch_id,
            seq_no=record.seq_no,
            event_type=EventType(record.event_type),
            occurred_at=record.occurred_at,
            actor=record.actor,
            provenance=record.provenance,
            payload=record.payload,
            prev_event_hash=record.prev_event_hash,
            event_hash=record.event_hash,
            schema_version=record.schema_version,
        )

    @app.get("/runs/{run_id}/branches/{branch_id}/events", response_model=list[EventRead])
    def list_events(run_id: UUID, branch_id: UUID, db: Session = Depends(get_db)) -> list[EventRead]:
        branch = db.get(Branch, branch_id)
        if not branch or branch.run_id != run_id:
            raise HTTPException(status_code=404, detail="Branch not found")

        records = db.execute(select(Event).where(Event.branch_id == branch_id).order_by(Event.seq_no)).scalars()
        return [
            EventRead(
                event_id=row.event_id,
                run_id=row.run_id,
                branch_id=row.branch_id,
                seq_no=row.seq_no,
                event_type=EventType(row.event_type),
                occurred_at=row.occurred_at,
                actor=row.actor,
                provenance=row.provenance,
                payload=row.payload,
                prev_event_hash=row.prev_event_hash,
                event_hash=row.event_hash,
                schema_version=row.schema_version,
            )
            for row in records
        ]

    @app.post("/runs/{run_id}/branches/{branch_id}/replay", response_model=ReplayResponse)
    def replay_branch(
        run_id: UUID, branch_id: UUID, payload: ReplayRequest, db: Session = Depends(get_db)
    ) -> ReplayResponse:
        branch = db.get(Branch, branch_id)
        if not branch or branch.run_id != run_id:
            raise HTTPException(status_code=404, detail="Branch not found")

        snapshot = db.get(Snapshot, branch.base_snapshot_id)
        if not snapshot:
            raise HTTPException(status_code=404, detail="Snapshot not found")

        state = CityState.model_validate(snapshot.state_json)

        events = db.execute(select(Event).where(Event.branch_id == branch_id).order_by(Event.seq_no)).scalars()
        event_records = [
            EventRecord(
                event_id=row.event_id,
                run_id=row.run_id,
                branch_id=row.branch_id,
                seq_no=row.seq_no,
                event_type=EventType(row.event_type),
                occurred_at=row.occurred_at,
                actor=row.actor,
                provenance=row.provenance,
                payload=row.payload,
                prev_event_hash=row.prev_event_hash,
                event_hash=row.event_hash,
                schema_version=row.schema_version,
            )
            for row in events
        ]

        final_state, output_hash = replay(
            snapshot_state=state,
            snapshot_sha256=snapshot.snapshot_sha256,
            events=event_records,
            seed=snapshot.seed,
            until_time=payload.until_time,
            max_events=payload.max_events,
        )
        return ReplayResponse(city_state=final_state, output_hash=output_hash)

    return app


app = create_app()
