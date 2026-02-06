export type ConfidenceLevel = 'low' | 'expected' | 'high';
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface CityStateDTO {
    id: string;
    name: string;
    timestamp: string; // ISO
    hazards: SignalDTO[];
    activeBranchId: string;
}

export interface SignalDTO {
    id: string;
    type: 'heat' | 'flood' | 'power' | 'traffic' | 'hospital';
    location: string; // H3 index or lat/lng string
    value: number;
    uncertainty: ConfidenceLevel;
    timestamp: string;
}

export interface OpPlacementDTO {
    id: string;
    type: 'helicopter' | 'ambulance' | 'fire' | 'police' | 'shelter' | 'barrier' | 'generator' | 'pump';
    location: { lat: number; lng: number };
    timestamp: string;
    status: 'planned' | 'deployed' | 'active' | 'completed';
}

export interface BranchNodeDTO {
    id: string;
    parentId: string | null;
    name: string;
    createdAt: string;
    divergenceTime: number; // Simulation tick
    events: string[]; // IDs of events in this branch
    isBaseline: boolean;
}

export interface SimulationResultDTO {
    runId: string;
    score: number;
    casualties: { min: number; avg: number; max: number };
    cost: { min: number; avg: number; max: number };
    provenance: string; // Model version ID
}

export interface ClipMetadataDTO {
    id: string;
    location: string;
    timestamp: string;
    url: string;
    thumbnailUrl: string;
    relatedRunId: string;
    confidence: number;
}
