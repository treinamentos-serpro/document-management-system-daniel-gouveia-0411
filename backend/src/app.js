const express = require('express');
const multer = require('multer');

const config = require('./config');
const documentsRouter = require('./routes/documents.routes');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      status === 413
        ? 'O arquivo excede o tamanho máximo permitido.'
        : 'O upload contém campos inválidos.';
    return res.status(status).json({ error: message });
  }

  console.error('Erro inesperado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
