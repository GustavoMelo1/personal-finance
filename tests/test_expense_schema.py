import unittest

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

    def test_rejects_unsupported_movement_types(self):
        for movement_type in ('banana', 'income', 'expense', '', None, 1):
            with self.subTest(movement_type=movement_type):
                with self.assertRaises(ValidationError) as error:
                    Flow(**self.payload(movement_type))
                self.assertEqual(error.exception.errors()[0]['loc'], ('type',))
                self.assertEqual(error.exception.errors()[0]['type'], 'literal_error')


if __name__ == '__main__':
    unittest.main()
