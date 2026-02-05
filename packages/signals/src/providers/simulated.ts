import fs from 'node:fs';
import path from 'node:path';
import { SignalQuality, SignalProvenance, SignalType } from '@dp/domain';
import { seededRandom } from '@dp/utils';
import { scoreQuality } from '../quality';
import { getCityConfig } from '../city';
import { IngestContext, NormalizedSignal, RawSignal, SignalProvider } from '../types';

abstract class BaseSimulatedProvider implements SignalProvider {
  abstract signalType: SignalType;
  source = 'simulated';
  version = 'sim-0.1.0';
  enabled = true;
  protected requiredFields: string[] = [];

  async fetch(context: IngestContext): Promise<RawSignal> {
    const rng = seededRandom(`${context.cityId}:${context.asOf.toISOString()}:${this.signalType}`);
    const payload = this.buildPayload(context, rng);
    const observedAt = new Date(context.asOf.getTime() - Math.floor(rng() * 3600 * 1000));
    const geoScope = {
      bbox: getCityConfig(context.cityId).bbox,
    };
    return {
      observedAt,
      units: payload.units,
      geoScope,
      payload: payload.payload,
      rawPayload: JSON.stringify(payload.payload),
    };
  }

  async normalize(raw: RawSignal, _context: IngestContext): Promise<NormalizedSignal> {
    return {
      observedAt: raw.observedAt,
      units: raw.units,
      geoScope: raw.geoScope,
      payload: raw.payload,
    };
  }

  async quality(normalized: NormalizedSignal, context: IngestContext): Promise<SignalQuality> {
    return scoreQuality({
      observedAt: normalized.observedAt,
      asOf: context.asOf,
      requiredFields: this.requiredFields,
      payload: normalized.payload,
      reliabilityScore: 0.75,
      latencyMs: 250,
    });
  }

  provenance(rawHash: string, _context: IngestContext): SignalProvenance {
    return {
      providerName: this.source,
      providerVersion: this.version,
      endpoint: 'simulated',
      requestParams: {},
      rawHash,
      transformVersion: 'sim-transform-0.1.0',
      isSimulated: true,
    };
  }

  protected abstract buildPayload(
    context: IngestContext,
    rng: () => number,
  ): { payload: Record<string, unknown>; units: string };
}

export class SimulatedWeatherProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'WEATHER_FORECAST';
  protected requiredFields = ['temperature_c', 'humidity'];

  protected buildPayload(context: IngestContext, rng: () => number) {
    const temp = 26 + rng() * 10;
    const humidity = 0.4 + rng() * 0.4;
    return {
      units: 'metric',
      payload: {
        temperature_c: Number(temp.toFixed(2)),
        humidity: Number(humidity.toFixed(2)),
        wind_kph: Number((5 + rng() * 20).toFixed(1)),
        provider: 'SIMULATED',
      },
    };
  }
}

export class SimulatedHeatIndexProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'HEAT_INDEX';
  protected requiredFields = ['heat_index_c'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    const heatIndex = 28 + rng() * 12;
    return {
      units: 'celsius',
      payload: {
        heat_index_c: Number(heatIndex.toFixed(2)),
        method: 'approx_sim',
      },
    };
  }
}

export class SimulatedWetBulbProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'TEMPERATURE_WETBULB';
  protected requiredFields = ['wet_bulb_c'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    const wetBulb = 20 + rng() * 6;
    return {
      units: 'celsius',
      payload: {
        wet_bulb_c: Number(wetBulb.toFixed(2)),
        method: 'approx_sim',
      },
    };
  }
}

export class SimulatedRoadGraphProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'ROAD_GRAPH_BASE';
  protected requiredFields = ['graph'];

  protected buildPayload(): { payload: Record<string, unknown>; units: string } {
    const samplePath = path.resolve('data/sample/roads.json');
    const graph = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
    return {
      units: 'graphml',
      payload: { graph },
    };
  }
}

export class SimulatedTrafficProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'TRAFFIC_SPEEDS';
  protected requiredFields = ['avg_speed_kph'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    return {
      units: 'kph',
      payload: {
        avg_speed_kph: Number((35 + rng() * 15).toFixed(1)),
        source: 'SIMULATED',
      },
    };
  }
}

export class SimulatedPowerOutageProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'POWER_OUTAGES_PUBLIC';
  protected requiredFields = ['outage_count'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    return {
      units: 'count',
      payload: {
        outage_count: Math.floor(rng() * 5),
        source: 'SIMULATED',
      },
    };
  }
}

export class Simulated311Provider extends BaseSimulatedProvider {
  signalType: SignalType = 'REPORTS_311';
  protected requiredFields = ['report_count'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    return {
      units: 'count',
      payload: {
        report_count: Math.floor(rng() * 25),
        top_category: 'heat',
      },
    };
  }
}

export class SimulatedVulnerabilityProvider extends BaseSimulatedProvider {
  signalType: SignalType = 'VULNERABILITY_INDEX';
  protected requiredFields = ['vulnerability_index'];

  protected buildPayload(_: IngestContext, rng: () => number) {
    return {
      units: 'index',
      payload: {
        vulnerability_index: Number((0.4 + rng() * 0.3).toFixed(2)),
        method: 'simulated',
      },
    };
  }
}
