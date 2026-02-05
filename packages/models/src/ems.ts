import { EventRecord } from '@dp/domain';
import { LayerModel, ModelInitContext, ModelTickContext } from '@dp/sim-core';

export interface EMSState {
  overloadRisk: number;
}

export class EMSModel implements LayerModel<EMSState> {
  name = 'ems';

  init(context: ModelInitContext): EMSState {
    const vuln = context.signals.find((s) => s.type === 'VULNERABILITY_INDEX');
    const vulnerability = Number(vuln?.payload.vulnerability_index ?? 0.5);
    const overloadRisk = Math.min(1, 0.2 + vulnerability * 0.5);
    return { overloadRisk: Number(overloadRisk.toFixed(3)) };
  }

  applyEvent(state: EMSState, event: EventRecord): EMSState {
    if (event.type === 'SHELTER_OPEN') {
      return { overloadRisk: Math.max(0, state.overloadRisk - 0.05) };
    }
    return state;
  }

  tick(state: EMSState, context: ModelTickContext): EMSState {
    const drift = (context.tick % 3) * 0.002;
    return { overloadRisk: Number(Math.min(1, state.overloadRisk + drift).toFixed(3)) };
  }

  summarize(state: EMSState): Record<string, unknown> {
    return { overload_risk: state.overloadRisk };
  }
}
