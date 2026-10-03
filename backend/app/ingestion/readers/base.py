from abc import ABC, abstractmethod 

class BaseReader(ABC):
    @abstractmethod
    def read(self, file_path: str):
        """Obriga toda classe filha a implementar o método read"""
        pass