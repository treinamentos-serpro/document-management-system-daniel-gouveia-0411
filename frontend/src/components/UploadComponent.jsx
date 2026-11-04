import { useRef, useState } from 'react';

// Formulário de upload de documento. A chamada à API fica a cargo do pai,
// recebido via onUpload, mantendo este componente reutilizável.
export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
      <label htmlFor="file-input" style={{ marginRight: '0.5rem' }}>
        Documento:
      </label>
      <input
        id="file-input"
        ref={inputRef}
        type="file"
        onChange={(event) => setFile(event.target.files[0] ?? null)}
      />
      <button type="submit" disabled={!file || submitting}>
        {submitting ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  );
}
