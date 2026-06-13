from fastapi import FastAPI
from src.database.crud import select_flow, select_investment, select_wishes

app = FastAPI()

@app.get("/")
def root():
    return {"message": "API funcionando"}

@app.get("/expenses")
def flow():
    return {"flow": select_flow()}

@app.get("/investments")
def investments():
    return {"investments": select_investment()}

@app.get("/wishes")
def wishes():
    return {"wishes": select_wishes()}
