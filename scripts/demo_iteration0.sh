#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"
BASE_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "Creating run..."
RUN_ID=$(curl -s -X POST "$API_URL/runs" \
  -H "Content-Type: application/json" \
  -d "{\"city_id\":\"phoenix\",\"base_time\":\"$BASE_TIME\",\"seed\":42}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['run_id'])")
echo "Run: $RUN_ID"

echo "Creating snapshot..."
SNAPSHOT_ID=$(curl -s -X POST "$API_URL/runs/$RUN_ID/snapshots" \
  -H "Content-Type: application/json" \
  -d "{
    \"city_state\": {
      \"city_id\": \"phoenix\",
      \"timestamp\": \"$BASE_TIME\",
      \"h3_resolution\": 8,
      \"layers\": {},
      \"road_state\": {},
      \"infra_state\": {},
      \"facilities_state\": {},
      \"last_signals_index\": {},
      \"applied_decisions\": [],
      \"applied_placements\": [],
      \"causal_notes\": [],
      \"uncertainty\": {},
      \"schema_version\": \"0.1.0\"
    },
    \"spatial_refs\": {
      \"road_graph_ref\": \"data/sample/roads.json\",
      \"facilities_ref\": \"data/sample/facilities.geojson\",
      \"h3_resolution\": 8
    }
  }" | python -c "import sys, json; print(json.load(sys.stdin)['snapshot_id'])")
echo "Snapshot: $SNAPSHOT_ID"

echo "Creating branch..."
BRANCH_ID=$(curl -s -X POST "$API_URL/runs/$RUN_ID/branches" \
  -H "Content-Type: application/json" \
  -d "{\"base_snapshot_id\":\"$SNAPSHOT_ID\",\"label\":\"baseline\"}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['branch_id'])")
echo "Branch: $BRANCH_ID"

echo "Appending SIGNAL event..."
curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"SIGNAL_INGESTED\",
    \"occurred_at\": \"$BASE_TIME\",
    \"actor\": \"demo\",
    \"provenance\": {\"source\":\"demo-sensor\"},
    \"payload\": {
      \"signal_id\": \"$(python -c 'import uuid; print(uuid.uuid4())')\",
      \"signal_type\": \"WEATHER\",
      \"observed_at\": \"$BASE_TIME\",
      \"ingested_at\": \"$BASE_TIME\",
      \"source\": \"demo-sensor\",
      \"units\": \"celsius\",
      \"location\": {\"h3\": \"8928308280fffff\"},
      \"payload\": {\"temp\": 42},
      \"quality\": {
        \"latency_ms\": 200,
        \"is_stale\": false,
        \"missing_fields\": [],
        \"reliability_score\": 0.9,
        \"quality_flags\": []
      },
      \"raw_payload_sha256\": \"demo\",
      \"schema_version\": \"0.1.0\"
    }
  }" > /dev/null

echo "Appending DECISION event..."
curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"DECISION_APPLIED\",
    \"occurred_at\": \"$BASE_TIME\",
    \"actor\": \"demo\",
    \"provenance\": {\"source\":\"demo\"},
    \"payload\": {
      \"decision_id\": \"$(python -c 'import uuid; print(uuid.uuid4())')\",
      \"decision_type\": \"OPEN_COOLING_CENTER\",
      \"issued_at\": \"$BASE_TIME\",
      \"parameters\": {\"within_minutes\": 30},
      \"constraints_version\": \"0.1\",
      \"schema_version\": \"0.1.0\"
    }
  }" > /dev/null

echo "Appending PLACEMENT event..."
curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"PLACEMENT_ADDED\",
    \"occurred_at\": \"$BASE_TIME\",
    \"actor\": \"demo\",
    \"provenance\": {\"source\":\"demo\"},
    \"payload\": {
      \"placement_id\": \"$(python -c 'import uuid; print(uuid.uuid4())')\",
      \"asset_type\": \"COOLING_CENTER\",
      \"placed_at\": \"$BASE_TIME\",
      \"location\": {\"type\": \"Point\", \"coordinates\": [-112.0740, 33.4484]},
      \"start_time\": \"$BASE_TIME\",
      \"parameters\": {\"capacity\": 120},
      \"schema_version\": \"0.1.0\"
    }
  }" > /dev/null

echo "Appending TICK event..."
curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"TICK\",
    \"occurred_at\": \"$BASE_TIME\",
    \"actor\": \"demo\",
    \"provenance\": {\"source\":\"demo\"},
    \"payload\": {
      \"step_minutes\": 5,
      \"schema_version\": \"0.1.0\"
    }
  }" > /dev/null

echo "Replaying twice to prove determinism..."
HASH1=$(curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/replay" \
  -H "Content-Type: application/json" -d "{}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['output_hash'])")
HASH2=$(curl -s -X POST "$API_URL/runs/$RUN_ID/branches/$BRANCH_ID/replay" \
  -H "Content-Type: application/json" -d "{}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['output_hash'])")

echo "Output hash #1: $HASH1"
echo "Output hash #2: $HASH2"
if [ "$HASH1" = "$HASH2" ]; then
  echo "Deterministic replay confirmed."
else
  echo "Mismatch detected."
  exit 1
fi
