// Cliente da API de documentos. Toda a comunicação com o backend passa por
// aqui, via fetch com o prefixo /api (proxy configurado no Vite).
const API_PREFIX = '/api';

// Lê o corpo da resposta e lança um erro com a mensagem do backend quando
// a requisição falha (tratamento de erro no limite do sistema).
async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Falha na requisição (HTTP ${response.status}).`);
  }
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  return handleResponse(response);
}

export function getDownloadUrl(documentId) {
  return `${API_PREFIX}/documents/${documentId}/download`;
}
