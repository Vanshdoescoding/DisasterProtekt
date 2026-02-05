import { Signal } from '@dp/domain';
import { LocalFSObjectStore } from '@dp/infra';
import { hashObject } from '@dp/utils';
import { SignalProvider, IngestContext, SignalRepository } from './types';

export class SignalIngestor {
  constructor(
    private providers: SignalProvider[],
    private repository: SignalRepository,
    private objectStore: LocalFSObjectStore,
  ) {}

  async ingestOnce(context: IngestContext): Promise<Signal[]> {
    const results: Signal[] = [];
    for (const provider of this.providers) {
      if (!provider.enabled) {
        continue;
      }
      const raw = await provider.fetch(context);
      const normalized = await provider.normalize(raw, context);
      const quality = await provider.quality(normalized, context);
      const rawKeySeed = {
        cityId: context.cityId,
        asOf: context.asOf.toISOString(),
        type: provider.signalType,
        source: provider.source,
      };
      const rawKey = `signals/${provider.signalType}/${hashObject(rawKeySeed)}.raw.json`;
      const rawPayloadText =
        typeof raw.rawPayload === 'string' ? raw.rawPayload : raw.rawPayload.toString('utf-8');
      const { key, sha256 } = await this.objectStore.put(rawKey, { data: rawPayloadText });
      const provenance = provider.provenance(sha256, context);

      const signalId = hashObject({
        type: provider.signalType,
        source: provider.source,
        observedAt: normalized.observedAt.toISOString(),
        payload: normalized.payload,
        rawHash: sha256,
      });
      const signal: Signal = {
        id: signalId,
        type: provider.signalType,
        source: provider.source,
        observedAt: normalized.observedAt.toISOString(),
        ingestedAt: context.asOf.toISOString(),
        geoScope: normalized.geoScope,
        units: normalized.units,
        payload: normalized.payload,
        rawRef: key,
        schemaVersion: '0.1.0',
        quality,
        provenance,
      };
      await this.repository.insert(signal, context.cityId);
      results.push(signal);
    }
    return results;
  }
}
