import { z } from 'zod';

export const SCHEMA_VERSION = '0.1.0';

export const SignalType = z.enum([
  'WEATHER_FORECAST',
  'TEMPERATURE_WETBULB',
  'HEAT_INDEX',
  'ROAD_GRAPH_BASE',
  'TRAFFIC_SPEEDS',
  'POWER_OUTAGES_PUBLIC',
  'REPORTS_311',
  'VULNERABILITY_INDEX',
  'CLIP_OBSERVATION',
]);
export type SignalType = z.infer<typeof SignalType>;

export const GeoScope = z.union([
  z.object({ h3Cells: z.array(z.string()).min(1) }),
  z.object({
    bbox: z.object({
      minLat: z.number(),
      minLon: z.number(),
      maxLat: z.number(),
      maxLon: z.number(),
    }),
  }),
]);
export type GeoScope = z.infer<typeof GeoScope>;

export const SignalQuality = z.object({
  freshnessSec: z.number().nonnegative(),
  completeness: z.number().min(0).max(1),
  reliabilityScore: z.number().min(0).max(1),
  latencyMs: z.number().nonnegative(),
  missingFields: z.array(z.string()).default([]),
  validationErrors: z.array(z.string()).default([]),
});
export type SignalQuality = z.infer<typeof SignalQuality>;

export const SignalProvenance = z.object({
  providerName: z.string(),
  providerVersion: z.string(),
  endpoint: z.string().optional(),
  requestParams: z.record(z.any()).optional(),
  rawHash: z.string(),
  transformVersion: z.string(),
  isSimulated: z.boolean().default(false),
});
export type SignalProvenance = z.infer<typeof SignalProvenance>;

export const Signal = z.object({
  id: z.string(),
  type: SignalType,
  source: z.string(),
  observedAt: z.string(),
  ingestedAt: z.string(),
  geoScope: GeoScope,
  units: z.string(),
  payload: z.record(z.any()),
  rawRef: z.string(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  quality: SignalQuality,
  provenance: SignalProvenance,
});
export type Signal = z.infer<typeof Signal>;

export const DecisionType = z.enum([
  'OPEN_COOLING_CENTER',
  'STAGE_CREWS',
  'ISSUE_ADVISORY',
  'CLOSE_ROAD',
  'PRIORITIZE_RESTORATION',
  'OTHER',
]);
export type DecisionType = z.infer<typeof DecisionType>;

export const DecisionTarget = z.object({
  h3Cells: z.array(z.string()).optional(),
  facilityIds: z.array(z.string()).optional(),
  roadSegmentIds: z.array(z.string()).optional(),
});
export type DecisionTarget = z.infer<typeof DecisionTarget>;

export const DecisionPrimitive = z.object({
  id: z.string(),
  type: DecisionType,
  issuedAt: z.string(),
  parameters: z.record(z.any()),
  target: DecisionTarget.optional(),
  constraintsVersion: z.string(),
  schemaVersion: z.literal(SCHEMA_VERSION),
});
export type DecisionPrimitive = z.infer<typeof DecisionPrimitive>;

export const AssetType = z.enum([
  'HELICOPTER',
  'AMBULANCE_STAGING',
  'GENERATOR',
  'SHELTER',
  'COOLING_CENTER',
  'ROAD_BARRIER',
  'DRONE_RELAY',
  'OTHER',
]);
export type AssetType = z.infer<typeof AssetType>;

export const GeoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});
export type GeoPoint = z.infer<typeof GeoPoint>;

export const OpPlacement = z.object({
  id: z.string(),
  assetType: AssetType,
  placedAt: z.string(),
  location: GeoPoint,
  startTime: z.string(),
  parameters: z.record(z.any()),
  assumptionNotes: z.string().optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
});
export type OpPlacement = z.infer<typeof OpPlacement>;

export const RunSnapshot = z.object({
  id: z.string(),
  createdAt: z.string(),
  cityId: z.string(),
  asOf: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  h3Resolution: z.number(),
  signalRefs: z.array(z.string()),
  derivedRefs: z.array(z.string()).default([]),
  roadGraphRef: z.string(),
  facilitiesRef: z.string(),
  stalenessAlarms: z.array(z.string()).default([]),
  snapshotHash: z.string(),
  schemaVersion: z.literal(SCHEMA_VERSION),
});
export type RunSnapshot = z.infer<typeof RunSnapshot>;

export const BranchNode = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  createdAt: z.string(),
  baseSnapshotId: z.string(),
  forkEventSeq: z.number().nullable(),
  metadata: z.record(z.any()).default({}),
  schemaVersion: z.literal(SCHEMA_VERSION),
});
export type BranchNode = z.infer<typeof BranchNode>;

export const EventType = z.enum([
  'SIGNAL_INGESTED',
  'DECISION_APPLIED',
  'PLACEMENT_ADDED',
  'ROAD_CLOSURE_SET',
  'SHELTER_OPEN',
  'GENERATOR_PREPOSITION',
  'HELICOPTER_STAGE',
  'RESOURCE_PLACEMENT_UPDATE',
  'TICK',
  'SNAPSHOT_CREATED',
  'NOTE',
]);
export type EventType = z.infer<typeof EventType>;

export const EventRecord = z.object({
  eventId: z.string(),
  runId: z.string(),
  branchId: z.string(),
  seqNo: z.number(),
  eventTime: z.string(),
  createdAt: z.string(),
  actor: z.string(),
  type: EventType,
  payload: z.record(z.any()),
  snapshotRef: z.string().optional(),
  modelVersion: z.string().optional(),
  prevHash: z.string().nullable(),
  hash: z.string(),
  schemaVersion: z.literal(SCHEMA_VERSION),
});
export type EventRecord = z.infer<typeof EventRecord>;

export const FeasibilityReport = z.object({
  ok: z.boolean(),
  severity: z.enum(['INFO', 'WARNING', 'BLOCK']),
  triggeredRules: z.array(z.string()),
  mitigation: z.array(
    z.object({
      rule: z.string(),
      suggestion: z.string(),
      severity: z.enum(['INFO', 'WARNING', 'BLOCK']),
    }),
  ),
});
export type FeasibilityReport = z.infer<typeof FeasibilityReport>;

export const SimulationTrace = z.object({
  traceId: z.string(),
  runId: z.string(),
  branchId: z.string(),
  snapshotId: z.string(),
  createdAt: z.string(),
  seed: z.number(),
  modelVersions: z.record(z.string()),
  outputHash: z.string(),
  stats: z.record(z.any()),
  metadata: z.record(z.any()),
});
export type SimulationTrace = z.infer<typeof SimulationTrace>;
