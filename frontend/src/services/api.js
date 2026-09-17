import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSystemStatus = () => api.get('/');

// Documents API
export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getDocuments = () => api.get('/documents');
export const getDocumentDetails = (id) => api.get(`/documents/${id}`);
export const getDocumentChunks = (id) => api.get(`/documents/${id}/chunks`);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Chat API
export const sendChatMessage = (query, conversationId = null, filterDocumentId = null, accessToken = null, fromEmail = null) => 
  api.post('/chat', { 
    query, 
    conversation_id: conversationId, 
    filter_document_id: filterDocumentId,
    access_token: accessToken,
    from_email: fromEmail
  });

export const getConversations = () => api.get('/conversations');
export const getConversationMessages = (id) => api.get(`/conversations/${id}/messages`);

// Tasks & Agent Observability
export const getTaskDetails = (taskId) => api.get(`/tasks/${taskId}`);
export const getAgentExecutionTimeline = (taskId) => api.get(`/agents/status/${taskId}`);

// Reports API
export const generateReport = (title, query, taskId = null, formatType = 'markdown') =>
  api.post('/reports/generate', { title, query, task_id: taskId, format_type: formatType });

export const getReportDownloadUrl = (filePath) => `${API_BASE_URL}/reports/download?file_path=${encodeURIComponent(filePath)}`;

// Email API
export const sendEmail = (recipient, subject, body) =>
  api.post('/email/send', { recipient, subject, body });

// Evaluation API
export const runEvaluationBenchmark = () => api.get('/evaluation/run');

export default api;
