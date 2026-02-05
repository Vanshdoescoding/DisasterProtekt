import { describe, it, expect } from 'vitest';
import { MemoryEventStore } from '@dp/events';

describe('EventStore', () => {
  it('appends events and verifies hash chain', async () => {
    const store = new MemoryEventStore();

    const eventA = await store.append({
      runId: 'run-1',
      branchId: 'branch-1',
      eventTime: new Date('2024-02-01T00:00:00Z'),
      actor: 'test',
      type: 'NOTE',
      payload: { note: 'a' },
    });
    const eventB = await store.append({
      runId: 'run-1',
      branchId: 'branch-1',
      eventTime: new Date('2024-02-01T00:05:00Z'),
      actor: 'test',
      type: 'NOTE',
      payload: { note: 'b' },
    });

    expect(eventA.seqNo).toBe(1);
    expect(eventB.seqNo).toBe(2);

    const verify = await store.verifyChain('branch-1');
    expect(verify.ok).toBe(true);
  });
});
