import React from 'react';
import { X, FileText, Bookmark, CheckCircle2 } from 'lucide-react';

const EvidenceModal = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '650px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Citation Evidence Inspector</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>DOCUMENT NAME</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>{citation.document}</span>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>PAGE NUMBER</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#c084fc' }}>Page {citation.page}</span>
            </div>
          </div>

          {/* Chunk ID */}
          {citation.chunk_id && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={14} color="#6366f1" />
              <span>Chunk ID: {citation.chunk_id}</span>
            </div>
          )}

          {/* Extracted Evidence Text */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px', display: 'block' }}>
              EXTRACTED VECTOR EVIDENCE TEXT:
            </span>
            <div style={{
              background: '#090d16',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              maxHeight: '260px',
              overflowY: 'auto',
              fontFamily: 'sans-serif'
            }}>
              "{citation.evidence}"
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399' }}>
            <CheckCircle2 size={14} />
            <span>Factual grounding verified by Verification Agent</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'right',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <button className="glass-button-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;
