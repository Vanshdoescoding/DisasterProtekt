import { EventRecord, EventType } from '@dp/domain';

export type Subsystem = 'heat' | 'grid' | 'traffic' | 'ems' | 'impact' | 'exposure';

const DEP_MAP: Record<EventType, Subsystem[]> = {
  SIGNAL_INGESTED: ['heat', 'grid', 'traffic', 'ems', 'impact'],
  DECISION_APPLIED: ['impact'],
  PLACEMENT_ADDED: ['ems', 'traffic'],
  ROAD_CLOSURE_SET: ['traffic'],
  SHELTER_OPEN: ['ems', 'impact'],
  GENERATOR_PREPOSITION: ['grid', 'impact'],
  HELICOPTER_STAGE: ['ems'],
  RESOURCE_PLACEMENT_UPDATE: ['traffic', 'ems'],
  TICK: ['heat', 'grid', 'traffic', 'ems', 'impact'],
  SNAPSHOT_CREATED: [],
  NOTE: [],
};

export function computeAffectedSubsystems(events: EventRecord[]): Set<Subsystem> {
  const affected = new Set<Subsystem>();
  for (const event of events) {
    for (const subsystem of DEP_MAP[event.type] ?? []) {
      affected.add(subsystem);
    }
  }
  return affected;
}
