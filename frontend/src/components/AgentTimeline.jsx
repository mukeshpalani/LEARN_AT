import React from 'react';
import { CheckCircle2, Clock, AlertCircle, MinusCircle, Loader2 } from 'lucide-react';

const AgentTimeline = ({ trace = [], analysis = null, plan = null }) => {
  const allAgents = [
    { id: 'query_analyzer', name: 'Query Analyzer' },
    { id: 'planner', name: 'Planning Agent' },
    { id: 'rag_agent', name: 'RAG Vector Search' },
    { id: 'data_agent', name: 'Data Analysis (Pandas)' },
    { id: 'research_agent', name: 'Web Research' },
    { id: 'verifier', name: 'Verification Agent' },
    { id: 'response_agent', name: 'Response Agent' }
  ];

  const getAgentStatus = (agentId) => {
    const found = trace.find((t) => t.agent_name === agentId);
    if (!found) return { status: 'skipped', time: null };
    return {
      status: found.status,
      time: found.execution_time_ms,
      output: found.output,
      error: found.error
    };
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Agent Orchestration Execution Flow</span>
      </h4>

      {/* Timeline Node Flow */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        background: '#090d16',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {allAgents.map((agent, idx) => {
          const info = getAgentStatus(agent.id);
          let badgeColor = '#64748b';
          let Icon = MinusCircle;

          if (info.status === 'completed') {
            badgeColor = '#34d399';
            Icon = CheckCircle2;
          } else if (info.status === 'running') {
            badgeColor = '#38bdf8';
            Icon = Loader2;
          } else if (info.status === 'failed') {
            badgeColor = '#fb7185';
            Icon = AlertCircle;
          }

          return (
            <React.Fragment key={agent.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: `1px solid ${badgeColor}33`,
                fontSize: '0.8rem',
                color: '#f8fafc'
              }}>
                <Icon size={14} color={badgeColor} className={info.status === 'running' ? 'animate-spin' : ''} />
                <span style={{ fontWeight: 500 }}>{agent.name}</span>
                {info.time !== null && info.time !== undefined && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({info.time}ms)</span>
                )}
              </div>
              {idx < allAgents.length - 1 && (
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Analysis Flags if available */}
      {analysis && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          gap: '12px',
          fontSize: '0.75rem',
          color: '#94a3b8',
          flexWrap: 'wrap'
        }}>
          <span>Intent: <strong style={{ color: '#38bdf8' }}>{analysis.intent}</strong></span>
          <span>Complexity: <strong style={{ color: '#c084fc' }}>{analysis.complexity}</strong></span>
          <span>RAG: <strong style={{ color: analysis.requires_rag ? '#34d399' : '#64748b' }}>{analysis.requires_rag ? 'YES' : 'NO'}</strong></span>
          <span>Data: <strong style={{ color: analysis.requires_data_analysis ? '#34d399' : '#64748b' }}>{analysis.requires_data_analysis ? 'YES' : 'NO'}</strong></span>
          <span>Research: <strong style={{ color: analysis.requires_research ? '#34d399' : '#64748b' }}>{analysis.requires_research ? 'YES' : 'NO'}</strong></span>
        </div>
      )}

      {/* Developer Inspection Panel for Hybrid NLP Intent & Context */}
      {analysis?.intent_metadata && (
        <div style={{
          marginTop: '14px',
          padding: '12px 14px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: '0.78rem'
        }}>
          <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🛠️ Developer Inspection Panel — Hybrid NLP Engine</span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              Task ID: {analysis.intent_metadata.task_id || 'NEW'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', color: '#cbd5e1' }}>
            <div><strong>Action:</strong> <span style={{ color: '#f43f5e' }}>{analysis.intent_metadata.action}</span></div>
            <div><strong>Message Purpose:</strong> <span style={{ color: '#a855f7' }}>{analysis.intent_metadata.message_purpose}</span></div>
            <div><strong>Recipient:</strong> <span style={{ color: '#38bdf8' }}>{analysis.intent_metadata.recipient || 'None'}</span></div>
            <div><strong>Context State:</strong> <span style={{ color: analysis.intent_metadata.context_dependency === 'NEW_TASK' ? '#34d399' : '#fbbf24' }}>{analysis.intent_metadata.context_dependency}</span></div>
            <div><strong>Reuse Previous Draft:</strong> <span style={{ color: analysis.intent_metadata.reuse_previous_email ? '#fbbf24' : '#94a3b8' }}>{analysis.intent_metadata.reuse_previous_email ? 'TRUE' : 'FALSE'}</span></div>
            <div><strong>Confidence:</strong> <span style={{ color: '#34d399' }}>{Math.round((analysis.intent_metadata.confidence || 0) * 100)}%</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTimeline;
