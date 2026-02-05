import { DecisionPrimitive, OpPlacement, EventType } from '@dp/domain';
import { ulidId } from '@dp/utils';
import { ConstraintEngine, ResourceInventory } from './constraints';

export interface CompiledEvent {
  type: EventType;
  payload: Record<string, unknown>;
  uniqueKey: string;
}

export class DecisionCompiler {
  private constraints: ConstraintEngine;

  constructor(inventory: ResourceInventory) {
    this.constraints = new ConstraintEngine(inventory);
  }

  compileDecision(decision: DecisionPrimitive): { events: CompiledEvent[]; report: ReturnType<ConstraintEngine['evaluateDecision']> } {
    const report = this.constraints.evaluateDecision(decision);
    if (!report.ok) {
      return { events: [], report };
    }
    const uniqueKey = `decision:${decision.id}`;
    switch (decision.type) {
      case 'CLOSE_ROAD':
        return {
          report,
          events: [
            {
              type: 'ROAD_CLOSURE_SET',
              payload: { decisionId: decision.id, parameters: decision.parameters },
              uniqueKey,
            },
          ],
        };
      case 'OPEN_COOLING_CENTER':
        return {
          report,
          events: [
            {
              type: 'SHELTER_OPEN',
              payload: { decisionId: decision.id, parameters: decision.parameters },
              uniqueKey,
            },
          ],
        };
      case 'PRIORITIZE_RESTORATION':
        return {
          report,
          events: [
            {
              type: 'GENERATOR_PREPOSITION',
              payload: { decisionId: decision.id, parameters: decision.parameters },
              uniqueKey,
            },
          ],
        };
      default:
        return {
          report,
          events: [
            {
              type: 'NOTE',
              payload: { decisionId: decision.id, note: 'Decision recorded' },
              uniqueKey,
            },
          ],
        };
    }
  }

  compilePlacement(placement: OpPlacement): { events: CompiledEvent[]; report: ReturnType<ConstraintEngine['evaluatePlacement']> } {
    const report = this.constraints.evaluatePlacement(placement);
    if (!report.ok) {
      return { events: [], report };
    }
    const uniqueKey = `placement:${placement.id}`;
    return {
      report,
      events: [
        {
          type: 'RESOURCE_PLACEMENT_UPDATE',
          payload: {
            placementId: placement.id,
            assetType: placement.assetType,
            location: placement.location,
            parameters: placement.parameters,
          },
          uniqueKey,
        },
      ],
    };
  }
}
