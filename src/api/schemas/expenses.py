from pydantic import BaseModel


class Flow(BaseModel):
    date: str
    description: str
    category: str
    type: str
    value: float
    bank: str
