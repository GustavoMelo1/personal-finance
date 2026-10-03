# Backend

API FastAPI com SQLite. Execute os comandos abaixo dentro de `backend/`,
usando o ambiente virtual que fica na raiz do repositorio:

```powershell
..\fluxo\Scripts\python.exe -m uvicorn app.main:app --reload --reload-dir app
..\fluxo\Scripts\python.exe -m unittest discover -s tests -t . -v
```

Imports internos usam `app.*`. `backend/` e a pasta do projeto Python;
nao e um prefixo de importacao. Evite misturar `app` e `backend.app`, pois
isso pode carregar duas instancias do mesmo modulo e suas configuracoes.

Responsabilidades:

- `app/main.py`: compoe a aplicacao e seu ciclo de vida.
- `app/core/`: configuracao compartilhada.
- `app/api/`: rotas e contratos HTTP.
- `app/domain/`: regras financeiras sem dependencia de HTTP ou SQLite.
- `app/database/`: persistencia e migracoes explicitas.
- `app/ingestion/`: leitura de arquivos; ainda sem pipeline de importacao.
- `tests/`: testes de validacao, persistencia, migracao e requisicoes ASGI.

Dados locais ficam em `../data/`, nao em `backend/data/`. Nao mova o ambiente
virtual `../fluxo/` junto com o codigo.

Para migrar um banco antigo, com a API parada:

```powershell
..\fluxo\Scripts\python.exe -m app.database.migrations.migrate_money
```

O comando cria backup. A migracao e independente da reorganizacao de pastas.
Mais detalhes em [arquitetura](../docs/architecture.md).
