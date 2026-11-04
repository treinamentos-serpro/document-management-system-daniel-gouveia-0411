# Especificação - Document Management System

> Especificação completa do Document Management System (DMS), gerada a partir
> do modelo [spec-template.md](./spec-template.md). Este documento orienta o
> desenvolvimento guiado por especificação (Spec Driven Development) e serve
> como fonte de verdade para as próximas etapas de implementação.

## 1. Objetivo

Oferecer um sistema web simples para que usuários enviem, listem e baixem
documentos, com arquivos gravados no filesystem local da aplicação e metadados
mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada documento tem um dono)

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação/autorização real (a identificação do usuário é simplificada)
- Persistência de metadados em banco de dados
- Exclusão e edição de documentos

## 3. Requisitos funcionais

| ID    | Requisito                                                                                   |
| ----- | ------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento via `multipart/form-data` (campo `file`)                 |
| RF-02 | O usuário pode listar os documentos enviados, ordenados do mais recente para o mais antigo  |
| RF-03 | O usuário pode baixar um documento pelo identificador, recebendo o arquivo com o nome original |
| RF-04 | Cada documento é associado a um dono (`owner`); a listagem pode ser filtrada por dono       |
| RF-05 | O sistema responde com erros claros: `400` para upload sem arquivo e `404` para id inexistente |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage`, via `multer` com `diskStorage`      |
| RNF-02 | Metadados dos documentos mantidos em memória nesta fase (perdidos ao reiniciar o servidor)      |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor): `PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE_BYTES` |
| RNF-04 | Limite de tamanho de upload configurável; uploads acima do limite são rejeitados com `413`      |
| RNF-05 | O nome físico do arquivo em disco é o `id` do documento, evitando colisões e path traversal     |
| RNF-06 | Testes do backend escritos com o runner nativo do Node (`node:test`)                            |

### Variáveis de ambiente

| Variável              | Padrão            | Descrição                                   |
| --------------------- | ----------------- | ------------------------------------------- |
| `PORT`                | `3000`            | Porta HTTP do backend                       |
| `STORAGE_DIR`         | `backend/storage` | Diretório local onde os arquivos são salvos |
| `MAX_FILE_SIZE_BYTES` | `10485760` (10 MB) | Tamanho máximo aceito por upload           |

## 5. Modelo de dados (metadados do documento)

Entidade `Document`, mantida em memória pelo repositório de metadados:

| Campo        | Tipo   | Descrição                                                      |
| ------------ | ------ | -------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID)                        |
| originalName | string | Nome original do arquivo enviado                               |
| size         | number | Tamanho em bytes                                               |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                 |
| owner        | string | Identificador do usuário dono                                  |
| storageName  | string | Nome físico do arquivo em disco (igual ao `id`) — uso interno  |
| mimeType     | string | Content-Type informado no upload — usado no download           |

Observações:

- `storageName` e `mimeType` são detalhes internos: não aparecem nas respostas
  da API de listagem, mas são necessários para localizar o arquivo em disco e
  para definir o `Content-Type` correto no download.
- Nesta fase não há banco de dados: o repositório de metadados é um array/Map
  em memória.

## 6. Contratos de API

Todas as rotas são servidas pelo backend Express na porta `3000` (padrão).
No frontend, as chamadas usam o prefixo `/api` (ex.: `/api/documents`), que o
proxy do Vite remove antes de encaminhar ao backend
(`/api/documents` → `http://localhost:3000/documents`).

### Identificação do usuário (premissa desta fase)

Não há autenticação real. O dono do documento é identificado pelo cabeçalho
HTTP `x-user-id`. Quando ausente, assume-se o valor `anonymous`.

### POST /upload

Envia um documento.

- Entrada: `multipart/form-data` com o campo `file` (obrigatório)
- Cabeçalhos: `x-user-id` (opcional, padrão `anonymous`)

Respostas:

- `201 Created` — metadados do documento criado:

  ```json
  {
    "id": "3f8a2c1e-9b7d-4a6f-8c2e-1d5b7a9f0c3e",
    "originalName": "relatorio.pdf",
    "size": 348112,
    "uploadedAt": "2026-11-04T19:02:19.822Z",
    "owner": "anonymous"
  }
  ```

- `400 Bad Request` — nenhum arquivo enviado:

  ```json
  { "error": "Nenhum arquivo foi enviado. Use o campo \"file\"." }
  ```

- `413 Payload Too Large` — arquivo acima de `MAX_FILE_SIZE_BYTES`:

  ```json
  { "error": "O arquivo excede o tamanho máximo permitido." }
  ```

### GET /documents

Lista os metadados dos documentos, do mais recente para o mais antigo.

- Query string: `owner` (opcional) — filtra os documentos pelo dono

Respostas:

- `200 OK`:

  ```json
  [
    {
      "id": "3f8a2c1e-9b7d-4a6f-8c2e-1d5b7a9f0c3e",
      "originalName": "relatorio.pdf",
      "size": 348112,
      "uploadedAt": "2026-11-04T19:02:19.822Z",
      "owner": "anonymous"
    }
  ]
  ```

### GET /documents/:id/download

Baixa o conteúdo binário de um documento.

- Parâmetro de rota: `id` — identificador do documento

Respostas:

- `200 OK` — conteúdo binário do arquivo, com cabeçalhos:
  - `Content-Type`: `mimeType` registrado no upload
  - `Content-Disposition`: `attachment; filename="<originalName>"`
- `404 Not Found` — documento não encontrado:

  ```json
  { "error": "Documento não encontrado." }
  ```

### GET /health

Verificação de saúde (já existente no seed).

- `200 OK`:

  ```json
  { "status": "ok" }
  ```

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples, com quatro camadas em `backend/src`
  e fluxo de dependência `routes -> controllers -> services -> repositories`:
  - `routes/`: definem os endpoints e delegam para os controllers
  - `controllers/`: tratam entrada/saída HTTP e validação básica
  - `services/`: concentram as regras de negócio
  - `repositories/`: cuidam da persistência (arquivos locais + metadados em memória)
- Camadas internas não conhecem camadas externas.
- Upload com `multer` configurado com `diskStorage`, gravando em
  `backend/storage` (criado automaticamente se não existir). Nenhum provedor
  externo de armazenamento é utilizado.
- Frontend React baseado em componentes funcionais com Hooks, organizado em
  `components/`, `pages/` e `services/`; comunicação com o backend via `fetch`
  usando o prefixo `/api` (proxy do Vite).
- Nomes de símbolos de código em inglês; mensagens ao usuário e comentários
  em português.
- Erros tratados nos limites do sistema (entrada HTTP e leitura/escrita de
  arquivos), com respostas JSON no formato `{ "error": "<mensagem>" }`.

## 8. Plano de execução

Etapas na ordem de implementação (cada etapa deve manter os testes verdes):

1. **Repositórios** — implementar em `backend/src/repositories` o repositório
   de metadados em memória (criar, listar, buscar por id) e a configuração do
   `multer` com `diskStorage` apontando para `STORAGE_DIR`.
2. **Service** — implementar em `backend/src/services` o service de documentos
   com as regras de negócio: montar metadados no upload, listar com filtro por
   dono e resolver documento para download.
3. **Controllers e rotas** — implementar em `backend/src/controllers` e
   `backend/src/routes` os endpoints `POST /upload`, `GET /documents` e
   `GET /documents/:id/download`, registrando as rotas em `app.js`.
4. **Testes do backend** — cobrir com `node:test` os fluxos principais:
   upload com sucesso, upload sem arquivo (`400`), listagem, download e id
   inexistente (`404`).
5. **Serviço de API no frontend** — criar em `frontend/src/services` o módulo
   de acesso à API com `fetch` e prefixo `/api`.
6. **Componentes e páginas** — criar em `frontend/src/components` e
   `frontend/src/pages` o formulário de upload, a lista de documentos e o
   link/ação de download, reutilizando componentes.
7. **Integração ponta a ponta** — validar o fluxo completo com backend e
   frontend rodando juntos (proxy do Vite), ajustando detalhes finais.
