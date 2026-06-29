from fastapi import APIRouter
from pydantic import BaseModel
from src.database.crud import select_wishes, insert_wishes, delete_wishes

router = APIRouter()

class Wishes(BaseModel):
    name: str
    search: str
    ignore: str
    stores: str
    max_value: float

@router.get("/wishes")
def wishes():
    """Retorna todos os desejos cadastrados"""
    return {"wishes": select_wishes()}

@router.post("/wishes")
def create_wishes(expense: Wishes):
    """Cria um desejo no banco"""
    insert_wishes(expense.name, expense.search, expense.ignore, expense.stores, expense.max_value)

@router.delete("/wishes/{id}")
def remove_wishes(id: int):
    """Apaga um desejo do banco pelo id."""
    delete_wishes(id)
