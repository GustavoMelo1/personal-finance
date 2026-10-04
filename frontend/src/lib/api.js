import { cents, legacyCents } from './finance.js';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (options.method === 'POST')
      throw new Error(
        'A conexão foi interrompida. O registro pode ter sido salvo: feche esta janela e atualize os dados antes de tentar novamente.',
      );
    throw new Error(
      'Não foi possível conectar. Confira se o backend está rodando e tente novamente.',
    );
  }
  if (!response.ok) {
    let message =
      'O servidor não conseguiu concluir o pedido. Confira o backend e a migração do banco.';
    if (response.status === 422) {
      const body = await response.json().catch(() => ({}));
      message = Array.isArray(body.detail)
        ? body.detail.map((item) => `${item.loc?.slice(1).join('.')}: ${item.msg}`).join(' · ')
        : 'Revise os dados informados.';
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

export async function loadData(signal) {
  const [expenses, investments, wishes] = await Promise.all([
    request('/expenses', { signal }),
    request('/investments', { signal }),
    request('/wishes', { signal }),
  ]);
  const data = {
    expenses: expenses.flow.map(([id, date, description, category, type, value, bank]) => ({
      id,
      date,
      description: description || '',
      category: category || '',
      type,
      value: String(value),
      bank: bank || '',
    })),
    investments: investments.investments.map(
      ([id, date, institution, investment, movement, value, asset_name]) => ({
        id,
        date,
        institution: institution || '',
        investment: investment || '',
        movement: movement || '',
        value,
        asset_name: asset_name || '',
      }),
    ),
    wishes: wishes.wishes.map(([id, name, search, ignore, stores, max_value]) => ({
      id,
      name,
      search: search || '',
      ignore: ignore || '',
      stores: stores || '',
      max_value: max_value ?? 0,
    })),
  };
  data.expenses.forEach((row) => cents(row.value));
  data.investments.forEach((row) => legacyCents(row.value));
  data.wishes.forEach((row) => legacyCents(row.max_value));
  return data;
}

export const createRecord = (kind, payload) =>
  request(`/${kind}`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteRecord = (kind, id) =>
  request(`/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' });
