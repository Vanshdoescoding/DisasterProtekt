# Technology Stack (Draft)

## Language
**Primary choice:** Python  
Rationale: strong ecosystem for data ingestion, ML/AI integration, rapid prototyping, and orchestration services.

**Alternatives**
- **TypeScript/Node.js**  
  Pros: excellent async IO and real-time services; mature web tooling.  
  Cons: weaker native scientific computing ecosystem.
- **Go**  
  Pros: high performance, simple concurrency model, easy deployment.  
  Cons: smaller ML/AI library ecosystem; slower iteration for modeling work.

## AI Model
**Primary choice:** Gemini 3 Pro  
Rationale: high-quality reasoning, tool integration, and multi-modal planning for complex, safety-critical tradeoffs.

## Communication Methods
**Primary choice:** SMS + voice alerts + operations dashboards  
Rationale: redundancy and reach across populations with different access constraints.

**Alternatives**
- **Push notifications**  
  Pros: rich UI, interactive guidance.  
  Cons: requires app install; unreliable for vulnerable groups.
- **Broadcast radio / CAP feeds**  
  Pros: wide reach and standards compatibility.  
  Cons: limited personalization and feedback loops.

## Data Ingestion
**Primary choice:** Streaming + batch pipelines (sensor feeds, weather APIs, infrastructure telemetry)  
Rationale: combines real-time monitoring with historical context for risk modeling.

**Alternatives**
- **Event sourcing only**  
  Pros: strong audit trail and replayability.  
  Cons: more complex infrastructure and data retention costs.
- **Batch-only analytics**  
  Pros: simpler operations.  
  Cons: insufficient for fast-moving emergencies.

