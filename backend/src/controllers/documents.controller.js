// Controller de documentos: trata entrada/saída HTTP e validação básica.
const documentsService = require('../services/documents.service');

const DEFAULT_OWNER = 'anonymous';

function upload(req, res) {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: 'Nenhum arquivo foi enviado. Use o campo "file".' });
  }

  const owner = req.get('x-user-id') || DEFAULT_OWNER;

  const document = documentsService.createDocument({
    storageName: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    owner,
  });

  return res.status(201).json(document);
}

function list(req, res) {
  const documents = documentsService.listDocuments({ owner: req.query.owner });
  return res.json(documents);
}

function download(req, res, next) {
  const document = documentsService.getDocumentForDownload(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  res.type(document.mimeType);
  return res.download(document.filePath, document.originalName, (err) => {
    if (err && !res.headersSent) {
      next(err);
    }
  });
}

module.exports = {
  upload,
  list,
  download,
};
