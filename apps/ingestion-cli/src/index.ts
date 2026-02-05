import { createDb, ensureSchema, LocalFSObjectStore } from '@dp/infra';
import {
  DbSignalRepository,
  SignalIngestor,
  SimulatedHeatIndexProvider,
  SimulatedPowerOutageProvider,
  SimulatedRoadGraphProvider,
  SimulatedTrafficProvider,
  SimulatedVulnerabilityProvider,
  SimulatedWeatherProvider,
  SimulatedWetBulbProvider,
  Simulated311Provider,
} from '@dp/signals';

function parseArgs() {
  const args = new Map<string, string>();
  for (const part of process.argv.slice(2)) {
    const [key, value] = part.replace(/^--/, '').split('=');
    if (key && value) args.set(key, value);
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const cityId = args.get('city') ?? 'mv';
  const asOf = new Date(args.get('asOf') ?? new Date().toISOString());
  const windowStart = new Date(args.get('windowStart') ?? asOf.toISOString());
  const windowEnd = new Date(args.get('windowEnd') ?? asOf.toISOString());

  const db = createDb();
  await ensureSchema(db);
  const repo = new DbSignalRepository(db);
  const objectStore = new LocalFSObjectStore('.object_store');
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

  const signals = await ingestor.ingestOnce({ cityId, asOf, windowStart, windowEnd });
  console.log(JSON.stringify({ ingested: signals.length, signalIds: signals.map((s) => s.id) }, null, 2));
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
