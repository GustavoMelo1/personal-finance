from fastapi import FastAPI
from src.api.routers.expenses import router as expenses_router
from src.api.routers.investments import router as investments_router
from src.api.routers.wishes import router as wishes_router

app = FastAPI()

# Registra os routers de cada área na aplicação principal
app.include_router(expenses_router)
app.include_router(investments_router)
app.include_router(wishes_router)