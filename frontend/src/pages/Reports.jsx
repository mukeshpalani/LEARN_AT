import React, { useState } from 'react';
import { generateReport, getReportDownloadUrl } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { FileSpreadsheet, Download, FileText, Sparkles, Loader2 } from 'lucide-react';

const Reports = () => {
  const [reportTitle, setReportTitle] = useState('Scholarship & Attendance Compliance Report');
  const [reportQuery, setReportQuery] = useState('Comprehensive analysis of scholarship eligibility, attendance requirements, missing documents, and student compliance checklist.');
  const [formatType, setFormatType] = useState('markdown');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!reportTitle.trim() || generating) return;

    try {
      setGenerating(true);
      const res = await generateReport(reportTitle, reportQuery, null, formatType);
      setReportData(res.data);
    } catch (err) {
      alert('Report generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>Report Generator</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Synthesize verified document intelligence into executive Markdown, DOCX, and PDF reports.
        </p>
      </div>

      {/* Report Form */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Report Title</label>
            <input 
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Scope & Topic Query</label>
            <textarea
              rows={3}
              value={reportQuery}
              onChange={(e) => setReportQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Target Export Format:</label>
            <select
              value={formatType}
              onChange={(e) => setFormatType(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc'
              }}
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="docx">Microsoft Word (.docx)</option>
              <option value="pdf">PDF Document (.pdf)</option>
            </select>

            <button type="submit" className="glass-button" disabled={generating}>
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generating ? 'Generating Executive Report...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Report Output & Downloads */}
      {reportData && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{reportData.title}</h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {Object.entries(reportData.files).map(([fmt, path]) => (
                <a
                  key={fmt}
                  href={getReportDownloadUrl(path)}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-button-secondary"
                  style={{ textDecoration: 'none', fontSize: '0.82rem' }}
                >
                  <Download size={14} /> Download {fmt.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Report Preview */}
          <div style={{ background: '#090d16', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', lineHeight: 1.6 }}>
            <ReactMarkdown>{reportData.report_markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
