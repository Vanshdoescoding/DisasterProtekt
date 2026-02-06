import { OpPlacementDTO } from '../services/api/types';

export type EventType =
    | 'STREET_SELECTED'
    | 'PLACEMENT_CREATED'
    | 'DECISION_COMMITTED'
    | 'BRANCH_FORKED'
    | 'CLIP_REQUESTED'
    | 'CLIP_ANALYZED'
    | 'CLIP_ERRORED';

export interface BaseEvent {
    eventId: string;
    checkpointId: number; // Lamport timestamp or sequence
    timestamp: number;
    userId: string;
}

export interface StreetSelectedEvent extends BaseEvent {
    type: 'STREET_SELECTED';
    payload: {
        locationId: string; // H3 or ID
        viewSource: 'map_click' | 'layer_pick' | 'search';
    };
}

export interface PlacementCreatedEvent extends BaseEvent {
    type: 'PLACEMENT_CREATED';
    payload: {
        asset: OpPlacementDTO;
        branchId: string;
    };
}

export interface BranchForkedEvent extends BaseEvent {
    type: 'BRANCH_FORKED';
    payload: {
        parentBranchId: string;
        newBranchId: string;
        forkTime: number;
        reason: string;
    };
}

export interface ClipRequestedEvent extends BaseEvent {
    type: 'CLIP_REQUESTED';
    payload: {
        locationId: string;
        simTime: number;
        trigger: 'selection' | 'change';
    };
}

export interface ClipAnalyzedEvent extends BaseEvent {
    type: 'CLIP_ANALYZED';
    payload: {
        locationId: string;
        simTime: number;
        clipCount: number;
    };
}

export interface ClipErroredEvent extends BaseEvent {
    type: 'CLIP_ERRORED';
    payload: {
        locationId: string;
        simTime: number;
        reason: string;
    };
}

export type DomainEvent =
    | StreetSelectedEvent
    | PlacementCreatedEvent
    | BranchForkedEvent
    | ClipRequestedEvent
    | ClipAnalyzedEvent
    | ClipErroredEvent;
