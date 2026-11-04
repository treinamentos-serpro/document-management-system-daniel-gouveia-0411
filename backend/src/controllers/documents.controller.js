const fs = require('node:fs/promises');
const path = require('node:path');

const documentsService = require('../services/documents.service');

async function upload(req, res, next) {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: 'Nenhum arquivo foi enviado. Use o campo "file".' });
  }

  const originalName = path.basename(req.file.originalname.replace(/\\/g, '/'));

  try {
    const document = documentsService.createDocument({
      storageName: req.file.filename,
      originalName: originalName || 'documento',
      size: req.file.size,
      mimeType: 'application/octet-stream',
      owner: req.user.id,
    });
    return res.status(201).json(document);
  } catch (error) {
    await fs.rm(req.file.path, { force: true }).catch(() => {});
    return next(error);
  }
}

function list(req, res) {
  return res.json(documentsService.listDocuments({ owner: req.user.id }));
}

async function download(req, res, next) {
  const document = documentsService.getDocumentForDownload(
    req.params.id,
    req.user.id
  );
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  try {
    await fs.access(document.filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }
    return next(error);
  }

  res.type('application/octet-stream');
  return res.download(document.filePath, document.originalName, (error) => {
    if (error) {
      next(error);
    }
  });
}

module.exports = {
  upload,
  list,
  download,
};