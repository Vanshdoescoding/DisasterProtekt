import { CityStateDTO, BranchNodeDTO, OpPlacementDTO } from './types';
import { MOCK_CITY_STATE, MOCK_BRANCHES } from './mockData';
import { logClientEvent } from '@/shared/logger';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
    async getCityState(_cityId: string): Promise<CityStateDTO> {
        void _cityId;
        await delay(500);
        // In real app, fetch(`/api/cities/${cityId}`)
        return MOCK_CITY_STATE;
    },

    async getBranches(_cityId: string): Promise<BranchNodeDTO[]> {
        void _cityId;
        await delay(300);
        return MOCK_BRANCHES;
    },

    async createPlacement(placement: OpPlacementDTO): Promise<void> {
        await delay(800);
        logClientEvent({
            type: 'placement_event',
            placementId: placement.id,
            resourceType: placement.type,
            branchId: 'baseline',
            valid: true
        });
        return;
    }
};
