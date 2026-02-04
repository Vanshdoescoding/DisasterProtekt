# Architecture Overview (Draft)

## Modular Flow
**Sensors → Risk Engine → Gemini Planner → Comms**

The system is designed as a series of modular services with clear contracts. Each module can be swapped or upgraded independently without breaking the full pipeline.

## Modules and Responsibilities

### 1) Sensor Ingestion
- **Role:** Collect and normalize data from sensors and external feeds
- **Inputs:** IoT telemetry, weather alerts, infrastructure strain signals, public reports
- **Outputs:** Cleaned, timestamped events and state snapshots

### 2) Risk Engine
- **Role:** Aggregate signals into hazard scores and exposure estimates
- **Inputs:** Normalized sensor events, historical context, vulnerability layers
- **Outputs:** Risk map, confidence scores, recommended thresholds to evaluate

### 3) Gemini Planner
- **Role:** Reason over risk context and propose coordinated actions
- **Inputs:** Risk engine output, policy constraints, available resources
- **Outputs:** Action plan with priorities, rationale, and confidence

### 4) Decision Policy Layer
- **Role:** Apply Bayesian nets / MDPs to validate or adapt actions
- **Inputs:** Planner outputs, probabilistic models, scenario constraints
- **Outputs:** Final decision set and expected outcomes

### 5) Communications & Dispatch
- **Role:** Execute alerts and operational coordination across channels
- **Inputs:** Finalized action set, audience segments, channel constraints
- **Outputs:** SMS alerts, voice calls, dashboard updates, status tracking

## Draft Data + Control Flow 
1. Sensors and external feeds stream events into the ingestion layer.  
2. Events are normalized and stored as time-ordered state snapshots.  
3. The risk engine computes hazard scores and exposure estimates.  
4. Gemini Planner receives risk context and generates action proposals.  
5. Decision policy layer (future) validates actions under uncertainty.  
6. Comms dispatch pushes alerts and updates to chosen channels.  
7. Feedback (delivery status, operator input) loops back to the planner.

