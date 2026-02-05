import fs from 'node:fs';
import path from 'node:path';
import {
  RunSnapshot,
  Signal,
  SignalType,
  SCHEMA_VERSION,
} from '@dp/domain';
import { LocalFSObjectStore } from '@dp/infra';
import { hashObject } from '@dp/utils';
import { SignalRepository } from '@dp/signals';
import { DbSnapshotRepository } from './storage';
import { getCityConfig } from '@dp/signals';

const CRITICAL_TYPES: SignalType[] = [
  'WEATHER_FORECAST',
  'TEMPERATURE_WETBULB',
  'HEAT_INDEX',
  'ROAD_GRAPH_BASE',
  'TRAFFIC_SPEEDS',
  'POWER_OUTAGES_PUBLIC',
  'REPORTS_311',
  'VULNERABILITY_INDEX',
];

const STALENESS_SEC: Record<SignalType, number> = {
  WEATHER_FORECAST: 6 * 3600,
  TEMPERATURE_WETBULB: 6 * 3600,
  HEAT_INDEX: 6 * 3600,
  ROAD_GRAPH_BASE: 365 * 24 * 3600,
  TRAFFIC_SPEEDS: 30 * 60,
  POWER_OUTAGES_PUBLIC: 60 * 60,
  REPORTS_311: 24 * 3600,
  VULNERABILITY_INDEX: 365 * 24 * 3600,
  CLIP_OBSERVATION: 24 * 3600,
};

function scoreSignal(signal: Signal, asOf: Date): number {
  const freshnessPenalty = signal.quality.freshnessSec / (STALENESS_SEC[signal.type] || 1);
  return signal.quality.reliabilityScore + signal.quality.completeness - freshnessPenalty;
}

export class SnapshotBuilder {
  constructor(
    private signalRepo: SignalRepository,
    private snapshotRepo: DbSnapshotRepository,
    private objectStore: LocalFSObjectStore,
  ) {}

  async buildSnapshot(params: {
    cityId: string;
    windowStart: Date;
    windowEnd: Date;
    asOf: Date;
  }): Promise<RunSnapshot> {
    const { cityId, windowStart, windowEnd, asOf } = params;
    const signals = await this.signalRepo.listByCityAndWindow(
      cityId,
      windowStart,
      windowEnd,
      asOf,
    );

    const selected = new Map<SignalType, Signal>();
    for (const signal of signals) {
      const current = selected.get(signal.type);
      if (!current || scoreSignal(signal, asOf) > scoreSignal(current, asOf)) {
        selected.set(signal.type, signal);
      }
    }

    const stalenessAlarms: string[] = [];
    for (const type of CRITICAL_TYPES) {
      const signal = selected.get(type);
      if (!signal) {
        stalenessAlarms.push(`missing:${type}`);
        continue;
      }
      const freshness = (asOf.getTime() - new Date(signal.observedAt).getTime()) / 1000;
      if (freshness > (STALENESS_SEC[type] ?? 0)) {
        stalenessAlarms.push(`stale:${type}:${Math.round(freshness)}s`);
      }
    }

    const derivedRefs: string[] = [];
    if (!selected.has('HEAT_INDEX') && selected.has('WEATHER_FORECAST')) {
      const weather = selected.get('WEATHER_FORECAST')!;
      const temp = Number(weather.payload.temperature_c ?? 0);
      const humidity = Number(weather.payload.humidity ?? 0);
      const heatIndex = Number((temp + humidity * 10).toFixed(2));
      const derived = { heat_index_c: heatIndex, method: 'derived' };
      const key = `derived/heat_index/${hashObject({
        cityId,
        asOf: asOf.toISOString(),
        heatIndex,
      })}.json`;
      const { sha256 } = await this.objectStore.put(key, { data: JSON.stringify(derived) });
      derivedRefs.push(`${key}#${sha256}`);
    }

    const facilitiesPath = path.resolve('data/sample/facilities.geojson');
    const facilitiesRaw = fs.readFileSync(facilitiesPath, 'utf-8');
    const facilitiesKey = `assets/facilities/${hashObject({
      cityId,
      file: facilitiesPath,
    })}.geojson`;
    const facilitiesWrite = await this.objectStore.put(facilitiesKey, { data: facilitiesRaw });

    const roadGraphSignal = selected.get('ROAD_GRAPH_BASE');
    const roadGraphRef = roadGraphSignal ? roadGraphSignal.rawRef : 'missing';

    const snapshotCore = {
      cityId,
      asOf: asOf.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      h3Resolution: getCityConfig(cityId).h3Resolution,
      signalRefs: [...selected.values()].map((s) => s.id),
      derivedRefs,
      roadGraphRef,
      facilitiesRef: facilitiesWrite.key,
      stalenessAlarms,
      schemaVersion: SCHEMA_VERSION,
    };
    const snapshotHash = hashObject(snapshotCore);

    const snapshot: RunSnapshot = {
      id: hashObject({ snapshotHash, cityId, asOf: asOf.toISOString() }),
      createdAt: asOf.toISOString(),
      cityId,
      asOf: asOf.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      h3Resolution: getCityConfig(cityId).h3Resolution,
      signalRefs: snapshotCore.signalRefs,
      derivedRefs,
      roadGraphRef,
      facilitiesRef: facilitiesWrite.key,
      stalenessAlarms,
      snapshotHash,
      schemaVersion: SCHEMA_VERSION,
    };

    await this.snapshotRepo.insert(snapshot);
    return snapshot;
  }
}
