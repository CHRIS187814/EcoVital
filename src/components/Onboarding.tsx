import { useState } from 'react';
import { Heart, MapPin, ChevronRight } from 'lucide-react';
import type { HealthProfile } from '@/lib/types';
import { CITY_NAMES, COMMON_CONDITIONS, COMMON_FAMILY_HISTORY } from '@/lib/indiaData';

interface OnboardingProps {
  onComplete: (profile: Omit<HealthProfile, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('other');
  const [city, setCity] = useState('Delhi');
  const [conditions, setConditions] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const finish = () => {
    const cityData = CITY_NAMES.includes(city) ? city : 'Delhi';
    onComplete({
      name: name.trim() || 'User',
      age,
      sex,
      city: cityData,
      lat: 28.6692,
      lon: 77.4538,
      conditions,
      family_history: familyHistory,
    });
  };

  const steps = ['Identity', 'Health', 'History', 'Location'];
  const canNext = step === 0 ? name.trim().length > 0 : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/20">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">EcoVital</h1>
          <p className="text-sm text-slate-500 mt-1">Your personal, explainable health-risk companion</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <p className={`text-[10px] mt-1.5 font-medium uppercase tracking-wide ${i <= step ? 'text-emerald-600' : 'text-slate-400'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
          {step === 0 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div>
                <label className="text-sm font-medium text-slate-700">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'other')}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-slate-800 bg-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <p className="text-sm text-slate-600">Any existing health conditions? (Optional)</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setConditions((p) => toggle(p, c))}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition border ${conditions.includes(c) ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {conditions.length > 0 && (
                <p className="text-xs text-slate-400">{conditions.length} condition(s) selected — each adds +10 risk</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <p className="text-sm text-slate-600">Family history of these conditions? (Optional)</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_FAMILY_HISTORY.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFamilyHistory((p) => toggle(p, c))}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition border ${familyHistory.includes(c) ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/30' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {familyHistory.length > 0 && (
                <p className="text-xs text-slate-400">{familyHistory.length} condition(s) selected — each adds +5 risk</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Select your city for live environment data</p>
              <div className="grid grid-cols-2 gap-2">
                {CITY_NAMES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition border ${city === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                Build my dashboard <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          This is a decision-support prototype, not medical advice.
        </p>
      </div>
    </div>
  );
}
