import { Signal } from '@dp/domain';
import { EventRecord } from '@dp/domain';
import { LayerModel, ModelInitContext, ModelTickContext, exponentialSmooth } from '@dp/sim-core';

export interface HeatState {
  stressIndex: number;
}

export class HeatModel implements LayerModel<HeatState> {
  name = 'heat';

  init(context: ModelInitContext): HeatState {
    const weather = context.signals.find((s) => s.type === 'WEATHER_FORECAST');
    const heatIndex = context.signals.find((s) => s.type === 'HEAT_INDEX');
    const measurement =
      Number(heatIndex?.payload.heat_index_c ?? 0) ||
      Number(weather?.payload.temperature_c ?? 25) + 2;
    const smoothed = exponentialSmooth(null, measurement, 0.7);
    return { stressIndex: Number(smoothed.value.toFixed(2)) };
  }

  applyEvent(state: HeatState, _event: EventRecord, _context: ModelTickContext): HeatState {
    return state;
  }

  tick(state: HeatState, context: ModelTickContext): HeatState {
    const drift = (context.tick % 6) * 0.05;
    return { stressIndex: Number((state.stressIndex + drift).toFixed(2)) };
  }

  summarize(state: HeatState): Record<string, unknown> {
    return { heat_stress: state.stressIndex };
  }
}
