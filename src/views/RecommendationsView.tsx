import { useState, useMemo } from 'react';
import { Heart, Activity, Wind, Plus, ExternalLink, Filter } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import type { Recommendation } from '@/lib/types';

type Category = 'all' | Recommendation['category'];

const categoryConfig: Record<Recommendation['category'], { icon: React.ReactNode; color: string; label: string }> = {
  diet: { icon: <Heart className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 ring-emerald-200', label: 'Diet' },
  lifestyle: { icon: <Activity className="w-4 h-4" />, color: 'bg-sky-50 text-sky-600 ring-sky-200', label: 'Lifestyle' },
  supplement: { icon: <Plus className="w-4 h-4" />, color: 'bg-violet-50 text-violet-600 ring-violet-200', label: 'Supplement' },
  environment: { icon: <Wind className="w-4 h-4" />, color: 'bg-orange-50 text-orange-600 ring-orange-200', label: 'Environment' },
};

export function RecommendationsView() {
  const { latestScore } = useApp();
  const [filter, setFilter] = useState<Category>('all');

  const recs = latestScore?.recommendations ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return recs;
    return recs.filter((r) => r.category === filter);
  }, [recs, filter]);

  const categories: Category[] = ['all', 'diet', 'lifestyle', 'supplement', 'environment'];

  if (recs.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Recommendations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Personalised actions to lower your risk.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-sm text-slate-400">No recommendations yet. Recompute your score from the dashboard to generate them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Recommendations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Personalised actions to lower your risk, each with a reason and a cited guideline.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {categories.map((cat) => {
          const count = cat === 'all' ? recs.length : recs.filter((r) => r.category === cat).length;
          if (count === 0) return null;
          const isActive = filter === cat;
          const label = cat === 'all' ? 'All' : categoryConfig[cat].label;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition border whitespace-nowrap ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
              {label} <span className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {filtered.map((r, i) => {
          const cfg = categoryConfig[r.category];
          return (
            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ring-1 ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{r.reason}</p>
                  <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {r.source}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
