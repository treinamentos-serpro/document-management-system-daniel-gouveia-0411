const path = require('node:path');

const config = require('../config');

const documents = [];

function save(document) {
  documents.push(document);
  return document;
}

function findAll({ owner } = {}) {
  const filteredDocuments = owner
    ? documents.filter((document) => document.owner === owner)
    : documents;

  return [...filteredDocuments].sort((first, second) =>
    second.uploadedAt.localeCompare(first.uploadedAt)
  );
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

function resolveFilePath(storageName) {
  if (typeof storageName !== 'string' || !storageName) {
    throw new Error('Nome de armazenamento inválido.');
  }

  const storageDir = path.resolve(config.storageDir);
  const filePath = path.resolve(storageDir, storageName);
  const relativePath = path.relative(storageDir, filePath);

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('Caminho fora do diretório de armazenamento.');
  }

  return filePath;
}

module.exports = {
  save,
  findAll,
  findById,
  resolveFilePath,
};