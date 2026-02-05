import { seededRandom } from '@dp/utils';

export interface MonteCarloConfig {
  seed: string;
  samples: number;
  baseValue: number;
}

export function runMonteCarlo(config: MonteCarloConfig): {
  p10: number;
  p50: number;
  p90: number;
} {
  const rng = seededRandom(config.seed);
  const samples: number[] = [];
  for (let i = 0; i < config.samples; i += 1) {
    const noise = (rng() - 0.5) * 0.2;
    samples.push(config.baseValue * (1 + noise));
  }
  samples.sort((a, b) => a - b);
  const p10 = percentile(samples, 0.1);
  const p50 = percentile(samples, 0.5);
  const p90 = percentile(samples, 0.9);
  return { p10, p50, p90 };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const idx = Math.floor(p * (values.length - 1));
  return Number(values[idx].toFixed(4));
}
