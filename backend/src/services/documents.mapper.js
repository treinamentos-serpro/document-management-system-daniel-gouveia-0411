function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function toDownloadDocument(document, filePath) {
  return {
    originalName: document.originalName,
    mimeType: document.mimeType,
    filePath,
  };
}

module.exports = {
  toPublicDocument,
  toDownloadDocument,
};