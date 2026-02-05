import fs from 'node:fs';
import { createDb, ensureSchema } from '@dp/infra';
import { EventStore } from '@dp/events';
import { BranchService } from '@dp/branching';
import { DecisionCompiler } from '@dp/decisions';
import { DecisionPrimitive, OpPlacement } from '@dp/domain';
import { ulidId, hashObject } from '@dp/utils';
import { DbSnapshotRepository } from '@dp/snapshot';
import { DbSignalRepository } from '@dp/signals';
import { SimulationRunner } from '@dp/sim-core';
import { HeatModel, GridModel, TrafficModel, EMSModel, ImpactModel } from '@dp/models';
import { TraceStore } from '@dp/trace-store';
import { LocalFSObjectStore } from '@dp/infra';

function parseArgs() {
  const args = new Map<string, string>();
  const positional: string[] = [];
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
  const command = positional[0];
  if (!command) throw new Error('Missing command');

  const db = createDb();
  await ensureSchema(db);
  const events = new EventStore(db);
  const branches = new BranchService(db, events);

  if (command === 'run:init') {
    const snapshotId = args.get('snapshotId');
    if (!snapshotId) throw new Error('Missing --snapshotId');
    const runId = ulidId();
    await db
      .insertInto('runs')
      .values({
        id: runId,
        snapshotId,
        createdAt: new Date().toISOString(),
        metadata: {},
      })
      .execute();
    const baseline = await branches.createBaseline(runId, snapshotId);
    console.log(JSON.stringify({ runId, baselineBranchId: baseline.id }, null, 2));
  } else if (command === 'branch:fork') {
    const branchId = args.get('branchId');
    const atSeq = args.get('atSeq') ? Number(args.get('atSeq')) : null;
    if (!branchId) throw new Error('Missing --branchId');
    const branch = await branches.fork(branchId, atSeq);
    console.log(JSON.stringify(branch, null, 2));
  } else if (command === 'decision:apply') {
    const branchId = args.get('branchId');
    const decisionJson = args.get('decisionJson');
    const placementJson = args.get('placementJson');
    if (!branchId) throw new Error('Missing --branchId');
    if (!decisionJson && !placementJson) throw new Error('Provide --decisionJson or --placementJson');

    const compiler = new DecisionCompiler({ generators: 2, helicopters: 1, shelters: 3 });
    const branchRow = await db
      .selectFrom('branches')
      .selectAll()
      .where('id', '=', branchId)
      .executeTakeFirst();
    if (!branchRow) throw new Error('Branch not found');
    const runId = branchRow.runId;
    if (decisionJson) {
      const decision = DecisionPrimitive.parse(JSON.parse(fs.readFileSync(decisionJson, 'utf-8')));
      const { events: compiled, report } = compiler.compileDecision(decision);
      if (!report.ok) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      for (const event of compiled) {
        await events.append({
          runId,
          branchId,
          eventTime: new Date(decision.issuedAt),
          actor: 'ops-cli',
          type: event.type,
          payload: event.payload,
          uniqueKey: event.uniqueKey,
        });
      }
      console.log(JSON.stringify({ status: 'ok', compiled: compiled.length }, null, 2));
    }
    if (placementJson) {
      const placement = OpPlacement.parse(JSON.parse(fs.readFileSync(placementJson, 'utf-8')));
      const { events: compiled, report } = compiler.compilePlacement(placement);
      if (!report.ok) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      for (const event of compiled) {
        await events.append({
          runId,
          branchId,
          eventTime: new Date(placement.placedAt),
          actor: 'ops-cli',
          type: event.type,
          payload: event.payload,
          uniqueKey: event.uniqueKey,
        });
      }
      console.log(JSON.stringify({ status: 'ok', compiled: compiled.length }, null, 2));
    }
  } else if (command === 'branch:diff') {
    const a = args.get('a');
    const b = args.get('b');
    if (!a || !b) throw new Error('Missing --a or --b');
    const diff = await branches.diff(a, b);
    console.log(JSON.stringify(diff, null, 2));
  } else if (command === 'event:verify-ledger') {
    const runId = args.get('runId');
    if (!runId) throw new Error('Missing --runId');
    const branchRows = await db.selectFrom('branches').selectAll().where('runId', '=', runId).execute();
    const results = [];
    for (const branch of branchRows) {
      const result = await events.verifyChain(branch.id);
      results.push({ branchId: branch.id, ...result });
    }
    console.log(JSON.stringify(results, null, 2));
  } else if (command === 'trace:run') {
    const snapshotId = args.get('snapshotId');
    const branchId = args.get('branchId');
    if (!snapshotId || !branchId) throw new Error('Missing --snapshotId or --branchId');
    const ticks = Number(args.get('ticks') ?? 12);
    const timestepMinutes = Number(args.get('timestepMinutes') ?? 5);
    const seed = Number(args.get('seed') ?? 42);

    const snapshotRepo = new DbSnapshotRepository(db);
    const signalRepo = new DbSignalRepository(db);
    const snapshot = await snapshotRepo.get(snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');
    const signals = await signalRepo.getByIds(snapshot.signalRefs);
    const branchRow = await db
      .selectFrom('branches')
      .selectAll()
      .where('id', '=', branchId)
      .executeTakeFirst();
    if (!branchRow) throw new Error('Branch not found');
    const eventStore = new EventStore(db);
    const eventsList = await eventStore.readBranch(branchId);

    const runner = new SimulationRunner([
      new HeatModel(),
      new GridModel(),
      new TrafficModel(),
      new EMSModel(),
      new ImpactModel(),
    ]);
    const output = runner.run({
      snapshot,
      signals,
      events: eventsList,
      seed,
      timestepMinutes,
      ticks,
    });

    const traceId = hashObject({ snapshotId, branchId, seed, outputHash: output.outputHash });
    const traceStore = new TraceStore(db, new LocalFSObjectStore('.object_store'));
    await traceStore.saveTrace(
      {
        traceId,
        runId: branchRow.runId,
        branchId,
        snapshotId,
        createdAt: new Date().toISOString(),
        seed,
        modelVersions: {
          heat: '0.1.0',
          grid: '0.1.0',
          traffic: '0.1.0',
          ems: '0.1.0',
          impact: '0.1.0',
        },
        outputHash: output.outputHash,
        stats: { ticks },
        metadata: {},
      },
      { outputs: output.outputs, outputHash: output.outputHash },
    );
    console.log(JSON.stringify({ traceId, outputHash: output.outputHash }, null, 2));
  } else if (command === 'trace:get') {
    const traceId = args.get('traceId');
    if (!traceId) throw new Error('Missing --traceId');
    const traceStore = new TraceStore(db, new LocalFSObjectStore('.object_store'));
    const trace = await traceStore.getTrace(traceId);
    console.log(JSON.stringify(trace, null, 2));
  } else if (command === 'trace:compare') {
    const baselineTrace = args.get('baselineTrace');
    const branchTrace = args.get('branchTrace');
    if (!baselineTrace || !branchTrace) throw new Error('Missing --baselineTrace or --branchTrace');
    const traceStore = new TraceStore(db, new LocalFSObjectStore('.object_store'));
    const diff = await traceStore.compareTraces(baselineTrace, branchTrace);
    console.log(JSON.stringify(diff, null, 2));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
