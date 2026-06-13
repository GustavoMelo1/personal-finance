# Personal Finance

Automated personal cash flow system. The goal is to connect a material/personal goal with your current cash flow — finding the best prices, across the best stores, to bring more comfort and organization to your budget.

## Project structure

```text
personal-finance/
├── .env                      # Environment variables and secrets (gitignored)
├── .gitignore                # Temp files, venv, etc.
├── requirements.txt          # Python dependencies
├── README.md                 # Documentation and roadmap
│
├── data/
│   ├── raw/                  # Raw bank statements (OFX, CSV, PDF, etc.)
│   └── financas.db           # Main database (SQLite)
│
└── src/
├── ingestion/
│   ├── readers/
│   │   ├── base.py        # Generic / abstract reader
│   │   ├── ofx_reader.py  # OFX statement reader
│   │   ├── csv_reader.py  # CSV reader
│   │   └── pdf_reader.py  # PDF reader (if added later)
│   ├── ingest.py          # Coordinates ingestion (raw → database)
│   └── cotacoes.py        # Fetches market quotes (yFinance, B3, etc.)
│
├── database/
│   ├── connection.py      # SQLite connection
│   ├── table.py           # Table definitions (flow, investment, wishes)
│   └── crud.py            # Insert, select, update operations
│
├── transform/             # Future folder for transformations (dbt, ETL, etc.)
│
├── api/
│   └── main.py            # FastAPI root (will expose endpoints)
│
└── app/                   # (Future) Frontend / app consuming the API
```