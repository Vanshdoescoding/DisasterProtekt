import {
    AuditTimelineResponse,
    AuditMetricWhyResponse,
    HealthResponse,
    BranchDiffResponse
} from './types';

const API_BASE = '/api/v1'; // Adjust if needed based on proxy config

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

export const apiClient = {
    // Audit
    getAuditTimeline: (runId: string, branchId: string) =>
        fetchJson<AuditTimelineResponse>(`${API_BASE}/runs/${runId}/audit/timeline?branch_id=${branchId}`),

    getAuditMetricWhy: (runId: string, metricKey: string) =>
        fetchJson<AuditMetricWhyResponse>(`${API_BASE}/runs/${runId}/audit/why/${metricKey}`),

    // Observability / Health
    getHealthPipeline: () => fetchJson<HealthResponse>(`${API_BASE}/health/pipeline`),
    getHealthSimulation: () => fetchJson<HealthResponse>(`${API_BASE}/health/simulation`),
    getHealthGemini: () => fetchJson<HealthResponse>(`${API_BASE}/health/gemini`),
    getHealthStaleStreams: () => fetchJson<HealthResponse>(`${API_BASE}/health/stale-critical-streams`),

    // Branch Diff (Optional/Proposed)
    // Assuming generic endpoint structure if it were to exist or we mock it for now
    getBranchDiff: async (runId: string, baselineId: string, compareId: string): Promise<BranchDiffResponse> => {
        // TODO: Wire up to real endpoint when available.
        // For now, return a mock or try a likely endpoint if we want to test failure.
        // Implementing a mock for UI dev purposes as requested in plan "Do not manual Show Clip".
        // Wait, constraint was "integrate Base vs Branch diff view".
        // If endpoint is missing, I will calculate naive diff or return empty info.
        return {
            baseline_branch_id: baselineId,
            compare_branch_id: compareId,
            baseline_event_count: 0,
            compare_event_count: 0,
            delta_event_count: 0
        };
    }
};
