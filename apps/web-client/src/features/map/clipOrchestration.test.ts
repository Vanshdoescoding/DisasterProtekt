import { describe, expect, it } from 'vitest';
import { buildClipRequestKey, clipReducer, ClipState } from './clipOrchestration';

describe('clipOrchestration', () => {
    it('builds a stable request key', () => {
        const key = buildClipRequestKey({
            selectedStreetId: '7th/Main',
            branchId: 'baseline',
            simTick: 5,
            placementId: 'op_1'
        });
        expect(key).toBe('7th/Main|baseline|5|op_1');
    });

    it('transitions through clip states', () => {
        const initial: ClipState = { status: 'idle', clips: [] };
        const requested = clipReducer(initial, { type: 'REQUEST', requestId: 'req_1' });
        expect(requested.status).toBe('loading');

        const analyzing = clipReducer(requested, { type: 'ANALYZING', requestId: 'req_1' });
        expect(analyzing.status).toBe('analyzing');

        const success = clipReducer(analyzing, { type: 'SUCCESS', requestId: 'req_1', clips: [] });
        expect(success.status).toBe('ready');
    });
});
