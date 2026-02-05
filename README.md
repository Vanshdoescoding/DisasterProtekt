# DisasterProtekt — Iteration 0

## Mission
Deliver a real-time, interactive consequence simulator for climate and infrastructure emergencies. Decision-makers can test actions before the event: click a map location, apply a policy choice, and see minute-by-minute outcomes—visual, quantitative, and explainable.

## Iteration 0 Scope (Backend Only)
This iteration builds the deterministic simulation core (“truth contracts”) and an API for runs, branches, events, and replay. No front-end components are included.

## Core Guarantees
- **Event-sourced state:** every change is an append-only event with provenance metadata.
- **Deterministic replay:** same snapshot + ordered events → identical output hash.
- **Branchable timelines:** branch, rewind, and replay counterfactuals (DAG structure).
- **Auditability:** event hash chain plus snapshot hash for evidence trails.

## Repository Structure
- `services/api` — FastAPI service (runs, snapshots, branches, events, replay)
- `services/sim_core` — core schemas, hashing, replay engine, spatial utilities
- `data/sample` — offline sample graph + facility data
- `scripts` — demo and ingestion utilities
- `tests` — determinism, hash stability, validation, spatial load tests

## Quickstart
1) Start Postgres:
```bash
docker-compose up -d
```

2) Install Python dependencies (Iteration 0 API):
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

3) Run the API:
```bash
uvicorn services.api.main:app --reload
```

By default the API connects to Postgres at `postgresql+psycopg://disaster:disaster@localhost:5432/disasterprotek`.
For local tests without Postgres, set:
```bash
export DATABASE_URL=sqlite+pysqlite:///./local.db
```

4) Run the deterministic demo:
```bash
bash scripts/demo_iteration0.sh
```

## Key API Endpoints
- `POST /runs` — create a run (city_id, base_time, seed)
- `POST /runs/{run_id}/snapshots` — create snapshot from CityState
- `POST /runs/{run_id}/branches` — create branch node
- `POST /runs/{run_id}/branches/{branch_id}/events` — append event (validated + hashed)
- `GET  /runs/{run_id}/branches/{branch_id}/events` — list events
- `POST /runs/{run_id}/branches/{branch_id}/replay` — replay and return CityState + output_hash
- `GET  /health`

## Determinism Proof
Replay uses the snapshot seed, event order, and event hash chain to guarantee identical output hashes. Run:
```bash
bash scripts/demo_iteration0.sh
```
It replays twice and confirms matching output hashes.

---

## Iteration 1–3 (TypeScript Monorepo)
Iteration 1 builds deterministic signal ingestion + snapshotting. Iteration 2 adds the append-only event ledger, branching DAG, and decision compiler. Iteration 3 introduces a deterministic simulation runner, uncertainty bands, and trace storage.

### Setup
```bash
pnpm install
```

Start Postgres (or use SQLite for tests):
```bash
cd ops && docker-compose up -d
```

### Signal Ingestion (Simulated Providers)
```bash
pnpm cli:ingest -- --city=mv --asOf=2024-02-01T00:00:00Z
```

### Build Snapshot (Deterministic)
```bash
pnpm cli:snapshot -- build --city=mv --asOf=2024-02-01T00:00:00Z
```

Verify snapshot hash:
```bash
pnpm cli:snapshot -- verify --snapshotId=<snapshotId>
```

### Run + Branching
Create a run from a snapshot and baseline branch:
```bash
pnpm cli:ops -- run:init --snapshotId=<snapshotId>
```

Fork a branch at a specific event sequence:
```bash
pnpm cli:ops -- branch:fork --branchId=<branchId> --atSeq=1
```

Apply a decision (JSON file):
```bash
pnpm cli:ops -- decision:apply --branchId=<branchId> --decisionJson=decision.json
```

Verify ledger integrity:
```bash
pnpm cli:ops -- event:verify-ledger --runId=<runId>
```

### Simulation Trace (Iteration 3)
Run a trace for a branch and compare outputs:
```bash
pnpm cli:ops -- trace:run --snapshotId=<snapshotId> --branchId=<branchId> --ticks=12 --timestepMinutes=5
pnpm cli:ops -- trace:compare --baselineTrace=<traceA> --branchTrace=<traceB>
```

### Determinism Guarantees
- Signal ingestion uses deterministic IDs and raw object keys derived from `(city, asOf, type)`.
- Snapshot hash is computed from canonicalized signal refs, derived refs, and spatial assets.
- Event ledger is hash-chained; any mutation breaks verification.
- Simulation outputs are hashed and reproducible given the same snapshot, branch, and seed.

### Adding a New Signal Provider
1) Implement `SignalProvider` in `packages/signals/src/providers`.
2) Use deterministic raw payload + normalization.
3) Register the provider in `apps/ingestion-cli/src/index.ts`.
4) Add tests under `packages/signals/tests`.

## Module Checklist
- [x] Domain schemas (Signal, Decision, OpPlacement, CityState, RunSnapshot, BranchNode)
- [x] Event hash chain and canonical serialization
- [x] Deterministic replay harness
- [x] Branch DAG data model (v0)
- [x] H3 utilities + offline road graph loader
- [x] Sample facilities registry loader
- [x] API endpoints for runs/events/replay
- [x] Determinism + validation tests
