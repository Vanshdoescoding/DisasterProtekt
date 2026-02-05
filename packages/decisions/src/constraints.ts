import { DecisionPrimitive, OpPlacement, FeasibilityReport } from '@dp/domain';

export interface ResourceInventory {
  generators: number;
  helicopters: number;
  shelters: number;
}

export class ConstraintEngine {
  constructor(private inventory: ResourceInventory) {}

  evaluateDecision(decision: DecisionPrimitive): FeasibilityReport {
    const triggered: string[] = [];
    const mitigation: FeasibilityReport['mitigation'] = [];

    if (decision.type === 'PRIORITIZE_RESTORATION' && this.inventory.generators <= 0) {
      triggered.push('no_generators_available');
      mitigation.push({
        rule: 'no_generators_available',
        suggestion: 'Reduce generator-dependent actions or request mutual aid.',
        severity: 'BLOCK',
      });
    }

    if (decision.type === 'OPEN_COOLING_CENTER' && this.inventory.shelters <= 0) {
      triggered.push('no_shelter_capacity');
      mitigation.push({
        rule: 'no_shelter_capacity',
        suggestion: 'Open alternative sites or delay activation.',
        severity: 'BLOCK',
      });
    }

    return {
      ok: triggered.length === 0,
      severity: triggered.length === 0 ? 'INFO' : 'BLOCK',
      triggeredRules: triggered,
      mitigation,
    };
  }

  evaluatePlacement(placement: OpPlacement): FeasibilityReport {
    const triggered: string[] = [];
    const mitigation: FeasibilityReport['mitigation'] = [];

    if (placement.assetType === 'GENERATOR' && this.inventory.generators <= 0) {
      triggered.push('generator_unavailable');
      mitigation.push({
        rule: 'generator_unavailable',
        suggestion: 'Reduce generator placements or adjust staging.',
        severity: 'BLOCK',
      });
    }

    if (placement.assetType === 'HELICOPTER' && this.inventory.helicopters <= 0) {
      triggered.push('helicopter_unavailable');
      mitigation.push({
        rule: 'helicopter_unavailable',
        suggestion: 'Use ground units or contract external support.',
        severity: 'BLOCK',
      });
    }

    return {
      ok: triggered.length === 0,
      severity: triggered.length === 0 ? 'INFO' : 'BLOCK',
      triggeredRules: triggered,
      mitigation,
    };
  }
}
