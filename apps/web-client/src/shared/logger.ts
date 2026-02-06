export type ClientLogEvent =
    | { type: 'layer_toggle'; layerId: string; enabled: boolean }
    | { type: 'street_select'; locationId: string; source: 'map_click' | 'layer_pick' | 'search' }
    | { type: 'placement_event'; placementId: string; resourceType: string; branchId: string; valid: boolean }
    | { type: 'branch_switch'; branchId: string }
    | { type: 'clip_request'; requestId: string; locationId: string; simTick: number; trigger: 'selection' | 'change' }
    | { type: 'clip_state'; requestId: string; state: 'loading' | 'analyzing' | 'ready' | 'error' };

export function logClientEvent(event: ClientLogEvent) {
    const entry = {
        ...event,
        ts: new Date().toISOString(),
        scope: 'disasterprotek.iter4'
    };
    // Structured log for auditability. Keep as info for lightweight observability.
    console.info('[dp-log]', entry);
    return entry;
}
