import sqlite3
import logging

logger = logging.getLogger(__name__)

PATH_db = 'data/financas.db'

def insert(date, description, category, type, value, bank):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO flow (date, description, category, type, value, bank)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, description, category, type, value, bank))
        conn.commit()
    logger.info(f"Gasto inserido: {description} - R${value}")    


def balance():
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Income',))
        income = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Expense',))
        expense = cursor.fetchone()[0] or 0
        
        balance = income - expense
        
    return balance

def delete(id):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM flow WHERE id = ?", (id,))
        conn.commit()
        logger.info(f"Item deletado: id {id}")
