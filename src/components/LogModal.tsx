import { useState } from 'react';
import { X } from 'lucide-react';
import { COMMON_FOODS, COMMON_SYMPTOMS } from '@/lib/indiaData';
import type { NewLog } from '@/lib/types';

interface LogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewLog) => void;
}

export function LogModal({ open, onClose, onSave }: LogModalProps) {
  const [sleepHours, setSleepHours] = useState(7);
  const [steps, setSteps] = useState(8000);
  const [foods, setFoods] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [sugar, setSugar] = useState('');
  const [anxiety, setAnxiety] = useState(0);

  if (!open) return null;

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const num = (v: string): number | null => {
    const n = Number(v);
    return v.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
  };

  const save = () => {
    const bpSys = num(sys);
    const bpDia = num(dia);
    onSave({
      bp_systolic: bpSys != null && bpDia != null ? bpSys : null,
      bp_diastolic: bpSys != null && bpDia != null ? bpDia : null,
      blood_sugar: num(sugar),
      anxiety_level: anxiety > 0 ? anxiety : null,
      sleep_hours: sleepHours,
      steps,
      food_entries: foods,
      reported_symptoms: symptoms,
      notes,
    });
    setFoods([]);
    setSymptoms([]);
    setNotes('');
    setSys('');
    setDia('');
    setSugar('');
    setAnxiety(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Log today's health data</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Sleep (hours)</label>
              <input
                type="number"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Steps</label>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">BP systolic</label>
              <input type="number" inputMode="numeric" placeholder="120" value={sys} onChange={(e) => setSys(e.target.value)} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">BP diastolic</label>
              <input type="number" inputMode="numeric" placeholder="80" value={dia} onChange={(e) => setDia(e.target.value)} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Fasting sugar</label>
              <input type="number" inputMode="numeric" placeholder="mg/dL" value={sugar} onChange={(e) => setSugar(e.target.value)} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Anxiety today: <span className="font-semibold">{anxiety === 0 ? 'not recorded' : `${anxiety}/10`}</span>
            </label>
            <input type="range" min={0} max={10} step={1} value={anxiety} onChange={(e) => setAnxiety(Number(e.target.value))} className="mt-2 w-full accent-emerald-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Foods eaten today</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FOODS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFoods((p) => toggle(p, f))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${foods.includes(f) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Any symptoms today?</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSymptoms((p) => toggle(p, s))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${symptoms.includes(s) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything else to record..."
              className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={save}
            className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-md shadow-emerald-500/20"
          >
            Save & recompute risk
          </button>
        </div>
      </div>
    </div>
  );
}
