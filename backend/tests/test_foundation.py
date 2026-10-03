import asyncio
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from app.core import config
from app.main import app
from app.api.routers import expenses, investments
from app.api.routers import wishes
from app.api.schemas.expenses import Flow
from app.api.schemas.investments import Investments
from app.api.schemas.wishes import Wishes
from app.database.connection import connect
from app.database.table import create_db


class ConfigurationTests(unittest.TestCase):
    def test_data_directory_stays_at_repository_root(self):
        repository_root = Path(__file__).resolve().parents[2]
        self.assertEqual(config.PROJECT_ROOT, repository_root)
        self.assertEqual(config.DATA_DIR, repository_root / 'data')
        self.assertEqual(config.PATH_DB, repository_root / 'data' / 'financas.db')
        self.assertEqual(config.PATH_RAW, repository_root / 'data' / 'wishes.json')
        self.assertEqual(config.PATH_NEWS, repository_root / 'data' / 'financialmarketnews.json')


class FoundationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.path = Path(temporary.name) / 'nested' / 'test.db'
        override = patch.object(config, 'PATH_DB', self.path)
        override.start()
        self.addCleanup(override.stop)

    def test_startup_initializes_database_and_preserves_existing_rows(self):
        async def start():
            async with app.router.lifespan_context(app):
                expenses.create_flow(Flow(
                    date='2026-09-12', description='Salary', category='Work',
                    type='Income', value=1000, bank='Test',
                ))
            async with app.router.lifespan_context(app):
                self.assertEqual(expenses.balance(), {'balance': '1000.00'})
                self.assertEqual(len(expenses.flow()['flow']), 1)
        asyncio.run(start())

    def test_existing_operations_keep_their_contract(self):
        create_db()
        for kind, amount in [('Income', 1000), ('Expense', 200)]:
            self.assertIsNone(expenses.create_flow(Flow(
                date='2026-09-12', description=kind, category='Test',
                type=kind, value=amount, bank='Test',
            )))
        rows = expenses.flow()['flow']
        self.assertEqual(rows[0][1:], ('2026-09-12', 'Income', 'Test', 'Income', '1000.00', 'Test'))
        self.assertEqual(expenses.balance(), {'balance': '800.00'})
        self.assertIsNone(expenses.remove_flow(rows[1][0]))
        self.assertEqual(expenses.balance(), {'balance': '1000.00'})

        self.assertIsNone(investments.create_investments(Investments(
            date='2026-09-12', institution='Test', investment='Test',
            movement='Contribution', value=100, asset_name='Asset',
        )))
        row = investments.investments()['investments'][0]
        self.assertEqual(row[1:], ('2026-09-12', 'Test', 'Test', 'Contribution', 100, 'Asset'))
        self.assertIsNone(investments.remove_investments(row[0]))
        self.assertEqual(investments.investments(), {'investments': []})

        self.assertIsNone(wishes.create_wishes(Wishes(
            name='Book', search='Book', ignore='', stores='Test', max_value=50,
        )))
        row = wishes.wishes()['wishes'][0]
        self.assertEqual(row[1:], ('Book', 'Book', '', 'Test', 50))
        self.assertIsNone(wishes.remove_wishes(row[0]))
        self.assertEqual(wishes.wishes(), {'wishes': []})

    def test_failed_transaction_rolls_back_and_closes_connection(self):
        create_db()
        with self.assertRaisesRegex(RuntimeError, 'abort'):
            with connect() as connection:
                connection.execute("INSERT INTO wishes (name) VALUES ('Rollback')")
                raise RuntimeError('abort')
        with self.assertRaises(sqlite3.ProgrammingError):
            connection.execute('SELECT 1')
        self.assertEqual(wishes.wishes(), {'wishes': []})

    def test_successful_transaction_commits_and_closes_connection(self):
        create_db()
        with connect() as connection:
            connection.execute("INSERT INTO wishes (name) VALUES ('Saved')")
        with self.assertRaises(sqlite3.ProgrammingError):
            connection.execute('SELECT 1')
        self.assertEqual(wishes.wishes()['wishes'][0][1], 'Saved')

    def test_database_path_is_independent_of_working_directory(self):
        self.assertTrue(config.DATA_DIR.is_absolute())
        previous = Path.cwd()
        try:
            os.chdir(self.path.parent.parent)
            create_db()
            self.assertEqual(expenses.flow(), {'flow': []})
            self.assertTrue(self.path.exists())
        finally:
            os.chdir(previous)

    def test_openapi_keeps_existing_paths_and_required_fields(self):
        schema = app.openapi()
        self.assertEqual(set(schema['paths']), {
            '/expenses', '/expenses/balance', '/expenses/{id}',
            '/investments', '/investments/{id}', '/wishes', '/wishes/{id}',
        })
        self.assertEqual(set(schema['components']['schemas']['Flow']['required']), {
            'date', 'description', 'category', 'type', 'value', 'bank',
        })


if __name__ == '__main__':
    unittest.main()
