# Arquitetura e evolucao gradual

O projeto e um backend unico, organizado em modulos, com FastAPI e SQLite.
O objetivo imediato e manter uma base compreensivel para uso pessoal e
acrescentar um fluxo funcional por vez.

## Responsabilidades atuais

| Local | Responsabilidade |
| --- | --- |
| `src/config.py` | Caminhos absolutos, derivados da raiz do projeto |
| `src/api/main.py` | Compor a API e inicializar tabelas no startup |
| `src/api/routers/` | Receber pedidos HTTP e devolver respostas |
| `src/api/schemas/` | Definir os contratos Pydantic de entrada |
| `src/database/crud.py` | Consultas SQL e persistencia das tres entidades |
| `src/database/connection.py` | Abrir conexao, confirmar ou reverter transacao e fechar |
| `src/database/table.py` | Criar as tabelas que ainda nao existem |
| `src/ingestion/readers/` | Ler arquivos; ainda sem importar para o banco |
| `src/ingestion/searcher.py` | Placeholder da futura pesquisa de precos |
| `tests/` | Verificar a base usando bancos temporarios |

Hoje as rotas chamam o CRUD diretamente. Quando surgir um fluxo com regras
proprias (como importacao), ele ganha um modulo em `src/services/`:

```text
rota HTTP -> servico de importacao -> leitor + normalizacao + persistencia
```

Servicos nao devem depender de FastAPI nem devolver respostas HTTP. Leitores
nao devem gravar no banco. SQL fica em `database/`; quando o CRUD crescer,
podemos separa-lo por dominio, mantendo a mesma responsabilidade.
Nao precisamos criar camadas que apenas repassam chamadas agora.

## Limites deste primeiro refactor

Foram preservados URLs, campos de entrada, respostas e esquema SQLite.
POST e DELETE continuam retornando `null`, listagens continuam como listas
de valores e datas/tipos continuam strings. Dinheiro ainda usa float/REAL.
Esses contratos precisam evoluir em uma etapa propria, com testes e uma
estrategia para converter os dados existentes.

A inicializacao usa CREATE TABLE IF NOT EXISTS: nao apaga registros e nao
atualiza esquemas antigos. Alteracoes futuras de coluna exigem migracao.
Importar os modulos nao cria o banco; o startup da API ou o comando explicito
`python -m src.database.table` cria as tabelas.

O SQLite atende a esta etapa local. A necessidade de Postgres, filas ou
infraestrutura na nuvem sera avaliada a partir do uso. A API atual nao tem
autenticacao e foi pensada para execucao local.

## Proximos passos pequenos

1. Definir as regras das movimentacoes: entrada, saida, transferencia,
   moeda, datas e representacao monetaria. Preparar migracao se necessario.
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
python -m unittest discover -s tests -v
```

Os testes verificam startup, preservacao de registros, operacoes atuais,
saldo, commit/rollback, fechamento de conexoes, caminhos e estrutura OpenAPI.
Chamam os handlers diretamente; nao substituem testes HTTP ponta a ponta.
Usam somente bancos temporarios, sem acessar `data/financas.db`.
