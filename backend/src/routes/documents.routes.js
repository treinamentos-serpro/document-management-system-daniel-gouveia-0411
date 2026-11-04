// Rotas de documentos: definem os endpoints e delegam ao controller.
// O multer grava os uploads no filesystem local via diskStorage.
const crypto = require('node:crypto');
const fs = require('node:fs');

const express = require('express');
const multer = require('multer');

const config = require('../config');
const documentsController = require('../controllers/documents.controller');

// Garante que o diretório de armazenamento local exista.
fs.mkdirSync(config.storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storageDir),
  // O nome físico em disco é um UUID, evitando colisões e path traversal.
  filename: (req, file, cb) => cb(null, crypto.randomUUID()),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;
