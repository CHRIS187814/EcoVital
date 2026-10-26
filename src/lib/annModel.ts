import weights from '@/lib/annWeights.json';
import type { HealthProfile, DailyLog, EnvironmentData } from '@/lib/types';

/**
 * Feed-forward neural network (14-32-16-1, ReLU/ReLU/sigmoid) trained offline by ml/train_ann.py.
 * Inference is a plain forward pass here, so the browser needs no ML library.
 */

interface Layer { W: number[][]; b: number[] }
const layers = weights.layers as Layer[];
const MEAN = weights.mean as number[];
const STD = weights.std as number[];

export const annMeta = weights.meta as {
  architecture: string;
  parameters: number;
  train_samples: number;
  test_mae: number;
  test_r2: number;
  band_accuracy: number;
  data: string;
};

// Neutral values for anything not logged (must match DEFAULTS in ml/train_ann.py)
const DEFAULTS = { sleep: 6.5, steps: 6500, sys: 115, dia: 75, sugar: 90, anxiety: 0 };

type AnnLog = Pick<DailyLog, 'sleep_hours' | 'steps' | 'reported_symptoms'> &
  Partial<Pick<DailyLog, 'bp_systolic' | 'bp_diastolic' | 'blood_sugar' | 'anxiety_level'>>;

export function buildFeatures(
  profile: Pick<HealthProfile, 'age' | 'sex' | 'conditions' | 'family_history'>,
  log: AnnLog | null,
  env: Pick<EnvironmentData, 'aqi' | 'uvIndex'>,
): number[] {
  const hasBp = log?.bp_systolic != null && log?.bp_diastolic != null;
  const symptoms = (log?.reported_symptoms ?? []).filter((s) => s.toLowerCase() !== 'none').length;
  // Order must match FEATURES in ml/train_ann.py
  return [
    profile.age,
    profile.sex === 'male' ? 1 : 0,
    profile.sex === 'female' ? 1 : 0,
    profile.conditions.length,
    profile.family_history.length,
    env.aqi,
    env.uvIndex,
    log?.sleep_hours ?? DEFAULTS.sleep,
    log?.steps ?? DEFAULTS.steps,
    hasBp ? (log!.bp_systolic as number) : DEFAULTS.sys,
    hasBp ? (log!.bp_diastolic as number) : DEFAULTS.dia,
    log?.blood_sugar ?? DEFAULTS.sugar,
    log?.anxiety_level ?? DEFAULTS.anxiety,
    symptoms,
  ];
}

/** Forward pass. Returns a 0-100 risk estimate. */
export function annPredict(features: number[]): number {
  let a = features.map((x, i) => (x - MEAN[i]) / STD[i]);
  layers.forEach((layer, li) => {
    const out = layer.b.slice();
    for (let j = 0; j < out.length; j++) {
      for (let i = 0; i < a.length; i++) out[j] += a[i] * layer.W[i][j];
    }
    const last = li === layers.length - 1;
    a = out.map((z) => (last ? 1 / (1 + Math.exp(-z)) : Math.max(0, z)));
  });
  return Math.round(a[0] * 1000) / 10;
}
