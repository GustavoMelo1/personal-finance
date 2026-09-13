from pydantic import BaseModel


class Wishes(BaseModel):
    name: str
    search: str
    ignore: str
    stores: str
    max_value: float
