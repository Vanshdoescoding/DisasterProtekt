import { type UUID } from 'crypto';

// Re-export specific types if we are using a shared types package, 
// otherwise define them here matching schemas_v1.py

export type AwareDatetime = string; // ISO 8601 string

export interface LedgerEventCreate {
    event_type: string;
    event_time: AwareDatetime;
    actor_type: string;
    actor_id: string;
    payload: Record<string, any>;
    causation_id?: string;
    correlation_id?: string;
    idempotency_key?: string;
}

export interface LedgerEventRead {
    event_id: string;
    run_id: string;
    branch_id: string;
    seq_no: number;
    event_type: string;
    event_time: AwareDatetime;
    actor_type: string;
    actor_id: string;
    payload: Record<string, any>;
    payload_canonical: string;
    payload_hash: string;
    causation_id?: string;
    correlation_id?: string;
    idempotency_key?: string;
    prev_event_hash?: string;
    event_hash: string;
}

export interface AuditTimelineEntry {
    category: string;
    occurred_at: AwareDatetime;
    object_id: string;
    summary: string;
}

export interface AuditTimelineResponse {
    run_id: string;
    entries: AuditTimelineEntry[];
}

export interface HealthResponse {
    status: 'ok' | 'degraded' | 'down'; // Inferred from "status: str" but usually these are the values
    warnings: string[];
    details: Record<string, any>;
}

export interface AuditMetricWhyResponse {
    metric_key: string;
    decision_events: string[]; // List of event IDs
    note: string;
}

// Defined in schemas_v1.py but endpoint might be missing or under construction
export interface BranchDiffResponse {
    baseline_branch_id: string;
    compare_branch_id: string;
    baseline_event_count: number;
    compare_event_count: number;
    delta_event_count: number;
}
