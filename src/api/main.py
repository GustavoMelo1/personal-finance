from fastapi import FastAPI
from pydantic import BaseModel
from src.database.crud import select_flow, select_investment, select_wishes, insert_flow, insert_investment, insert_wishes


app = FastAPI()
class Flow(BaseModel):
    date: str
    description:str
    category:str
    type:str
    bank:str
    value:float

@app.get("/")
def root():
    return {"message": "API funcionando"}

@app.get("/expenses")
def flow():
    return {"flow": select_flow()}

@app.post("/expenses")
def create_flow(expense: Flow):
    insert_flow(expense.date, expense.description, expense.category, expense.type, expense.value, expense.bank)

@app.get("/investments")
def investments():
    return {"investments": select_investment()}

@app.get("/wishes")
def wishes():
    return {"wishes": select_wishes()}

