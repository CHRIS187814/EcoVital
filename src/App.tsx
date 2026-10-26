import { useEffect, useState, useCallback } from 'react';
import type { HealthProfile, RiskScore, EnvironmentData, DailyLog, NewLog } from '@/lib/types';
import { profileService, logService, scoreService } from '@/services/dataService';
import { assessmentService } from '@/services/assessmentService';
import { getEnvironmentForCity } from '@/lib/indiaData';
import { fetchLiveEnvironment } from '@/lib/liveEnv';
import { supabaseConfigured } from '@/lib/supabase';
import { Onboarding } from '@/components/Onboarding';
import { SidebarLayout, type ViewId } from '@/components/SidebarLayout';
import { DashboardView } from '@/views/DashboardView';
import { LogsView } from '@/views/LogsView';
import { HistoryView } from '@/views/HistoryView';
import { RecommendationsView } from '@/views/RecommendationsView';
import { LogModal } from '@/components/LogModal';
import { AppContext, type AppData } from '@/components/AppContext';

const PROFILE_KEY = 'ecovital_profile_id';

export default function App() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [env, setEnv] = useState<EnvironmentData | null>(null);
  const [latestScore, setLatestScore] = useState<RiskScore | null>(null);
  const [latestLog, setLatestLog] = useState<DailyLog | null>(null);
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewId>('dashboard');
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchAll = useCallback(async (p: HealthProfile) => {
    const [log, recent] = await Promise.all([
      logService.latest(),
      scoreService.recent(30),
    ]);
    setLatestLog(log);
    setScores(recent);
    setLatestScore(recent[0] ?? null);
    setEnv(await fetchLiveEnvironment(p.city, p.lat, p.lon));
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return; }
    (async () => {
      const storedId = localStorage.getItem(PROFILE_KEY);
      if (storedId) {
        try {
          const p = await profileService.get(storedId);
          if (p) {
            setProfile(p);
            await fetchAll(p);
          }
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      }
      setLoading(false);
    })();
  }, [fetchAll]);

  const runAssessment = useCallback(async (override?: HealthProfile) => {
    const target = override ?? profile;
    if (!target) return;
    const result = await assessmentService.run(target);
    setLatestScore(result.score);
    setEnv(result.env);
    setScores((prev) => [result.score, ...prev].slice(0, 30));
    const log = await logService.latest();
    setLatestLog(log);
  }, [profile]);

  const refresh = useCallback(async () => {
    if (!profile) return;
    await fetchAll(profile);
  }, [profile, fetchAll]);

  const updateCity = useCallback(async (city: string) => {
    if (!profile) return;
    const updated = { ...profile, city };
    setProfile(updated);
    await profileService.updateCity(profile.id, city);
    setEnv(getEnvironmentForCity(city));
    await runAssessment(updated);
  }, [profile, runAssessment]);

  const handleOnboard = async (p: Omit<HealthProfile, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await profileService.create(p);
    localStorage.setItem(PROFILE_KEY, created.id);
    setProfile(created);
    setEnv(getEnvironmentForCity(created.city));
    await runAssessment(created);
  };

  const handleReset = () => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setScores([]);
    setLatestScore(null);
    setLatestLog(null);
  };

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-lg font-bold text-slate-800">EcoVital is not configured</h1>
          <p className="text-sm text-slate-500 mt-2">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the hosting environment
            variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <Onboarding onComplete={handleOnboard} />;

  const handleSaveLog = async (data: NewLog) => {
    await logService.create(data);
    setShowLogModal(false);
    await refresh();
    await runAssessment();
  };

  const ctx: AppData = {
    profile,
    env: env ?? getEnvironmentForCity(profile.city),
    latestScore,
    latestLog,
    scores,
    loading: false,
    refresh,
    runAssessment,
    updateCity,
    openLogModal: () => setShowLogModal(true),
  };

  return (
    <AppContext.Provider value={ctx}>
      <SidebarLayout current={view} onNavigate={setView}>
        {view === 'dashboard' && <DashboardView onNavigate={setView} />}
        {view === 'logs' && <LogsView />}
        {view === 'history' && <HistoryView />}
        {view === 'recommendations' && <RecommendationsView />}
      </SidebarLayout>
      <LogModal open={showLogModal} onClose={() => setShowLogModal(false)} onSave={handleSaveLog} />
    </AppContext.Provider>
  );
}
