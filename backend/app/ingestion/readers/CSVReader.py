import pandas as pd
from .base import BaseReader


class CSVReader(BaseReader):
    def read(self, file_path: str):
        """Retorna a leitura do CSV."""
        return pd.read_csv(file_path)