import { supabase } from '@/lib/supabase';
import type { HealthProfile, DailyLog, RiskScore, NewLog } from '@/lib/types';

export const profileService = {
  async get(id: string): Promise<HealthProfile | null> {
    const { data, error } = await supabase.from('health_profile').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as HealthProfile | null;
  },

  async create(p: Omit<HealthProfile, 'id' | 'created_at' | 'updated_at'>): Promise<HealthProfile> {
    const { data, error } = await supabase.from('health_profile').insert({
      name: p.name,
      age: p.age,
      sex: p.sex,
      city: p.city,
      lat: p.lat,
      lon: p.lon,
      conditions: p.conditions,
      family_history: p.family_history,
    }).select('*').single();
    if (error) throw error;
    return data as HealthProfile;
  },

  async updateCity(id: string, city: string): Promise<void> {
    const { error } = await supabase.from('health_profile').update({ city, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

export const logService = {
  async latest(): Promise<DailyLog | null> {
    const { data, error } = await supabase.from('daily_logs').select('*').order('log_date', { ascending: false }).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? (data[0] as DailyLog) : null;
  },

  async recent(limit = 30): Promise<DailyLog[]> {
    const { data, error } = await supabase.from('daily_logs').select('*').order('log_date', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as DailyLog[];
  },

  async create(data: NewLog): Promise<DailyLog> {
    const payload = {
      log_date: new Date().toISOString().split('T')[0],
      sleep_hours: data.sleep_hours,
      steps: data.steps,
      food_entries: data.food_entries,
      reported_symptoms: data.reported_symptoms,
      notes: data.notes,
      bp_systolic: data.bp_systolic,
      bp_diastolic: data.bp_diastolic,
      blood_sugar: data.blood_sugar,
      anxiety_level: data.anxiety_level,
    };
    const { data: inserted, error } = await supabase.from('daily_logs').insert(payload).select('*').single();
    if (error) throw error;
    return inserted as DailyLog;
  },
};

export const scoreService = {
  async recent(limit = 30): Promise<RiskScore[]> {
    const { data, error } = await supabase.from('risk_scores').select('*').order('scored_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as RiskScore[];
  },

  async latest(): Promise<RiskScore | null> {
    const { data, error } = await supabase.from('risk_scores').select('*').order('scored_at', { ascending: false }).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? (data[0] as RiskScore) : null;
  },

  async insert(score: Omit<RiskScore, 'id' | 'scored_at'>): Promise<RiskScore> {
    const { data, error } = await supabase.from('risk_scores').insert(score).select('*').single();
    if (error) throw error;
    return data as RiskScore;
  },
};
