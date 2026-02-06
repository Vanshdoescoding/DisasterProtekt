import { create } from 'zustand';
import { BranchNodeDTO, OpPlacementDTO } from '@/services/api/types';
import { BranchForkedEvent, DomainEvent, PlacementCreatedEvent } from '@/entities/events';
import { logClientEvent } from '@/shared/logger';

interface BranchState {
    activeBranchId: string;
    branches: Record<string, BranchNodeDTO>;
    events: Record<string, DomainEvent[]>;
    lastPlacementId: string | null;
    runId: string | null;

    // Actions
    setRunId: (runId: string) => void;
    createPlacement: (placement: OpPlacementDTO) => void;
    setActiveBranch: (branchId: string) => void;
}

export const branchStoreDefaults = {
    activeBranchId: 'baseline',
    branches: {
        baseline: {
            id: 'baseline',
            parentId: null,
            name: 'Baseline Forecast',
            createdAt: new Date().toISOString(),
            divergenceTime: 0,
            events: [],
            isBaseline: true
        }
    },
    events: {
        baseline: []
    },
    lastPlacementId: null,
    runId: '00000000-0000-0000-0000-000000000000' // Default/Mock run ID
};

export const useBranchStore = create<BranchState>((set) => ({
    ...branchStoreDefaults,

    setRunId: (runId) => set({ runId }),
    setActiveBranch: (branchId) => {
        logClientEvent({ type: 'branch_switch', branchId });
        set({ activeBranchId: branchId });
    },

    createPlacement: (placement) => {
        set((state) => {
            const currentBranchId = state.activeBranchId;
            const now = Date.now();

            // If adding to baseline, auto-fork
            let targetBranchId = currentBranchId;
            let newBranches = { ...state.branches };
            let newEvents = { ...state.events };

            if (currentBranchId === 'baseline') {
                targetBranchId = `branch_${now}`;
                newBranches[targetBranchId] = {
                    id: targetBranchId,
                    parentId: 'baseline',
                    name: 'New Intervention Strategy',
                    createdAt: new Date().toISOString(),
                    divergenceTime: now,
                    events: [],
                    isBaseline: false
                };
                newEvents[targetBranchId] = [];

                const forkEvent: BranchForkedEvent = {
                    eventId: `evt_fork_${now}`,
                    checkpointId: now,
                    timestamp: now,
                    userId: 'user_1',
                    type: 'BRANCH_FORKED',
                    payload: {
                        parentBranchId: 'baseline',
                        newBranchId: targetBranchId,
                        forkTime: now,
                        reason: 'Placement added to baseline'
                    }
                };
                newEvents[targetBranchId] = [...newEvents[targetBranchId], forkEvent];
            }

            const event: PlacementCreatedEvent = {
                eventId: `evt_${now}`,
                checkpointId: now,
                timestamp: now,
                userId: 'user_1',
                type: 'PLACEMENT_CREATED',
                payload: {
                    asset: placement,
                    branchId: targetBranchId
                }
            };

            logClientEvent({
                type: 'placement_event',
                placementId: placement.id,
                resourceType: placement.type,
                branchId: targetBranchId,
                valid: true
            });

            return {
                branches: newBranches,
                events: {
                    ...newEvents,
                    [targetBranchId]: [...(newEvents[targetBranchId] || []), event]
                },
                activeBranchId: targetBranchId,
                lastPlacementId: placement.id
            };
        });
    }
}));
