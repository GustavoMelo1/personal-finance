# Roadmap M1-M10

Objetivo da V1: usar controle financeiro, investimentos e desejos conectados
ao orcamento. Cada modulo avanca por conceito, tarefa pequena, revisao, teste
e commit. O assistente explica e orienta; implementa quando solicitado.

| Modulo | Escopo | Criterio de conclusao | Estado |
| --- | --- | --- | --- |
| M1 | Estrutura, execucao, testes e arquitetura | Rodar o projeto e entender o caminho de uma requisicao | Estrutura reorganizada; revisao guiada e verificacao do banco pessoal pendentes |
| M2 | Validacao de movimentacoes, edicao, respostas, filtros e paginacao | Cadastrar, consultar, corrigir e excluir com contratos previsiveis | Tipos e dinheiro implementados; datas e demais itens pendentes |
| M3 | Contas, saldo inicial e transferencias | Transferencias nao inflarem receitas/despesas | Planejado |
| M4 | Importacao com previa, confirmacao e deduplicacao | Reimportar um extrato sem duplicar registros | Leitores basicos existentes |
| M5 | Categorias, orcamento e resumo mensal | Comparar gasto realizado com o planejado | Planejado |
| M6 | Interface para rotina financeira | Usar o controle financeiro sem depender de /docs | Pasta reservada; tecnologia pendente |
| M7 | Carteira, aportes, resgates, posicao e evolucao | Conferir ativos suportados com o extrato da corretora | Cadastro basico existente |
| M8 | Desejos, prioridades, prazos e valor reservado | Acompanhar objetivos e impacto no orcamento | Cadastro basico existente |
| M9 | Pesquisa de precos, historico e alertas | Receber oportunidades com fonte, link, preco e horario | Placeholder existente |
| M10 | Backup, restauracao, exportacao e operacao | Usar, atualizar e recuperar a V1 com confiabilidade | Planejado |

M6 entrega o primeiro controle financeiro utilizavel. M10 fecha os tres
pilares da V1. Testes e protecao de dados acompanham todos os modulos.
Autenticacao deve ser implementada antes de disponibilizar acesso pela internet.

Decisoes pendentes: bancos e formatos de extrato, cartoes/faturas, ativos de
investimento suportados, tecnologia da interface e fontes de precos.
IA e infraestrutura avancada ficam para depois da V1, conforme necessidade.

Proximo passo de aprendizado: revisar a nova estrutura e os comandos (M1).
Proxima mudanca funcional: validar datas das movimentacoes (M2). Essa validacao
ainda nao foi implementada durante a reorganizacao.
