import { createContext, useContext } from 'react';
import type { HealthProfile, RiskScore, EnvironmentData, DailyLog } from '@/lib/types';

export interface AppData {
  profile: HealthProfile;
  env: EnvironmentData;
  latestScore: RiskScore | null;
  latestLog: DailyLog | null;
  scores: RiskScore[];
  loading: boolean;
  refresh: () => Promise<void>;
  runAssessment: (p?: HealthProfile) => Promise<void>;
  updateCity: (city: string) => Promise<void>;
  openLogModal: () => void;
}

export const AppContext = createContext<AppData | null>(null);

export function useApp(): AppData {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext provider');
  return ctx;
}
