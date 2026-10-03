import logging
from pathlib import Path

from app.database.connection import connect

logger = logging.getLogger(__name__)

def create_db(database_path: str | Path | None = None):
    """Cria as tabelas flow, investment e wishes no banco se ainda não existirem."""
    with connect(database_path) as conn:
        cursor = conn.cursor()

        columns = {row[1] for row in cursor.execute('PRAGMA table_info(flow)')}
        if columns and 'value_cents' not in columns:
            raise RuntimeError(
                'Legacy flow schema: run python -m app.database.migrations.migrate_money first'
            )

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT,
                category TEXT,
                type TEXT NOT NULL,
                value_cents INTEGER NOT NULL
                    CHECK(typeof(value_cents) = 'integer' AND value_cents > 0),
                bank TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS investment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                institution TEXT,
                investment TEXT,
                movement TEXT,
                value REAL NOT NULL,
                asset_name TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS wishes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                search TEXT,
                ignore TEXT,
                stores TEXT,
                max_value REAL
            )
        ''')

    logger.info("db created successfully")

if __name__ == "__main__":
    create_db()
