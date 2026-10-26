"""
EcoVital ANN risk model - training script (NumPy only, no ML framework).

A fully-connected feed-forward neural network:  14 inputs -> 32 (ReLU) -> 16 (ReLU) -> 1 (sigmoid)
Trained with mini-batch gradient descent + Adam, MSE loss, manual back-propagation,
early stopping on a validation split, and a held-out test set.

IMPORTANT - what the training data is:
No labelled clinical dataset exists for this project yet. The network is trained on
SYNTHETIC Indian-context profiles (AQI on the CPCB National AQI scale) whose target risk comes from EcoVital's guideline-based scoring rules
(CPCB NAQI for air quality, WHO / AHA / ADA / CDC thresholds) plus Gaussian label noise. So the ANN learns a smooth
function approximating the guideline engine. Once real logs are collected, replace
`generate_dataset()` with the collected data and re-run - the rest of the pipeline is unchanged.

Run:  python ml/train_ann.py      ->  writes src/lib/annWeights.json
"""
import json
import pathlib
import numpy as np

SEED = 42
rng = np.random.default_rng(SEED)

FEATURES = [
    "age", "is_male", "is_female", "n_conditions", "n_family_history",
    "aqi", "uv_index", "sleep_hours", "steps",
    "bp_systolic", "bp_diastolic", "blood_sugar", "anxiety_level", "n_symptoms",
]
# Neutral values used when a vital was not logged (must match src/lib/annModel.ts)
DEFAULTS = {"sleep_hours": 6.5, "steps": 6500, "bp_systolic": 115, "bp_diastolic": 75,
            "blood_sugar": 90, "anxiety_level": 0}


def rule_score(f):
    """Python port of computeRiskScore() in src/lib/riskEngine.ts."""
    t = 20.0
    if f["age"] > 40:
        t += round((f["age"] - 40) * 0.3 * 10) / 10
    t += 10 * f["n_conditions"] + 5 * f["n_family_history"]
    a = f["aqi"]   # India NAQI (CPCB)
    t += 15 if a > 300 else 10 if a > 200 else 5 if a > 100 else 0
    s = f["sleep_hours"]
    t += 8 if s < 6 else -4 if s >= 7 else 0
    st = f["steps"]
    t += 6 if st < 5000 else -5 if st >= 8000 else 0
    t += 7 * f["n_symptoms"]
    sy, di = f["bp_systolic"], f["bp_diastolic"]
    t += 10 if (sy >= 140 or di >= 90) else 5 if (sy >= 130 or di >= 80) else 0
    g = f["blood_sugar"]
    t += 10 if g >= 126 else 5 if g >= 100 else 0
    an = f["anxiety_level"]
    t += 6 if an >= 7 else 3 if an >= 4 else 0
    t += 4 if f["uv_index"] >= 8 else 0
    return max(0.0, min(100.0, t))


def generate_dataset(n=40000):
    X, y = [], []
    for _ in range(n):
        age = int(np.clip(rng.normal(52, 20), 18, 95))
        sex = rng.integers(0, 3)
        has_vitals = rng.random() < 0.7
        f = {
            "age": age,
            "is_male": float(sex == 0), "is_female": float(sex == 1),
            "n_conditions": int(min(rng.poisson(0.8 + (age - 18) / 60), 5)),
            "n_family_history": int(min(rng.poisson(1.0), 4)),
            "aqi": float(np.clip(rng.gamma(3.0, 55), 15, 500)),   # India NAQI: skewed high, as in North Indian cities
            "uv_index": float(np.clip(rng.normal(7, 2.5), 0, 12)),
            "sleep_hours": float(np.clip(rng.normal(6.6, 1.3), 3, 10)),
            "steps": float(np.clip(rng.normal(6500, 3200), 300, 20000)),
            "n_symptoms": int(min(rng.poisson(0.7), 5)),
        }
        if has_vitals:
            f["bp_systolic"] = float(np.clip(rng.normal(112 + (age - 18) * 0.35, 14), 85, 200))
            f["bp_diastolic"] = float(np.clip(rng.normal(72 + (age - 18) * 0.12, 9), 50, 120))
            f["blood_sugar"] = float(np.clip(rng.normal(88 + (age - 18) * 0.25, 18), 60, 300))
            f["anxiety_level"] = float(rng.integers(0, 11))
        else:
            f.update({k: DEFAULTS[k] for k in ("bp_systolic", "bp_diastolic", "blood_sugar", "anxiety_level")})
        X.append([f[k] for k in FEATURES])
        y.append(rule_score(f) + rng.normal(0, 1.5))  # label noise
    return np.array(X, dtype=np.float64), np.clip(np.array(y), 0, 100) / 100.0


def relu(z): return np.maximum(0, z)
def sigmoid(z): return 1 / (1 + np.exp(-z))


def init(sizes):
    P = []
    for i in range(len(sizes) - 1):
        W = rng.normal(0, np.sqrt(2 / sizes[i]), (sizes[i], sizes[i + 1]))  # He init
        P.append([W, np.zeros(sizes[i + 1])])
    return P


def forward(P, X):
    acts = [X]
    for i, (W, b) in enumerate(P):
        z = acts[-1] @ W + b
        acts.append(sigmoid(z) if i == len(P) - 1 else relu(z))
    return acts


def train():
    X, y = generate_dataset()
    mu, sd = X.mean(0), X.std(0) + 1e-9
    Xn = (X - mu) / sd
    idx = rng.permutation(len(Xn))
    n_tr, n_va = int(0.7 * len(Xn)), int(0.15 * len(Xn))
    tr, va, te = idx[:n_tr], idx[n_tr:n_tr + n_va], idx[n_tr + n_va:]

    sizes = [len(FEATURES), 32, 16, 1]
    P = init(sizes)
    m = [[np.zeros_like(W), np.zeros_like(b)] for W, b in P]
    v = [[np.zeros_like(W), np.zeros_like(b)] for W, b in P]
    lr, b1, b2, eps, batch = 3e-3, 0.9, 0.999, 1e-8, 128
    best, best_P, patience, step = 1e9, None, 0, 0

    for epoch in range(1, 201):
        order = rng.permutation(tr)
        for s in range(0, len(order), batch):
            ib = order[s:s + batch]
            xb, yb = Xn[ib], y[ib].reshape(-1, 1)
            acts = forward(P, xb)
            out = acts[-1]
            delta = (2 * (out - yb) / len(ib)) * out * (1 - out)   # dMSE/dz at sigmoid output
            step += 1
            for l in range(len(P) - 1, -1, -1):
                gW = acts[l].T @ delta
                gb = delta.sum(0)
                if l > 0:
                    delta = (delta @ P[l][0].T) * (acts[l] > 0)      # back-prop through ReLU
                for j, g in enumerate((gW, gb)):                      # Adam update
                    m[l][j] = b1 * m[l][j] + (1 - b1) * g
                    v[l][j] = b2 * v[l][j] + (1 - b2) * g * g
                    mh = m[l][j] / (1 - b1 ** step)
                    vh = v[l][j] / (1 - b2 ** step)
                    P[l][j] -= lr * mh / (np.sqrt(vh) + eps)
        val_loss = float(np.mean((forward(P, Xn[va])[-1].ravel() - y[va]) ** 2))
        if epoch % 10 == 0 or epoch == 1:
            tr_loss = float(np.mean((forward(P, Xn[tr])[-1].ravel() - y[tr]) ** 2))
            print(f"epoch {epoch:3d}  train MSE {tr_loss:.5f}  val MSE {val_loss:.5f}")
        if val_loss < best - 1e-7:
            best, best_P, patience = val_loss, [[W.copy(), b.copy()] for W, b in P], 0
        else:
            patience += 1
            if patience >= 15:
                print(f"early stop at epoch {epoch}")
                break

    P = best_P
    pred = forward(P, Xn[te])[-1].ravel() * 100
    true = y[te] * 100
    mae = float(np.mean(np.abs(pred - true)))
    r2 = float(1 - np.sum((pred - true) ** 2) / np.sum((true - true.mean()) ** 2))
    band = lambda s: np.digitize(s, [30, 50, 70])
    band_acc = float(np.mean(band(pred) == band(true)))
    print(f"\nTEST  MAE {mae:.2f} points | R^2 {r2:.3f} | risk-band accuracy {band_acc:.1%}  (n={len(te)})")

    out = {
        "features": FEATURES,
        "mean": mu.tolist(), "std": sd.tolist(),
        "layers": [{"W": W.tolist(), "b": b.tolist()} for W, b in P],
        "meta": {
            "architecture": "14-32-16-1 (ReLU, ReLU, sigmoid)",
            "parameters": int(sum(W.size + b.size for W, b in P)),
            "train_samples": int(len(tr)), "test_mae": round(mae, 2),
            "test_r2": round(r2, 3), "band_accuracy": round(band_acc, 3),
            "data": "synthetic Indian-context profiles (CPCB NAQI) labelled by guideline rules + noise",
        },
    }
    path = pathlib.Path(__file__).resolve().parent.parent / "src" / "lib" / "annWeights.json"
    path.write_text(json.dumps(out))
    print("wrote", path)


if __name__ == "__main__":
    train()
