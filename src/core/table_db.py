import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

#paths for db
PATH_db = 'data/financas.db'
os.makedirs('data', exist_ok=True)

def create_db():
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        
        #cash flow table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT,
                category TEXT,
                type TEXT NOT NULL, -- 'Income' ou 'Expense'
                value REAL NOT NULL,
                bank TEXT
            )
        ''')
        
        #investments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS investment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                institution TEXT,
                investiment TEXT,
                movement TEXT,
                value REAL NOT NULL,
                asset_name TEXT
            )
        ''')
        
        conn.commit()
    logger.info("db created successfully")

if __name__ == "__main__":
    create_db()