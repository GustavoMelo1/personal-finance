import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FlaskConical,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sprout,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  AlertCircle,
  Compass,
  Mountain,
  Monitor,
  Headphones,
} from 'lucide-react';
import { loadData, createRecord, deleteRecord } from './lib/api.js';
import { makeDemo } from './lib/demo.js';
import {
  cents,
  csv,
  legacyCents,
  monthLabel,
  shiftMonth,
  summarize,
  today,
} from './lib/finance.js';
import { CategoryIcon, Empty, Modal, Money, SectionHeading, Stat } from './components/UI.jsx';
import { CashflowChart, CategoryChart } from './components/Charts.jsx';
import RecordForm from './components/RecordForm.jsx';

const navigation = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'expenses', label: 'Movimentações', icon: Wallet },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'wishes', label: 'Meus desejos', icon: Target },
];
const initialPage = () =>
  navigation.some((item) => item.id === location.hash.slice(1))
    ? location.hash.slice(1)
    : 'overview';

export default function App() {
  const [page, setPage] = useState(initialPage);
  const [mode, setMode] = useState('live');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [hidden, setHidden] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [form, setForm] = useState(null);
  const [remove, setRemove] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(15);
  const controller = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    const closeMenu = (event) => {
      if (event.key === 'Escape') setMobile(false);
    };
    window.addEventListener('keydown', closeMenu);
    return () => window.removeEventListener('keydown', closeMenu);
  }, []);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError('');
    try {
      const result = await loadData(AbortSignal.any([current.signal, AbortSignal.timeout(15000)]));
      if (!current.signal.aborted) setData(result);
    } catch (error) {
      if (!current.signal.aborted) setError(error.message);
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    setData(null);
    setError('');
    if (mode === 'demo') {
      controller.current?.abort();
      setData(makeDemo());
      setLoading(false);
    } else refresh();
    return () => controller.current?.abort();
  }, [mode, refresh]);
  useEffect(() => {
    const listener = () => {
      setPage(initialPage());
      setMobile(false);
    };
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    document.title = `${navigation.find((item) => item.id === page).label} · Lastro`;
    setLimit(15);
    setSearch('');
    setFilter('all');
    setCategoryFilter('all');
  }, [page]);
  useEffect(() => setLimit(15), [month, search, filter, categoryFilter]);
  function navigate(next) {
    location.hash = next;
    setPage(next);
    setMobile(false);
  }
  function switchMode() {
    setMode((current) => (current === 'live' ? 'demo' : 'live'));
    setMonth(today().slice(0, 7));
  }
  async function save(kind, payload) {
    if (mode === 'demo') {
      setData((current) => ({
        ...current,
        [kind]: [...current[kind], { ...payload, id: Date.now() }],
      }));
    } else {
      await createRecord(kind, payload);
    }
    setForm(null);
    notify(mode === 'demo' ? 'Registro adicionado à demonstração.' : 'Registro salvo.');
    if (mode === 'live') await refresh();
  }
  async function confirmDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      if (mode === 'demo')
        setData((current) => ({
          ...current,
          [remove.kind]: current[remove.kind].filter((row) => row.id !== remove.id),
        }));
      else await deleteRecord(remove.kind, remove.id);
      setRemove(null);
      notify('Registro excluído.');
      if (mode === 'live') await refresh();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  }
  function askDelete(kind, row) {
    setDeleteError('');
    setRemove({ kind, id: row.id, name: row.description || row.asset_name || row.name });
  }
  const rows = data?.expenses || [];
  const summary = summarize(rows, month);
  const allSummary = summarize(rows);
  const months = [
    ...new Set([
      ...Array.from({ length: 18 }, (_, i) => shiftMonth(today().slice(0, 7), -i)),
      month,
      ...rows.map((row) => row.date.slice(0, 7)).filter((item) => /^\d{4}-\d{2}$/.test(item)),
    ]),
  ]
    .sort()
    .reverse();
  const filtered = rows
    .filter(
      (row) =>
        row.date.startsWith(month) &&
        (filter === 'all' || row.type === filter) &&
        (categoryFilter === 'all' || row.category === categoryFilter) &&
        `${row.description} ${row.category} ${row.bank}`
          .toLocaleLowerCase('pt-BR')
          .includes(search.toLocaleLowerCase('pt-BR')),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const availableCategories = [...new Set(rows.map((row) => row.category))].sort();
  const actionKind = page === 'overview' ? 'expenses' : page;
  const actionLabel =
    page === 'investments'
      ? 'Registrar investimento'
      : page === 'wishes'
        ? 'Adicionar desejo'
        : 'Novo lançamento';
  const title = {
    overview: 'Seu mês, em perspectiva.',
    expenses: 'Cada escolha conta.',
    investments: 'Cultive o seu amanhã.',
    wishes: 'Planos que ganham forma.',
  }[page];
  const subtitle = {
    overview: 'Entenda o presente. Abra espaço para o que vem depois.',
    expenses: 'Um lugar para acompanhar o dinheiro que entra e sai.',
    investments: 'Seus aportes e movimentações, organizados em um só lugar.',
    wishes: 'O dinheiro faz mais sentido quando tem um destino.',
  }[page];
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([csv(filtered)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lastro-movimentacoes-${month}${mode === 'demo' ? '-demonstracao' : ''}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Exportação preparada.');
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Fechar navegação"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <a
          className="brand"
          href="#overview"
          onClick={() => navigate('overview')}
          aria-label="Lastro, início"
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            lastro<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">P</span>
          <div>
            <strong>Meu espaço</strong>
            <small>Finanças pessoais</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">SEU DINHEIRO</p>
        <nav aria-label="Navegação principal">
          {navigation.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? 'page' : undefined}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon size={19} strokeWidth={1.65} />
              <span>{label}</span>
              {page === id && <span className="nav-indicator" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sprout size={25} strokeWidth={1.4} />
            <p>
              Mais intenção.
              <br />
              Menos preocupação.
            </p>
            <span>Um passo de cada vez.</span>
          </div>
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Sobre seu espaço
          </button>
          <button
            className={`demo-toggle ${mode === 'demo' ? 'demo-active' : ''}`}
            onClick={switchMode}
            disabled={!!form || !!remove}
          >
            <FlaskConical size={16} />
            <span>{mode === 'demo' ? 'Voltar aos meus dados' : 'Explorar demonstração'}</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-footer">
            <span className="tiny-logo">l.</span>
            <span>Feito para a sua vida.</span>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Abrir navegação"
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Meu espaço <span>/</span>{' '}
              <strong>{navigation.find((item) => item.id === page).label}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className={`connection ${mode === 'demo' ? 'demo' : error ? 'offline' : ''}`}>
              <i />
              {mode === 'demo'
                ? 'Demonstração'
                : loading
                  ? 'Sincronizando'
                  : error
                    ? 'Sem conexão'
                    : 'Dados locais'}
            </span>
            <button
              className="icon-button"
              onClick={() => setHidden((value) => !value)}
              aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
              title={hidden ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <span className="profile-avatar" aria-label="Espaço pessoal">
              P
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {mode === 'demo' && (
            <div className="demo-banner">
              <FlaskConical size={16} />
              <span>Você está explorando dados fictícios. Nada é salvo no seu banco.</span>
              <button onClick={switchMode}>
                Usar meus dados <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === 'overview' ? 'BOM TER VOCÊ POR AQUI' : 'SEU DINHEIRO, COM DIREÇÃO'}
              </p>
              <h1>{title}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
            <button
              className="btn btn-primary"
              disabled={!data || loading}
              onClick={() => setForm(actionKind)}
            >
              <Plus size={18} />
              {actionLabel}
            </button>
          </div>
          {(page === 'overview' || page === 'expenses') && (
            <div className="period-row">
              <div className="period-picker">
                <button
                  aria-label="Mês anterior"
                  className="icon-button"
                  onClick={() => setMonth(shiftMonth(month, -1))}
                >
                  <ChevronLeft size={17} />
                </button>
                <CalendarDays size={16} />
                <label className="sr-only" htmlFor="month">
                  Mês de referência
                </label>
                <select id="month" value={month} onChange={(event) => setMonth(event.target.value)}>
                  {months.map((value) => (
                    <option value={value} key={value}>
                      {monthLabel(value)}
                    </option>
                  ))}
                </select>
                <button
                  aria-label="Próximo mês"
                  className="icon-button"
                  onClick={() => setMonth(shiftMonth(month, 1))}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <span className="period-caption">
                {month === today().slice(0, 7) ? 'Seu mês atual' : 'Seu histórico'}
                <span className="caption-dot">·</span>
                {summary.count} lançamentos
              </span>
              <button
                className="refresh-button"
                onClick={() =>
                  mode === 'live' ? refresh() : notify('Você está no modo de demonstração.')
                }
                disabled={loading}
                aria-label="Atualizar dados"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Atualizar</span>
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={20} />
              <div>
                <strong>
                  {data
                    ? 'Os dados exibidos podem estar desatualizados.'
                    : 'Vamos conectar seu espaço.'}
                </strong>
                <p>{error}</p>
              </div>
              <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
                Tentar novamente
              </button>
            </div>
          )}
          {!data && loading ? (
            <div className="loading-layout" role="status">
              <span className="sr-only">Carregando seus dados</span>
              <div className="skeleton-grid">
                {[1, 2, 3].map((i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
              <div className="skeleton skeleton-large" />
            </div>
          ) : !data ? (
            <section className="welcome-panel">
              <div className="welcome-art">
                <Compass size={64} strokeWidth={1} />
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
              </div>
              <p className="eyebrow">UM NOVO OLHAR PARA SUAS FINANÇAS</p>
              <h2>
                Seu dinheiro merece
                <br />
                um lugar de clareza.
              </h2>
              <p>
                Inicie o backend para acessar seus registros.
                <br />
                Enquanto isso, conheça o Lastro com dados de exemplo.
              </p>
              <button className="btn btn-primary" onClick={switchMode}>
                Explorar demonstração <ArrowRight size={17} />
              </button>
              <button className="text-button" onClick={() => setHelp(true)}>
                Como conectar meus dados <ArrowUpRight size={15} />
              </button>
            </section>
          ) : (
            <>
              {(page === 'overview' || page === 'expenses') && (
                <div className="stats-grid">
                  <Stat
                    label="Resultado do mês"
                    value={summary.balance}
                    hidden={hidden}
                    emphasis
                    note="Receitas menos despesas do período"
                  />
                  <Stat
                    label="Receitas"
                    type="in"
                    value={summary.income}
                    hidden={hidden}
                    note="Tudo que entrou neste mês"
                  />
                  <Stat
                    label="Despesas"
                    type="out"
                    value={summary.expense}
                    hidden={hidden}
                    note="Tudo que saiu neste mês"
                  />
                </div>
              )}
              {page === 'overview' && (
                <>
                  <div className="overview-charts">
                    <CashflowChart rows={rows} month={month} hidden={hidden} onMonth={setMonth} />
                    <CategoryChart rows={rows} month={month} hidden={hidden} />
                  </div>
                  <div className="overview-bottom">
                    <section className="panel transactions-panel">
                      <SectionHeading
                        title="Os últimos movimentos"
                        eyebrow="NO SEU DIA A DIA"
                        action="Ver todos"
                        onAction={() => navigate('expenses')}
                      />
                      <TransactionTable
                        rows={filtered.slice(0, 5)}
                        hidden={hidden}
                        compact
                        onAdd={() => setForm('expenses')}
                      />
                    </section>
                    <section className="next-step">
                      <span className="next-step-icon">
                        <Sprout size={30} strokeWidth={1.4} />
                      </span>
                      <p className="eyebrow">DO PRESENTE AO POSSÍVEL</p>
                      <h2>
                        O próximo plano
                        <br />
                        começa aqui.
                      </h2>
                      <p>
                        {data.wishes.length
                          ? `${data.wishes.length} desejos já têm um lugar no seu planejamento. Que tal dar uma olhada?`
                          : 'Uma viagem, um novo projeto, mais tranquilidade. Dê um nome ao que vem depois.'}
                      </p>
                      <button
                        className="btn btn-white"
                        onClick={() =>
                          data.wishes.length ? navigate('wishes') : setForm('wishes')
                        }
                      >
                        {data.wishes.length ? 'Olhar meus desejos' : 'Criar meu primeiro desejo'}
                        <ArrowUpRight size={17} />
                      </button>
                      <span className="decorative-line" aria-hidden="true" />
                    </section>
                  </div>
                  <div className="balance-note">
                    <span>
                      <span className="dot dot-green" />
                      Saldo dos lançamentos, em todo o histórico
                    </span>
                    <Money value={allSummary.balance} hidden={hidden} />
                    <small>Não inclui saldo inicial de contas nem carteira de investimentos.</small>
                  </div>
                </>
              )}
              {page === 'expenses' && (
                <section className="panel transactions-panel">
                  <div className="table-toolbar">
                    <div className="segmented">
                      {[
                        ['all', 'Todos'],
                        ['Income', 'Receitas'],
                        ['Expense', 'Despesas'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          className={filter === value ? 'active' : ''}
                          aria-pressed={filter === value}
                          onClick={() => setFilter(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="table-actions">
                      <label className="search-box">
                        <Search size={16} />
                        <input
                          aria-label="Buscar movimentações"
                          placeholder="Buscar lançamento…"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </label>
                      <button
                        className={`icon-button ${showFilters ? 'pressed' : ''}`}
                        onClick={() => setShowFilters((value) => !value)}
                        aria-label="Filtrar por categoria"
                        aria-expanded={showFilters}
                      >
                        <SlidersHorizontal size={18} />
                      </button>
                      <button
                        className="btn btn-secondary export-button"
                        onClick={exportCsv}
                        disabled={!filtered.length}
                      >
                        <ArrowDownToLine size={16} />
                        Exportar
                      </button>
                    </div>
                  </div>
                  {showFilters && (
                    <div className="filter-row">
                      <label>
                        Categoria{' '}
                        <select
                          value={categoryFilter}
                          onChange={(event) => setCategoryFilter(event.target.value)}
                        >
                          <option value="all">Todas as categorias</option>
                          {availableCategories.map((value) => (
                            <option key={value} value={value}>
                              {value || 'Sem categoria'}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="text-button"
                        onClick={() => {
                          setCategoryFilter('all');
                          setSearch('');
                          setFilter('all');
                        }}
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                  <TransactionTable
                    rows={filtered.slice(0, limit)}
                    hidden={hidden}
                    onAdd={() => setForm('expenses')}
                    onDelete={(row) => askDelete('expenses', row)}
                    filtered={!!search || filter !== 'all' || categoryFilter !== 'all'}
                  />
                  <div className="table-footer">
                    <span>
                      {Math.min(limit, filtered.length)} de {filtered.length} lançamentos
                    </span>
                    {filtered.length > limit && (
                      <button
                        className="text-button"
                        onClick={() => setLimit((current) => current + 15)}
                      >
                        Carregar mais <Plus size={15} />
                      </button>
                    )}
                    <span>Valores em reais · BRL</span>
                  </div>
                </section>
              )}
              {page === 'investments' && (
                <Investments
                  rows={data.investments}
                  hidden={hidden}
                  onAdd={() => setForm('investments')}
                  onDelete={(row) => askDelete('investments', row)}
                />
              )}
              {page === 'wishes' && (
                <Wishes
                  rows={data.wishes}
                  hidden={hidden}
                  onAdd={() => setForm('wishes')}
                  onDelete={(row) => askDelete('wishes', row)}
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              lastro<span>.</span>
            </span>
            <p>Organizar hoje. Escolher melhor amanhã.</p>
            <small>
              {mode === 'demo' ? 'Dados ilustrativos' : 'Seu controle, no seu computador'}
            </small>
          </footer>
        </main>
      </div>
      {form && (
        <RecordForm
          kind={form}
          onClose={() => setForm(null)}
          onSave={save}
          demo={mode === 'demo'}
        />
      )}
      {remove && (
        <Modal
          title="Excluir este registro?"
          subtitle="Esta ação não pode ser desfeita."
          onClose={() => setRemove(null)}
          busy={deleting}
        >
          <div className="confirm-content">
            <p>
              Você está excluindo <strong>{remove.name}</strong>.
            </p>
            {deleteError && (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setRemove(null)}
                disabled={deleting}
              >
                Manter registro
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Excluir registro
              </button>
            </div>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Um espaço só seu."
          subtitle="O que já funciona e o que vem depois."
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <h3>Conecte seus dados</h3>
            <p>
              Com o backend iniciado na porta 8000, os registros aparecem automaticamente. A
              interface não conecta sua conta bancária e não faz compras ou operações financeiras.
            </p>
            <h3>Uma visão honesta dos números</h3>
            <p>
              O resultado mensal é a diferença entre receitas e despesas cadastradas. Investimentos
              são registros de movimentações, sem cotações ou rentabilidade. Desejos são uma lista
              de planejamento; a pesquisa automática de preços ainda não está disponível.
            </p>
            <h3>Explore sem compromisso</h3>
            <p>
              O modo de demonstração usa dados fictícios em memória. Ao sair ou recarregar a página,
              suas alterações na demonstração são descartadas. Seus dados reais não são afetados.
            </p>
            <details>
              <summary>Ajuda para iniciar o projeto</summary>
              <p>Na raiz, execute o backend:</p>
              <code>
                .\fluxo\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
              </code>
              <p>
                Se o servidor indicar banco antigo, siga a migração documentada no README antes de
                iniciar.
              </p>
            </details>
            <button className="btn btn-primary" onClick={() => setHelp(false)}>
              Entendi <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button aria-label="Fechar aviso" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionTable({ rows, hidden, compact = false, onDelete, onAdd, filtered }) {
  if (!rows.length)
    return (
      <Empty
        title={filtered ? 'Nenhum resultado por aqui.' : 'Este mês ainda está em branco.'}
        text={
          filtered
            ? 'Tente outra busca ou ajuste os filtros.'
            : 'Registre sua primeira receita ou despesa para começar.'
        }
        action={filtered ? undefined : 'Adicionar lançamento'}
        onAction={onAdd}
      />
    );
  return (
    <div className="table-scroll">
      <table className={`transaction-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            <th>Descrição</th>
            {!compact && <th>Categoria</th>}
            <th>Data</th>
            <th className="amount-cell">Valor</th>
            {!compact && (
              <th>
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="transaction-name">
                  <CategoryIcon category={row.category} type={row.type} />
                  <div>
                    <strong>{row.description || 'Sem descrição'}</strong>
                    <small>
                      {row.bank || 'Sem instituição'}
                      {compact && ` · ${row.category || 'Sem categoria'}`}
                    </small>
                  </div>
                </div>
              </td>
              {!compact && (
                <td>
                  <span className="category-tag">{row.category || 'Sem categoria'}</span>
                </td>
              )}
              <td className="date-cell">{row.date.split('-').reverse().join('/')}</td>
              <td className={`amount-cell ${row.type === 'Income' ? 'positive' : ''}`}>
                <span className="amount-sign">{row.type === 'Income' ? '+' : '−'}</span>
                <Money value={cents(row.value)} hidden={hidden} />
                <small className="sr-only">{row.type === 'Income' ? 'Receita' : 'Despesa'}</small>
              </td>
              {!compact && (
                <td>
                  <button
                    className="icon-button delete-button"
                    aria-label={`Excluir ${row.description}`}
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Investments({ rows, hidden, onAdd, onDelete }) {
  const [search, setSearch] = useState('');
  const deposits = rows
    .filter((row) => ['aporte', 'contribution'].includes(row.movement.toLowerCase()))
    .reduce((sum, row) => sum + legacyCents(row.value), 0n);
  const withdrawals = rows
    .filter((row) => ['resgate', 'withdrawal'].includes(row.movement.toLowerCase()))
    .reduce((sum, row) => sum + legacyCents(row.value), 0n);
  const filtered = rows
    .filter((row) =>
      `${row.asset_name} ${row.institution} ${row.investment}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Aportes registrados"
          value={deposits}
          hidden={hidden}
          emphasis
          note="Todos os registros classificados como aporte"
        />
        <Stat
          label="Resgates registrados"
          value={withdrawals}
          hidden={hidden}
          type="out"
          note="Todos os registros classificados como resgate"
        />
        <article className="stat">
          <div className="stat-top">
            <span>Movimentações</span>
            <TrendingUp size={18} />
          </div>
          <strong className="stat-value">{rows.length.toString().padStart(2, '0')}</strong>
          <p>Histórico completo da sua carteira</p>
        </article>
      </div>
      <div className="info-note">
        <Sprout size={19} />
        <p>
          Seu histórico de investimentos começa pelos registros. Estes valores{' '}
          <strong>não representam o valor atual da carteira</strong>. Cotações, rentabilidade e
          integração com o saldo virão depois.
        </p>
      </div>
      <section className="panel">
        <div className="investment-toolbar">
          <SectionHeading
            title="O que você está construindo"
            eyebrow="HISTÓRICO DE MOVIMENTAÇÕES"
          />
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Buscar investimentos"
              placeholder="Buscar ativo ou instituição…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {!filtered.length ? (
          <Empty
            title={search ? 'Nenhum investimento encontrado.' : 'Comece a registrar sua carteira.'}
            text="Acompanhe seus aportes, resgates e proventos."
            action={!search ? 'Registrar investimento' : undefined}
            onAction={onAdd}
          />
        ) : (
          <div className="table-scroll">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Ativo / instituição</th>
                  <th>Movimentação</th>
                  <th>Data</th>
                  <th className="amount-cell">Valor registrado</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="transaction-name">
                        <span className="category-icon income-icon">
                          <TrendingUp size={18} />
                        </span>
                        <div>
                          <strong>{row.asset_name || 'Sem nome'}</strong>
                          <small>
                            {row.institution} · {row.investment}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{row.movement || 'Não classificado'}</span>
                    </td>
                    <td className="date-cell">{row.date.split('-').reverse().join('/')}</td>
                    <td className="amount-cell">
                      <Money value={legacyCents(row.value)} hidden={hidden} />
                    </td>
                    <td>
                      <button
                        className="icon-button delete-button"
                        aria-label={`Excluir ${row.asset_name}`}
                        onClick={() => onDelete(row)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Wishes({ rows, hidden, onAdd, onDelete }) {
  const icons = [Mountain, Monitor, Headphones, Compass, Sprout, Target];
  return (
    <>
      <div className="wishes-intro">
        <span className="eyebrow">DESEJAR TAMBÉM É PLANEJAR</span>
        <p>
          Não é só sobre comprar.
          <br />
          <strong>É sobre fazer espaço para o que importa.</strong>
        </p>
        <span className="wishes-count">
          {rows.length.toString().padStart(2, '0')} <small>desejos na lista</small>
        </span>
      </div>
      {!rows.length ? (
        <section className="panel">
          <Empty
            title="Qual é o seu próximo desejo?"
            text="Dê um nome, defina um preço máximo e guarde suas preferências."
            action="Adicionar meu primeiro desejo"
            onAction={onAdd}
          />
        </section>
      ) : (
        <div className="wishes-grid">
          {rows.map((row, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article className={`wish-card wish-tone-${index % 3}`} key={row.id}>
                <div className="wish-illustration">
                  <span className="wish-orbit" />
                  <Icon size={68} strokeWidth={1} />
                  <span className="wish-index">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="wish-content">
                  <div className="flex justify-between items-start gap-3">
                    <span className="eyebrow">NA SUA LISTA</span>
                    <button
                      className="icon-button delete-button"
                      aria-label={`Excluir ${row.name}`}
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h2>{row.name}</h2>
                  <p className="wish-search">{row.search || 'Sem termos de pesquisa definidos'}</p>
                  <div className="wish-price">
                    <span>Preço máximo planejado</span>
                    <Money value={legacyCents(row.max_value)} hidden={hidden} />
                  </div>
                  <div className="wish-preferences">
                    <span>Lojas de preferência</span>
                    <p>{row.stores || 'Sem preferência'}</p>
                    {row.ignore && <small>Evitar: {row.ignore}</small>}
                  </div>
                  <span className="wish-status">
                    <span className="dot" />
                    Planejamento · sem busca automática
                  </span>
                </div>
              </article>
            );
          })}
          <button className="add-wish-card" onClick={onAdd}>
            <span>
              <Plus size={25} />
            </span>
            <strong>Um novo plano</strong>
            <p>O que mais você quer realizar?</p>
          </button>
        </div>
      )}
      <p className="section-disclaimer">
        Preços definidos por você. Não são ofertas de lojas, reservas de dinheiro ou recomendações
        de compra.
      </p>
    </>
  );
}
