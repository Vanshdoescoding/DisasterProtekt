import { RunSnapshot } from '@dp/domain';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@dp/infra';

export class DbSnapshotRepository {
  constructor(private db: Kysely<DatabaseSchema>) {}

  async insert(snapshot: RunSnapshot): Promise<void> {
    await this.db
      .insertInto('snapshots')
      .values({
        id: snapshot.id,
        cityId: snapshot.cityId,
        createdAt: snapshot.createdAt,
        asOf: snapshot.asOf,
        windowStart: snapshot.windowStart,
        windowEnd: snapshot.windowEnd,
        h3Resolution: snapshot.h3Resolution,
        signalRefs: snapshot.signalRefs,
        derivedRefs: snapshot.derivedRefs,
        roadGraphRef: snapshot.roadGraphRef,
        facilitiesRef: snapshot.facilitiesRef,
        stalenessAlarms: snapshot.stalenessAlarms,
        snapshotHash: snapshot.snapshotHash,
        schemaVersion: snapshot.schemaVersion,
      })
      .execute();
  }

  async get(snapshotId: string): Promise<RunSnapshot | null> {
    const row = await this.db
      .selectFrom('snapshots')
      .selectAll()
      .where('id', '=', snapshotId)
      .executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      cityId: row.cityId,
      createdAt: row.createdAt,
      asOf: row.asOf,
      windowStart: row.windowStart,
      windowEnd: row.windowEnd,
      h3Resolution: row.h3Resolution,
      signalRefs: row.signalRefs as string[],
      derivedRefs: row.derivedRefs as string[],
      roadGraphRef: row.roadGraphRef,
      facilitiesRef: row.facilitiesRef,
      stalenessAlarms: row.stalenessAlarms as string[],
      snapshotHash: row.snapshotHash,
      schemaVersion: row.schemaVersion as RunSnapshot['schemaVersion'],
    };
  }
}

export class InMemorySnapshotRepository {
  private snapshots: RunSnapshot[] = [];

  async insert(snapshot: RunSnapshot): Promise<void> {
    const exists = this.snapshots.find((s) => s.id === snapshot.id);
    if (!exists) {
      this.snapshots.push(snapshot);
    }
  }

  async get(snapshotId: string): Promise<RunSnapshot | null> {
    return this.snapshots.find((s) => s.id === snapshotId) ?? null;
  }
}
