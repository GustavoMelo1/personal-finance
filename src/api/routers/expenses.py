from fastapi import APIRouter
from src.api.schemas.expenses import Flow
from src.database.crud import select_flow, insert_flow, delete_flow, balance_flow

router = APIRouter()

@router.get("/expenses")
def flow():
    """Retorna todos os gastos cadastrados"""
    return {"flow": [(*row[:5], format(row[5], '.2f'), row[6]) for row in select_flow()]}

@router.post("/expenses")
def create_flow(expense: Flow):
    """Cria um novo tipo de gasto no banco"""
    insert_flow(expense.date, expense.description, expense.category, expense.type, expense.value, expense.bank)

@router.get("/expenses/balance")
def balance():
    """Calcula e retorna o saldo atual (ganhos menos gastos)."""
    return {"balance": format(balance_flow(), '.2f')}

@router.delete("/expenses/{id}")
def remove_flow(id: int):
    """Apaga um tipo de gasto do banco pelo id."""
    delete_flow(id)
