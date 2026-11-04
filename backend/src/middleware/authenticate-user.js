const crypto = require('node:crypto');

const config = require('../config');

function matchesToken(candidate, expected) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return (
    candidateBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

function authenticateUser(req, res, next) {
  if (Object.keys(config.userTokens).length === 0) {
    return res.status(503).json({
      error: 'A autenticação não está configurada no servidor.',
    });
  }

  const authorization = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  let userId = null;
  for (const [configuredUserId, token] of Object.entries(config.userTokens)) {
    if (matchesToken(match[1], token)) {
      userId = configuredUserId;
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Credencial inválida.' });
  }

  req.user = { id: userId };
  return next();
}

module.exports = authenticateUser;