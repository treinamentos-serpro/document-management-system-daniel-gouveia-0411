const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const config = require('../src/config');

// O repositório mantém os metadados em memória no escopo do módulo. Para
// manter os testes isolados, recarregamos service e repository a cada teste.
function createFreshService() {
  delete require.cache[require.resolve('../src/services/documents.service')];
  delete require.cache[require.resolve('../src/repositories/documents.repository')];
  return require('../src/services/documents.service');
}

// Monta uma entrada de criação válida, permitindo sobrescrever campos.
function makeDocumentInput(overrides = {}) {
  return {
    storageName: 'uuid-padrao',
    originalName: 'relatorio.pdf',
    size: 1234,
    mimeType: 'application/pdf',
    owner: 'daniel',
    ...overrides,
  };
}

test('createDocument retorna os metadados públicos do documento', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-01T10:00:00.000Z') });
  const service = createFreshService();

  const document = service.createDocument(makeDocumentInput());

  assert.deepStrictEqual(document, {
    id: 'uuid-padrao', // o id é o próprio nome físico em disco
    originalName: 'relatorio.pdf',
    size: 1234,
    uploadedAt: '2026-01-01T10:00:00.000Z',
    owner: 'daniel',
  });
});

test('createDocument não expõe campos internos (storageName, mimeType)', () => {
  const service = createFreshService();

  const document = service.createDocument(makeDocumentInput());

  assert.strictEqual('storageName' in document, false);
  assert.strictEqual('mimeType' in document, false);
});

test('listDocuments retorna vazio quando não há documentos', () => {
  const service = createFreshService();

  assert.deepStrictEqual(service.listDocuments(), []);
});

test('listDocuments ordena do mais recente para o mais antigo', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-01T10:00:00.000Z') });
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ storageName: 'antigo' }));
  t.mock.timers.tick(60_000);
  service.createDocument(makeDocumentInput({ storageName: 'recente' }));

  const ids = service.listDocuments().map((document) => document.id);
  assert.deepStrictEqual(ids, ['recente', 'antigo']);
});

test('listDocuments filtra pelo dono quando informado', () => {
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ storageName: 'a', owner: 'alice' }));
  service.createDocument(makeDocumentInput({ storageName: 'b', owner: 'bruno' }));
  service.createDocument(makeDocumentInput({ storageName: 'c', owner: 'alice' }));

  const ids = service.listDocuments({ owner: 'alice' }).map((document) => document.id);
  assert.deepStrictEqual(ids.sort(), ['a', 'c']);
});

test('listDocuments sem filtro retorna todos os documentos', () => {
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ storageName: 'a', owner: 'alice' }));
  service.createDocument(makeDocumentInput({ storageName: 'b', owner: 'bruno' }));

  assert.strictEqual(service.listDocuments().length, 2);
});

test('listDocuments para dono sem documentos retorna vazio', () => {
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ owner: 'alice' }));

  assert.deepStrictEqual(service.listDocuments({ owner: 'ninguem' }), []);
});

test('getDocumentForDownload retorna null para id inexistente', () => {
  const service = createFreshService();

  assert.strictEqual(service.getDocumentForDownload('nao-existe'), null);
});

test('getDocumentForDownload retorna nome original, mime type e caminho no storage', () => {
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ storageName: 'uuid-download' }));

  const download = service.getDocumentForDownload('uuid-download');
  assert.deepStrictEqual(download, {
    originalName: 'relatorio.pdf',
    mimeType: 'application/pdf',
    filePath: path.join(config.storageDir, 'uuid-download'),
  });
});

test('getDocumentForDownload resolve o arquivo dentro do diretório de storage', () => {
  const service = createFreshService();

  service.createDocument(makeDocumentInput({ storageName: 'uuid-contido' }));

  const { filePath } = service.getDocumentForDownload('uuid-contido');
  const storageDir = path.resolve(config.storageDir);
  assert.ok(
    path.resolve(filePath).startsWith(storageDir + path.sep),
    'o caminho do arquivo deve ficar contido no diretório de storage'
  );
});

test('resolveFilePath rejeita caminhos fora do diretório de storage', () => {
  const repository = require('../src/repositories/documents.repository');

  assert.throws(
    () => repository.resolveFilePath('../../outside.txt'),
    /fora do diretório de armazenamento/
  );
});
