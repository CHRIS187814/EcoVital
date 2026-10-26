import { useEffect, useState } from 'react';
import { Plus, Moon, Footprints, Apple, AlertCircle, StickyNote, HeartPulse, Droplet, Brain } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { logService } from '@/services/dataService';
import { LogModal } from '@/components/LogModal';
import type { DailyLog, NewLog } from '@/lib/types';

export function LogsView() {
  const { latestLog, refresh, runAssessment } = useApp();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const data = await logService.recent(30);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSave = async (data: NewLog) => {
    await logService.create(data);
    setShowModal(false);
    await Promise.all([fetchLogs(), refresh()]);
    await runAssessment();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Health Logs</h2>
          <p className="text-sm text-slate-500 mt-0.5">Daily tracking for vitals, sleep, steps, food, and symptoms.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-md shadow-emerald-500/20 self-start"
        >
          <Plus className="w-4 h-4" /> New entry
        </button>
      </div>

      {latestLog && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-3">Today's snapshot</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SnapshotCard icon={<Moon className="w-4 h-4" />} label="Sleep" value={`${latestLog.sleep_hours ?? '—'}h`} />
            <SnapshotCard icon={<Footprints className="w-4 h-4" />} label="Steps" value={latestLog.steps?.toLocaleString('en-IN') ?? '—'} />
            <SnapshotCard icon={<Apple className="w-4 h-4" />} label="Foods" value={`${latestLog.food_entries?.length ?? 0} items`} />
            <SnapshotCard icon={<AlertCircle className="w-4 h-4" />} label="Symptoms" value={`${(latestLog.reported_symptoms ?? []).filter((s) => s !== 'None').length} reported`} />
          </div>
          {(latestLog.bp_systolic != null || latestLog.blood_sugar != null || latestLog.anxiety_level != null) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <SnapshotCard icon={<HeartPulse className="w-4 h-4" />} label="Blood pressure" value={latestLog.bp_systolic != null && latestLog.bp_diastolic != null ? `${latestLog.bp_systolic}/${latestLog.bp_diastolic}` : '—'} />
              <SnapshotCard icon={<Droplet className="w-4 h-4" />} label="Blood sugar" value={latestLog.blood_sugar != null ? `${latestLog.blood_sugar} mg/dL` : '—'} />
              <SnapshotCard icon={<Brain className="w-4 h-4" />} label="Anxiety" value={latestLog.anxiety_level != null ? `${latestLog.anxiety_level}/10` : '—'} />
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Log history</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400 mb-3">No logs yet.</p>
            <button onClick={() => setShowModal(true)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Add your first entry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => {
              const realSymptoms = (log.reported_symptoms ?? []).filter((s) => s.toLowerCase() !== 'none');
              return (
                <div key={log.id} className="px-5 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{new Date(log.log_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Moon className="w-3 h-3" /> {log.sleep_hours ?? '—'}h</span>
                        <span className="inline-flex items-center gap-1"><Footprints className="w-3 h-3" /> {log.steps?.toLocaleString('en-IN') ?? '—'} steps</span>
                        {log.food_entries && log.food_entries.length > 0 && (
                          <span className="inline-flex items-center gap-1"><Apple className="w-3 h-3" /> {log.food_entries.join(', ')}</span>
                        )}
                        {log.bp_systolic != null && log.bp_diastolic != null && (
                          <span className="inline-flex items-center gap-1"><HeartPulse className="w-3 h-3" /> {log.bp_systolic}/{log.bp_diastolic} mmHg</span>
                        )}
                        {log.blood_sugar != null && (
                          <span className="inline-flex items-center gap-1"><Droplet className="w-3 h-3" /> {log.blood_sugar} mg/dL</span>
                        )}
                        {log.anxiety_level != null && (
                          <span className="inline-flex items-center gap-1"><Brain className="w-3 h-3" /> anxiety {log.anxiety_level}/10</span>
                        )}
                        {realSymptoms.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-orange-600"><AlertCircle className="w-3 h-3" /> {realSymptoms.join(', ')}</span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-slate-400 mt-2 flex items-start gap-1"><StickyNote className="w-3 h-3 mt-0.5 shrink-0" /> {log.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LogModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
    </div>
  );
}

function SnapshotCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/70 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-emerald-600 mb-1">{icon}<span className="text-[10px] font-medium uppercase tracking-wide">{label}</span></div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
