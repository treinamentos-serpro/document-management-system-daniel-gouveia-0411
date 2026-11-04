// Repositório de documentos: metadados em memória e resolução do caminho
// físico dos arquivos gravados em disco pelo multer.
const path = require('path');

const config = require('../config');

// Metadados mantidos em memória nesta fase (perdidos ao reiniciar o servidor).
const documents = [];

function save(document) {
  documents.push(document);
  return document;
}

function findAll() {
  // Retorna uma cópia ordenada do mais recente para o mais antigo.
  return [...documents].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt)
  );
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

function resolveFilePath(storageName) {
  return path.join(config.storageDir, storageName);
}

module.exports = {
  save,
  findAll,
  findById,
  resolveFilePath,
};
