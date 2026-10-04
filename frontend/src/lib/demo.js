import { today, shiftMonth } from './finance.js';

export function makeDemo() {
  const month = today().slice(0, 7);
  let id = 1;
  const expenses = [];
  for (let offset = -5; offset <= 0; offset++) {
    const current = shiftMonth(month, offset);
    const entries = [
      ['02', 'Salário', 'Trabalho', 'Income', '8500.00', 'Nubank'],
      ['03', 'Aluguel do apartamento', 'Moradia', 'Expense', '2100.00', 'Itaú'],
      [
        '05',
        'Projeto freelance',
        'Trabalho',
        'Income',
        offset === 0 ? '1800.00' : '1200.00',
        'Nubank',
      ],
      [
        '06',
        'Mercado da semana',
        'Alimentação',
        'Expense',
        offset === 0 ? '486.90' : `${420 + offset * 16}.50`,
        'Nubank',
      ],
      ['09', 'Restaurante e cafés', 'Alimentação', 'Expense', '328.40', 'Nubank'],
      ['12', 'Academia', 'Saúde', 'Expense', '149.90', 'Itaú'],
      ['16', 'Uber e combustível', 'Transporte', 'Expense', '287.60', 'Nubank'],
      ['20', 'Internet + energia', 'Moradia', 'Expense', '298.00', 'Itaú'],
      ['23', 'Cinema e livros', 'Lazer', 'Expense', '219.00', 'Nubank'],
      ['25', 'Assinaturas do mês', 'Assinaturas', 'Expense', '94.80', 'Nubank'],
    ];
    entries.forEach(([day, description, category, type, value, bank]) =>
      expenses.push({
        id: id++,
        date: `${current}-${day}`,
        description,
        category,
        type,
        value,
        bank,
      }),
    );
  }
  return {
    expenses,
    investments: [
      {
        id: 1,
        date: `${month}-05`,
        institution: 'Nu Invest',
        investment: 'Renda fixa',
        movement: 'Aporte',
        value: 2500,
        asset_name: 'Tesouro IPCA+',
      },
      {
        id: 2,
        date: `${month}-10`,
        institution: 'Itaú',
        investment: 'Renda fixa',
        movement: 'Aporte',
        value: 1200,
        asset_name: 'CDB liquidez diária',
      },
      {
        id: 3,
        date: `${month}-12`,
        institution: 'Nu Invest',
        investment: 'ETF',
        movement: 'Aporte',
        value: 800,
        asset_name: 'ETF de índice',
      },
    ],
    wishes: [
      {
        id: 1,
        name: 'Um novo lugar para conhecer',
        search: 'Viagem para a serra',
        ignore: '',
        stores: 'Hospedagem, passagens',
        max_value: 4800,
      },
      {
        id: 2,
        name: 'Upgrade no home office',
        search: 'Monitor 27 polegadas',
        ignore: 'usado',
        stores: 'Amazon, Kabum',
        max_value: 1800,
      },
      {
        id: 3,
        name: 'Mais música, menos ruído',
        search: 'Fone com cancelamento de ruído',
        ignore: 'recondicionado',
        stores: 'Amazon',
        max_value: 1200,
      },
    ],
  };
}
