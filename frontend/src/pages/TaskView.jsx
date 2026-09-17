import React, { useState } from 'react';
import { getTaskDetails } from '../services/api';
import AgentTimeline from '../components/AgentTimeline';
import { GitBranch, Search, Clock, ShieldCheck, FileCheck } from 'lucide-react';

const TaskView = () => {
  const [taskIdInput, setTaskIdInput] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearchTask = async (e) => {
    e?.preventDefault();
    if (!taskIdInput.trim()) return;

    try {
      setLoading(true);
      const res = await getTaskDetails(taskIdInput.trim());
      setTaskData(res.data);
    } catch (e) {
      alert('Task ID not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>Task Observability</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Inspect agent execution order, state transitions, runtime durations, and verification metrics.
        </p>
      </div>

      {/* Task Lookup */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <form onSubmit={handleSearchTask} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text"
            value={taskIdInput}
            onChange={(e) => setTaskIdInput(e.target.value)}
            placeholder="Enter Task UUID..."
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.9rem'
            }}
          />
          <button type="submit" className="glass-button">
            <Search size={16} /> Fetch Task Timeline
          </button>
        </form>
      </div>

      {/* Task Details */}
      {taskData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AgentTimeline trace={taskData.agent_runs} />

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>Task Summary</h3>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Task ID: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{taskData.task_id}</span></div>
              <div>Query: <span style={{ color: '#f8fafc' }}>"{taskData.query}"</span></div>
              <div>Status: <span className="badge badge-success">{taskData.status}</span></div>
              <div>Created At: <span style={{ color: '#f8fafc' }}>{new Date(taskData.created_at).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>Citations & Grounding</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {taskData.citations.map((c, i) => (
                <div key={i} style={{ background: '#090d16', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.85rem' }}>
                    [{c.citation_id}] {c.document} — Page {c.page}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>"{c.evidence}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b', borderRadius: '16px' }}>
          Execute a query in the Chat interface to populate real-time task traces, or enter a Task ID above.
        </div>
      )}
    </div>
  );
};

export default TaskView;
