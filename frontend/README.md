# Lastro · Frontend

Interface em React, Vite e Tailwind CSS. Fontes locais, layout responsivo,
paleta oliva/terracota e foco em uso pessoal. Sem serviços externos de analytics.

## Iniciar

Na raiz do projeto, inicie o backend em um terminal:

```powershell
.\fluxo\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. A interface usa `/api`, encaminhado pelo Vite para
http://127.0.0.1:8000. Isso evita exigir CORS no backend durante o uso local.
Para outra porta do backend, defina `API_TARGET` antes de iniciar o Vite.
Não coloque credenciais nessa configuração.

Se o backend informar esquema antigo, execute a migração monetária documentada
no README principal. A interface não migra nem modifica o banco automaticamente.

Sem backend, a tela mostra o erro e permite explorar a demonstração. O modo
de demonstração tem aviso permanente e nunca grava no banco: alterações são
descartadas ao sair do modo ou recarregar a página.

## Funcionalidades

- Visão mensal com receitas, despesas, resultado, histórico de seis meses e categorias.
- Movimentações: cadastro, exclusão confirmada, busca, filtros e exportação CSV.
- Investimentos: cadastro e exclusão de aportes, resgates e proventos.
- Desejos: cadastro, exclusão, preço máximo e preferências de pesquisa.
- Valores ocultáveis, estados vazios, erros de conexão, formulários e navegação por teclado.

Os cálculos de movimentações usam BigInt em centavos; valores decimais são
enviados como strings. Valores numéricos servem apenas aos gráficos.
Investimentos/desejos ainda usam float no backend; são arredondados somente
para exibição. Limites e validações na interface não substituem os do servidor.

## Limites explícitos

O resultado mensal não é saldo bancário: não inclui saldo inicial de contas
ou investimentos. A seção de investimentos mostra registros, não cotações,
patrimônio atual ou rentabilidade. Desejos não têm pesquisa automática nem
dinheiro reservado. Edição, importação, orçamento, transferências e autenticação
dependem de próximas etapas do backend. Dados antigos são lidos como estão.

## Estrutura

```text
src/
  App.jsx                    Navegação, páginas e estado
  components/                Formulários, gráficos e elementos compartilhados
  lib/api.js                 Adaptação dos registros posicionais da API
  lib/finance.js             Cálculos, formatos, datas e exportação
  lib/demo.js                Dados fictícios, somente em memória
  styles.css                 Tailwind e identidade visual
tests/
  finance.test.js            Testes de precisão e validação
  e2e/app.spec.js             Fluxos de navegador com banco temporário
```

## Verificar

Dentro de `frontend/`:

```powershell
npm test
npm run build
npm run test:e2e
```

Os testes E2E iniciam uma API isolada na porta 8001 e um Vite na 5173.
As duas portas devem estar livres. `backend/tests/serve_frontend.py` configura
um banco temporário antes de importar a API. Nenhum teste usa o banco pessoal.
No Windows, os testes usam Microsoft Edge headless. Em outros ambientes,
instale Chromium com `npx playwright install chromium` e ajuste o caminho do
Python no config se o ambiente não estiver em `fluxo/`.
Screenshots e traces ficam em `test-results/` (ignorado pelo Git).

## Build local

`npm run build` gera `dist/`. `npm run preview` serve a versão compilada na
porta 4173 com o mesmo proxy local. Para hospedagem fora do Vite, configure o
servidor para encaminhar `/api/*` ao FastAPI removendo o prefixo `/api`.
O projeto atual é para uso local, sem autenticação; não o exponha publicamente.

Referências: [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite)
e [proxy do Vite](https://vite.dev/config/server-options#server-proxy).
