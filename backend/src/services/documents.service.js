const documentsRepository = require('../repositories/documents.repository');
const documentsMapper = require('./documents.mapper');

function createDocument({ storageName, originalName, size, mimeType, owner }) {
  const document = {
    id: storageName,
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName,
    mimeType,
  };

  documentsRepository.save(document);
  return documentsMapper.toPublicDocument(document);
}

function listDocuments({ owner } = {}) {
  return documentsRepository
    .findAll({ owner })
    .map(documentsMapper.toPublicDocument);
}

function getDocumentForDownload(id, owner) {
  const document = documentsRepository.findById(id);
  if (!document || (owner !== undefined && document.owner !== owner)) {
    return null;
  }

  const filePath = documentsRepository.resolveFilePath(document.storageName);
  return documentsMapper.toDownloadDocument(document, filePath);
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};