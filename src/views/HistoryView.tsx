import { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, X, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { riskLabel } from '@/lib/riskEngine';
import { colorsForScore } from '@/lib/colors';
import { LineChart, BarChart } from '@/components/Charts';
import type { RiskScore } from '@/lib/types';

export function HistoryView() {
  const { scores } = useApp();
  const [selected, setSelected] = useState<RiskScore | null>(null);

  if (scores.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Risk History</h2>
          <p className="text-sm text-slate-500 mt-0.5">Every assessment, with full factor breakdown.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-sm text-slate-400">No assessments yet. Recompute from the dashboard to start building history.</p>
        </div>
      </div>
    );
  }

  const trendData = [...scores].reverse().map((s, i) => ({
    label: scores.length > 7 ? `${i + 1}` : new Date(s.scored_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: s.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Risk History</h2>
        <p className="text-sm text-slate-500 mt-0.5">Every assessment, with full factor breakdown.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Score over time ({scores.length})</p>
        <LineChart data={trendData} color={colorsForScore(scores[0]?.risk_score).stroke} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">All assessments</p>
          <p className="text-xs text-slate-400 mt-0.5">Tap any row to see its factor breakdown.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {scores.map((s) => {
            const label = riskLabel(s.risk_score);
            const c = colorsForScore(s.risk_score);
            const delta = s.previous_score != null ? Math.round((s.risk_score - s.previous_score) * 10) / 10 : null;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition text-left"
              >
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center text-white font-bold shrink-0`}>
                  {Math.round(s.risk_score)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{label.label}</p>
                  <p className="text-xs text-slate-400">{new Date(s.scored_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · AQI {Math.round(s.aqi ?? 0)} · {s.dominant_pollutant}</p>
                </div>
                {delta != null && (
                  <span className={`text-xs font-medium inline-flex items-center gap-1 ${delta > 0 ? 'text-red-500' : delta < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {selected && <DetailDrawer score={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailDrawer({ score, onClose }: { score: RiskScore; onClose: () => void }) {
  const c = colorsForScore(score.risk_score);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-[fadeIn_0.2s_ease]">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assessment detail</p>
            <p className="text-sm font-semibold text-slate-800">{new Date(score.scored_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className={`rounded-2xl p-5 bg-gradient-to-br ${c.bg} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">Risk score</p>
                <p className="text-4xl font-bold mt-1">{Math.round(score.risk_score)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide opacity-80">AQI</p>
                <p className="text-2xl font-bold mt-1">{Math.round(score.aqi ?? 0)}</p>
                <p className="text-xs opacity-80">{score.dominant_pollutant}</p>
              </div>
            </div>
            {score.previous_score != null && (
              <p className="text-xs opacity-80 mt-3">Previous score: {score.previous_score}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Factor contributions</p>
            <BarChart
              data={score.factor_breakdown.map((f) => ({ label: f.label, value: f.value, positive: f.value >= 0 }))}
            />
          </div>

          <div className="space-y-2.5">
            {score.factor_breakdown.map((f, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className={`shrink-0 w-10 text-right font-bold text-sm ${f.value >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {f.value > 0 ? '+' : ''}{f.value}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{f.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">Source: {f.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
