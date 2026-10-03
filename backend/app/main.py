from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.database.table import create_db
from app.api.routers.expenses import router as expenses_router
from app.api.routers.investments import router as investments_router
from app.api.routers.wishes import router as wishes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    yield


app = FastAPI(lifespan=lifespan)

# Registra os routers de cada área na aplicação principal
app.include_router(expenses_router)
app.include_router(investments_router)
app.include_router(wishes_router)
