const crypto = require('node:crypto');
const fs = require('node:fs');

const express = require('express');
const multer = require('multer');

const config = require('../config');
const documentsController = require('../controllers/documents.controller');
const authenticateUser = require('../middleware/authenticate-user');

fs.mkdirSync(config.storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, config.storageDir),
  filename: (req, file, callback) => callback(null, crypto.randomUUID()),
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
    fields: 0,
    parts: 2,
  },
});

const router = express.Router();

router.use(authenticateUser);
router.get('/session', (req, res) => res.json({ userId: req.user.id }));
router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;