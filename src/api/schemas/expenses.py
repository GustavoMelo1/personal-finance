from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field
from src.money import MAX_AMOUNT


class Flow(BaseModel):
    date: str
    description: str
    category: str
    type: Literal["Income", "Expense"]
    value: Decimal = Field(gt=0, le=MAX_AMOUNT, decimal_places=2, allow_inf_nan=False)
    bank: str
