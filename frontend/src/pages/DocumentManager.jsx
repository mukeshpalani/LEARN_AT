import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument, getDocumentChunks } from '../services/api';
import { UploadCloud, Trash2, Eye, FileText, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeChunksModal, setActiveChunksModal] = useState(null);
  const [chunksList, setChunksList] = useState([]);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', selectedCategory);

    try {
      setUploading(true);
      await uploadDocument(formData);
      setSelectedFile(null);
      fetchDocs();
    } catch (err) {
      alert('Document upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete document and all associated vector embeddings?')) return;
    try {
      await deleteDocument(id);
      fetchDocs();
    } catch (e) {
      alert('Failed to delete document');
    }
  };

  const handleInspectChunks = async (doc) => {
    try {
      setActiveChunksModal(doc);
      const res = await getDocumentChunks(doc.id);
      setChunksList(res.data || []);
    } catch (e) {
      alert('Failed to load document chunks');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>Document Manager</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Upload PDFs, DOCX, TXT, CSV, XLSX, and JSON files into the Qdrant vector knowledge base.
          </p>
        </div>
        <button className="glass-button-secondary" onClick={fetchDocs}>
          <RefreshCw size={16} /> Refresh List
        </button>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '16px' }}>Upload New Document</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls,.json"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.9rem',
              flex: 1
            }}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.9rem'
            }}
          >
            <option value="general">General</option>
            <option value="regulations">Regulations</option>
            <option value="handbooks">Handbooks</option>
            <option value="policies">Policies</option>
            <option value="student_records">Student Records</option>
          </select>

          <button type="submit" className="glass-button" disabled={uploading || !selectedFile}>
            <UploadCloud size={18} /> {uploading ? 'Processing Ingestion...' : 'Upload & Index'}
          </button>
        </form>
      </div>

      {/* Documents Table */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '16px' }}>Indexed Documents</h3>
        
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No documents found. Upload files using the form above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Filename</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Chunks</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 16px', color: '#f8fafc', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#38bdf8" />
                      <span>{doc.filename}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#c084fc', textTransform: 'uppercase' }}>{doc.file_type}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{doc.category}</td>
                  <td style={{ padding: '14px 16px', color: '#f8fafc' }}>{doc.chunk_count}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${doc.status === 'processed' ? 'badge-success' : 'badge-running'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        className="glass-button-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleInspectChunks(doc)}
                      >
                        <Eye size={14} /> Chunks
                      </button>
                      <button 
                        className="glass-button-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', borderColor: '#fb7185', color: '#fb7185' }}
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Chunks Inspector Modal */}
      {activeChunksModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            background: '#0f172a', borderRadius: '16px', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Chunk Metadata Inspector: {activeChunksModal.filename}
              </h3>
              <button onClick={() => setActiveChunksModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chunksList.map((c, i) => (
                <div key={i} style={{ background: '#090d16', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#38bdf8', marginBottom: '6px' }}>
                    <span>Chunk ID: {c.chunk_id}</span>
                    <span>Page: {c.page_number}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>{c.text_preview}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
