import React, { useEffect, useState } from 'react';
import { getDocuments } from '../services/api';
import { FolderOpen, MessageSquareCode, FileSpreadsheet, FileCheck2, Sparkles, ArrowRight, BookOpen, Layers, CheckSquare } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const docsRes = await getDocuments().catch(() => ({ data: [] }));
      setDocs(docsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const quickTasks = [
    {
      title: "Document Explanation",
      desc: "Ask the agent to explain complex project documents or research papers in simple terms.",
      icon: BookOpen,
      action: "Explain the AI sign language project."
    },
    {
      title: "Multi-File Requirements Checklist",
      desc: "Retrieve requirements across documents and generate an actionable checklist.",
      icon: CheckSquare,
      action: "Analyze scholarship requirements, tell me what documents are needed, and create a checklist."
    },
    {
      title: "Structured Data Summary",
      desc: "Perform calculations and tabular analysis on CSV or Excel files automatically.",
      icon: Layers,
      action: "Analyze the student records data and summarize performance."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ maxWidth: '700px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px'
          }}>
            <Sparkles size={14} /> KnowledgePilot AI Workspace
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
            What would you like to accomplish today?
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Upload your project documents, ask high-level questions, and let the AI agent automatically analyze, verify, and generate structured results for you.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="glass-button" onClick={() => setActiveTab('chat')}>
              <MessageSquareCode size={18} /> Run AI Task
            </button>
            <button className="glass-button-secondary" onClick={() => setActiveTab('documents')}>
              <FolderOpen size={18} /> Upload Documents
            </button>
            <button className="glass-button-secondary" onClick={() => setActiveTab('reports')}>
              <FileSpreadsheet size={18} /> Generate Reports
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Active Documents</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)' }}>
              <FolderOpen size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>{docs.length} Files</div>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Ready for AI Analysis</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Supported Formats</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(192, 132, 252, 0.15)' }}>
              <FileCheck2 size={20} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>PDF, DOCX, TXT, CSV, XLSX</div>
          <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>Unified Document Ingestion</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Export Capabilities</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)' }}>
              <FileSpreadsheet size={20} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>Markdown, DOCX & PDF</div>
          <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>Formal Reports & Checklists</span>
        </div>
      </div>

      {/* Recommended Quick Tasks */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
          Quick Task Suggestions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {quickTasks.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div 
                key={idx}
                className="glass-panel"
                onClick={() => setActiveTab('chat')}
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '14px'
                  }}>
                    <Icon size={20} color="#38bdf8" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                    {t.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {t.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: '18px', display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8'
                }}>
                  <span>Run this task</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Knowledge Base Recent Documents */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Your Uploaded Documents</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Documents available for the AI Agent to reference</p>
          </div>
          <button className="glass-button-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setActiveTab('documents')}>
            Manage Files
          </button>
        </div>

        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            No documents uploaded yet. Upload PDFs, Word documents, text files, or CSVs to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {docs.slice(0, 6).map((d) => (
              <div key={d.id} style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <FileCheck2 size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.filename}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.file_type.toUpperCase()} File</span>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Ready</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
