import sqlite3
import logging
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import PATH_DB

logger = logging.getLogger(__name__)

def insert_flow(date, description, category, type, value, bank):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO flow (date, description, category, type, value, bank)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, description, category, type, value, bank))
        conn.commit()
    logger.info(f"Expenditure entered: {description} - R${value}")    

def balance_flow():
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Income',))
        income = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(value) FROM flow WHERE type = ?", ('Expense',))
        expense = cursor.fetchone()[0] or 0
        
        balance = income - expense   
    return balance

def delete_flow(id):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM flow WHERE id = ?", (id,))
        conn.commit()
    logger.info(f"Item deleted: id {id}")

def select_flow():
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM flow")
        rows = cursor.fetchall()
    logger.info("Selected flow : ")
    return rows

def insert_investment(date, institution, investment, movement, value, asset_name):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO investment (date, institution, investment, movement, value, asset_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, institution, investment, movement, value, asset_name))
        conn.commit()
    logger.info(f"Suggested investments: {investment} - R${value}")

def delete_investment(id):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investment WHERE id = ?", (id,))
        conn.commit()
    logger.info(f"Item deleted: id {id}")

def select_investment():
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM investment")
        rows = cursor.fetchall()
    logger.info("Selected investments : ")
    return rows

def insert_wish(name, search, ignore, stores, max_value):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO wishes (name, search, ignore, stores, max_value)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, search, ignore, stores, max_value))
        conn.commit()
    logger.info(f"Wish added: {name} - R${max_value}")

def delete_wish(id):
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM wishes WHERE id = ?", (id,))
        conn.commit()
    logger.info(f"Wish deleted: id {id}")

def select_wish():
    with sqlite3.connect(PATH_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM wishes")
        rows = cursor.fetchall()
    logger.info("Selected wishes")
    return rows




    

