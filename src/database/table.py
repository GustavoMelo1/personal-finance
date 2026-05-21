import sqlite3
import os
import sys
import logging

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import PATH_DB

logger = logging.getLogger(__name__)

os.makedirs(os.path.dirname(PATH_DB), exist_ok=True)

def create_db():
    with sqlite3.connect(PATH_DB) as conn:
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