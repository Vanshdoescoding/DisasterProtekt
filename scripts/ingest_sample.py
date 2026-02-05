from __future__ import annotations

import os
from pathlib import Path

from services.api.db import Database
from services.api.models import Facility
from services.sim_core.spatial import load_facilities


def main() -> None:
    db_url = os.getenv("DATABASE_URL", Database().url)
    db = Database(url=db_url)
    db.create_all()

    sample_path = Path(__file__).resolve().parents[1] / "data" / "sample" / "facilities.geojson"
    records = load_facilities(sample_path)

    with db.SessionLocal() as session:
        for record in records:
            existing = session.get(Facility, record.facility_id)
            if existing:
                existing.facility_type = record.facility_type
                existing.name = record.name
                existing.location = record.location
                existing.metadata_json = record.metadata
            else:
                session.add(
                    Facility(
                        facility_id=record.facility_id,
                        facility_type=record.facility_type,
                        name=record.name,
                        location=record.location,
                        metadata_json=record.metadata,
                    )
                )
        session.commit()

    print(f"Ingested {len(records)} facilities from {sample_path}")


if __name__ == "__main__":
    main()
