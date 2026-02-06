import { useEffect, useReducer, useRef } from 'react';
import { ClipMetadataDTO } from '@/services/api/types';
import { logClientEvent } from '@/shared/logger';

export type ClipStatus = 'idle' | 'loading' | 'analyzing' | 'ready' | 'error';

export interface ClipState {
    status: ClipStatus;
    clips: ClipMetadataDTO[];
    error?: string;
    requestId?: string;
}

export type ClipAction =
    | { type: 'RESET' }
    | { type: 'REQUEST'; requestId: string }
    | { type: 'ANALYZING'; requestId: string }
    | { type: 'SUCCESS'; requestId: string; clips: ClipMetadataDTO[] }
    | { type: 'ERROR'; requestId: string; error: string };

export function clipReducer(state: ClipState, action: ClipAction): ClipState {
    switch (action.type) {
        case 'RESET':
            return { status: 'idle', clips: [] };
        case 'REQUEST':
            return { status: 'loading', clips: [], requestId: action.requestId };
        case 'ANALYZING':
            return { ...state, status: 'analyzing', requestId: action.requestId };
        case 'SUCCESS':
            return { status: 'ready', clips: action.clips, requestId: action.requestId };
        case 'ERROR':
            return { status: 'error', clips: [], requestId: action.requestId, error: action.error };
        default:
            return state;
    }
}

export function buildClipRequestKey(params: {
    selectedStreetId: string | null;
    branchId: string;
    simTick: number;
    placementId: string | null;
}) {
    if (!params.selectedStreetId) return null;
    return [
        params.selectedStreetId,
        params.branchId,
        params.simTick,
        params.placementId ?? 'none'
    ].join('|');
}

export function useClipOrchestration(params: {
    selectedStreetId: string | null;
    branchId: string;
    simTick: number;
    placementId: string | null;
}) {
    const [state, dispatch] = useReducer(clipReducer, { status: 'idle', clips: [] });
    const previousStreetId = useRef<string | null>(null);
    const requestKey = buildClipRequestKey(params);

    useEffect(() => {
        if (!requestKey || !params.selectedStreetId) {
            dispatch({ type: 'RESET' });
            return;
        }

        const locationId = params.selectedStreetId;
        const requestId = `clip_${Date.now()}`;
        const trigger = previousStreetId.current !== locationId ? 'selection' : 'change';
        previousStreetId.current = locationId;

        logClientEvent({
            type: 'clip_request',
            requestId,
            locationId,
            simTick: params.simTick,
            trigger
        });
        dispatch({ type: 'REQUEST', requestId });

        const analyzingTimer = setTimeout(() => {
            logClientEvent({ type: 'clip_state', requestId, state: 'analyzing' });
            dispatch({ type: 'ANALYZING', requestId });
        }, 600);

        const finalizeTimer = setTimeout(() => {
            const clips: ClipMetadataDTO[] = [
                {
                    id: `clip_${locationId}_${params.simTick}`,
                    location: locationId,
                    timestamp: new Date().toISOString(),
                    url: 'https://placehold.co/600x400/000000/FFF?text=Simulated+Clip',
                    thumbnailUrl: 'https://placehold.co/600x400/000000/FFF?text=Thumb',
                    relatedRunId: params.branchId,
                    confidence: 0.85
                }
            ];
            logClientEvent({ type: 'clip_state', requestId, state: 'ready' });
            dispatch({ type: 'SUCCESS', requestId, clips });
        }, 2200);

        return () => {
            clearTimeout(analyzingTimer);
            clearTimeout(finalizeTimer);
        };
    }, [requestKey, params.branchId, params.selectedStreetId, params.simTick, params.placementId]);

    return state;
}
