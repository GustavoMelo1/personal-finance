import sqlite3
import logging

logger = logging.getLogger(__name__)

PATH_db = 'data/financas.db'

def insert_flow(date, description, category, type, value, bank):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO flow (date, description, category, type, value, bank)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, description, category, type, value, bank))
        conn.commit()
    logger.info(f"Gasto inserido: {description} - R${value}")    

def balance_flow():
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Income',))
        income = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Expense',))
        expense = cursor.fetchone()[0] or 0
        
        balance = income - expense   
    return balance

def delete_flow(id):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM flow WHERE id = ?", (id,))
        conn.commit()
    logger.info(f"Item deletado: id {id}")

def insert_investment(date, institution, investment, movement, value, asset_name):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO investment (date, institution, investment, movement, value, asset_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, institution, investment, movement, value, asset_name))
        conn.commit()
    logger.info(f"Investimentos sugeridos: {investment} - R${value}")

def delete_investment(id):
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investment WHERE id = ?", (id,))
        conn.commit()
    logger.info(f"Item deletado: id {id}")

def select_investment():
    with sqlite3.connect(PATH_db) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM investment  ")
        return cursor.fetchall()





    

