import { describe, expect, it } from 'vitest';
import { clampTick, deriveSimTime, MINUTES_PER_TICK } from './timelineSelectors';

describe('timelineSelectors', () => {
    it('clamps tick within bounds', () => {
        expect(clampTick(-3, 60)).toBe(0);
        expect(clampTick(120, 60)).toBe(60);
    });

    it('derives simulated time based on tick', () => {
        const base = new Date('2026-02-06T00:00:00.000Z');
        const result = deriveSimTime(base, 2, MINUTES_PER_TICK);
        expect(result.toISOString()).toBe('2026-02-06T00:20:00.000Z');
    });
});
