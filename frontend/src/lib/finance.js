// Financial arithmetic stays in integer cents; Number is only used for charts.
export function cents(value) {
  const text = String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) throw new Error('Valor monetário inválido.');
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -result : result;
}

export function decimal(value) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function brl(value) {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '− ' : ''}R$ ${(absolute / 100n).toLocaleString('pt-BR')},${String(absolute % 100n).padStart(2, '0')}`;
}

export function parseInput(value) {
  const normalized = String(value).trim().replace(/\s/g, '').replace(/^R\$/, '');
  const result = normalized.includes(',')
    ? normalized.replaceAll('.', '').replace(',', '.')
    : normalized;
  const amount = cents(result);
  if (amount <= 0n) throw new Error('O valor precisa ser maior que zero.');
  if (amount > 9223372036854775807n) throw new Error('O valor ultrapassa o limite permitido.');
  return decimal(amount);
}

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function monthLabel(month, short = false) {
  return new Date(`${month}-15T12:00:00`).toLocaleDateString('pt-BR', {
    month: short ? 'short' : 'long',
    ...(!short && { year: 'numeric' }),
  });
}

export function shiftMonth(month, shift) {
  const date = new Date(`${month}-15T12:00:00`);
  date.setMonth(date.getMonth() + shift);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function summarize(rows, month) {
  const selected = rows.filter((row) => !month || row.date.startsWith(month));
  const income = selected
    .filter((row) => row.type === 'Income')
    .reduce((sum, row) => sum + cents(row.value), 0n);
  const expense = selected
    .filter((row) => row.type === 'Expense')
    .reduce((sum, row) => sum + cents(row.value), 0n);
  return { income, expense, balance: income - expense, count: selected.length };
}

export function categories(rows, month) {
  const grouped = new Map();
  rows
    .filter((row) => row.type === 'Expense' && row.date.startsWith(month))
    .forEach((row) => {
      const category = row.category || 'Sem categoria';
      grouped.set(category, (grouped.get(category) || 0n) + cents(row.value));
    });
  return [...grouped].sort((a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0));
}

export function legacyCents(value) {
  // Investments/wishes still use REAL in the API. Round for display only.
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Math.abs(numeric) > Number.MAX_SAFE_INTEGER / 100)
    throw new Error('Valor fora do limite de exibição.');
  return BigInt(Math.round(numeric * 100));
}

export function csv(rows) {
  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    '\uFEFF' +
    [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Instituição'],
      ...rows.map((row) => [
        row.date,
        row.description,
        row.category,
        row.type === 'Income' ? 'Receita' : 'Despesa',
        row.value.replace('.', ','),
        row.bank,
      ]),
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n')
  );
}
