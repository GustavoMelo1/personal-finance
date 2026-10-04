import { categories, summarize, shiftMonth, monthLabel } from '../lib/finance.js';
import { Money, Empty, SectionHeading } from './UI.jsx';

export function CashflowChart({ rows, month, hidden, onMonth }) {
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(month, index - 5));
  const values = months.map((item) => summarize(rows, item));
  const max = values.reduce(
    (acc, item) => [item.income, item.expense].reduce((a, b) => (a > b ? a : b), acc),
    1n,
  );
  return (
    <section className="panel chart-panel">
      <SectionHeading title="O ritmo do seu dinheiro" eyebrow="ENTRADAS & SAÍDAS" />
      <div className="chart-meta">
        <p>Últimos seis meses · incluindo o mês selecionado</p>
        <div className="legend">
          <span>
            <i className="dot dot-green" />
            Receitas
          </span>
          <span>
            <i className="dot dot-orange" />
            Despesas
          </span>
        </div>
      </div>
      {values.every((item) => item.count === 0) ? (
        <Empty
          title="Um histórico que cresce com você."
          text="Seus lançamentos vão formar esta visão mês a mês."
        />
      ) : (
        <>
          <div className="bar-chart" aria-label="Comparação mensal de receitas e despesas">
            <div className="chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            {months.map((item, index) => (
              <button
                className={`bar-group ${item === month ? 'selected' : ''}`}
                key={item}
                aria-label={`Ver ${monthLabel(item)}`}
                onClick={() => onMonth(item)}
              >
                <div className="bar-tooltip">
                  <b>{monthLabel(item)}</b>
                  <span>
                    Receitas <Money value={values[index].income} hidden={hidden} />
                  </span>
                  <span>
                    Despesas <Money value={values[index].expense} hidden={hidden} />
                  </span>
                </div>
                <div className="bar-pair">
                  <span
                    className="bar bar-income"
                    style={{
                      height: `${Math.max(values[index].income ? 2 : 0, Number((values[index].income * 100n) / max))}%`,
                    }}
                  />
                  <span
                    className="bar bar-expense"
                    style={{
                      height: `${Math.max(values[index].expense ? 2 : 0, Number((values[index].expense * 100n) / max))}%`,
                    }}
                  />
                </div>
                <span className="bar-label">{monthLabel(item, true).replace('.', '')}</span>
              </button>
            ))}
          </div>
          <p className="chart-footnote">Passe o mouse ou use Tab para consultar os valores.</p>
        </>
      )}
    </section>
  );
}

const colors = ['#526648', '#b4bc8e', '#c78364', '#d8b788', '#d9dcd2'];
export function CategoryChart({ rows, month, hidden }) {
  const all = categories(rows, month);
  const groups =
    all.length > 5
      ? [...all.slice(0, 4), ['Outras', all.slice(4).reduce((sum, item) => sum + item[1], 0n)]]
      : all;
  const total = groups.reduce((sum, item) => sum + item[1], 0n);
  let position = 0;
  const stops = groups.map((item, index) => {
    const start = position;
    position += (Number(item[1]) / Number(total)) * 100;
    return `${colors[index]} ${start}% ${position}%`;
  });
  return (
    <section className="panel categories-panel">
      <SectionHeading title="Para onde foi?" eyebrow="DESPESAS DO MÊS" />
      {!total ? (
        <Empty
          title="Tudo em seu lugar."
          text="As categorias aparecem com a primeira despesa do mês."
        />
      ) : (
        <>
          <div className="donut-layout">
            <div
              className="donut"
              role="img"
              aria-label="Distribuição das despesas por categoria, detalhada abaixo"
              style={{ background: `conic-gradient(${stops.join(',')})` }}
            >
              <div className="donut-hole">
                <span>Total de saídas</span>
                <Money value={total} hidden={hidden} />
              </div>
            </div>
          </div>
          <div className="category-list">
            {groups.map(([name, value], index) => (
              <div key={name}>
                <span>
                  <i className="dot" style={{ background: colors[index] }} />
                  {name}
                </span>
                <span>
                  <Money value={value} hidden={hidden} />
                  <small>{Number((value * 100n) / total)}%</small>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
