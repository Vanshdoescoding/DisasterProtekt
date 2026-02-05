import { EventRecord } from '@dp/domain';
import { computeAffectedSubsystems } from '@dp/recompute';
import { hashObject } from '@dp/utils';
import { runMonteCarlo } from '@dp/uncertainty';
import { LayerModel, SimulationConfig, SimulationTraceOutput } from './types';

export class SimulationRunner {
  constructor(private models: Array<LayerModel<any>>) {}

  run(config: SimulationConfig): SimulationTraceOutput {
    const { snapshot, events, seed, timestepMinutes, ticks } = config;
    const start = new Date(snapshot.asOf);
    const states = new Map<string, any>();
    for (const model of this.models) {
      states.set(model.name, model.init({ snapshot, signals: config.signals, seed }));
    }

    const outputs: SimulationTraceOutput['outputs'] = [];
    let eventCursor = 0;
    const sortedEvents = [...events].sort((a, b) => a.seqNo - b.seqNo);

    for (let tick = 0; tick < ticks; tick += 1) {
      const time = new Date(start.getTime() + tick * timestepMinutes * 60_000);
      const pending: EventRecord[] = [];
      while (eventCursor < sortedEvents.length) {
        const event = sortedEvents[eventCursor];
        if (new Date(event.eventTime) <= time) {
          pending.push(event);
          eventCursor += 1;
        } else {
          break;
        }
      }

      const affected = computeAffectedSubsystems(pending);
      for (const model of this.models) {
        let state = states.get(model.name);
        for (const event of pending) {
          state = model.applyEvent(state, event, { time, tick, events: pending, seed });
        }
        state = model.tick(state, { time, tick, events: pending, seed });
        states.set(model.name, state);
      }

      const summaries: Record<string, Record<string, unknown>> = {};
      for (const model of this.models) {
        summaries[model.name] = model.summarize(states.get(model.name));
      }

      const impactValue = Number(summaries.impact?.expected_harm ?? 0);
      const uncertainty = runMonteCarlo({
        seed: `${seed}:${tick}`,
        samples: 10,
        baseValue: impactValue,
      });

      outputs.push({
        time: time.toISOString(),
        summaries,
        uncertainty,
      });
    }

    const outputHash = hashObject({ snapshot: snapshot.snapshotHash, outputs });
    return { outputHash, outputs };
  }
}
