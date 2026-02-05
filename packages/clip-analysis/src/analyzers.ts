import path from 'node:path';
import { seededRandom } from '@dp/utils';

export interface ClipObservation {
  smoke_density: number;
  standing_water: number;
  traffic_density: number;
  confidence: number;
  method: string;
  model_version: string;
}

export interface ClipAnalyzer {
  analyze(filePath: string): Promise<ClipObservation>;
}

export class StubClipAnalyzer implements ClipAnalyzer {
  async analyze(filePath: string): Promise<ClipObservation> {
    const base = path.basename(filePath);
    const rng = seededRandom(base);
    return {
      smoke_density: Number(rng().toFixed(2)),
      standing_water: Number(rng().toFixed(2)),
      traffic_density: Number(rng().toFixed(2)),
      confidence: Number((0.6 + rng() * 0.3).toFixed(2)),
      method: 'stub',
      model_version: 'stub-0.1.0',
    };
  }
}
