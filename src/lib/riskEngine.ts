import type { HealthProfile, DailyLog, EnvironmentData, RiskFactor, Recommendation } from './types';

export interface RiskInput {
  profile: Pick<HealthProfile, 'age' | 'sex' | 'conditions' | 'family_history'>;
  log: Pick<DailyLog, 'sleep_hours' | 'steps' | 'reported_symptoms'> & Partial<Pick<DailyLog, 'bp_systolic' | 'bp_diastolic' | 'blood_sugar' | 'anxiety_level'>> | null;
  env: EnvironmentData;
  previousScore?: number | null;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function computeRiskScore(input: RiskInput): {
  score: number;
  factors: RiskFactor[];
  recommendations: Recommendation[];
} {
  const { profile, log, env } = input;
  const factors: RiskFactor[] = [];
  let total = 0;

  // Baseline population risk
  factors.push({
    label: 'Population baseline',
    value: 20,
    detail: 'General baseline risk applied to every individual.',
    source: 'General public-health guidance',
  });
  total += 20;

  // Age — +0.3 per year over 40
  if (profile.age > 40) {
    const ageImpact = Math.round((profile.age - 40) * 0.3 * 10) / 10;
    factors.push({
      label: 'Age',
      value: ageImpact,
      detail: `${profile.age} years — non-modifiable risk factor for chronic conditions.`,
      source: 'WHO age-related risk guidance',
    });
    total += ageImpact;
  }

  // Existing conditions — +10 each
  for (const cond of profile.conditions) {
    factors.push({
      label: `Condition: ${cond}`,
      value: 10,
      detail: `Existing ${cond} compounds overall health risk.`,
      source: 'Clinical risk literature',
    });
    total += 10;
  }

  // Family history — +5 each
  for (const fh of profile.family_history) {
    factors.push({
      label: `Family history: ${fh}`,
      value: 5,
      detail: `Genetic predisposition to ${fh}.`,
      source: 'Hereditary risk guidance',
    });
    total += 5;
  }

  // Air quality (India NAQI, CPCB) — Moderate: +5, Poor: +10, Very Poor/Severe: +15
  if (env.aqi > 300) {
    factors.push({
      label: 'Air quality',
      value: 15,
      detail: `${env.category} air (NAQI ${env.aqi}, ${env.dominant_pollutant}).`,
      source: 'CPCB National AQI & WHO air quality guidance',
    });
    total += 15;
  } else if (env.aqi > 200) {
    factors.push({
      label: 'Air quality',
      value: 10,
      detail: `Poor air (NAQI ${env.aqi}, ${env.dominant_pollutant}) — ${env.category}.`,
      source: 'CPCB National AQI & WHO air quality guidance',
    });
    total += 10;
  } else if (env.aqi > 100) {
    factors.push({
      label: 'Air quality',
      value: 5,
      detail: `Moderately polluted air (NAQI ${env.aqi}, ${env.dominant_pollutant}) — breathing discomfort for people with lung or heart disease.`,
      source: 'CPCB National AQI & WHO air quality guidance',
    });
    total += 5;
  }

  // Sleep — under 6h: +8, 7h+: -4
  if (log?.sleep_hours != null) {
    if (log.sleep_hours < 6) {
      factors.push({
        label: 'Sleep',
        value: 8,
        detail: `${log.sleep_hours}h sleep — below the recommended 7+ hours.`,
        source: 'CDC sleep recommendations',
      });
      total += 8;
    } else if (log.sleep_hours >= 7) {
      factors.push({
        label: 'Sleep',
        value: -4,
        detail: `${log.sleep_hours}h sleep — meets healthy range.`,
        source: 'CDC sleep recommendations',
      });
      total -= 4;
    }
  }

  // Steps — under 5,000: +6, 8,000+: -5
  if (log?.steps != null) {
    if (log.steps < 5000) {
      factors.push({
        label: 'Physical activity',
        value: 6,
        detail: `${log.steps.toLocaleString('en-IN')} steps — below 5,000.`,
        source: 'WHO physical-activity guidance',
      });
      total += 6;
    } else if (log.steps >= 8000) {
      factors.push({
        label: 'Physical activity',
        value: -5,
        detail: `${log.steps.toLocaleString('en-IN')} steps — meets active range.`,
        source: 'WHO physical-activity guidance',
      });
      total -= 5;
    }
  }

  // Reported symptoms — +7 each (excluding 'None')
  const realSymptoms = (log?.reported_symptoms ?? []).filter((s) => s.toLowerCase() !== 'none');
  for (const sym of realSymptoms) {
    factors.push({
      label: `Symptom: ${sym}`,
      value: 7,
      detail: `Reported ${sym.toLowerCase()} flagged for monitoring.`,
      source: 'Self-reported symptom monitoring',
    });
    total += 7;
  }

  // Blood pressure (AHA categories) — stage 2: +10, stage 1: +5
  if (log?.bp_systolic != null && log?.bp_diastolic != null) {
    const { bp_systolic: s, bp_diastolic: d } = log;
    if (s >= 140 || d >= 90) {
      factors.push({ label: 'Blood pressure', value: 10, detail: `${s}/${d} mmHg — in the stage 2 hypertension range.`, source: 'AHA blood pressure categories' });
      total += 10;
    } else if (s >= 130 || d >= 80) {
      factors.push({ label: 'Blood pressure', value: 5, detail: `${s}/${d} mmHg — in the stage 1 hypertension range.`, source: 'AHA blood pressure categories' });
      total += 5;
    }
  }

  // Fasting blood sugar (ADA) — 126+: +10, 100–125: +5
  if (log?.blood_sugar != null) {
    const g = log.blood_sugar;
    if (g >= 126) {
      factors.push({ label: 'Blood sugar', value: 10, detail: `Fasting ${g} mg/dL — in the diabetic range.`, source: 'ADA diagnostic criteria' });
      total += 10;
    } else if (g >= 100) {
      factors.push({ label: 'Blood sugar', value: 5, detail: `Fasting ${g} mg/dL — in the pre-diabetic range.`, source: 'ADA diagnostic criteria' });
      total += 5;
    }
  }

  // Self-reported anxiety (1–10) — 7+: +6, 4–6: +3
  if (log?.anxiety_level != null) {
    const a = log.anxiety_level;
    if (a >= 7) {
      factors.push({ label: 'Anxiety', value: 6, detail: `Self-reported anxiety ${a}/10 — high.`, source: 'Self-reported wellbeing monitoring' });
      total += 6;
    } else if (a >= 4) {
      factors.push({ label: 'Anxiety', value: 3, detail: `Self-reported anxiety ${a}/10 — moderate.`, source: 'Self-reported wellbeing monitoring' });
      total += 3;
    }
  }

  // UV index — high UV adds a small respiratory/skin stress factor
  if (env.uvIndex >= 8) {
    factors.push({
      label: 'UV exposure',
      value: 4,
      detail: `High UV index (${env.uvIndex}) — limit direct sun exposure.`,
      source: 'WHO UV index guidance',
    });
    total += 4;
  }

  return {
    score: clampScore(total),
    factors,
    recommendations: buildRecommendations(env, log, profile),
  };
}

function buildRecommendations(
  env: EnvironmentData,
  log: RiskInput['log'],
  profile: RiskInput['profile'],
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (env.aqi > 100) {
    recs.push({
      title: 'Limit outdoor exertion; add antioxidant-rich foods',
      reason: `NAQI ${env.aqi} (${env.category}) raises oxidative stress. Berries, leafy greens and turmeric help counter inhaled pollutant damage.`,
      source: 'CPCB NAQI health advisory; nutrition guidance on oxidative stress',
      category: 'environment',
    });
  }

  if (env.uvIndex >= 8) {
    recs.push({
      title: 'Moderate Vitamin D intake on high-UV days',
      reason: `UV index ${env.uvIndex} is high — skin synthesises Vitamin D quickly, so a smaller supplemental nudge is appropriate.`,
      source: 'NIH Office of Dietary Supplements',
      category: 'supplement',
    });
  }

  if (log?.sleep_hours != null && log.sleep_hours < 6) {
    recs.push({
      title: 'Prioritise an earlier bedtime tonight',
      reason: `Last night's ${log.sleep_hours}h sleep is below the 7h minimum. Aim to wind down 30 minutes earlier.`,
      source: 'CDC sleep recommendations',
      category: 'lifestyle',
    });
  }

  if (log?.steps != null && log.steps < 5000) {
    recs.push({
      title: 'Add a 15-minute walk today',
      reason: `${log.steps.toLocaleString('en-IN')} steps is well below the 5,000 daily baseline. A short walk lifts activity without overexertion on ${env.category.toLowerCase()} air days.`,
      source: 'WHO physical-activity guidance',
      category: 'lifestyle',
    });
  }

  if (profile.conditions.includes('Diabetes') || profile.family_history.includes('Diabetes')) {
    recs.push({
      title: 'Prioritise low-glycaemic whole grains and legumes',
      reason: 'Diabetes risk is present — whole grains, legumes and bitter gourd help stabilise blood sugar.',
      source: 'ADA dietary guidance; Indian Council of Medical Research',
      category: 'diet',
    });
  }

  if (profile.conditions.includes('Hypertension') || profile.family_history.includes('Hypertension')) {
    recs.push({
      title: 'Reduce added salt; add potassium-rich foods',
      reason: 'Hypertension risk is present — bananas, spinach and lentils support healthy blood pressure.',
      source: 'WHO sodium guidance; DASH diet principles',
      category: 'diet',
    });
  }

  if (log?.bp_systolic != null && log?.bp_diastolic != null && (log.bp_systolic >= 130 || log.bp_diastolic >= 80)) {
    recs.push({
      title: 'Recheck blood pressure and speak to your doctor',
      reason: `${log.bp_systolic}/${log.bp_diastolic} mmHg is above the normal range. Repeat the reading rested, and share the trend with a clinician.`,
      source: 'AHA blood pressure guidance',
      category: 'lifestyle',
    });
  }

  if (log?.blood_sugar != null && log.blood_sugar >= 100) {
    recs.push({
      title: 'Cut refined sugar and discuss a glucose check',
      reason: `Fasting ${log.blood_sugar} mg/dL is above 100. Prefer whole grains and legumes, and ask a clinician about an HbA1c test.`,
      source: 'ADA dietary and diagnostic guidance',
      category: 'diet',
    });
  }

  if (log?.anxiety_level != null && log.anxiety_level >= 7) {
    recs.push({
      title: 'Try 5 minutes of slow breathing and talk to someone',
      reason: `Anxiety reported at ${log.anxiety_level}/10. Slow breathing, a short walk, or talking with a family member or caregiver can help.`,
      source: 'General wellbeing guidance',
      category: 'lifestyle',
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: 'Keep up current habits',
      reason: 'No major risk flags detected today. Maintain your routine and continue tracking.',
      source: 'General preventive-health guidance',
      category: 'lifestyle',
    });
  }

  return recs;
}

export function riskLabel(score: number): { label: string; color: string } {
  if (score < 30) return { label: 'Low risk', color: 'emerald' };
  if (score < 50) return { label: 'Moderate risk', color: 'amber' };
  if (score < 70) return { label: 'Elevated risk', color: 'orange' };
  return { label: 'High risk', color: 'red' };
}
