import { useMemo } from 'react';
import { Plus, RotateCcw, TrendingDown, TrendingUp, Minus, Activity, BookOpen, Brain } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { riskLabel } from '@/lib/riskEngine';
import { colorsForScore } from '@/lib/colors';
import { LineChart } from '@/components/Charts';
import { EnvironmentPanel } from '@/components/EnvironmentPanel';
import { annPredict, annMeta, buildFeatures } from '@/lib/annModel';

export function DashboardView({ onNavigate }: { onNavigate: (v: 'logs' | 'history' | 'recommendations') => void }) {
  const { profile, env, latestScore, latestLog, scores, runAssessment, openLogModal } = useApp();
  const annScore = useMemo(
    () => annPredict(buildFeatures(profile, latestLog, env)),
    [profile, latestLog, env],
  );
  const annLabel = riskLabel(annScore);
  const annColors = colorsForScore(annScore);
  const label = latestScore ? riskLabel(latestScore.risk_score) : { label: '—', color: 'slate' };
  const c = colorsForScore(latestScore?.risk_score);

  const delta = latestScore?.previous_score != null
    ? Math.round((latestScore.risk_score - latestScore.previous_score) * 10) / 10
    : null;

  const trendData = [...scores].reverse().map((s, i) => ({
    label: scores.length > 7 ? `${i + 1}` : new Date(s.scored_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: s.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runAssessment()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" /> Recompute
          </button>
          <button
            onClick={openLogModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Log today
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(latestScore ? latestScore.risk_score : 0) * 3.27} 327`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c.hex} />
                    <stop offset="100%" stopColor={c.hexDark} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${c.text}`}>{latestScore ? Math.round(latestScore.risk_score) : '—'}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">out of 100</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current risk score</p>
              <p className={`text-xl font-bold ${c.text} mt-0.5`}>{label.label}</p>
              {delta != null && (
                <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100">
                  {delta > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : delta < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <Minus className="w-3 h-3 text-slate-400" />}
                  <span className={delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-500'}>
                    {delta > 0 ? `+${delta}` : delta} vs previous
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Combines your health profile, today's logged data, and live air quality for {profile.city}.
                Every point is traceable.
              </p>
              <div className="flex gap-4 mt-3">
                <button onClick={() => onNavigate('recommendations')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition inline-flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> See actions
                </button>
                <button onClick={() => onNavigate('history')} className="text-sm font-medium text-slate-500 hover:text-slate-700 transition inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Full history
                </button>
              </div>
            </div>
          </div>
        </div>

        <EnvironmentPanel env={env} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Neural network risk model
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
              A {annMeta.architecture} feed-forward ANN ({annMeta.parameters.toLocaleString('en-IN')} weights) scores the same
              14 inputs: profile, vitals, sleep, activity and live air quality.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-3xl font-bold ${annColors.text}`}>{Math.round(annScore)}</p>
            <p className={`text-xs font-semibold ${annColors.text}`}>{annLabel.label}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-sm font-bold text-slate-800">{latestScore ? Math.abs(Math.round((annScore - latestScore.risk_score) * 10) / 10) : '—'}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">pts vs rule engine</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-sm font-bold text-slate-800">{annMeta.test_mae} pts</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">test MAE</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-sm font-bold text-slate-800">{annMeta.test_r2}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">test R²</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Trained on {annMeta.train_samples.toLocaleString('en-IN')} {annMeta.data}. It will be retrained on real collected data.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Risk score trend ({scores.length} assessments)</p>
        {trendData.length > 0 ? (
          <LineChart data={trendData} color={c.stroke} />
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">No assessments yet — click "Recompute" to generate one.</p>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        EcoVital is a decision-support prototype. Scores use placeholder guideline-based weights and are not a substitute for medical advice.
      </p>
    </div>
  );
}
