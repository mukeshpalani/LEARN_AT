import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DocumentManager from './pages/DocumentManager';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import EmailPage from './pages/EmailPage';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#38bdf8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Initializing KnowledgePilot Auth & Workspace...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc' }}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '32px 40px',
        maxWidth: '1400px',
        width: 'calc(100vw - 260px)',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'email' && <EmailPage />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;

