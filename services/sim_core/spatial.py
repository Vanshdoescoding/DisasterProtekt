from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import h3
import networkx as nx


DEFAULT_H3_RESOLUTION = 8


def latlon_to_h3(lat: float, lon: float, resolution: int = DEFAULT_H3_RESOLUTION) -> str:
    return h3.latlng_to_cell(lat, lon, resolution)


def bbox_to_h3_cells(
    min_lat: float, min_lon: float, max_lat: float, max_lon: float, resolution: int = DEFAULT_H3_RESOLUTION
) -> List[str]:
    polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [min_lon, min_lat],
                [min_lon, max_lat],
                [max_lon, max_lat],
                [max_lon, min_lat],
                [min_lon, min_lat],
            ]
        ],
    }
    cells = h3.polygon_to_cells(polygon, resolution)
    return sorted(cells)


class RoadGraphLoader:
    @staticmethod
    def load(path: str | Path) -> nx.Graph:
        path = Path(path)
        if path.suffix.lower() == ".graphml":
            return nx.read_graphml(path)
        if path.suffix.lower() == ".json":
            with path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            return nx.node_link_graph(data)
        raise ValueError(f"Unsupported road graph format: {path.suffix}")


class FacilityRecord:
    def __init__(self, facility_id: str, facility_type: str, name: str, location: Dict[str, Any], metadata: Dict[str, Any]):
        self.facility_id = facility_id
        self.facility_type = facility_type
        self.name = name
        self.location = location
        self.metadata = metadata


def load_facilities(path: str | Path) -> List[FacilityRecord]:
    path = Path(path)
    if path.suffix.lower() == ".geojson" or path.suffix.lower() == ".json":
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        records = []
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            records.append(
                FacilityRecord(
                    facility_id=str(props.get("facility_id")),
                    facility_type=str(props.get("facility_type")),
                    name=str(props.get("name")),
                    location=feature.get("geometry"),
                    metadata=props,
                )
            )
        return records
    if path.suffix.lower() == ".csv":
        import csv

        records = []
        with path.open("r", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                location = {
                    "type": "Point",
                    "coordinates": [float(row["lon"]), float(row["lat"])],
                }
                records.append(
                    FacilityRecord(
                        facility_id=row["facility_id"],
                        facility_type=row.get("facility_type", "unknown"),
                        name=row.get("name", ""),
                        location=location,
                        metadata=row,
                    )
                )
        return records
    raise ValueError(f"Unsupported facility format: {path.suffix}")
