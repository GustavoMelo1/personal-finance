import { Children, cloneElement, isValidElement, useId, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Modal } from './UI.jsx';
import { parseInput, today, validDate } from '../lib/finance.js';

const labels = {
  expenses: 'Novo lançamento',
  investments: 'Registrar investimento',
  wishes: 'Um novo desejo',
};
const subtitles = {
  expenses: 'Pequenos registros. Uma visão muito mais clara.',
  investments: 'Registre uma movimentação da sua carteira.',
  wishes: 'Dê nome ao que você quer realizar.',
};

function Field({ label, children, hint }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) && ['input', 'select'].includes(child.type)
          ? cloneElement(child, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })
          : child,
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export default function RecordForm({ kind, onClose, onSave, demo }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState('Expense');
  async function submit(event) {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      Object.keys(values).forEach((key) => (values[key] = values[key].trim()));
      const amount = parseInput(values.amount);
      if (kind !== 'wishes' && !validDate(values.date)) throw new Error('Informe uma data válida.');
      let payload;
      if (kind === 'expenses') {
        if (!values.description || !values.bank || !values.category)
          throw new Error('Preencha descrição, categoria e instituição.');
        payload = {
          date: values.date,
          description: values.description,
          category: values.category,
          type,
          value: amount,
          bank: values.bank,
        };
      } else {
        // Legacy endpoints use float; reject values beyond reliable cent precision.
        if (Number(amount) > Number.MAX_SAFE_INTEGER / 100)
          throw new Error('Valor acima do limite desta seção.');
        if (kind === 'investments') {
          if (!values.asset_name || !values.institution)
            throw new Error('Preencha o ativo e a instituição.');
          payload = {
            date: values.date,
            institution: values.institution,
            investment: values.investment,
            movement: values.movement,
            value: Number(amount),
            asset_name: values.asset_name,
          };
        } else {
          if (!values.name) throw new Error('Dê um nome ao seu desejo.');
          payload = {
            name: values.name,
            search: values.search,
            ignore: values.ignore,
            stores: values.stores,
            max_value: Number(amount),
          };
        }
      }
      setBusy(true);
      await onSave(kind, payload);
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <Modal title={labels[kind]} subtitle={subtitles[kind]} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="record-form">
        {demo && (
          <p className="form-note">
            Demonstração: este registro só existe enquanto você explora a interface.
          </p>
        )}
        <fieldset disabled={busy}>
          {kind === 'expenses' && (
            <div className="segmented type-segment" aria-label="Tipo de lançamento">
              <button
                type="button"
                aria-pressed={type === 'Expense'}
                className={type === 'Expense' ? 'active' : ''}
                onClick={() => setType('Expense')}
              >
                Despesa
              </button>
              <button
                type="button"
                aria-pressed={type === 'Income'}
                className={type === 'Income' ? 'active' : ''}
                onClick={() => setType('Income')}
              >
                Receita
              </button>
            </div>
          )}
          {kind === 'expenses' && (
            <Field label="Descrição">
              <input
                name="description"
                placeholder="Ex.: mercado da semana"
                maxLength={160}
                required
                autoFocus
              />
            </Field>
          )}
          {kind === 'investments' && (
            <Field label="Nome do ativo">
              <input
                name="asset_name"
                placeholder="Ex.: Tesouro IPCA+ 2029"
                maxLength={120}
                required
                autoFocus
              />
            </Field>
          )}
          {kind === 'wishes' && (
            <Field label="O que você quer realizar?">
              <input
                name="name"
                placeholder="Ex.: uma viagem para a serra"
                maxLength={120}
                required
                autoFocus
              />
            </Field>
          )}
          <div className="form-grid">
            <Field
              label={kind === 'wishes' ? 'Preço máximo (R$)' : 'Valor (R$)'}
              hint="Use vírgula ou ponto para os centavos."
            >
              <input name="amount" inputMode="decimal" placeholder="0,00" maxLength={24} required />
            </Field>
            {kind !== 'wishes' && (
              <Field label="Data">
                <input name="date" type="date" defaultValue={today()} required />
              </Field>
            )}
          </div>
          {kind === 'expenses' && (
            <div className="form-grid">
              <Field label="Categoria">
                <input
                  name="category"
                  list="categories"
                  placeholder="Selecione ou escreva"
                  required
                  maxLength={60}
                />
                <datalist id="categories">
                  {[
                    'Alimentação',
                    'Moradia',
                    'Transporte',
                    'Saúde',
                    'Lazer',
                    'Assinaturas',
                    'Trabalho',
                    'Educação',
                    'Outros',
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </datalist>
              </Field>
              <Field label="Instituição">
                <input name="bank" placeholder="Ex.: Nubank" maxLength={60} required />
              </Field>
            </div>
          )}
          {kind === 'investments' && (
            <>
              <div className="form-grid">
                <Field label="Tipo de investimento">
                  <select name="investment">
                    <option>Renda fixa</option>
                    <option>Ações</option>
                    <option>Fundos imobiliários</option>
                    <option>ETF</option>
                    <option>Criptoativos</option>
                    <option>Outros</option>
                  </select>
                </Field>
                <Field label="Movimentação">
                  <select name="movement">
                    <option>Aporte</option>
                    <option>Resgate</option>
                    <option>Provento</option>
                  </select>
                </Field>
              </div>
              <Field label="Instituição">
                <input
                  name="institution"
                  placeholder="Ex.: sua corretora"
                  maxLength={80}
                  required
                />
              </Field>
              <p className="form-note">
                Este registro não altera o saldo das suas movimentações. Cotações e rentabilidade
                ainda não são calculadas.
              </p>
            </>
          )}
          {kind === 'wishes' && (
            <>
              <Field label="Termos de pesquisa">
                <input name="search" placeholder="Ex.: monitor 27 polegadas 4K" maxLength={200} />
              </Field>
              <Field label="Lojas de preferência">
                <input name="stores" placeholder="Ex.: Amazon, Kabum" maxLength={200} />
              </Field>
              <Field label="O que evitar? (opcional)">
                <input name="ignore" placeholder="Ex.: usado, recondicionado" maxLength={200} />
              </Field>
              <p className="form-note">
                Organize sua lista agora. O monitoramento automático de preços será uma próxima
                etapa.
              </p>
            </>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
            {busy ? 'Salvando…' : 'Salvar registro'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
