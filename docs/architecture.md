# Arquitetura e evolucao gradual

O projeto e um backend unico, organizado em modulos, com FastAPI e SQLite.
O objetivo imediato e manter uma base compreensivel para uso pessoal e
acrescentar um fluxo funcional por vez.

## Responsabilidades atuais

| Local | Responsabilidade |
| --- | --- |
| `backend/app/core/config.py` | Caminhos absolutos, derivados da raiz do projeto |
| `backend/app/main.py` | Compor a API e inicializar tabelas no startup |
| `backend/app/api/routers/` | Receber pedidos HTTP e devolver respostas |
| `backend/app/api/schemas/` | Definir os contratos Pydantic de entrada |
| `backend/app/database/crud.py` | Consultas SQL e persistencia das tres entidades |
| `backend/app/database/connection.py` | Abrir conexao, confirmar ou reverter transacao e fechar |
| `backend/app/database/table.py` | Criar as tabelas que ainda nao existem |
| `backend/app/database/migrations/migrate_money.py` | Migrar valores antigos com backup e transacao |
| `backend/app/domain/money.py` | Converter reais decimais para centavos inteiros e vice-versa |
| `backend/app/ingestion/readers/` | Ler arquivos; ainda sem importar para o banco |
| `backend/app/ingestion/searcher.py` | Placeholder da futura pesquisa de precos |
| `backend/tests/` | Verificar a base usando bancos temporarios |

Hoje as rotas chamam o CRUD diretamente. Quando surgir um fluxo com regras
proprias (como importacao), ele ganha um modulo em `backend/app/services/`:

```text
rota HTTP -> servico de importacao -> leitor + normalizacao + persistencia
```

Servicos nao devem depender de FastAPI nem devolver respostas HTTP. Leitores
nao devem gravar no banco. SQL fica em `database/`; quando o CRUD crescer,
podemos separa-lo por dominio, mantendo a mesma responsabilidade.
Nao precisamos criar camadas que apenas repassam chamadas agora.

## Estado atual dos contratos

URLs e nomes dos campos de entrada foram preservados. POST e DELETE
continuam retornando `null` e listagens continuam posicionais.
Datas ainda sao strings. O tipo de movimentacao aceita Income ou Expense.
Receitas/despesas agora usam Decimal e centavos inteiros; investimentos
e desejos continuam float/REAL e serao tratados separadamente.

## Dinheiro em receitas e despesas

O schema Flow exige valor positivo, finito, com ate duas casas decimais
e no maximo 92233720368547758.07 reais (limite do inteiro SQLite em centavos).
Valores com fracao de centavo sao rejeitados, sem arredondamento silencioso.
Envie preferencialmente texto decimal no JSON: `"value": "35.50"`.
Numeros JSON tambem sao aceitos, mas podem ja conter aproximacoes do cliente.

O Python calcula com Decimal e o banco guarda `value_cents INTEGER`.
Por exemplo, `"35.50"` vira 3550. O saldo soma/subtrai centavos inteiros.
Na resposta HTTP, o valor na sexta posicao de cada movimentacao e o campo
`balance` agora sao strings com duas casas decimais, como `"35.50"`.
Essa e uma mudanca de contrato: clientes que esperavam numero precisam
ser adaptados. Nao converta de volta para float para calculos financeiros.

### Banco existente

A API nao converte dados antigos automaticamente. Se flow ainda tiver
`value REAL`, o startup solicita executar, na raiz do projeto:

```powershell
cd backend
..\fluxo\Scripts\python.exe -m app.database.migrations.migrate_money
cd ..
```

Execute com a API parada. O comando valida todos os valores, cria uma copia
SQLite completa `data/financas.db.before-money-<id>.bak` e substitui a tabela
flow dentro de uma transacao. IDs, sequencia de IDs e demais tabelas sao
preservados. Se ja foi migrado, nao realiza nova conversao.
O script recusa indices/triggers personalizados em flow para nao remove-los
silenciosamente. Esta migracao foi desenhada para o esquema original do projeto.

Valores antigos negativos, zero, nao finitos, fora do limite ou com fracao
de centavo interrompem a migracao e indicam o ID que precisa de revisao.
Isso inclui residuos de calculos antigos com float: a regra de correcao deve
ser decidida explicitamente. Nenhum valor e arredondado automaticamente.

O backup conserva o esquema antigo. Para voltar a ele, pare a API, preserve
o banco atual, restaure o backup e use uma versao do codigo anterior a esta
migracao. Nao restaure sobre um banco em uso. Backups contem dados pessoais
e ficam dentro de `data/`, que ja e ignorado pelo Git.

A inicializacao usa CREATE TABLE IF NOT EXISTS: nao apaga registros e nao
atualiza esquemas antigos. Alteracoes futuras de coluna exigem migracao.
Importar os modulos nao cria o banco; o startup da API ou o comando explicito
`python -m app.database.table` (executado dentro de `backend/`) cria as tabelas.

O SQLite atende a esta etapa local. A necessidade de Postgres, filas ou
infraestrutura na nuvem sera avaliada a partir do uso. A API atual nao tem
autenticacao e foi pensada para execucao local.

## Proximos passos pequenos

1. Completar as regras das movimentacoes: transferencias entre contas,
   moeda e validacao de datas. Precisao monetaria de flow ja foi implementada.
2. Escolher um banco e formato de extrato; implementar apenas a leitura
   normalizada e a previa, sem gravar automaticamente.
3. Confirmar importacao e detectar repeticoes, preferindo identificador
   da transacao fornecido pelo banco e incluindo a conta de origem.
   Data/valor/descricao iguais podem representar compras diferentes.
4. Adicionar categorias revisaveis e resumo mensal.
5. Evoluir carteira de investimentos e monitoramento de desejos em etapas
   separadas, com regras e fontes definidas antes das integracoes.

PIX recebido nao e necessariamente renda: pode ser transferencia propria
ou reembolso. A classificacao precisa considerar esse contexto.

## Validacao

Na raiz, com as dependencias instaladas:

```powershell
.\fluxo\Scripts\python.exe -m unittest discover -s backend/tests -t backend -v
```

Os testes verificam startup, preservacao de registros, operacoes atuais,
saldo exato, commit/rollback, fechamento de conexoes, caminhos, estrutura
OpenAPI e migracao com backup. Tambem exercitam requisicoes ASGI para validar
respostas HTTP 422 e serializacao decimal; nao iniciam um servidor de rede.
Usam somente bancos temporarios, sem acessar `data/financas.db`.

## Separacao backend/frontend

O backend e um pacote Python chamado `app`, dentro de `backend/`. Imports
internos usam `app.*`, sem prefixo `backend` e sem manipulacao de `sys.path`.
Da raiz, o Uvicorn usa `--app-dir backend`; o unittest usa `-t backend`.
Dentro de `backend/`, o pacote ja esta no caminho de importacao.

O ponto de entrada e `app.main:app`. Configuracoes ficam em `core/`, regras
monetarias puras em `domain/` e migracoes explicitas em `database/migrations/`.
Leitores e o placeholder de pesquisa mantem seu comportamento atual.

`data/` e `fluxo/` continuam na raiz. A raiz de dados e calculada a partir de
`backend/app/core/config.py`, nao da pasta em que o comando foi executado.
Esta reorganizacao nao executa a migracao monetaria do banco pessoal.

`frontend/` contem a interface Lastro em React, Vite e Tailwind. Ela consome
`/api/*`, encaminhado pelo proxy do Vite para o FastAPI local na porta 8000.
Nao acessa o SQLite diretamente. O modo de demonstracao usa dados ficticios
em memoria, separado da API. Calculos de movimentacoes usam BigInt em centavos;
as respostas posicionais do backend sao adaptadas em `frontend/src/lib/api.js`.
Veja [frontend](../frontend/README.md) para comandos, limites e testes de navegador,
e [roadmap](roadmap.md) para as etapas.
