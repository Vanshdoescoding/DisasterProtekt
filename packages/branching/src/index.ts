import { BranchNode, SCHEMA_VERSION } from '@dp/domain';
import { EventStore } from '@dp/events';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@dp/infra';
import { ulidId } from '@dp/utils';

export interface BranchDiff {
  onlyInA: string[];
  onlyInB: string[];
}

export class BranchService {
  constructor(private db: Kysely<DatabaseSchema>, private events: EventStore) {}

  async createBaseline(runId: string, snapshotId: string): Promise<BranchNode> {
    const branch: BranchNode = {
      id: ulidId(),
      parentId: null,
      createdAt: new Date().toISOString(),
      baseSnapshotId: snapshotId,
      forkEventSeq: null,
      metadata: { label: 'baseline', runId },
      schemaVersion: SCHEMA_VERSION,
    };
    await this.db
      .insertInto('branches')
      .values({
        id: branch.id,
        runId,
        parentId: branch.parentId,
        createdAt: branch.createdAt,
        baseSnapshotId: branch.baseSnapshotId,
        forkEventSeq: branch.forkEventSeq,
        metadata: branch.metadata,
        schemaVersion: branch.schemaVersion,
      })
      .execute();
    return branch;
  }

  async fork(parentBranchId: string, atSeq: number | null): Promise<BranchNode> {
    const parent = await this.db
      .selectFrom('branches')
      .selectAll()
      .where('id', '=', parentBranchId)
      .executeTakeFirst();
    if (!parent) {
      throw new Error('Parent branch not found');
    }
    const branch: BranchNode = {
      id: ulidId(),
      parentId: parentBranchId,
      createdAt: new Date().toISOString(),
      baseSnapshotId: parent.baseSnapshotId,
      forkEventSeq: atSeq,
      metadata: { label: 'fork' },
      schemaVersion: SCHEMA_VERSION,
    };
    await this.db
      .insertInto('branches')
      .values({
        id: branch.id,
        runId: parent.runId,
        parentId: branch.parentId,
        createdAt: branch.createdAt,
        baseSnapshotId: branch.baseSnapshotId,
        forkEventSeq: branch.forkEventSeq,
        metadata: branch.metadata,
        schemaVersion: branch.schemaVersion,
      })
      .execute();
    return branch;
  }

  async list(runId: string): Promise<BranchNode[]> {
    const rows = await this.db
      .selectFrom('branches')
      .selectAll()
      .where('runId', '=', runId)
      .execute();
    return rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      createdAt: row.createdAt,
      baseSnapshotId: row.baseSnapshotId,
      forkEventSeq: row.forkEventSeq,
      metadata: row.metadata,
      schemaVersion: row.schemaVersion as BranchNode['schemaVersion'],
    }));
  }

  async diff(aBranchId: string, bBranchId: string): Promise<BranchDiff> {
    const aEvents = await this.events.readBranch(aBranchId);
    const bEvents = await this.events.readBranch(bBranchId);
    const aSet = new Set(aEvents.map((e) => e.eventId));
    const bSet = new Set(bEvents.map((e) => e.eventId));
    const onlyInA = [...aSet].filter((id) => !bSet.has(id));
    const onlyInB = [...bSet].filter((id) => !aSet.has(id));
    return { onlyInA, onlyInB };
  }
}
