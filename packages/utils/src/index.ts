import crypto from 'node:crypto';
import { ulid } from 'ulid';
import { polygonToCells, latLngToCell } from 'h3-js';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function canonicalize(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => [key, canonicalize(val)] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries) as JsonValue;
  }
  return String(value);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashObject(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function ulidId(): string {
  return ulid();
}

export function stableNow(asOf?: Date): Date {
  return asOf ? new Date(asOf.toISOString()) : new Date();
}

export function h3FromLatLon(lat: number, lon: number, resolution: number): string {
  return latLngToCell(lat, lon, resolution);
}

export function h3FromBbox(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  resolution: number,
): string[] {
  const polygon = [
    [
      [minLon, minLat],
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat],
    ],
  ];
  const cells = polygonToCells({ type: 'Polygon', coordinates: polygon }, resolution);
  return [...cells].sort();
}

export function seededRandom(seed: string): () => number {
  let h = sha256Hex(seed);
  return () => {
    h = sha256Hex(h);
    const slice = h.slice(0, 8);
    return parseInt(slice, 16) / 0xffffffff;
  };
}
