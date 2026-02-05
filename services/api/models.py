from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Run(Base):
    __tablename__ = "runs"

    run_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    city_id = Column(String, nullable=False)
    base_time = Column(DateTime(timezone=True), nullable=False)
    seed = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    snapshots = relationship("Snapshot", back_populates="run")
    branches = relationship("Branch", back_populates="run")


class Snapshot(Base):
    __tablename__ = "snapshots"

    snapshot_id = Column(UUID(as_uuid=True), primary_key=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.run_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    city_id = Column(String, nullable=False)
    seed = Column(BigInteger, nullable=False)
    base_time = Column(DateTime(timezone=True), nullable=False)
    spatial_refs = Column(JSON, nullable=False)
    normalized_inputs_ref = Column(String, nullable=True)
    state_json = Column(JSON, nullable=False)
    state_ref = Column(String, nullable=False)
    snapshot_sha256 = Column(String, nullable=False)
    schema_version = Column(String, nullable=False)

    run = relationship("Run", back_populates="snapshots")


class Branch(Base):
    __tablename__ = "branches"

    branch_id = Column(UUID(as_uuid=True), primary_key=True)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.run_id"), nullable=False)
    parent_branch_id = Column(UUID(as_uuid=True), nullable=True)
    base_snapshot_id = Column(UUID(as_uuid=True), ForeignKey("snapshots.snapshot_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    label = Column(String, nullable=False)
    head_event_id = Column(UUID(as_uuid=True), nullable=True)
    schema_version = Column(String, nullable=False)

    run = relationship("Run", back_populates="branches")
    events = relationship("Event", back_populates="branch")


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (UniqueConstraint("branch_id", "seq_no", name="uq_branch_seq"),)

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.run_id"), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.branch_id"), nullable=False)
    seq_no = Column(BigInteger, nullable=False)
    event_type = Column(String, nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    actor = Column(String, nullable=False)
    provenance = Column(JSON, nullable=False)
    payload = Column(JSON, nullable=False)
    prev_event_hash = Column(String, nullable=True)
    event_hash = Column(String, nullable=False)
    schema_version = Column(String, nullable=False)

    branch = relationship("Branch", back_populates="events")


class Facility(Base):
    __tablename__ = "facilities"

    facility_id = Column(String, primary_key=True)
    facility_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    location = Column(JSON, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=False)
