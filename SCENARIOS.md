# Scenario Library (Draft)

This document provides example use cases and branching decision inputs. Each scenario is designed to test “act now vs wait” tradeoffs with clear, comparable outcomes.

---

## Scenario A: Heatwave + Delayed Cooling Centers
**Location:** Dense urban district with high elderly population  
**Baseline:** 4-day heatwave, grid near capacity, hospital ER load rising

**Decision Inputs**
- **Branch 1 (Act Now):** Open cooling centers in 30 minutes; extend transit hours.
- **Branch 2 (Delay):** Open cooling centers in 4 hours; no transit changes.

**Impact Timeline (Example)**
- **+1h:** Branch 1 reduces heat exposure peaks; Branch 2 shows rising EMS calls.
- **+4h:** Branch 1 stabilizes ER load; Branch 2 triggers ER overflow warnings.
- **+12h:** Branch 1 maintains manageable grid load; Branch 2 risks local brownouts.

---

## Scenario B: Coastal Flood + Evacuation Timing
**Location:** Low-lying coastal neighborhood, tidal surge forecasted  
**Baseline:** 18-hour warning window, schools in session

**Decision Inputs**
- **Branch 1 (Act Now):** Start evacuation within 2 hours; open shelters.
- **Branch 2 (Wait):** Delay evacuation until surge probability exceeds 70%.

**Impact Timeline (Example)**
- **+3h:** Branch 1 clears main arterial routes; Branch 2 sees congestion spikes.
- **+8h:** Branch 1 reduces stranded households; Branch 2 shows route closures.
- **+16h:** Branch 1 limits property loss; Branch 2 increases rescue demand.

---

## Scenario C: Heat + Grid + Traffic Cascade
**Location:** Metro region with aging grid and commuter reliance  
**Baseline:** Extreme heat, afternoon peak load, highway construction

**Decision Inputs**
- **Branch 1 (Act Now):** Staggered business closures; deploy mobile cooling units.
- **Branch 2 (Wait):** Maintain normal operations; monitor only.

**Impact Timeline (Example)**
- **+2h:** Branch 1 dampens peak load; Branch 2 stresses transformers.
- **+6h:** Branch 1 reduces traffic bottlenecks; Branch 2 worsens EMS response times.
- **+10h:** Branch 1 limits outages; Branch 2 triggers cascading failures.

---

## Scenario D: Wildfire Smoke + Hospital Surge
**Location:** Inland city with limited ICU capacity  
**Baseline:** Smoke plume expected, schools open

**Decision Inputs**
- **Branch 1 (Act Now):** Issue air-quality alerts; pre-stage oxygen supplies.
- **Branch 2 (Delay):** Wait for AQI to exceed emergency threshold.

**Impact Timeline (Example)**
- **+4h:** Branch 1 reduces school exposure; Branch 2 sees pediatric spikes.
- **+12h:** Branch 1 stabilizes ICU demand; Branch 2 reaches capacity.

