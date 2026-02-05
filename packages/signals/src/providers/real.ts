import { SignalProvenance, SignalQuality, SignalType } from '@dp/domain';
import { withRetries } from '@dp/infra';
import { scoreQuality } from '../quality';
import { IngestContext, NormalizedSignal, RawSignal, SignalProvider } from '../types';

export class RealProviderStub implements SignalProvider {
  enabled = false;

  constructor(
    public signalType: SignalType,
    public source: string,
    public version: string,
    private endpoint: string,
  ) {}

  async fetch(context: IngestContext): Promise<RawSignal> {
    if (!this.enabled) {
      throw new Error(`Provider ${this.source} disabled`);
    }
    const response = await withRetries(
      async () => fetch(this.endpoint),
      { retries: 2, baseDelayMs: 200, maxDelayMs: 1000 },
    );
    const payloadText = await response.text();
    return {
      observedAt: context.asOf,
      units: 'unknown',
      geoScope: { bbox: { minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 } },
      payload: { raw: payloadText },
      rawPayload: payloadText,
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
      requiredFields: [],
      payload: normalized.payload,
      reliabilityScore: 0.5,
      latencyMs: 500,
    });
  }

  provenance(rawHash: string, _context: IngestContext): SignalProvenance {
    return {
      providerName: this.source,
      providerVersion: this.version,
      endpoint: this.endpoint,
      requestParams: {},
      rawHash,
      transformVersion: 'real-stub-0.1.0',
      isSimulated: false,
    };
  }
}
