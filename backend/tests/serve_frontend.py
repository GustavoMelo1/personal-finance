"""Servidor exclusivo dos testes do frontend; nunca abre o banco pessoal."""

from pathlib import Path
from tempfile import TemporaryDirectory

import uvicorn
from app.core import config


if __name__ == '__main__':
    with TemporaryDirectory(prefix='lastro-e2e-') as directory:
        config.PATH_DB = Path(directory) / 'test.db'
        from app.main import app
        uvicorn.run(app, host='127.0.0.1', port=8001)
