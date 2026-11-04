// Servidor backend do Document Management System.
//
// Clean Architecture simples, com fluxo de dependência:
//   routes -> controllers -> services -> repositories
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');

const config = require('./config');
const documentsRouter = require('./routes/documents.routes');

const app = express();
const PORT = config.port;

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);

// Tratamento de erros nos limites do sistema (upload e leitura de arquivos).
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(413)
      .json({ error: 'O arquivo excede o tamanho máximo permitido.' });
  }

  console.error('Erro inesperado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
