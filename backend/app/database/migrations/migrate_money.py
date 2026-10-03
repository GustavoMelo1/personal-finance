"""Migracao explicita de flow.value (reais) para value_cents (inteiro)."""

from pathlib import Path
import sqlite3
from uuid import uuid4

from app.core import config
from app.domain.money import to_cents


def migrate(database_path: str | Path | None = None) -> Path | None:
    path = Path(database_path) if database_path is not None else config.PATH_DB
    if not path.is_file():
        raise FileNotFoundError(path)
    connection = sqlite3.connect(path)
    try:
        # Backup from a second read connection while the writer lock prevents
        # competing writes. SQLite backup includes committed WAL contents.
        connection.execute('BEGIN IMMEDIATE')
        columns = {row[1] for row in connection.execute('PRAGMA table_info(flow)')}
        if 'value_cents' in columns:
            connection.rollback()
            return None
        if 'value' not in columns:
            raise ValueError('Expected legacy flow.value column')
        converted = []
        for row in connection.execute('SELECT id, date, description, category, type, value, bank FROM flow'):
            try:
                cents = to_cents(row[5])
            except ValueError as error:
                raise ValueError(f'Cannot migrate flow id={row[0]}: {error}') from error
            converted.append((*row[:5], cents, row[6]))

        # Do not silently discard custom indexes/triggers added outside this app.
        if connection.execute(
            "SELECT 1 FROM sqlite_master WHERE tbl_name='flow' AND type IN ('index', 'trigger')"
        ).fetchone():
            raise ValueError('Custom flow indexes/triggers require a reviewed migration')
        sequence = connection.execute("SELECT seq FROM sqlite_sequence WHERE name='flow'").fetchone()
        backup_path = path.with_name(f'{path.name}.before-money-{uuid4().hex}.bak')
        source = sqlite3.connect(path)
        backup = sqlite3.connect(backup_path)
        try:
            source.backup(backup)
        finally:
            backup.close()
            source.close()

        connection.execute('''CREATE TABLE flow_money (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT,
            category TEXT,
            type TEXT NOT NULL,
            value_cents INTEGER NOT NULL
                CHECK(typeof(value_cents) = 'integer' AND value_cents > 0),
            bank TEXT
        )''')
        connection.executemany('INSERT INTO flow_money VALUES (?, ?, ?, ?, ?, ?, ?)', converted)
        connection.execute('DROP TABLE flow')
        connection.execute('ALTER TABLE flow_money RENAME TO flow')
        if sequence:
            connection.execute("DELETE FROM sqlite_sequence WHERE name='flow'")
            connection.execute("INSERT INTO sqlite_sequence (name, seq) VALUES ('flow', ?)", sequence)
        connection.commit()
        return backup_path
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == '__main__':
    backup = migrate()
    print(f'Migration complete. Backup: {backup}' if backup else 'Already migrated.')
