import os
import yaml
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PARAMS_PATH = BASE_DIR / "params.yaml"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:admin123@localhost:5432/pqrs_db"
)

def load_params() -> dict:
    with open(PARAMS_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)