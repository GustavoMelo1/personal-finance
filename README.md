# Personal Finance

## Development

See [architecture and next steps](docs/architecture.md) for module responsibilities
and the gradual implementation plan. Request models live in `src/api/schemas/`;
SQLite connections are managed by `src/database/connection.py`.

From the project root, using the existing Windows environment:

```powershell
.\fluxo\Scripts\python.exe -m uvicorn src.api.main:app --reload
.\fluxo\Scripts\python.exe -m unittest discover -s tests -v
```

For a new environment, create it with `python -m venv fluxo` and install
dependencies with `.\fluxo\Scripts\python.exe -m pip install -r requirements.txt`.
The API creates missing tables on startup. Local docs: http://127.0.0.1:8000/docs.
Tests use temporary databases.

Automated personal cash flow system. The goal is to connect a material/personal goal with your current cash flow — finding the best prices, across the best stores, to bring more comfort and organization to your budget.

## Project structure

```text
personal-finance/
├── .gitignore
├── README.md
├── requirements.txt
│
└── src/
    ├── __init__.py
    ├── config.py                  
    │
    ├── api/
    │   ├── __init__.py
    │   ├── main.py                
    │   └── routers/
    │       ├── __init__.py
    │       ├── expenses.py
    │       ├── investments.py
    │       └── wishes.py
    │
    ├── database/
    │   ├── crud.py
    │   └── table.py
    │
    ├── ingestion/
    │   ├── __init__.py
    │   ├── searcher.py
    │   └── readers/
    │       ├── __init__.py
    │       ├── base.py
    │       ├── CSVReader.py
    │       ├── OFXReader.py
    │       └── PDFReader.py
    │
    └── transform/
```

> `data/`, `.env` e outros arquivos sensíveis/gerados estão no `.gitignore` e não aparecem na árvore acima.
