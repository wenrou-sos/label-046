import { apiGet, apiPost, apiPut, apiPatch, apiDelete, uploadFile } from '../utils/request';

export const authAPI = {
  login: (data) => apiPost('/api/auth/login', data),
  register: (data) => apiPost('/api/auth/register', data),
  getProfile: () => apiGet('/api/auth/profile'),
  updateProfile: (data) => apiPut('/api/auth/profile', data),
  logout: () => apiPost('/api/auth/logout')
};

export const userAPI = {
  list: (params) => apiGet('/api/users', params),
  getLawyers: () => apiGet('/api/users/lawyers'),
  get: (id) => apiGet(`/api/users/${id}`),
  create: (data) => apiPost('/api/users', data),
  update: (id, data) => apiPut(`/api/users/${id}`, data),
  delete: (id) => apiDelete(`/api/users/${id}`),
  toggleStatus: (id) => apiPatch(`/api/users/${id}/toggle-status`)
};

export const caseAPI = {
  list: (params) => apiGet('/api/cases', params),
  stats: () => apiGet('/api/cases/stats/overview'),
  get: (id) => apiGet(`/api/cases/${id}`),
  create: (data) => apiPost('/api/cases', data),
  update: (id, data) => apiPut(`/api/cases/${id}`, data),
  updateStatus: (id, status) => apiPatch(`/api/cases/${id}/status`, { status }),
  saveDraft: (id, data) => apiPatch(`/api/cases/${id}/save-draft`, data),
  submit: (id, data) => apiPatch(`/api/cases/${id}/submit`, data),
  delete: (id) => apiDelete(`/api/cases/${id}`)
};

export const partyAPI = {
  list: (params) => apiGet('/api/parties', params),
  all: () => apiGet('/api/parties/all'),
  get: (id) => apiGet(`/api/parties/${id}`),
  create: (data) => apiPost('/api/parties', data),
  batchCreate: (data) => apiPost('/api/parties/batch', data),
  update: (id, data) => apiPut(`/api/parties/${id}`, data),
  delete: (id) => apiDelete(`/api/parties/${id}`),
  getByCase: (caseId) => apiGet(`/api/parties/case/${caseId}`),
  linkToCase: (caseId, data) => apiPost(`/api/parties/case/${caseId}/link`, data),
  batchLinkToCase: (caseId, data) => apiPost(`/api/parties/case/${caseId}/batch-link`, data),
  unlinkFromCase: (caseId, partyId, role) =>
    apiDelete(`/api/parties/case/${caseId}/unlink/${partyId}`, { params: { role } })
};

export const documentAPI = {
  list: (params) => apiGet('/api/documents', params),
  get: (id) => apiGet(`/api/documents/${id}`),
  upload: (formData, onProgress) =>
    uploadFile('/api/documents/upload', formData, onProgress),
  uploadMultiple: (formData, onProgress) =>
    uploadFile('/api/documents/upload-multiple', formData, onProgress),
  update: (id, data) => apiPut(`/api/documents/${id}`, data),
  delete: (id) => apiDelete(`/api/documents/${id}`),
  download: (id) => `/api/documents/${id}/download`,
  preview: (id) => apiGet(`/api/documents/${id}/preview`)
};

export const categoryAPI = {
  list: () => apiGet('/api/categories'),
  tree: () => apiGet('/api/categories/tree'),
  create: (data) => apiPost('/api/categories', data),
  update: (id, data) => apiPut(`/api/categories/${id}`, data),
  delete: (id) => apiDelete(`/api/categories/${id}`)
};

export const milestoneAPI = {
  list: (params) => apiGet('/api/milestones', params),
  timeline: (caseId) => apiGet(`/api/milestones/timeline/${caseId}`),
  get: (id) => apiGet(`/api/milestones/${id}`),
  create: (data) => apiPost('/api/milestones', data),
  generateFromTemplate: (caseId, data) =>
    apiPost(`/api/milestones/generate-from-template/${caseId}`, data),
  update: (id, data) => apiPut(`/api/milestones/${id}`, data),
  updateStatus: (id, status, completed_note) =>
    apiPatch(`/api/milestones/${id}/status`, { status, completed_note }),
  delete: (id) => apiDelete(`/api/milestones/${id}`)
};

export const milestoneTemplateAPI = {
  list: (params) => apiGet('/api/milestone-templates', params),
  get: (id) => apiGet(`/api/milestone-templates/${id}`),
  create: (data) => apiPost('/api/milestone-templates', data),
  update: (id, data) => apiPut(`/api/milestone-templates/${id}`, data),
  delete: (id) => apiDelete(`/api/milestone-templates/${id}`)
};

export const notificationAPI = {
  list: (params) => apiGet('/api/notifications', params),
  unreadCount: () => apiGet('/api/notifications/unread-count'),
  get: (id) => apiGet(`/api/notifications/${id}`),
  markRead: (id) => apiPost(`/api/notifications/${id}/read`),
  markAllRead: () => apiPost('/api/notifications/read-all'),
  delete: (id) => apiDelete(`/api/notifications/${id}`)
};

export const reminderRuleAPI = {
  list: (params) => apiGet('/api/reminder-rules', params),
  all: () => apiGet('/api/reminder-rules/all'),
  get: (id) => apiGet(`/api/reminder-rules/${id}`),
  create: (data) => apiPost('/api/reminder-rules', data),
  update: (id, data) => apiPut(`/api/reminder-rules/${id}`, data),
  toggle: (id) => apiPatch(`/api/reminder-rules/${id}/toggle`),
  delete: (id) => apiDelete(`/api/reminder-rules/${id}`),
  runCheck: () => apiPost('/api/reminder-rules/run-check')
};

export const statisticsAPI = {
  dashboard: () => apiGet('/api/statistics/dashboard'),
  casesTrend: (days) => apiGet('/api/statistics/cases-trend', { days }),
  feeStats: () => apiGet('/api/statistics/fee-stats')
};
