import DownloadButton from './DownloadButton';

// Converte bytes para uma representação legível.
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('pt-BR');
}

// Tabela com os documentos enviados e a ação de download de cada um.
export default function DocumentList({ documents }) {
  if (documents.length === 0) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={cellStyle}>Nome</th>
          <th style={cellStyle}>Tamanho</th>
          <th style={cellStyle}>Enviado em</th>
          <th style={cellStyle}>Dono</th>
          <th style={cellStyle}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td style={cellStyle}>{document.originalName}</td>
            <td style={cellStyle}>{formatFileSize(document.size)}</td>
            <td style={cellStyle}>{formatDate(document.uploadedAt)}</td>
            <td style={cellStyle}>{document.owner}</td>
            <td style={cellStyle}>
              <DownloadButton document={document} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: '0.5rem',
  textAlign: 'left',
};
