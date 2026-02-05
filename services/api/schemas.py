from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from services.sim_core.schemas import (
    CityState,
    EventType,
    SpatialRefs,
)
from services.sim_core.version import SCHEMA_VERSION


class StrictBase(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)


class RunCreate(StrictBase):
    city_id: str
    base_time: datetime
    seed: int


class RunRead(StrictBase):
    run_id: UUID
    city_id: str
    base_time: datetime
    seed: int
    created_at: datetime


class SnapshotCreate(StrictBase):
    city_state: CityState
    spatial_refs: SpatialRefs
    normalized_inputs_ref: Optional[str] = None


class SnapshotRead(StrictBase):
    snapshot_id: UUID
    run_id: UUID
    created_at: datetime
    city_id: str
    seed: int
    base_time: datetime
    spatial_refs: SpatialRefs
    normalized_inputs_ref: Optional[str]
    state_ref: str
    snapshot_sha256: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class BranchCreate(StrictBase):
    base_snapshot_id: UUID
    parent_branch_id: Optional[UUID] = None
    label: str


class BranchRead(StrictBase):
    branch_id: UUID
    run_id: UUID
    parent_branch_id: Optional[UUID]
    base_snapshot_id: UUID
    created_at: datetime
    label: str
    head_event_id: Optional[UUID]
    schema_version: str = Field(default=SCHEMA_VERSION)


class Provenance(StrictBase):
    source: str
    observed_at: Optional[datetime] = None
    ingested_at: Optional[datetime] = None
    tool_version: Optional[str] = None
    notes: Optional[str] = None


class EventCreate(StrictBase):
    event_type: EventType
    occurred_at: datetime
    actor: str
    provenance: Provenance
    payload: Dict[str, Any]


class EventRead(StrictBase):
    event_id: UUID
    run_id: UUID
    branch_id: UUID
    seq_no: int
    event_type: EventType
    occurred_at: datetime
    actor: str
    provenance: Dict[str, Any]
    payload: Dict[str, Any]
    prev_event_hash: Optional[str]
    event_hash: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class ReplayRequest(StrictBase):
    until_time: Optional[datetime] = None
    max_events: Optional[int] = None


class ReplayResponse(StrictBase):
    city_state: CityState
    output_hash: str
