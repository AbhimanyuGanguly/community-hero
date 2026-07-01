// ============================================
// Community Hero — API Client
// ============================================

// Dynamically determine the backend API URL
// If running on localhost, use relative paths to the local Node server.
// If running on Firebase Hosting (production), route to the Render backend.
const API_BASE_URL = '/api';

const API = {
  baseUrl: API_BASE_URL,

  _getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = Auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async _request(method, path, body = null, isFormData = false) {
    const options = {
      method,
      headers: this._getHeaders(isFormData)
    };

    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error — please check your connection');
      }
      throw err;
    }
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
    const query = new URLSearchParams(params).toString();
    return this._request('GET', `/issues${query ? '?' + query : ''}`);
  },

  async getIssue(id) {
    return this._request('GET', `/issues/${id}`);
  },

  async createIssue(formData) {
    return this._request('POST', '/issues', formData, true);
  },

  async analyzeIssue(formData) {
    return this._request('POST', '/issues/analyze', formData, true);
  },

  async updateIssueStatus(id, status) {
    return this._request('PATCH', `/issues/${id}/status`, { status });
  },

  async upvoteIssue(id) {
    return this._request('POST', `/issues/${id}/upvote`);
  },

  async verifyIssue(id) {
    return this._request('POST', `/issues/${id}/verify`);
  },

  async addComment(id, text) {
    return this._request('POST', `/issues/${id}/comments`, { text });
  },

  async getGovDraft(id, authority) {
    const qs = authority ? `?authority=${encodeURIComponent(authority)}` : '';
    return this._request('GET', `/issues/${id}/gov-draft${qs}`);
  },

  async fileGovGrievance(id, authority, complaintId) {
    return this._request('POST', `/issues/${id}/gov-file`, { gov_authority: authority, gov_complaint_id: complaintId });
  },

  async deleteIssue(id) {
    return this._request('DELETE', `/issues/${id}`);
  },

  // ---- Stats ----
  async getStats() {
    return this._request('GET', '/issues/stats');
  },

  async getPredictions() {
    return this._request('GET', '/issues/predictions');
  },

  // ---- Users ----
  async getLeaderboard() {
    return this._request('GET', '/users/leaderboard');
  },

  async getUserStats(id) {
    return this._request('GET', `/users/${id}/stats`);
  }
};

window.API = API;
