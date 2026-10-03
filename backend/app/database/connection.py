"""Abre uma conexao por operacao, com commit/rollback e fechamento."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app.core import config


@contextmanager
def connect(database_path: str | Path | None = None) -> Iterator[sqlite3.Connection]:
    path = Path(database_path) if database_path is not None else config.PATH_DB
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    try:
        with connection:
            yield connection
    finally:
        connection.close()
