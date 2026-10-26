import { riskLabel } from '@/lib/riskEngine';

export interface ColorSet { text: string; bg: string; ring: string; stroke: string; hex: string; hexDark: string; }

export const colorMap: Record<string, ColorSet> = {
  emerald: { text: 'text-emerald-600', bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-200', stroke: '#10b981', hex: '#10b981', hexDark: '#0d9488' },
  amber: { text: 'text-amber-600', bg: 'from-amber-500 to-orange-500', ring: 'ring-amber-200', stroke: '#f59e0b', hex: '#f59e0b', hexDark: '#ea580c' },
  orange: { text: 'text-orange-600', bg: 'from-orange-500 to-red-500', ring: 'ring-orange-200', stroke: '#f97316', hex: '#f97316', hexDark: '#dc2626' },
  red: { text: 'text-red-600', bg: 'from-red-500 to-rose-600', ring: 'ring-red-200', stroke: '#ef4444', hex: '#ef4444', hexDark: '#e11d48' },
  slate: { text: 'text-slate-600', bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-200', stroke: '#64748b', hex: '#64748b', hexDark: '#475569' },
};

export function colorsForScore(score: number | null | undefined): ColorSet {
  if (score == null) return colorMap.slate;
  return colorMap[riskLabel(score).color] ?? colorMap.slate;
}

export function scoreGradientStops(score: number | null | undefined): { from: string; to: string } {
  const c = colorsForScore(score);
  return { from: c.hex, to: c.hexDark };
}
