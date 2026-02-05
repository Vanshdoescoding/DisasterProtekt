export interface SmootherState {
  value: number;
  confidence: number;
}

export function exponentialSmooth(
  previous: SmootherState | null,
  measurement: number,
  alpha = 0.6,
): SmootherState {
  if (!previous) {
    return { value: measurement, confidence: 0.5 };
  }
  const value = alpha * measurement + (1 - alpha) * previous.value;
  const confidence = Math.min(1, previous.confidence + 0.05);
  return { value: Number(value.toFixed(4)), confidence: Number(confidence.toFixed(3)) };
}
