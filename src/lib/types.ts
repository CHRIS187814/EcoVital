export type Sex = 'male' | 'female' | 'other';

export interface HealthProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  city: string;
  lat: number;
  lon: number;
  conditions: string[];
  family_history: string[];
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  log_date: string;
  sleep_hours: number | null;
  steps: number | null;
  food_entries: string[];
  reported_symptoms: string[];
  notes: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_sugar: number | null;
  anxiety_level: number | null;
  created_at: string;
}

export type NewLog = Pick<
  DailyLog,
  'sleep_hours' | 'steps' | 'food_entries' | 'reported_symptoms' | 'notes' | 'bp_systolic' | 'bp_diastolic' | 'blood_sugar' | 'anxiety_level'
>;

export interface RiskFactor {
  label: string;
  value: number;
  detail: string;
  source: string;
}

export interface Recommendation {
  title: string;
  reason: string;
  source: string;
  category: 'diet' | 'lifestyle' | 'supplement' | 'environment';
}

export interface RiskScore {
  id: string;
  scored_at: string;
  risk_score: number;
  aqi: number | null;
  dominant_pollutant: string | null;
  factor_breakdown: RiskFactor[];
  recommendations: Recommendation[];
  previous_score: number | null;
}

export interface EnvironmentData {
  aqi: number;
  pm25: number;
  pm10: number;
  dominant_pollutant: string;
  category: string;
  temperature: number;
  humidity: number;
  uvIndex: number;
  city: string;  source?: 'live' | 'estimate';
}
