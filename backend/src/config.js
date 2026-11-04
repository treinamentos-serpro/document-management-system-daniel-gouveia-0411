// Configuração central da aplicação (12-Factor: tudo via variáveis de ambiente).
const path = require('path');

const config = {
  port: Number(process.env.PORT) || 3000,
  storageDir:
    process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage'),
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024,
};

module.exports = config;
