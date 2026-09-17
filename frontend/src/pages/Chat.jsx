import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getDocuments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import EvidenceModal from '../components/EvidenceModal';
import AgentTimeline from '../components/AgentTimeline';
import { Send, Bot, User, FileText, Sparkles, ShieldCheck, Loader2, Target } from 'lucide-react';

const Chat = () => {
  const { user, gmailStatus, gmailConnected, gmailScopeMissing, connectGmail, gmailAccessToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocFilter, setSelectedDocFilter] = useState('');
  const [activeCitation, setActiveCitation] = useState(null);
  const [activeTaskTrace, setActiveTaskTrace] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (queryText = inputQuery) => {
    if (!queryText.trim() || loading) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);
    setActiveTaskTrace(null);

    const token = gmailAccessToken || sessionStorage.getItem('gmail_access_token') || null;

    try {
      const response = await sendChatMessage(queryText, null, selectedDocFilter || null, token, user?.email || null);
      const data = response.data;

      const assistantMessage = {
        task_id: data.task_id,
        role: 'assistant',
        content: data.final_response,
        citations: data.citations || [],
        analysis: data.analysis,
        plan: data.plan,
        agent_trace: data.agent_trace || [],
        verification: data.verification_results,
        email_draft: data.email_draft
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setActiveTaskTrace(data);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Task execution error: ' + (err.response?.data?.detail || err.message)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoScenario = (scenarioType) => {
    let demoQuery = "";
    if (scenarioType === 'sign_language') {
      demoQuery = "Explain the AI sign language project.";
    } else if (scenarioType === 'email') {
      demoQuery = "I received an invitation email for a project showcase. Reply saying that I accept the invitation and keep it professional. Send it to organizer@example.com.";
    } else {
      demoQuery = "Analyze the scholarship requirements, tell me what documents are needed, check the attendance requirement, and create an application checklist.";
    }
    setInputQuery(demoQuery);
    handleSend(demoQuery);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header Bar & Scope Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={22} color="#38bdf8" />
            <span>KnowledgePilot — AI Task Workspace</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Single-Agent AI Workspace • RAG Document Search • Real Gmail API Action (Authenticated as {user?.email})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Document Scope Filter */}
          <select
            value={selectedDocFilter}
            onChange={(e) => setSelectedDocFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Uploaded Documents</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.filename}</option>
            ))}
          </select>

          {/* Quick Demo Scenario Triggers */}
          <button className="glass-button" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleDemoScenario('sign_language')}>
            <Sparkles size={14} /> Test DOCX RAG
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            margin: 'auto',
            maxWidth: '580px',
            padding: '40px 28px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <Bot size={52} color="#38bdf8" style={{ marginBottom: '16px', opacity: 0.9 }} />
            <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.4rem', marginBottom: '8px' }}>
              Welcome, {user?.displayName || 'User'}!
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
              Enter a high-level goal below. KnowledgePilot will automatically select required tools, retrieve document evidence using RAG, calculate data, and generate natural responses.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button className="glass-button" style={{ fontSize: '0.82rem' }} onClick={() => handleDemoScenario('sign_language')}>
                "Explain the AI sign language project."
              </button>
              <button className="glass-button" style={{ fontSize: '0.82rem' }} onClick={() => handleDemoScenario('multi_file')}>
                "Analyze scholarship requirements."
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '14px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '80%' : '100%',
                width: msg.role === 'assistant' ? '100%' : 'auto'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Bot size={20} color="#fff" />
                </div>
              )}

              <div className="glass-panel" style={{
                padding: '18px 22px',
                borderRadius: '16px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.15))' : 'rgba(15, 23, 42, 0.85)',
                border: msg.role === 'user' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                flex: 1
              }}>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 600, color: msg.role === 'user' ? '#38bdf8' : '#c084fc',
                  marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span>{msg.role === 'user' ? 'User Goal' : 'Result'}</span>
                  {msg.role === 'assistant' && msg.verification && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      color: msg.verification.is_fully_supported ? '#34d399' : '#fb7185',
                      fontSize: '0.72rem'
                    }}>
                      <ShieldCheck size={14} />
                      {msg.verification.is_fully_supported ? 'Evidence Verified' : 'Partially Grounded'}
                    </span>
                  )}
                </div>

                <div className="markdown-content" style={{ fontSize: '0.94rem', color: '#f8fafc', lineHeight: 1.6 }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(51, 65, 85, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
                  ) : (
                    <User size={20} color="#f8fafc" />
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', color: '#38bdf8' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>KnowledgePilot Task Workflow Executing (Understand → Plan → Retrieve → Verify → Respond)...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type your goal here (e.g. 'Explain scholarship requirements' or 'Analyze attendance data')..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              background: '#090d16',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="glass-button" disabled={loading || !inputQuery.trim()}>
            <Send size={18} /> Run Task
          </button>
        </form>
      </div>

      {/* Interactive Evidence Inspector Modal */}
      {activeCitation && (
        <EvidenceModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
      )}
    </div>
  );
};

export default Chat;
