import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

PATH_db = 'data/financas.db'
os.makedirs('data', exist_ok=True)

def create_db():
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT,
                category TEXT,
                type TEXT NOT NULL,
                value REAL NOT NULL,
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

        conn.commit()
    logger.info("db created successfully")

if __name__ == "__main__":
    create_db()