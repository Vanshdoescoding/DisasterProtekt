import { Signal, SignalQuality, SignalType, SignalProvenance, GeoScope } from '@dp/domain';

export interface IngestContext {
  cityId: string;
  asOf: Date;
  windowStart: Date;
  windowEnd: Date;
}

export interface RawSignal {
  observedAt: Date;
  units: string;
  geoScope: GeoScope;
  payload: Record<string, unknown>;
  rawPayload: string | Buffer;
}

export interface NormalizedSignal {
  observedAt: Date;
  units: string;
  geoScope: GeoScope;
  payload: Record<string, unknown>;
}

export interface SignalProvider {
  signalType: SignalType;
  source: string;
  version: string;
  enabled: boolean;
  fetch(context: IngestContext): Promise<RawSignal>;
  normalize(raw: RawSignal, context: IngestContext): Promise<NormalizedSignal>;
  quality(
    normalized: NormalizedSignal,
    context: IngestContext,
  ): Promise<SignalQuality>;
  provenance(rawHash: string, context: IngestContext): SignalProvenance;
}

export interface SignalRepository {
  insert(signal: Signal, cityId: string): Promise<void>;
  listByCityAndWindow(
    cityId: string,
    windowStart: Date,
    windowEnd: Date,
    asOf: Date,
  ): Promise<Signal[]>;
  getByIds(ids: string[]): Promise<Signal[]>;
}
