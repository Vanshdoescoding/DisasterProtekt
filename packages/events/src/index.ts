import { EventRecord, EventType, SCHEMA_VERSION } from '@dp/domain';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@dp/infra';
import { hashObject, ulidId } from '@dp/utils';

export interface AppendEventInput {
  runId: string;
  branchId: string;
  eventTime: Date;
  actor: string;
  type: EventType;
  payload: Record<string, unknown>;
  snapshotRef?: string;
  modelVersion?: string;
  uniqueKey?: string;
}

export class EventStore {
  constructor(private db: Kysely<DatabaseSchema>) {}

  async append(input: AppendEventInput): Promise<EventRecord> {
    if (input.uniqueKey) {
      const existing = await this.db
        .selectFrom('events')
        .selectAll()
        .where('branchId', '=', input.branchId)
        .where('uniqueKey', '=', input.uniqueKey)
        .executeTakeFirst();
      if (existing) {
        return this.rowToEvent(existing);
      }
    }

    const last = await this.db
      .selectFrom('events')
      .selectAll()
      .where('branchId', '=', input.branchId)
      .orderBy('seqNo', 'desc')
      .executeTakeFirst();
    const seqNo = last ? last.seqNo + 1 : 1;
    const prevHash = last?.hash ?? null;

    const eventCore = {
      eventId: ulidId(),
      runId: input.runId,
      branchId: input.branchId,
      seqNo,
      eventTime: input.eventTime.toISOString(),
      createdAt: new Date().toISOString(),
      actor: input.actor,
      type: input.type,
      payload: input.payload,
      snapshotRef: input.snapshotRef ?? null,
      modelVersion: input.modelVersion ?? null,
      prevHash,
      schemaVersion: SCHEMA_VERSION,
    };
    const hash = hashObject(eventCore);
    const record: EventRecord = {
      ...eventCore,
      hash,
    };

    await this.db
      .insertInto('events')
      .values({
        eventId: record.eventId,
        runId: record.runId,
        branchId: record.branchId,
        seqNo: record.seqNo,
        eventTime: record.eventTime,
        createdAt: record.createdAt,
        actor: record.actor,
        type: record.type,
        payload: record.payload,
        snapshotRef: record.snapshotRef ?? null,
        modelVersion: record.modelVersion ?? null,
        prevHash: record.prevHash ?? null,
        hash: record.hash,
        schemaVersion: record.schemaVersion,
        uniqueKey: input.uniqueKey ?? null,
      })
      .execute();
    return record;
  }

  async readRange(branchId: string, fromSeq: number, toSeq: number): Promise<EventRecord[]> {
    const rows = await this.db
      .selectFrom('events')
      .selectAll()
      .where('branchId', '=', branchId)
      .where('seqNo', '>=', fromSeq)
      .where('seqNo', '<=', toSeq)
      .orderBy('seqNo')
      .execute();
    return rows.map((row) => this.rowToEvent(row));
  }

  async readBranch(branchId: string): Promise<EventRecord[]> {
    const rows = await this.db
      .selectFrom('events')
      .selectAll()
      .where('branchId', '=', branchId)
      .orderBy('seqNo')
      .execute();
    return rows.map((row) => this.rowToEvent(row));
  }

  async verifyChain(branchId: string): Promise<{ ok: boolean; error?: string }> {
    const events = await this.readBranch(branchId);
    let prev: string | null = null;
    for (const event of events) {
      const core = {
        eventId: event.eventId,
        runId: event.runId,
        branchId: event.branchId,
        seqNo: event.seqNo,
        eventTime: event.eventTime,
        createdAt: event.createdAt,
        actor: event.actor,
        type: event.type,
        payload: event.payload,
        snapshotRef: event.snapshotRef ?? null,
        modelVersion: event.modelVersion ?? null,
        prevHash: event.prevHash ?? null,
        schemaVersion: event.schemaVersion,
      };
      const expected = hashObject(core);
      if (event.prevHash !== prev) {
        return { ok: false, error: `prevHash mismatch at seq ${event.seqNo}` };
      }
      if (event.hash !== expected) {
        return { ok: false, error: `hash mismatch at seq ${event.seqNo}` };
      }
      prev = event.hash;
    }
    return { ok: true };
  }

  private rowToEvent(row: any): EventRecord {
    return {
      eventId: row.eventId,
      runId: row.runId,
      branchId: row.branchId,
      seqNo: row.seqNo,
      eventTime: row.eventTime,
      createdAt: row.createdAt,
      actor: row.actor,
      type: row.type,
      payload: row.payload,
      snapshotRef: row.snapshotRef ?? undefined,
      modelVersion: row.modelVersion ?? undefined,
      prevHash: row.prevHash ?? null,
      hash: row.hash,
      schemaVersion: row.schemaVersion,
    };
  }
}

export class MemoryEventStore {
  private events: EventRecord[] = [];

  async append(input: AppendEventInput): Promise<EventRecord> {
    if (input.uniqueKey) {
      const existing = this.events.find((e) => e.branchId === input.branchId && (e as any).uniqueKey === input.uniqueKey);
      if (existing) return existing;
    }
    const last = [...this.events]
      .filter((e) => e.branchId === input.branchId)
      .sort((a, b) => b.seqNo - a.seqNo)[0];
    const seqNo = last ? last.seqNo + 1 : 1;
    const prevHash = last?.hash ?? null;
    const core = {
      eventId: ulidId(),
      runId: input.runId,
      branchId: input.branchId,
      seqNo,
      eventTime: input.eventTime.toISOString(),
      createdAt: new Date().toISOString(),
      actor: input.actor,
      type: input.type,
      payload: input.payload,
      snapshotRef: input.snapshotRef ?? null,
      modelVersion: input.modelVersion ?? null,
      prevHash,
      schemaVersion: SCHEMA_VERSION,
    };
    const hash = hashObject(core);
    const record: EventRecord = { ...core, hash };
    (record as any).uniqueKey = input.uniqueKey ?? null;
    this.events.push(record);
    return record;
  }

  async readBranch(branchId: string): Promise<EventRecord[]> {
    return this.events.filter((e) => e.branchId === branchId).sort((a, b) => a.seqNo - b.seqNo);
  }

  async verifyChain(branchId: string): Promise<{ ok: boolean; error?: string }> {
    const events = await this.readBranch(branchId);
    let prev: string | null = null;
    for (const event of events) {
      const core = {
        eventId: event.eventId,
        runId: event.runId,
        branchId: event.branchId,
        seqNo: event.seqNo,
        eventTime: event.eventTime,
        createdAt: event.createdAt,
        actor: event.actor,
        type: event.type,
        payload: event.payload,
        snapshotRef: event.snapshotRef ?? null,
        modelVersion: event.modelVersion ?? null,
        prevHash: event.prevHash ?? null,
        schemaVersion: event.schemaVersion,
      };
      const expected = hashObject(core);
      if (event.prevHash !== prev) return { ok: false, error: `prevHash mismatch at ${event.seqNo}` };
      if (event.hash !== expected) return { ok: false, error: `hash mismatch at ${event.seqNo}` };
      prev = event.hash;
    }
    return { ok: true };
  }
}
