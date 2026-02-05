import fs from 'node:fs';
import path from 'node:path';
import { Signal } from '@dp/domain';
import { LocalFSObjectStore } from '@dp/infra';
import { hashObject } from '@dp/utils';
import { SignalRepository } from '@dp/signals';
import { ClipAnalyzer } from './analyzers';

export interface ClipMetadata {
  cityId: string;
  observedAt: Date;
  cameraType: string;
  location: { lat: number; lon: number };
}

export class ClipIngestService {
  constructor(
    private objectStore: LocalFSObjectStore,
    private repository: SignalRepository,
    private analyzer: ClipAnalyzer,
  ) {}

  async ingestClip(filePath: string, metadata: ClipMetadata): Promise<Signal> {
    const raw = fs.readFileSync(filePath);
    const key = `clips/${path.basename(filePath)}`;
    const { sha256 } = await this.objectStore.put(key, { data: raw });
    const analysis = await this.analyzer.analyze(filePath);

    const signal: Signal = {
      id: hashObject({ filePath, sha256, observedAt: metadata.observedAt.toISOString() }),
      type: 'CLIP_OBSERVATION',
      source: 'clip-analysis',
      observedAt: metadata.observedAt.toISOString(),
      ingestedAt: new Date().toISOString(),
      geoScope: {
        bbox: {
          minLat: metadata.location.lat,
          minLon: metadata.location.lon,
          maxLat: metadata.location.lat,
          maxLon: metadata.location.lon,
        },
      },
      units: 'index',
      payload: {
        ...analysis,
        cameraType: metadata.cameraType,
        location: metadata.location,
      },
      rawRef: key,
      schemaVersion: '0.1.0',
      quality: {
        freshnessSec: 0,
        completeness: 1,
        reliabilityScore: analysis.confidence,
        latencyMs: 0,
        missingFields: [],
        validationErrors: [],
      },
      provenance: {
        providerName: 'clip-analysis',
        providerVersion: analysis.model_version,
        endpoint: 'local',
        requestParams: {},
        rawHash: sha256,
        transformVersion: analysis.model_version,
        isSimulated: true,
      },
    };

    await this.repository.insert(signal, metadata.cityId);
    return signal;
  }
}

export * from './analyzers';
