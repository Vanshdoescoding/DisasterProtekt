import { Signal } from '@dp/domain';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@dp/infra';
import { SignalRepository } from './types';

export class DbSignalRepository implements SignalRepository {
  constructor(private db: Kysely<DatabaseSchema>) {}

  async insert(signal: Signal, cityId: string): Promise<void> {
    await this.db
      .insertInto('signals')
      .values({
        id: signal.id,
        cityId,
        type: signal.type,
        source: signal.source,
        observedAt: signal.observedAt,
        ingestedAt: signal.ingestedAt,
        geoScope: signal.geoScope,
        units: signal.units,
        payload: signal.payload,
        rawRef: signal.rawRef,
        rawHash: signal.provenance.rawHash,
        quality: signal.quality,
        provenance: signal.provenance,
        schemaVersion: signal.schemaVersion,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  async listByCityAndWindow(
    cityId: string,
    windowStart: Date,
    windowEnd: Date,
    asOf: Date,
  ): Promise<Signal[]> {
    const rows = await this.db
      .selectFrom('signals')
      .selectAll()
      .where('cityId', '=', cityId)
      .where('observedAt', '>=', windowStart.toISOString())
      .where('observedAt', '<=', windowEnd.toISOString())
      .where('ingestedAt', '<=', asOf.toISOString())
      .execute();
    return rows.map((row) => ({
      id: row.id,
      type: row.type as Signal['type'],
      source: row.source,
      observedAt: row.observedAt,
      ingestedAt: row.ingestedAt,
      geoScope: row.geoScope as Signal['geoScope'],
      units: row.units,
      payload: row.payload as Signal['payload'],
      rawRef: row.rawRef,
      schemaVersion: row.schemaVersion as Signal['schemaVersion'],
      quality: row.quality as Signal['quality'],
      provenance: row.provenance as Signal['provenance'],
    }));
  }

  async getByIds(ids: string[]): Promise<Signal[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.selectFrom('signals').selectAll().where('id', 'in', ids).execute();
    return rows.map((row) => ({
      id: row.id,
      type: row.type as Signal['type'],
      source: row.source,
      observedAt: row.observedAt,
      ingestedAt: row.ingestedAt,
      geoScope: row.geoScope as Signal['geoScope'],
      units: row.units,
      payload: row.payload as Signal['payload'],
      rawRef: row.rawRef,
      schemaVersion: row.schemaVersion as Signal['schemaVersion'],
      quality: row.quality as Signal['quality'],
      provenance: row.provenance as Signal['provenance'],
    }));
  }
}

export class InMemorySignalRepository implements SignalRepository {
  private signals: Signal[] = [];

  async insert(signal: Signal, cityId: string): Promise<void> {
    const exists = this.signals.find((s) => s.id === signal.id && (s as any).cityId === cityId);
    if (!exists) {
      (signal as any).cityId = cityId;
      this.signals.push(signal);
    }
  }

  async listByCityAndWindow(
    cityId: string,
    windowStart: Date,
    windowEnd: Date,
    asOf: Date,
  ): Promise<Signal[]> {
    return this.signals.filter((signal: any) => {
      return (
        signal.cityId === cityId &&
        new Date(signal.observedAt) >= windowStart &&
        new Date(signal.observedAt) <= windowEnd &&
        new Date(signal.ingestedAt) <= asOf
      );
    });
  }

  async getByIds(ids: string[]): Promise<Signal[]> {
    return this.signals.filter((signal) => ids.includes(signal.id));
  }
}
