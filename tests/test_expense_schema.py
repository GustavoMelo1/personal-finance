import unittest
from decimal import Decimal

from pydantic import ValidationError

from src.api.schemas.expenses import Flow


class FlowValidationTests(unittest.TestCase):
    def payload(self, movement_type):
        return {
            'date': '2026-09-25',
            'description': 'Lunch',
            'category': 'Food',
            'type': movement_type,
            'value': 35.50,
            'bank': 'Test',
        }

    def test_accepts_supported_movement_types(self):
        for movement_type in ('Income', 'Expense'):
            with self.subTest(movement_type=movement_type):
                flow = Flow(**self.payload(movement_type))
                self.assertEqual(flow.model_dump()['type'], movement_type)

    def test_accepts_positive_values(self):
        for movement_type in ('Income', 'Expense'):
            for value in (0.01, 35.50, 1000):
                with self.subTest(movement_type=movement_type, value=value):
                    payload = self.payload(movement_type)
                    payload['value'] = value
                    self.assertEqual(Flow(**payload).value, Decimal(str(value)))

    def test_rejects_invalid_precision_and_non_finite_values(self):
        for value in ('0.001', '12.345', 'NaN', 'Infinity', '-Infinity', '92233720368547758.08'):
            with self.subTest(value=value):
                payload = self.payload('Expense')
                payload['value'] = value
                with self.assertRaises(ValidationError):
                    Flow(**payload)

    def test_rejects_zero_and_negative_values(self):
        for movement_type in ('Income', 'Expense'):
            for value in (0, -0.01, -50):
                with self.subTest(movement_type=movement_type, value=value):
                    payload = self.payload(movement_type)
                    payload['value'] = value
                    with self.assertRaises(ValidationError) as error:
                        Flow(**payload)
                    self.assertEqual(error.exception.errors()[0]['loc'], ('value',))
                    self.assertEqual(error.exception.errors()[0]['type'], 'greater_than')

    def test_rejects_unsupported_movement_types(self):
        for movement_type in ('banana', 'income', 'expense', '', None, 1):
            with self.subTest(movement_type=movement_type):
                with self.assertRaises(ValidationError) as error:
                    Flow(**self.payload(movement_type))
                self.assertEqual(error.exception.errors()[0]['loc'], ('type',))
                self.assertEqual(error.exception.errors()[0]['type'], 'literal_error')


if __name__ == '__main__':
    unittest.main()
