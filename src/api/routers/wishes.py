from fastapi import APIRouter
from src.api.schemas.wishes import Wishes
from src.database.crud import select_wishes, insert_wishes, delete_wishes

router = APIRouter()

@router.get("/wishes")
def wishes():
    """Retorna todos os desejos cadastrados"""
    return {"wishes": select_wishes()}

@router.post("/wishes")
def create_wishes(wishes: Wishes):
    """Cria um desejo no banco"""
    insert_wishes(wishes.name, wishes.search, wishes.ignore, wishes.stores, wishes.max_value)

@router.delete("/wishes/{id}")
def remove_wishes(id: int):
    """Apaga um desejo do banco pelo id."""
    delete_wishes(id)
