from fastapi import FastAPI
from src.database.crud import select_flow

app = FastAPI()

@app.get("/")
def root():
    return {"message": "API funcionando"}

@app.get("/gastos")
def flow():
    return {"my_flow": select_flow()}