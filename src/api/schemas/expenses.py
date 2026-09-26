from typing import Literal

from pydantic import BaseModel


class Flow(BaseModel):
    date: str
    description: str
    category: str
    type: Literal["Income", "Expense"]
    value: float
    bank: str
