// ===== API Client =====
const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function setToken(token) { localStorage.setItem('token', token); }
function removeToken() { localStorage.removeItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function removeUser() { localStorage.removeItem('user'); }
function isLoggedIn() { return !!getToken(); }

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        removeToken(); removeUser();
        window.location.hash = '#/auth';
      }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server');
    }
    throw err;
  }
}

const api = {
  // Auth
  signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest('/auth/me'),

  // Projects
  getProjects: () => apiRequest('/projects'),
  createProject: (data) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProject: (id) => apiRequest(`/projects/${id}`),
  updateProject: (id, data) => apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),

  // Members
  getMembers: (projectId) => apiRequest(`/projects/${projectId}/members`),
  addMember: (projectId, data) => apiRequest(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (projectId, memberId, data) => apiRequest(`/projects/${projectId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeMember: (projectId, memberId) => apiRequest(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (projectId) => apiRequest(`/project/${projectId}/tasks`),
  createTask: (projectId, data) => apiRequest(`/project/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  getTask: (taskId) => apiRequest(`/tasks/${taskId}`),
  updateTask: (taskId, data) => apiRequest(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (taskId) => apiRequest(`/tasks/${taskId}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => apiRequest('/dashboard'),
};
