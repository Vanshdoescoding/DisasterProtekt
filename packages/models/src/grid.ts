import { EventRecord } from '@dp/domain';
import { LayerModel, ModelInitContext, ModelTickContext } from '@dp/sim-core';

export interface GridState {
  outageProbability: number;
}

export class GridModel implements LayerModel<GridState> {
  name = 'grid';

  init(context: ModelInitContext): GridState {
    const heat = context.signals.find((s) => s.type === 'HEAT_INDEX');
    const base = Number(heat?.payload.heat_index_c ?? 30);
    const probability = Math.min(1, 0.05 + base / 200);
    return { outageProbability: Number(probability.toFixed(3)) };
  }

  applyEvent(state: GridState, event: EventRecord): GridState {
    if (event.type === 'GENERATOR_PREPOSITION') {
      return { outageProbability: Math.max(0, state.outageProbability - 0.02) };
    }
    return state;
  }

  tick(state: GridState, context: ModelTickContext): GridState {
    const drift = (context.tick % 5) * 0.001;
    return { outageProbability: Number(Math.min(1, state.outageProbability + drift).toFixed(3)) };
  }

  summarize(state: GridState): Record<string, unknown> {
    return { outage_probability: state.outageProbability };
  }
}
