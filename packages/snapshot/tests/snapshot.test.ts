import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LocalFSObjectStore } from '@dp/infra';
import { InMemorySignalRepository, SignalIngestor, SimulatedWeatherProvider, SimulatedHeatIndexProvider, SimulatedWetBulbProvider, SimulatedRoadGraphProvider, SimulatedTrafficProvider, SimulatedPowerOutageProvider, Simulated311Provider, SimulatedVulnerabilityProvider } from '@dp/signals';
import { InMemorySnapshotRepository, SnapshotBuilder } from '@dp/snapshot';

describe('SnapshotBuilder', () => {
  it('produces deterministic snapshot hash for fixed signals', async () => {
    const repo = new InMemorySignalRepository();
    const snapshotRepo = new InMemorySnapshotRepository();
    const objectStorePath = path.join(process.cwd(), '.object_store_test');
    fs.mkdirSync(objectStorePath, { recursive: true });
    const objectStore = new LocalFSObjectStore(objectStorePath);

    const ingestor = new SignalIngestor(
      [
        new SimulatedWeatherProvider(),
        new SimulatedHeatIndexProvider(),
        new SimulatedWetBulbProvider(),
        new SimulatedRoadGraphProvider(),
        new SimulatedTrafficProvider(),
        new SimulatedPowerOutageProvider(),
        new Simulated311Provider(),
        new SimulatedVulnerabilityProvider(),
      ],
      repo,
      objectStore,
    );

    const asOf = new Date('2024-02-01T00:00:00Z');
    await ingestor.ingestOnce({
      cityId: 'mv',
      asOf,
      windowStart: asOf,
      windowEnd: asOf,
    });

    const builder = new SnapshotBuilder(repo, snapshotRepo, objectStore);
    const snapshotA = await builder.buildSnapshot({
      cityId: 'mv',
      asOf,
      windowStart: asOf,
      windowEnd: asOf,
    });
    const snapshotB = await builder.buildSnapshot({
      cityId: 'mv',
      asOf,
      windowStart: asOf,
      windowEnd: asOf,
    });

    expect(snapshotA.snapshotHash).toBe(snapshotB.snapshotHash);
  });
});
