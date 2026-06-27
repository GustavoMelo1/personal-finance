from fastapi import FastAPI
from pydantic import BaseModel
from src.database.crud import select_flow, select_investment, select_wishes, insert_flow, insert_investment, insert_wishes, delete_flow, delete_investment, delete_wishes

app = FastAPI()
class Flow(BaseModel):
    date: str
    description:str
    category:str
    type:str
    value:float
    bank:str

class Investments(BaseModel):
    date: str
    institution: str
    investment: str
    movement: str
    value: float
    asset_name: str

class Wishes(BaseModel):
    name: str
    search: str
    ignore: str
    stores: str
    max_value: float

@app.get("/expenses")
def flow():
    return {"flow": select_flow()}

@app.post("/expenses")
def create_flow(expense: Flow):
    insert_flow(expense.date, expense.description, expense.category, expense.type, expense.value, expense.bank)

@app.delete("/expenses/{id}")
def remove_flow(id: int):
    delete_flow(id)

@app.get("/investments")
def investments():
    return {"investments": select_investment()}

@app.post("/investments")
def create_investiments(expense: Investments):
    insert_investment(expense.date, expense.institution, expense.investment, expense.movement, expense.value, expense.asset_name)

@app.delete("/investments/{id}")
def remove_investments(id: int):
    delete_investment(id)

@app.get("/wishes")
def wishes():
    return {"wishes": select_wishes()}

@app.post("/wishes")
def create_wishes(expense: Wishes):
    insert_wishes(expense.name, expense.search, expense.ignore, expense.stores, expense.max_value)

@app.delete("/wishes/{id}")
def remove_wishes(id: int):
    delete_wishes(id)
