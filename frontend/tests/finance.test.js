import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cents,
  decimal,
  brl,
  parseInput,
  summarize,
  categories,
  validDate,
  csv,
  legacyCents,
} from '../src/lib/finance.js';

test('cent arithmetic is exact, including the SQLite maximum', () => {
  assert.equal(cents('0.10') + cents('0.20'), cents('0.30'));
  const max = '92233720368547758.07';
  assert.equal(decimal(cents(max)), max);
  assert.equal(brl(cents('-1234.56')), '− R$ 1.234,56');
});
test('Brazilian input is normalized without implicit rounding', () => {
  assert.equal(parseInput('1.234,56'), '1234.56');
  assert.equal(parseInput('35.5'), '35.50');
  for (const value of ['0', '-5', '1.234', 'NaN', 'Infinity', '92233720368547758.08'])
    assert.throws(() => parseInput(value));
});
test('monthly totals exclude other months and categorize only expenses', () => {
  const rows = [
    { date: '2026-10-01', value: '0.30', type: 'Income', category: 'Trabalho' },
    { date: '2026-10-02', value: '0.10', type: 'Expense', category: 'Alimentação' },
    { date: '2026-10-03', value: '0.20', type: 'Expense', category: 'Alimentação' },
    { date: '2026-09-01', value: '999.00', type: 'Expense', category: 'Outros' },
  ];
  assert.deepEqual(summarize(rows, '2026-10'), {
    income: 30n,
    expense: 30n,
    balance: 0n,
    count: 3,
  });
  assert.deepEqual(categories(rows, '2026-10'), [['Alimentação', 30n]]);
});
test('calendar dates reject nonexistent days and support leap years', () => {
  assert.equal(validDate('2028-02-29'), true);
  for (const value of ['2026-02-29', '2026-02-30', 'ontem', '2026-13-01'])
    assert.equal(validDate(value), false);
});
test('CSV preserves accents and escapes spreadsheet formulas and quotes', () => {
  const result = csv([
    {
      date: '2026-10-01',
      description: '=HYPERLINK("bad")',
      category: 'Alimentação',
      type: 'Expense',
      value: '10.50',
      bank: 'Banco',
    },
  ]);
  assert.ok(result.startsWith('\uFEFF'));
  assert.ok(result.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(result.includes('"10,50"'));
});
test('legacy values are display-only rounded with explicit limits', () => {
  assert.equal(legacyCents(10.5), 1050n);
  assert.throws(() => legacyCents(Infinity));
});
