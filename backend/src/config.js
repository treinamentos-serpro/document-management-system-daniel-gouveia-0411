const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function parseUserTokens(value) {
  if (!value) {
    return {};
  }

  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('DMS_USER_TOKENS deve ser um objeto JSON.');
  }

  for (const [userId, token] of Object.entries(parsed)) {
    if (!userId.trim() || typeof token !== 'string' || !token.trim()) {
      throw new Error('DMS_USER_TOKENS contém uma identidade inválida.');
    }
  }

  return parsed;
}

const configuredFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(
    process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage')
  ),
  maxFileSizeBytes:
    Number.isInteger(configuredFileSize) && configuredFileSize > 0
      ? configuredFileSize
      : DEFAULT_MAX_FILE_SIZE_BYTES,
  userTokens: parseUserTokens(process.env.DMS_USER_TOKENS),
};