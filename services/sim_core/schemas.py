from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic import AfterValidator
from typing_extensions import Annotated, Literal

from .version import SCHEMA_VERSION


def _ensure_tz(dt: datetime) -> datetime:
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        raise ValueError("datetime must be timezone-aware")
    return dt


AwareDatetime = Annotated[datetime, AfterValidator(_ensure_tz)]


class StrictBase(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)


class SignalType(str, Enum):
    WEATHER = "WEATHER"
    TRAFFIC = "TRAFFIC"
    GRID = "GRID"
    HOSPITAL = "HOSPITAL"
    VULNERABILITY = "VULNERABILITY"
    OTHER = "OTHER"


class DecisionType(str, Enum):
    OPEN_COOLING_CENTER = "OPEN_COOLING_CENTER"
    STAGE_CREWS = "STAGE_CREWS"
    ISSUE_ADVISORY = "ISSUE_ADVISORY"
    CLOSE_ROAD = "CLOSE_ROAD"
    PRIORITIZE_RESTORATION = "PRIORITIZE_RESTORATION"
    OTHER = "OTHER"


class AssetType(str, Enum):
    HELICOPTER = "HELICOPTER"
    AMBULANCE_STAGING = "AMBULANCE_STAGING"
    GENERATOR = "GENERATOR"
    SHELTER = "SHELTER"
    COOLING_CENTER = "COOLING_CENTER"
    ROAD_BARRIER = "ROAD_BARRIER"
    DRONE_RELAY = "DRONE_RELAY"
    OTHER = "OTHER"


class EventType(str, Enum):
    SIGNAL_INGESTED = "SIGNAL_INGESTED"
    DECISION_APPLIED = "DECISION_APPLIED"
    PLACEMENT_ADDED = "PLACEMENT_ADDED"
    TICK = "TICK"
    SNAPSHOT_CREATED = "SNAPSHOT_CREATED"
    NOTE = "NOTE"


class GeoJSONPoint(StrictBase):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., min_length=2, max_length=2)


class LocationRef(StrictBase):
    geojson: Optional[GeoJSONPoint] = None
    h3: Optional[str] = None
    road_edge_id: Optional[str] = None

    @model_validator(mode="after")
    def _exactly_one(self) -> "LocationRef":
        present = [self.geojson is not None, self.h3 is not None, self.road_edge_id is not None]
        if sum(present) != 1:
            raise ValueError("LocationRef must include exactly one of geojson, h3, road_edge_id")
        return self


class Quality(StrictBase):
    latency_ms: int
    is_stale: bool
    missing_fields: List[str]
    reliability_score: float = Field(..., ge=0.0, le=1.0)
    quality_flags: List[str]


class Signal(StrictBase):
    signal_id: UUID
    signal_type: SignalType
    observed_at: AwareDatetime
    ingested_at: AwareDatetime
    source: str
    units: str
    location: LocationRef
    payload: Dict[str, Any]
    quality: Quality
    raw_payload_sha256: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class DecisionTarget(StrictBase):
    h3_cells: Optional[List[str]] = None
    facility_ids: Optional[List[str]] = None
    road_segment_ids: Optional[List[str]] = None


class DecisionPrimitive(StrictBase):
    decision_id: UUID
    decision_type: DecisionType
    issued_at: AwareDatetime
    parameters: Dict[str, Any]
    target: Optional[DecisionTarget] = None
    constraints_version: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class OpPlacement(StrictBase):
    placement_id: UUID
    asset_type: AssetType
    placed_at: AwareDatetime
    location: GeoJSONPoint
    start_time: AwareDatetime
    parameters: Dict[str, Any]
    assumption_notes: Optional[str] = None
    schema_version: str = Field(default=SCHEMA_VERSION)


class CityState(StrictBase):
    city_id: str
    timestamp: AwareDatetime
    h3_resolution: int
    layers: Dict[str, Any]
    road_state: Dict[str, Any]
    infra_state: Dict[str, Any]
    facilities_state: Dict[str, Any]
    last_signals_index: Dict[str, str]
    applied_decisions: List[UUID]
    applied_placements: List[UUID]
    causal_notes: List[str]
    uncertainty: Dict[str, Any]
    schema_version: str = Field(default=SCHEMA_VERSION)


class SpatialRefs(StrictBase):
    road_graph_ref: str
    facilities_ref: str
    h3_resolution: int


class RunSnapshot(StrictBase):
    snapshot_id: UUID
    created_at: AwareDatetime
    city_id: str
    seed: int
    base_time: AwareDatetime
    spatial_refs: SpatialRefs
    normalized_inputs_ref: Optional[str] = None
    state_ref: str
    snapshot_sha256: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class BranchNode(StrictBase):
    branch_id: UUID
    parent_branch_id: Optional[UUID]
    base_snapshot_id: UUID
    created_at: AwareDatetime
    label: str
    head_event_id: Optional[UUID]
    schema_version: str = Field(default=SCHEMA_VERSION)


class TickEvent(StrictBase):
    step_minutes: int = Field(default=5, ge=1)
    schema_version: str = Field(default=SCHEMA_VERSION)


class NoteEvent(StrictBase):
    note: str
    schema_version: str = Field(default=SCHEMA_VERSION)


class SnapshotCreatedEvent(StrictBase):
    snapshot_id: UUID
    schema_version: str = Field(default=SCHEMA_VERSION)


class EventRecord(StrictBase):
    event_id: UUID
    run_id: UUID
    branch_id: UUID
    seq_no: int
    event_type: EventType
    occurred_at: AwareDatetime
    actor: str
    provenance: Dict[str, Any]
    payload: Dict[str, Any]
    prev_event_hash: Optional[str] = None
    event_hash: Optional[str] = None
    schema_version: str = Field(default=SCHEMA_VERSION)


EVENT_PAYLOAD_MODELS = {
    EventType.SIGNAL_INGESTED: Signal,
    EventType.DECISION_APPLIED: DecisionPrimitive,
    EventType.PLACEMENT_ADDED: OpPlacement,
    EventType.TICK: TickEvent,
    EventType.SNAPSHOT_CREATED: SnapshotCreatedEvent,
    EventType.NOTE: NoteEvent,
}


def parse_event_payload(event_type: EventType, payload: Dict[str, Any]) -> StrictBase:
    model = EVENT_PAYLOAD_MODELS[event_type]
    return model.model_validate(payload)
