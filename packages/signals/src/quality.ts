import { SignalQuality } from '@dp/domain';

export interface QualityInputs {
  observedAt: Date;
  asOf: Date;
  requiredFields: string[];
  payload: Record<string, unknown>;
  reliabilityScore?: number;
  latencyMs?: number;
  validationErrors?: string[];
}

export function scoreQuality(input: QualityInputs): SignalQuality {
  const missingFields = input.requiredFields.filter((field) => !(field in input.payload));
  const completeness =
    input.requiredFields.length === 0
      ? 1
      : (input.requiredFields.length - missingFields.length) / input.requiredFields.length;
  const freshnessSec = Math.max(0, (input.asOf.getTime() - input.observedAt.getTime()) / 1000);
  return {
    freshnessSec,
    completeness,
    reliabilityScore: input.reliabilityScore ?? 0.7,
    latencyMs: input.latencyMs ?? 0,
    missingFields,
    validationErrors: input.validationErrors ?? [],
  };
}
