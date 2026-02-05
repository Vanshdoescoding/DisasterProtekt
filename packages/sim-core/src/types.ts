import { EventRecord, RunSnapshot, Signal } from '@dp/domain';

export interface ModelInitContext {
  snapshot: RunSnapshot;
  signals: Signal[];
  seed: number;
}

export interface ModelTickContext {
  time: Date;
  tick: number;
  events: EventRecord[];
  seed: number;
}

export interface LayerModel<State> {
  name: string;
  init(context: ModelInitContext): State;
  applyEvent(state: State, event: EventRecord, context: ModelTickContext): State;
  tick(state: State, context: ModelTickContext): State;
  summarize(state: State): Record<string, unknown>;
}

export interface SimulationConfig {
  snapshot: RunSnapshot;
  signals: Signal[];
  events: EventRecord[];
  seed: number;
  timestepMinutes: number;
  ticks: number;
}

export interface SimulationTraceOutput {
  outputHash: string;
  outputs: Array<{
    time: string;
    summaries: Record<string, Record<string, unknown>>;
    uncertainty: Record<string, unknown>;
  }>;
}
