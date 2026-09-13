from pydantic import BaseModel


class Investments(BaseModel):
    date: str
    institution: str
    investment: str
    movement: str
    value: float
    asset_name: str
