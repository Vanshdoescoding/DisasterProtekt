import { CityStateDTO, BranchNodeDTO } from './types';

export const MOCK_CITY_STATE: CityStateDTO = {
    id: 'phoenix_v1',
    name: 'Phoenix, AZ',
    timestamp: new Date().toISOString(),
    hazards: [
        {
            id: 'h1',
            type: 'heat',
            location: '892a3064c97ffff', // H3 index
            value: 42, // Celsius
            uncertainty: 'expected',
            timestamp: new Date().toISOString(),
        },
        {
            id: 'f1',
            type: 'flood',
            location: '892a3064c97ffff',
            value: 0.1,
            uncertainty: 'high',
            timestamp: new Date().toISOString(),
        }
    ],
    activeBranchId: 'b_baseline',
};

export const MOCK_BRANCHES: BranchNodeDTO[] = [
    {
        id: 'b_baseline',
        parentId: null,
        name: 'Baseline Forecast',
        createdAt: new Date().toISOString(),
        divergenceTime: 0,
        events: [],
        isBaseline: true,
    },
    {
        id: 'b_intervention_1',
        parentId: 'b_baseline',
        name: 'Cooling Centers Deployed',
        createdAt: new Date().toISOString(),
        divergenceTime: 60, // 30 mins in (assuming 2 ticks/min? no 1 tick/min usually, or whatever)
        events: ['evt_placement_1'],
        isBaseline: false,
    }
];
