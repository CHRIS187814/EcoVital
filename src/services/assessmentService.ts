import { fetchLiveEnvironment } from '@/lib/liveEnv';
import { computeRiskScore, type RiskInput } from '@/lib/riskEngine';
import { scoreService, logService } from '@/services/dataService';
import type { HealthProfile, EnvironmentData, RiskScore } from '@/lib/types';

export const assessmentService = {
  /** Compute and persist a fresh risk score for the profile + latest log + live environment. */
  async run(profile: HealthProfile): Promise<{ score: RiskScore; env: EnvironmentData }> {
    const env = await fetchLiveEnvironment(profile.city, profile.lat, profile.lon);
    const latestLog = await logService.latest();
    const prevScore = await scoreService.latest();

    const result = computeRiskScore({
      profile,
      log: latestLog,
      env,
      previousScore: prevScore?.risk_score ?? null,
    } satisfies RiskInput);

    const inserted = await scoreService.insert({
      risk_score: result.score,
      aqi: env.aqi,
      dominant_pollutant: env.dominant_pollutant,
      factor_breakdown: result.factors,
      recommendations: result.recommendations,
      previous_score: prevScore?.risk_score ?? null,
    });

    return { score: inserted, env };
  },
};
