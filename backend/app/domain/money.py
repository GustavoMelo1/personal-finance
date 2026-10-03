"""Conversao exata de valores em reais para centavos SQLite."""

from decimal import Decimal, InvalidOperation

MAX_AMOUNT = Decimal('92233720368547758.07')


def to_cents(value: Decimal | str | int | float) -> int:
    try:
        amount = Decimal(str(value))
    except InvalidOperation as error:
        raise ValueError('Invalid monetary value') from error
    if not amount.is_finite() or not 0 < amount <= MAX_AMOUNT:
        raise ValueError('Value must be positive, finite and within SQLite limits')
    cents = amount * 100
    if cents != cents.to_integral_value():
        raise ValueError('Value must have at most two decimal places')
    return int(cents)


def from_cents(cents: int) -> Decimal:
    return Decimal(cents).scaleb(-2)
