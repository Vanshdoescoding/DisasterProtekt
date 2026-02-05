import { Kysely, SqliteDialect, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import Database from 'better-sqlite3';

export interface SignalRow {
  id: string;
  cityId: string;
  type: string;
  source: string;
  observedAt: string;
  ingestedAt: string;
  geoScope: unknown;
  units: string;
  payload: unknown;
  rawRef: string;
  rawHash: string;
  quality: unknown;
  provenance: unknown;
  schemaVersion: string;
}

export interface SnapshotRow {
  id: string;
  cityId: string;
  createdAt: string;
  asOf: string;
  windowStart: string;
  windowEnd: string;
  h3Resolution: number;
  signalRefs: unknown;
  derivedRefs: unknown;
  roadGraphRef: string;
  facilitiesRef: string;
  stalenessAlarms: unknown;
  snapshotHash: string;
  schemaVersion: string;
}

export interface RunRow {
  id: string;
  snapshotId: string;
  createdAt: string;
  metadata: unknown;
}

export interface BranchRow {
  id: string;
  runId: string;
  parentId: string | null;
  createdAt: string;
  baseSnapshotId: string;
  forkEventSeq: number | null;
  metadata: unknown;
  schemaVersion: string;
}

export interface EventRow {
  eventId: string;
  runId: string;
  branchId: string;
  seqNo: number;
  eventTime: string;
  createdAt: string;
  actor: string;
  type: string;
  payload: unknown;
  snapshotRef: string | null;
  modelVersion: string | null;
  prevHash: string | null;
  hash: string;
  schemaVersion: string;
}

export interface TraceRow {
  traceId: string;
  runId: string;
  branchId: string;
  snapshotId: string;
  createdAt: string;
  seed: number;
  modelVersions: unknown;
  outputHash: string;
  stats: unknown;
  metadata: unknown;
}

export interface DatabaseSchema {
  signals: SignalRow;
  snapshots: SnapshotRow;
  runs: RunRow;
  branches: BranchRow;
  events: EventRow;
  traces: TraceRow;
}

export function createDb(databaseUrl?: string): Kysely<DatabaseSchema> {
  const url = databaseUrl ?? process.env.DATABASE_URL ?? 'postgresql://disaster:disaster@localhost:5432/disasterprotek';
  if (url.startsWith('sqlite')) {
    const filename = url === 'sqlite::memory:' ? ':memory:' : url.replace('sqlite://', '');
    return new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({
        database: new Database(filename),
      }),
    });
  }
  return new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: url }),
    }),
  });
}

export async function ensureSchema(db: Kysely<DatabaseSchema>): Promise<void> {
  await db.schema
    .createTable('signals')
    .ifNotExists()
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('cityId', 'text', (c) => c.notNull())
    .addColumn('type', 'text', (c) => c.notNull())
    .addColumn('source', 'text', (c) => c.notNull())
    .addColumn('observedAt', 'text', (c) => c.notNull())
    .addColumn('ingestedAt', 'text', (c) => c.notNull())
    .addColumn('geoScope', 'json', (c) => c.notNull())
    .addColumn('units', 'text', (c) => c.notNull())
    .addColumn('payload', 'json', (c) => c.notNull())
    .addColumn('rawRef', 'text', (c) => c.notNull())
    .addColumn('rawHash', 'text', (c) => c.notNull())
    .addColumn('quality', 'json', (c) => c.notNull())
    .addColumn('provenance', 'json', (c) => c.notNull())
    .addColumn('schemaVersion', 'text', (c) => c.notNull())
    .execute();

  await db.schema
    .createTable('snapshots')
    .ifNotExists()
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('cityId', 'text', (c) => c.notNull())
    .addColumn('createdAt', 'text', (c) => c.notNull())
    .addColumn('asOf', 'text', (c) => c.notNull())
    .addColumn('windowStart', 'text', (c) => c.notNull())
    .addColumn('windowEnd', 'text', (c) => c.notNull())
    .addColumn('h3Resolution', 'integer', (c) => c.notNull())
    .addColumn('signalRefs', 'json', (c) => c.notNull())
    .addColumn('derivedRefs', 'json', (c) => c.notNull())
    .addColumn('roadGraphRef', 'text', (c) => c.notNull())
    .addColumn('facilitiesRef', 'text', (c) => c.notNull())
    .addColumn('stalenessAlarms', 'json', (c) => c.notNull())
    .addColumn('snapshotHash', 'text', (c) => c.notNull())
    .addColumn('schemaVersion', 'text', (c) => c.notNull())
    .execute();

  await db.schema
    .createTable('runs')
    .ifNotExists()
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('snapshotId', 'text', (c) => c.notNull())
    .addColumn('createdAt', 'text', (c) => c.notNull())
    .addColumn('metadata', 'json', (c) => c.notNull())
    .execute();

  await db.schema
    .createTable('branches')
    .ifNotExists()
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('runId', 'text', (c) => c.notNull())
    .addColumn('parentId', 'text')
    .addColumn('createdAt', 'text', (c) => c.notNull())
    .addColumn('baseSnapshotId', 'text', (c) => c.notNull())
    .addColumn('forkEventSeq', 'integer')
    .addColumn('metadata', 'json', (c) => c.notNull())
    .addColumn('schemaVersion', 'text', (c) => c.notNull())
    .execute();

  await db.schema
    .createTable('events')
    .ifNotExists()
    .addColumn('eventId', 'text', (c) => c.primaryKey())
    .addColumn('runId', 'text', (c) => c.notNull())
    .addColumn('branchId', 'text', (c) => c.notNull())
    .addColumn('seqNo', 'integer', (c) => c.notNull())
    .addColumn('eventTime', 'text', (c) => c.notNull())
    .addColumn('createdAt', 'text', (c) => c.notNull())
    .addColumn('actor', 'text', (c) => c.notNull())
    .addColumn('type', 'text', (c) => c.notNull())
    .addColumn('payload', 'json', (c) => c.notNull())
    .addColumn('snapshotRef', 'text')
    .addColumn('modelVersion', 'text')
    .addColumn('prevHash', 'text')
    .addColumn('hash', 'text', (c) => c.notNull())
    .addColumn('schemaVersion', 'text', (c) => c.notNull())
    .addColumn('uniqueKey', 'text')
    .execute();

  await db.schema
    .createIndex('events_branch_seq')
    .ifNotExists()
    .on('events')
    .columns(['branchId', 'seqNo'])
    .execute();

  await db.schema
    .createTable('traces')
    .ifNotExists()
    .addColumn('traceId', 'text', (c) => c.primaryKey())
    .addColumn('runId', 'text', (c) => c.notNull())
    .addColumn('branchId', 'text', (c) => c.notNull())
    .addColumn('snapshotId', 'text', (c) => c.notNull())
    .addColumn('createdAt', 'text', (c) => c.notNull())
    .addColumn('seed', 'integer', (c) => c.notNull())
    .addColumn('modelVersions', 'json', (c) => c.notNull())
    .addColumn('outputHash', 'text', (c) => c.notNull())
    .addColumn('stats', 'json', (c) => c.notNull())
    .addColumn('metadata', 'json', (c) => c.notNull())
    .execute();

  await sql`select 1`.execute(db);
}
