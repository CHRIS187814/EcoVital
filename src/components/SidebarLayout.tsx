import { useState, type ReactNode } from 'react';
import { Heart, Activity, ClipboardList, History, Lightbulb, RotateCcw, X, Menu } from 'lucide-react';
import { CITY_NAMES } from '@/lib/indiaData';
import { riskLabel } from '@/lib/riskEngine';
import { useApp } from '@/components/AppContext';

export type ViewId = 'dashboard' | 'logs' | 'history' | 'recommendations';

interface LayoutProps {
  current: ViewId;
  onNavigate: (v: ViewId) => void;
  children: ReactNode;
}

const navItems: { id: ViewId; label: string; icon: ReactNode; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-5 h-5" />, description: 'Score & environment' },
  { id: 'logs', label: 'Health Logs', icon: <ClipboardList className="w-5 h-5" />, description: 'Daily tracking' },
  { id: 'history', label: 'Risk History', icon: <History className="w-5 h-5" />, description: 'Score timeline' },
  { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-5 h-5" />, description: 'Actions & advice' },
];

const scoreBg: Record<string, string> = {
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-500',
  orange: 'from-orange-500 to-red-500',
  red: 'from-red-500 to-rose-600',
  slate: 'from-slate-400 to-slate-600',
};

export function SidebarLayout({ current, onNavigate, children }: LayoutProps) {
  const { profile, updateCity, latestScore } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
          <Heart className="w-5 h-5 text-white" fill="white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">EcoVital</h1>
          <p className="text-[10px] text-slate-400 leading-tight">Explainable health risk</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${current === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className={current === item.id ? 'text-emerald-600' : 'text-slate-400'}>{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
            </div>
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100 space-y-3">
        {latestScore && (
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${scoreBg[riskLabel(latestScore.risk_score).color] ?? scoreBg.slate} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {Math.round(latestScore.risk_score)}
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-tight">Latest score</p>
              <p className="text-sm font-semibold text-slate-700 leading-tight">{new Date(latestScore.scored_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
        )}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">City</label>
          <select
            value={profile.city}
            onChange={(e) => updateCity(e.target.value)}
            className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-[10px] text-slate-400">Signed in as {profile.name}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-100 flex-col fixed inset-y-0">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white shadow-xl flex flex-col animate-[fadeIn_0.2s_ease]">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:pl-64 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 flex items-center justify-between px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-slate-800">EcoVital</span>
          </div>
          <button onClick={() => { localStorage.removeItem('ecovital_profile_id'); window.location.reload(); }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
