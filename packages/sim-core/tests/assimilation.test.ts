import { describe, it, expect } from 'vitest';
import { exponentialSmooth } from '@dp/sim-core';

describe('exponentialSmooth', () => {
  it('converges deterministically', () => {
    const a = exponentialSmooth(null, 10, 0.6);
    const b = exponentialSmooth(a, 12, 0.6);
    const c = exponentialSmooth(b, 11, 0.6);
    expect(a.value).toBe(10);
    expect(b.value).toBeGreaterThan(10);
    expect(c.value).toBeGreaterThan(10);
  });
});
