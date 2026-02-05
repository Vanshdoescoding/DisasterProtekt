import { describe, it, expect } from 'vitest';
import { DecisionCompiler } from '@dp/decisions';

describe('DecisionCompiler', () => {
  it('blocks decisions when constraints fail', () => {
    const compiler = new DecisionCompiler({ generators: 0, helicopters: 0, shelters: 0 });
    const { report } = compiler.compileDecision({
      id: 'dec-1',
      type: 'OPEN_COOLING_CENTER',
      issuedAt: '2024-02-01T00:00:00Z',
      parameters: {},
      constraintsVersion: '0.1',
      schemaVersion: '0.1.0',
    });
    expect(report.ok).toBe(false);
    expect(report.triggeredRules.length).toBeGreaterThan(0);
  });
});
