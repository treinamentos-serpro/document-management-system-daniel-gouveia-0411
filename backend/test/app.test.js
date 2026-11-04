const { after, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-api-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_FILE_SIZE_BYTES = '1024';
process.env.DMS_USER_TOKENS = JSON.stringify({
  alice: 'alice-test-token',
  bob: 'bob-test-token',
});

const app = require('../src/app');

after(() => fs.rmSync(storageDir, { recursive: true, force: true }));

function startServer(t) {
  const server = app.listen(0);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return new Promise((resolve) => {
    server.once('listening', () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('rotas de documentos exigem autenticação', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 401);
});

test('usuário lista e baixa somente os próprios documentos', async (t) => {
  const baseUrl = await startServer(t);
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo privado']), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authorization('alice-test-token'),
    body: formData,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();

  const aliceList = await fetch(`${baseUrl}/documents`, {
    headers: authorization('alice-test-token'),
  });
  assert.deepStrictEqual(
    (await aliceList.json()).map((document) => document.id),
    [uploadedDocument.id]
  );

  const bobList = await fetch(`${baseUrl}/documents`, {
    headers: authorization('bob-test-token'),
  });
  assert.deepStrictEqual(await bobList.json(), []);

  const forbiddenDownload = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
    { headers: authorization('bob-test-token') }
  );
  assert.strictEqual(forbiddenDownload.status, 404);

  const download = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
    { headers: authorization('alice-test-token') }
  );
  assert.strictEqual(download.status, 200);
  assert.strictEqual(await download.text(), 'conteudo privado');
  assert.strictEqual(download.headers.get('x-content-type-options'), 'nosniff');
});

test('upload rejeita arquivo acima do limite configurado', async (t) => {
  const baseUrl = await startServer(t);
  const formData = new FormData();
  formData.append('file', new Blob(['x'.repeat(2048)]), 'grande.bin');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authorization('alice-test-token'),
    body: formData,
  });

  assert.strictEqual(response.status, 413);
});

test('upload sem arquivo retorna 400', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: authorization('alice-test-token'),
    body: new FormData(),
  });

  assert.strictEqual(response.status, 400);
});
