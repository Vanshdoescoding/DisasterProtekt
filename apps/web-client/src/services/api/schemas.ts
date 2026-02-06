import { z } from 'zod';

export const ConfidenceSchema = z.enum(['low', 'expected', 'high']);

export const SignalSchema = z.object({
    id: z.string(),
    type: z.enum(['heat', 'flood', 'power', 'traffic', 'hospital']),
    location: z.string(),
    value: z.number(),
    uncertainty: ConfidenceSchema,
    timestamp: z.string().datetime(),
});

export const OpPlacementSchema = z.object({
    id: z.string(),
    type: z.enum(['helicopter', 'ambulance', 'fire', 'police', 'shelter', 'barrier']),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    timestamp: z.string().datetime(),
    status: z.enum(['planned', 'deployed', 'active', 'completed']),
});

export const BranchNodeSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    createdAt: z.string().datetime(),
    divergenceTime: z.number(),
    events: z.array(z.string()),
    isBaseline: z.boolean(),
});

export const ClipMetadataSchema = z.object({
    id: z.string(),
    location: z.string(),
    timestamp: z.string().datetime(),
    url: z.string().url(),
    thumbnailUrl: z.string().url(),
    relatedRunId: z.string(),
    confidence: z.number().min(0).max(1),
});
