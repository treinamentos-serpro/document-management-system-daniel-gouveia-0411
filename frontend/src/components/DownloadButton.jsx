import { getDownloadUrl } from '../services/documentsApi';

// Link de download de um documento, estilizado como botão.
export default function DownloadButton({ document }) {
  return (
    <a
      href={getDownloadUrl(document.id)}
      download={document.originalName}
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        textDecoration: 'none',
      }}
    >
      Baixar
    </a>
  );
}
