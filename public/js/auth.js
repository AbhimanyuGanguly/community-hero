// ============================================
// Community Hero — Auth State Management
// ============================================

const Auth = {
  _user: null,
  _listeners: [],

  getToken() {
    return localStorage.getItem('ch_token');
  },

  setToken(token) {
    localStorage.setItem('ch_token', token);
  },

  removeToken() {
    localStorage.removeItem('ch_token');
  },

  getUser() {
    if (this._user) return this._user;
    const cached = localStorage.getItem('ch_user');
    if (cached) {
      try {
        this._user = JSON.parse(cached);
        return this._user;
      } catch (e) {}
    }
    return null;
  },

  setUser(user) {
    this._user = user;
    localStorage.setItem('ch_user', JSON.stringify(user));
    this._notify();
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  async login(email, password) {
    const data = await API.login(email, password);
    this.setToken(data.token);
    this.setUser(data.user);
    return data.user;
  },

  async signup(name, email, password) {
    const data = await API.signup(name, email, password);
    this.setToken(data.token);
    this.setUser(data.user);
    return data.user;
  },

  logout() {
    this.removeToken();
    this._user = null;
    localStorage.removeItem('ch_user');
    this._notify();
    window.location.hash = '#home';
  },

  async refreshUser() {
    if (!this.getToken()) return null;
    try {
      const user = await API.getMe();
      this.setUser(user);
      return user;
    } catch (err) {
      // Token expired or invalid
      this.logout();
      return null;
    }
  },

  // Listener pattern for auth state changes
  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  },

  _notify() {
    this._listeners.forEach(fn => fn(this.getUser()));
  }
};

window.Auth = Auth;
