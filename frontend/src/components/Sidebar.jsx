import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Target, 
  FileSpreadsheet, 
  Bot, 
  Cpu,
  Mail,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, gmailStatus, gmailConnected, connectGmail, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Document Manager', icon: FolderOpen },
    { id: 'chat', label: 'AI Task Workspace', icon: Target },
    { id: 'reports', label: 'Report Generator', icon: FileSpreadsheet },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', padding: '0 4px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
        }}>
          <Bot size={24} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>KnowledgePilot</h2>
          <span style={{ fontSize: '0.68rem', color: '#38bdf8', letterSpacing: '0.06em', fontWeight: 600 }}>AI TASK WORKSPACE</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.15))' : 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.92rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              <Icon size={19} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Gmail Authorization Card */}
      {user && (
        <div className="glass-panel" style={{
          padding: '14px',
          borderRadius: '14px',
          marginBottom: '12px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid #38bdf8' }}
              />
            ) : (
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', background: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#fff'
              }}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.displayName || 'User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Gmail Connection Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            padding: '6px 8px',
            borderRadius: '8px',
            background: gmailConnected ? 'rgba(52, 211, 153, 0.1)' : gmailStatus === 'PERMISSION_REQUIRED' || gmailStatus === 'TOKEN_EXPIRED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.1)',
            color: gmailConnected ? '#34d399' : gmailStatus === 'PERMISSION_REQUIRED' || gmailStatus === 'TOKEN_EXPIRED' ? '#fbbf24' : '#94a3b8',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Mail size={13} style={{ flexShrink: 0 }} /> 
              {gmailConnected 
                ? '✓ Connected' 
                : gmailStatus === 'PERMISSION_REQUIRED' 
                  ? '⚠️ Permission Required' 
                  : gmailStatus === 'TOKEN_EXPIRED' 
                    ? '⚠️ Token Expired' 
                    : gmailStatus === 'VERIFYING' 
                      ? '⏳ Verifying...' 
                      : '○ Not Connected'}
            </span>
            {!gmailConnected && gmailStatus !== 'VERIFYING' && (
              <button
                onClick={() => connectGmail(true)}
                style={{
                  background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem',
                  fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0
                }}
              >
                {gmailStatus === 'PERMISSION_REQUIRED' || gmailStatus === 'TOKEN_EXPIRED' ? 'Reconnect' : 'Connect'}
              </button>
            )}
          </div>

          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      {/* System Status Footer */}
      <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <Cpu size={14} color="#344399" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>FIREBASE AUTH & GMAIL</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Project: knowledge-piolet</div>
      </div>
    </aside>
  );
};

export default Sidebar;

