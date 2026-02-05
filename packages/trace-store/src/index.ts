import { SimulationTrace } from '@dp/domain';
import { Kysely } from 'kysely';
import { DatabaseSchema, LocalFSObjectStore } from '@dp/infra';
import { hashObject } from '@dp/utils';

export interface TraceOutputBundle {
  outputs: unknown[];
  outputHash: string;
}

export class TraceStore {
  constructor(private db: Kysely<DatabaseSchema>, private objectStore: LocalFSObjectStore) {}

  async saveTrace(trace: SimulationTrace, bundle: TraceOutputBundle): Promise<string> {
    const outputKey = `traces/${trace.traceId}.json`;
    const outputPayload = JSON.stringify(bundle);
    const { sha256 } = await this.objectStore.put(outputKey, { data: outputPayload });

    await this.db
      .insertInto('traces')
      .values({
        traceId: trace.traceId,
        runId: trace.runId,
        branchId: trace.branchId,
        snapshotId: trace.snapshotId,
        createdAt: trace.createdAt,
        seed: trace.seed,
        modelVersions: trace.modelVersions,
        outputHash: trace.outputHash,
        stats: trace.stats,
        metadata: { ...trace.metadata, outputKey, outputSha256: sha256 },
      })
      .execute();
    return outputKey;
  }

  async getTrace(traceId: string): Promise<SimulationTrace | null> {
    const row = await this.db.selectFrom('traces').selectAll().where('traceId', '=', traceId).executeTakeFirst();
    if (!row) return null;
    return {
      traceId: row.traceId,
      runId: row.runId,
      branchId: row.branchId,
      snapshotId: row.snapshotId,
      createdAt: row.createdAt,
      seed: row.seed,
      modelVersions: row.modelVersions as Record<string, string>,
      outputHash: row.outputHash,
      stats: row.stats as Record<string, unknown>,
      metadata: row.metadata as Record<string, unknown>,
    };
  }

  async compareTraces(aId: string, bId: string): Promise<Record<string, unknown>> {
    const a = await this.getTrace(aId);
    const b = await this.getTrace(bId);
    if (!a || !b) {
      throw new Error('Trace not found');
    }
    const aKey = (a.metadata as any).outputKey;
    const bKey = (b.metadata as any).outputKey;
    const aPayload = JSON.parse((await this.objectStore.get(aKey)).toString('utf-8'));
    const bPayload = JSON.parse((await this.objectStore.get(bKey)).toString('utf-8'));
    const aFinal = aPayload.outputs[aPayload.outputs.length - 1];
    const bFinal = bPayload.outputs[bPayload.outputs.length - 1];
    const delta = hashObject({ aFinal, bFinal });
    return {
      a: a.outputHash,
      b: b.outputHash,
      deltaHash: delta,
      aFinal,
      bFinal,
    };
  }
}
