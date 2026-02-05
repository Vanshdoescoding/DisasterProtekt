import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LocalFSObjectStore } from '@dp/infra';
import { InMemorySignalRepository } from '@dp/signals';
import { ClipIngestService, StubClipAnalyzer } from '@dp/clip-analysis';

describe('ClipIngestService', () => {
  it('produces deterministic observations', async () => {
    const repo = new InMemorySignalRepository();
    const storePath = path.join(process.cwd(), '.object_store_test');
    fs.mkdirSync(storePath, { recursive: true });
    const objectStore = new LocalFSObjectStore(storePath);
    const analyzer = new StubClipAnalyzer();
    const service = new ClipIngestService(objectStore, repo, analyzer);

    const filePath = path.join(storePath, 'clip_smoke.mp4');
    fs.writeFileSync(filePath, 'dummy');

    const signalA = await service.ingestClip(filePath, {
      cityId: 'mv',
      observedAt: new Date('2024-02-01T00:00:00Z'),
      cameraType: 'traffic_cam',
      location: { lat: 37.4, lon: -122.08 },
    });
    const signalB = await service.ingestClip(filePath, {
      cityId: 'mv',
      observedAt: new Date('2024-02-01T00:00:00Z'),
      cameraType: 'traffic_cam',
      location: { lat: 37.4, lon: -122.08 },
    });

    expect(signalA.payload).toEqual(signalB.payload);
  });
});
