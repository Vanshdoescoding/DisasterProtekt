import { createDb, ensureSchema, LocalFSObjectStore } from '@dp/infra';
import { DbSnapshotRepository, SnapshotBuilder } from '@dp/snapshot';
import { DbSignalRepository } from '@dp/signals';
import { hashObject } from '@dp/utils';

function parseArgs() {
  const args = new Map<string, string>();
  const positional = [];
  for (const part of process.argv.slice(2)) {
    if (part.startsWith('--')) {
      const [key, value] = part.replace(/^--/, '').split('=');
      if (key && value) args.set(key, value);
    } else {
      positional.push(part);
    }
  }
  return { args, positional };
}

async function main() {
  const { args, positional } = parseArgs();
  const command = positional[0] ?? 'build';
  const db = createDb();
  await ensureSchema(db);
  const signalRepo = new DbSignalRepository(db);
  const snapshotRepo = new DbSnapshotRepository(db);
  const objectStore = new LocalFSObjectStore('.object_store');
  const builder = new SnapshotBuilder(signalRepo, snapshotRepo, objectStore);

  if (command === 'build') {
    const cityId = args.get('city') ?? 'mv';
    const asOf = new Date(args.get('asOf') ?? new Date().toISOString());
    const windowStart = new Date(args.get('windowStart') ?? asOf.toISOString());
    const windowEnd = new Date(args.get('windowEnd') ?? asOf.toISOString());
    const snapshot = await builder.buildSnapshot({ cityId, asOf, windowStart, windowEnd });
    console.log(JSON.stringify(snapshot, null, 2));
  } else if (command === 'verify') {
    const snapshotId = args.get('snapshotId');
    if (!snapshotId) {
      throw new Error('Missing --snapshotId');
    }
    const snapshot = await snapshotRepo.get(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }
    const snapshotCore = {
      cityId: snapshot.cityId,
      asOf: snapshot.asOf,
      windowStart: snapshot.windowStart,
      windowEnd: snapshot.windowEnd,
      h3Resolution: snapshot.h3Resolution,
      signalRefs: snapshot.signalRefs,
      derivedRefs: snapshot.derivedRefs,
      roadGraphRef: snapshot.roadGraphRef,
      facilitiesRef: snapshot.facilitiesRef,
      stalenessAlarms: snapshot.stalenessAlarms,
      schemaVersion: snapshot.schemaVersion,
    };
    const computed = hashObject(snapshotCore);
    console.log(JSON.stringify({ snapshotId, stored: snapshot.snapshotHash, computed, ok: snapshot.snapshotHash === computed }, null, 2));
  } else {
    throw new Error(`Unknown command ${command}`);
  }
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
