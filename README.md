# Personal Finance

Sistema pessoal para conectar controle financeiro, investimentos e objetivos
de compra. O backend atual oferece cadastros, saldo e leitores de arquivos;
importacao completa e pesquisa automatica de precos ainda serao construidas.
A interface Lastro conecta os cadastros e a visao mensal ao backend.
Veja o [roadmap M1-M10](docs/roadmap.md).

## Estrutura

```text
personal-finance/
|-- backend/
|   |-- app/
|   |   |-- main.py              # Composicao e inicializacao da API
|   |   |-- core/config.py       # Caminhos e configuracao
|   |   |-- api/                 # Rotas HTTP e schemas Pydantic
|   |   |-- domain/money.py      # Conversao monetaria
|   |   |-- database/            # Conexao, CRUD, tabelas e migrations/
|   |   |-- ingestion/          # Leitores e placeholder de pesquisa
|   |   `-- transform/          # Espaco reservado, sem implementacao
|   |-- tests/
|   `-- requirements.txt
|-- frontend/                   # Lastro: React, Vite e Tailwind CSS
|-- docs/
|-- data/                       # Banco e arquivos locais, ignorados pelo Git
`-- fluxo/                      # Ambiente virtual local, ignorado pelo Git
```

Detalhes: [arquitetura](docs/architecture.md), [backend](backend/README.md)
e [frontend](frontend/README.md).

## Preparar o ambiente

Comandos PowerShell executados na raiz do repositorio. O ambiente existente
em `fluxo/` pode continuar sendo usado; nao precisa ser movido ou recriado.
Para uma instalacao nova:

```powershell
python -m venv fluxo
.\fluxo\Scripts\python.exe -m pip install -r backend/requirements.txt
```

## Executar e testar

Na raiz:

```powershell
.\fluxo\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --reload-dir backend/app
.\fluxo\Scripts\python.exe -m unittest discover -s backend/tests -t backend -v
```

O primeiro comando fica executando; use outro terminal para os testes.
Documentacao interativa: http://127.0.0.1:8000/docs.
Os testes usam bancos temporarios e nao alteram `data/financas.db`.

## Interface Lastro

Com o backend rodando, em outro terminal a partir da raiz:

```powershell
cd frontend
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. Sem o backend, voce pode explorar o modo de
demonstracao, identificado na tela e separado dos seus dados reais.
Consulte [funcionalidades, limites e testes](frontend/README.md).

## Banco existente e migracao monetaria

Novos bancos usam centavos inteiros em `flow.value_cents`. Se o banco ainda
tiver `flow.value REAL`, a API solicita migracao. Com a API parada, execute
a partir da raiz:

```powershell
cd backend
..\fluxo\Scripts\python.exe -m app.database.migrations.migrate_money
cd ..
```

O comando cria backup antes da conversao. Consulte as regras de validacao,
falhas e recuperacao na [arquitetura](docs/architecture.md).
Valores de movimentacoes e saldo sao retornados como strings decimais,
por exemplo `"35.50"`. Investimentos e desejos ainda usam float/REAL.

O banco continua em `data/` na raiz, mesmo executando dentro de `backend/`.
A reorganizacao de pastas nao converte automaticamente o banco existente.
