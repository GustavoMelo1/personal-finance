"""Centraliza os caminhos de arquivos usados no projeto."""
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

PATH_DB = DATA_DIR / "financas.db"
PATH_RAW = DATA_DIR / "wishes.json"
PATH_NEWS = DATA_DIR / "financialmarketnews.json"
