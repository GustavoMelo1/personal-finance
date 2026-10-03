import ofxparse
from .base import BaseReader
from ofxparse import OfxParser

class OFXReader(BaseReader):
    """Retorna a leitura do OFX"""
    def read(self, file_path: str):
        with open(file_path, 'rb') as f:
            ofx = OfxParser.parse(f)
        return ofx