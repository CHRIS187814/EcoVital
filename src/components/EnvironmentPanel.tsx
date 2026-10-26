import { useMemo } from 'react';
import { Wind, Droplets, Sun, Thermometer, AlertTriangle } from 'lucide-react';
import type { EnvironmentData } from '@/lib/types';

interface EnvPanelProps {
  env: EnvironmentData;
}

const categoryStyles: Record<string, { bg: string; text: string; ring: string }> = {
  Good: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  Satisfactory: { bg: 'bg-lime-50', text: 'text-lime-700', ring: 'ring-lime-200' },
  Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  Poor: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  'Very Poor': { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  Severe: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
};

export function EnvironmentPanel({ env }: EnvPanelProps) {
  const styles = useMemo(() => categoryStyles[env.category] ?? categoryStyles.Good, [env.category]);

  return (
    <div className={`rounded-2xl p-5 ${styles.bg} ring-1 ${styles.ring} border border-white/50`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {env.source === 'live' ? 'Live environment · Open-Meteo' : 'Estimated environment (offline)'}
          </p>
          <h3 className="text-lg font-bold text-slate-800 mt-0.5">{env.city}</h3>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${styles.text}`}>{Math.round(env.aqi)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">India NAQI (CPCB)</p>
        </div>
      </div>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.text} bg-white/70 mb-4`}>
        {env.aqi > 100 && <AlertTriangle className="w-3 h-3" />}
        {env.category} · {env.dominant_pollutant}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <EnvStat icon={<Wind className="w-4 h-4" />} label="PM2.5" value={`${env.pm25}`} unit="µg/m³" />
        <EnvStat icon={<Wind className="w-4 h-4" />} label="PM10" value={`${env.pm10}`} unit="µg/m³" />
        <EnvStat icon={<Thermometer className="w-4 h-4" />} label="Temp" value={`${env.temperature}`} unit="°C" />
        <EnvStat icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${env.humidity}`} unit="%" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Sun className="w-3.5 h-3.5" />
        UV index <span className="font-semibold text-slate-700">{env.uvIndex}</span>
        {env.uvIndex >= 8 && <span className="text-orange-600 font-medium">(high)</span>}
        {env.uvIndex >= 3 && env.uvIndex < 8 && <span className="text-amber-600 font-medium">(moderate)</span>}
        {env.uvIndex < 3 && <span className="text-emerald-600 font-medium">(low)</span>}
      </div>
    </div>
  );
}

function EnvStat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="bg-white/60 rounded-xl p-2.5">
      <div className="flex items-center gap-1 text-slate-500 mb-1">{icon}<span className="text-[10px] font-medium uppercase tracking-wide">{label}</span></div>
      <p className="text-sm font-bold text-slate-800">{value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span></p>
    </div>
  );
}
