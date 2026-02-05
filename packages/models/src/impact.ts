import { EventRecord } from '@dp/domain';
import { LayerModel, ModelInitContext, ModelTickContext } from '@dp/sim-core';

export interface ImpactState {
  expectedHarm: number;
  drivers: string[];
}

export class ImpactModel implements LayerModel<ImpactState> {
  name = 'impact';

  init(_context: ModelInitContext): ImpactState {
    return { expectedHarm: 0.05, drivers: ['baseline'] };
  }

  applyEvent(state: ImpactState, event: EventRecord): ImpactState {
    if (event.type === 'ROAD_CLOSURE_SET') {
      return { expectedHarm: state.expectedHarm + 0.01, drivers: [...state.drivers, 'road'] };
    }
    if (event.type === 'SHELTER_OPEN') {
      return { expectedHarm: Math.max(0, state.expectedHarm - 0.01), drivers: [...state.drivers, 'shelter'] };
    }
    return state;
  }

  tick(state: ImpactState, context: ModelTickContext): ImpactState {
    const drift = (context.tick % 5) * 0.002;
    return { expectedHarm: Number((state.expectedHarm + drift).toFixed(4)), drivers: state.drivers };
  }

  summarize(state: ImpactState): Record<string, unknown> {
    return {
      expected_harm: Number(state.expectedHarm.toFixed(4)),
      drivers: state.drivers,
    };
  }
}
