from typing import Literal

from pydantic import BaseModel, Field


class Flow(BaseModel):
    date: str
    description: str
    category: str
    type: Literal["Income", "Expense"]
    value: float = Field(gt=0)
    bank: str
