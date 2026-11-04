// Service de documentos: concentra as regras de negócio.
const documentsRepository = require('../repositories/documents.repository');

// Campos internos (storageName, mimeType) não são expostos nas respostas da API.
function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function createDocument({ storageName, originalName, size, mimeType, owner }) {
  const document = {
    id: storageName, // o nome físico em disco é o próprio id do documento
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName,
    mimeType,
  };

  documentsRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments({ owner } = {}) {
  const documents = documentsRepository.findAll();
  const filtered = owner
    ? documents.filter((document) => document.owner === owner)
    : documents;
  return filtered.map(toPublicDocument);
}

function getDocumentForDownload(id) {
  const document = documentsRepository.findById(id);
  if (!document) {
    return null;
  }

  return {
    originalName: document.originalName,
    mimeType: document.mimeType,
    filePath: documentsRepository.resolveFilePath(document.storageName),
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};
