import { describe, expect, it } from 'vitest';
import { validatePlacement } from './placementValidation';

describe('validatePlacement', () => {
    it('accepts valid resource types within bounds', () => {
        const result = validatePlacement({
            type: 'fire',
            location: { lat: 33.45, lng: -112.07 }
        });
        expect(result.valid).toBe(true);
    });

    it('rejects invalid coordinates', () => {
        const result = validatePlacement({
            type: 'helicopter',
            location: { lat: 200, lng: 0 }
        });
        expect(result.valid).toBe(false);
    });
});
