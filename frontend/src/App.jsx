import { useCallback, useEffect, useState } from 'react';

import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments, uploadDocument } from './services/documentsApi';

// Componente raiz: orquestra o estado dos documentos e delega a
// apresentação para os componentes de upload e listagem.
export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshDocuments = useCallback(async () => {
    try {
      setDocuments(await listDocuments());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  async function handleUpload(file) {
    try {
      await uploadDocument(file);
      await refreshDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <section>
        <h2>Enviar documento</h2>
        <UploadComponent onUpload={handleUpload} />
      </section>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section>
        <h2>Documentos</h2>
        {loading ? <p>Carregando documentos…</p> : <DocumentList documents={documents} />}
      </section>
    </main>
  );
}
