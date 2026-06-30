const API_BASE = '/api';

export const API = {
  _getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('ch_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async _request(method, endpoint, body = null, isFormData = false) {
    const config = { method, headers: this._getHeaders(isFormData) };
    if (body) config.body = isFormData ? body : JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Request Failed');
    }
    return data;
  },

  // ---- Auth ----
  async signup(name, email, password) {
    return this._request('POST', '/auth/signup', { name, email, password });
  },
  async login(email, password) {
    return this._request('POST', '/auth/login', { email, password });
  },
  async getMe() {
    return this._request('GET', '/auth/me');
  },

  // ---- Issues ----
  async getIssues(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const data = await this._request('GET', `/issues${qs ? '?' + qs : ''}`);
    // Backend returns { issues: [...], total: N }
    return data;
  },
  async getIssue(id) {
    // Backend returns { ...issue, comments, verifiers, userUpvoted, userVerified }
    return this._request('GET', `/issues/${id}`);
  },
  async createIssue(formData) {
    return this._request('POST', '/issues', formData, true);
  },
  async deleteIssue(id) {
    return this._request('DELETE', `/issues/${id}`);
  },
  async updateStatus(id, status) {
    return this._request('PATCH', `/issues/${id}/status`, { status });
  },
  async verifyIssue(id) {
    return this._request('POST', `/issues/${id}/verify`);
  },
  async upvoteIssue(id) {
    return this._request('POST', `/issues/${id}/upvote`);
  },

  // ---- Comments ----
  async addComment(issueId, text) {
    return this._request('POST', `/issues/${issueId}/comments`, { text });
  },

  // ---- AI / Gov Routing ----
  async getGovDraft(id, authority) {
    const qs = authority ? `?authority=${encodeURIComponent(authority)}` : '';
    return this._request('GET', `/issues/${id}/gov-draft${qs}`);
  },
  async recordGovFiling(id, payload) {
    return this._request('POST', `/issues/${id}/gov-file`, payload);
  },

  // ---- Stats ----
  async getStats() {
    return this._request('GET', '/issues/stats');
  }
};
