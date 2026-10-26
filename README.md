# EcoVital

Personalised health-risk tracker that combines your own vitals and habits with **live air quality and weather**, then explains the score and recommends diet, lifestyle and supplement changes.

## Features
- Onboarding profile (age, sex, city, conditions, family history)
- Daily log: blood pressure, fasting blood sugar, anxiety (1-10), sleep, steps, food, symptoms
- Live PM2.5 / PM10 converted to India's CPCB National AQI (Good → Severe), temperature, humidity and UV from [Open-Meteo](https://open-meteo.com) (no API key). Falls back to built-in city estimates if offline
- Explainable risk score: every factor shows its contribution and guideline source (CPCB NAQI, WHO, AHA, ADA, CDC)
- Risk history charts and personalised recommendations
- **Neural network risk model:** a 14-32-16-1 feed-forward ANN (ReLU, sigmoid output; 1,025 weights) runs in the browser and is shown next to the rule-based score
- Stack: React 18, TypeScript, Vite, Tailwind, Supabase (Postgres)

## Run locally
```bash
npm install
cp .env.example .env     # fill in your Supabase URL and anon key
npm run dev
```

## Database setup
In the Supabase SQL editor, run in order:
1. `supabase/migrations/20261025125527_ecovital_schema.sql`
2. `supabase/migrations/20261026000000_add_vitals.sql`

## Deploy (Netlify / Vercel)
Build command `npm run build`, output directory `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, then redeploy.

## Limitations (prototype)
- The official risk score is rule-based (guideline thresholds). The ANN is trained on **synthetic** profiles labelled by those rules plus noise, because no clinical dataset exists yet, so it approximates the rules rather than discovering new medical patterns.
- Single-tenant demo: row-level security is open. Add authentication before storing real personal health data.
- Decision support only, not medical advice.

## ANN model
`ml/train_ann.py` (NumPy only): He initialisation, mini-batch Adam, manual back-propagation, MSE loss, early stopping, 70/15/15 train/val/test split. Writes `src/lib/annWeights.json`, which `src/lib/annModel.ts` loads for inference.
```bash
python ml/train_ann.py
```
Held-out test results: MAE 1.82 points, R² 0.985, 93.3% risk-band accuracy.

## Roadmap
Retrain the ANN on real collected logs (swap `generate_dataset()`), authentication and per-user data, elder-care community pilot, caregiver alerts.
