import { useMemo } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  max?: number;
}

export function LineChart({ data, height = 160, color = '#0ea5e9', max = 100 }: LineChartProps) {
  const width = 520;
  const padding = { top: 12, right: 12, bottom: 24, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => {
      const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = padding.top + innerH - (d.value / max) * innerH;
      return { x, y, ...d };
    });
  }, [data, innerW, innerH]);

  const path = points.length > 1
    ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';
  const areaPath = points.length > 1
    ? `M ${points[0].x},${padding.top + innerH} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${padding.top + innerH} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((g) => {
        const y = padding.top + innerH - (g / max) * innerH;
        return (
          <g key={g}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={g === 0 ? '0' : '3 3'} />
            <text x={padding.left - 6} y={y + 4} fontSize="10" fill="#94a3b8" textAnchor="end">{g}</text>
          </g>
        );
      })}
      {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          {points.length <= 10 && (
            <text x={p.x} y={height - 6} fontSize="9" fill="#94a3b8" textAnchor="middle">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number; positive: boolean }[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = (Math.abs(d.value) / maxAbs) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-xs text-slate-600 truncate" title={d.label}>{d.label}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: d.positive
                    ? 'linear-gradient(90deg, #f97316, #ef4444)'
                    : 'linear-gradient(90deg, #10b981, #059669)',
                }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-slate-700">
                {d.value > 0 ? '+' : ''}{d.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
