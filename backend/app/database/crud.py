import logging

from app.database.connection import connect
from app.domain.money import from_cents, to_cents

logger = logging.getLogger(__name__)

def insert_flow(date, description, category, type, value, bank):
    """Insere um registro de gasto novo no banco."""
    cents = to_cents(value)
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO flow (date, description, category, type, value_cents, bank)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, description, category, type, cents, bank))
    logger.info(f"Expenditure entered: {description} - R${value}")    

def balance_flow():
    """Calcula o saldo (ganhos menos gastos) no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT type, value_cents FROM flow WHERE type IN ('Income', 'Expense')")
        # Python integers avoid SQLite SUM overflow across many valid rows.
        balance = sum(cents if kind == 'Income' else -cents for kind, cents in cursor)
    return from_cents(balance)

def delete_flow(id):
    """Apaga registros de gastos pelo ID no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM flow WHERE id = ?", (id,))
    logger.info(f"Item deleted: id {id}")

def select_flow():
    """Busca e retorna todos os gastos cadastrados no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, date, description, category, type, value_cents, bank FROM flow')
        rows = [(*row[:5], from_cents(row[5]), row[6]) for row in cursor.fetchall()]
    logger.info("Selected flow : ")
    return rows

def insert_investment(date, institution, investment, movement, value, asset_name):
    """Insere um novo aporte de investimento no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO investment (date, institution, investment, movement, value, asset_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, institution, investment, movement, value, asset_name))
    logger.info(f"Suggested investments: {investment} - R${value}")

def delete_investment(id):
    """Apaga um aporte de investimento pelo id no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investment WHERE id = ?", (id,))
    logger.info(f"Item deleted: id {id}")

def select_investment():
    """Busca e retorna todos os aportes de investimento no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM investment")
        rows = cursor.fetchall()
    logger.info("Selected investments : ")
    return rows

def insert_wishes(name, search, ignore, stores, max_value):
    """Insere um novo desejo no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO wishes (name, search, ignore, stores, max_value)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, search, ignore, stores, max_value))
    logger.info(f"Wishes added: {name} - R${max_value}")

def delete_wishes(id):
    """Apaga um desejo pelo id no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM wishes WHERE id = ?", (id,))
    logger.info(f"Wishes deleted: id {id}")

def select_wishes():
    """Busca e retorna todos os desejos cadastrados no banco."""
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM wishes")
        rows = cursor.fetchall()
    logger.info("Selected wishes")
    return rows




    

