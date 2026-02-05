import { EventRecord } from '@dp/domain';
import { LayerModel, ModelInitContext, ModelTickContext } from '@dp/sim-core';

export interface TrafficState {
  avgSpeedKph: number;
  closures: number;
}

export class TrafficModel implements LayerModel<TrafficState> {
  name = 'traffic';

  init(context: ModelInitContext): TrafficState {
    const traffic = context.signals.find((s) => s.type === 'TRAFFIC_SPEEDS');
    const base = Number(traffic?.payload.avg_speed_kph ?? 35);
    return { avgSpeedKph: Number(base.toFixed(2)), closures: 0 };
  }

  applyEvent(state: TrafficState, event: EventRecord): TrafficState {
    if (event.type === 'ROAD_CLOSURE_SET') {
      return {
        avgSpeedKph: Number((state.avgSpeedKph * 0.9).toFixed(2)),
        closures: state.closures + 1,
      };
    }
    return state;
  }

  tick(state: TrafficState, context: ModelTickContext): TrafficState {
    const variance = (context.tick % 4) * 0.2;
    return {
      avgSpeedKph: Number(Math.max(5, state.avgSpeedKph - variance).toFixed(2)),
      closures: state.closures,
    };
  }

  summarize(state: TrafficState): Record<string, unknown> {
    return { avg_speed_kph: state.avgSpeedKph, closures: state.closures };
  }
}
