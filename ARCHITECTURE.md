# Architecture Overview

## System Modules

### 1) Map Layer & Asset Catalog
- **Role:** Render geospatial context and critical infrastructure layers.
- **Inputs:** Base maps, parcels, flood zones, roads, grid assets, hospitals.
- **Outputs:** Interactive map tiles, selectable locations, asset metadata.

### 2) Data Ingestion & Normalization
- **Role:** Stream and reconcile sensor, weather, and infrastructure feeds.
- **Inputs:** IoT telemetry, forecasts, grid load, traffic, hospital capacity.
- **Outputs:** Time-aligned state snapshots and event streams.

### 3) Impact & Compound Hazard Engine
- **Role:** Translate signals into risk, exposure, and cascade models.
- **Inputs:** Normalized data, vulnerability layers, historical baselines.
- **Outputs:** Hazard scores, impact estimates, uncertainty bounds.

### 4) Gemini 3 Pro Reasoning Core
- **Role:** Generate narratives and decision implications from model outputs.
- **Inputs:** Hazard/impact outputs, policy constraints, resource limits.
- **Outputs:** Minute-by-minute consequence narration and rationale.

### 5) Scenario Graph & Branching Engine
- **Role:** Manage timelines, branches, rewinds, and replay comparisons.
- **Inputs:** Decision inputs, baseline scenario states, change deltas.
- **Outputs:** Scenario tree, diff summaries, replayable timelines.

### 6) Video Synthesis & Multimodal Renderer
- **Role:** Produce AI-generated visual simulations aligned to the map.
- **Inputs:** Scenario states, hazard dynamics, camera paths, overlays.
- **Outputs:** Video-style sequences, annotated frames, preview clips.

### 7) Decision Input & Policy Interface
- **Role:** Capture actions and constraints from decision-makers.
- **Inputs:** User policies, timing choices, operational constraints.
- **Outputs:** Action directives applied to scenarios.

### 8) Outcomes, Metrics & Audit
- **Role:** Quantify impacts and preserve decision provenance.
- **Inputs:** Scenario results, model assumptions, user actions.
- **Outputs:** KPIs, consequence tables, audit logs.

## Data + Control Flow (Draft)
1. Users select a location on the map; the asset catalog resolves context.  
2. Ingestion services hydrate a state snapshot for that location and time.  
3. The impact engine computes hazard and cascade dynamics.  
4. Users apply a policy decision with timing constraints.  
5. The scenario engine branches from the baseline and simulates outcomes.  
6. Gemini 3 Pro generates minute-by-minute narration and rationale.  
7. The video synthesis engine renders visual simulations.  
8. Metrics are computed and displayed for side-by-side comparison.  
9. The system records provenance and decision audit trails.

