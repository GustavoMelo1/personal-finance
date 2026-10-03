import asyncio
from decimal import Decimal
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from app.core import config
from app.main import app
from app.database.crud import balance_flow, insert_flow, select_flow
from app.database.migrations.migrate_money import migrate
from app.database.table import create_db
from app.domain.money import from_cents, to_cents, MAX_AMOUNT


class MoneyTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.path = Path(temporary.name) / 'test.db'
        override = patch.object(config, 'PATH_DB', self.path)
        override.start()
        self.addCleanup(override.stop)

    def legacy_database(self, values):
        connection = sqlite3.connect(self.path)
        try:
            connection.execute('''CREATE TABLE flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
                description TEXT, category TEXT, type TEXT NOT NULL,
                value REAL NOT NULL, bank TEXT)''')
            connection.executemany(
                "INSERT INTO flow VALUES (?, '2026-09-26', 'Test', 'Test', 'Income', ?, 'Test')",
                enumerate(values, start=1),
            )
            connection.execute('CREATE TABLE untouched (value TEXT)')
            connection.execute("INSERT INTO untouched VALUES ('keep')")
            connection.commit()
        finally:
            connection.close()

    def test_conversion_limits_and_precision(self):
        for value, cents in [('0.01', 1), ('35.50', 3550), (str(MAX_AMOUNT), 9223372036854775807)]:
            self.assertEqual(to_cents(value), cents)
            self.assertEqual(from_cents(cents), Decimal(value))
        for value in ('0', '-1', '0.001', 'NaN', 'Infinity', '92233720368547758.08'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                to_cents(value)

    def test_exact_balance_storage_and_readback(self):
        create_db()
        self.assertEqual(balance_flow(), Decimal('0.00'))
        for kind, amount in [('Income', '0.10'), ('Income', '0.20'), ('Expense', '0.30')]:
            insert_flow('2026-09-26', 'Test', 'Test', kind, Decimal(amount), 'Test')
        self.assertEqual(balance_flow(), Decimal('0.00'))
        self.assertEqual(select_flow()[0][5], Decimal('0.10'))
        connection = sqlite3.connect(self.path)
        try:
            self.assertEqual(connection.execute('SELECT value_cents, typeof(value_cents) FROM flow').fetchall(),
                             [(10, 'integer'), (20, 'integer'), (30, 'integer')])
        finally:
            connection.close()

    def test_migration_backs_up_preserves_ids_and_is_repeatable(self):
        self.legacy_database([0.10, 35.50])
        connection = sqlite3.connect(self.path)
        try:
            connection.execute("UPDATE sqlite_sequence SET seq=100 WHERE name='flow'")
            connection.commit()
        finally:
            connection.close()
        backup = migrate(self.path)
        self.assertTrue(backup.is_file())
        original = sqlite3.connect(backup)
        try:
            self.assertEqual(original.execute('SELECT id, value FROM flow').fetchall(), [(1, 0.1), (2, 35.5)])
        finally:
            original.close()
        create_db()
        self.assertEqual([row[0] for row in select_flow()], [1, 2])
        self.assertEqual(balance_flow(), Decimal('35.60'))
        insert_flow('2026-09-26', 'Next', 'Test', 'Income', Decimal('1.00'), 'Test')
        self.assertEqual(select_flow()[-1][0], 101)
        connection = sqlite3.connect(self.path)
        try:
            self.assertEqual(connection.execute('SELECT * FROM untouched').fetchall(), [('keep',)])
        finally:
            connection.close()
        self.assertIsNone(migrate(self.path))
        self.assertEqual(len(list(self.path.parent.glob('*.bak'))), 1)

    def test_invalid_legacy_values_leave_original_database_intact(self):
        self.legacy_database([10.00, 12.345])
        with self.assertRaisesRegex(ValueError, 'id=2'):
            migrate(self.path)
        connection = sqlite3.connect(self.path)
        try:
            self.assertEqual(connection.execute('SELECT value FROM flow').fetchall(), [(10.0,), (12.345,)])
            self.assertIsNone(connection.execute("SELECT name FROM sqlite_master WHERE name='flow_money'").fetchone())
        finally:
            connection.close()

    def test_startup_requires_explicit_legacy_migration(self):
        self.legacy_database([10.00])
        with self.assertRaisesRegex(RuntimeError, 'migrate_money'):
            create_db()

    def test_http_validation_and_decimal_serialization(self):
        # Exercise the actual ASGI request/response path without extra dependencies.
        async def request(method, path, payload=None):
            messages = []
            body = json.dumps(payload).encode() if payload is not None else b''
            async def receive():
                return {'type': 'http.request', 'body': body, 'more_body': False}
            async def send(message):
                messages.append(message)
            await app({
                'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1',
                'method': method, 'scheme': 'http', 'path': path, 'raw_path': path.encode(),
                'query_string': b'', 'root_path': '', 'headers': [(b'content-type', b'application/json')],
                'server': ('test', 80), 'client': ('test', 1234),
            }, receive, send)
            status = next(message['status'] for message in messages if message['type'] == 'http.response.start')
            data = b''.join(message.get('body', b'') for message in messages if message['type'] == 'http.response.body')
            return status, json.loads(data)

        async def scenario():
            async with app.router.lifespan_context(app):
                payload = dict(date='2026-09-26', description='Test', category='Test', type='Income', bank='Test')
                for amount in ('0.10', 0.2):
                    self.assertEqual(await request('POST', '/expenses', dict(payload, value=amount)), (200, None))
                for amount in ('0.001', '-1', '0', 'NaN', 'Infinity'):
                    status, _ = await request('POST', '/expenses', dict(payload, value=amount))
                    self.assertEqual(status, 422)
                self.assertEqual(await request('GET', '/expenses/balance'), (200, {'balance': '0.30'}))
                status, data = await request('GET', '/expenses')
                self.assertEqual(status, 200)
                self.assertEqual([row[5] for row in data['flow']], ['0.10', '0.20'])
        asyncio.run(scenario())


if __name__ == '__main__':
    unittest.main()
