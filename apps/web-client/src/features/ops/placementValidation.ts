import { OpPlacementDTO } from '@/services/api/types';

export type PlacementCandidate = Pick<OpPlacementDTO, 'type' | 'location'>;

export type PlacementValidationResult =
    | { valid: true }
    | { valid: false; reason: string };

const VALID_RESOURCE_TYPES: OpPlacementDTO['type'][] = [
    'helicopter',
    'ambulance',
    'fire',
    'police',
    'shelter',
    'barrier',
    'generator',
    'pump',
];

export function validatePlacement(candidate: PlacementCandidate): PlacementValidationResult {
    if (!VALID_RESOURCE_TYPES.includes(candidate.type)) {
        return { valid: false, reason: 'Unsupported resource type.' };
    }

    const { lat, lng } = candidate.location;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return { valid: false, reason: 'Invalid coordinates.' };
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { valid: false, reason: 'Placement outside supported map bounds.' };
    }

    return { valid: true };
}
