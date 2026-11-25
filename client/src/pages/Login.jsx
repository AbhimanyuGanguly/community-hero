import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const user = await login(loginEmail.trim(), loginPassword);
      showToast('success', 'Welcome back!', `Logged in as ${user.name}`);
      navigate('/');
    } catch (err) {
      setLoginError('⚠ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setLoading(true);

    try {
      await signup(signupName.trim(), signupEmail.trim(), signupPassword);
      showToast('success', 'Account created!', 'Welcome to Community Hero 🎉');
      navigate('/');
    } catch (err) {
      setSignupError('⚠ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await login('arjun@demo.com', 'demo123');
      showToast('success', 'Welcome, Arjun!', "You're using a demo account");
      navigate('/');
    } catch (err) {
      showToast('error', 'Demo login failed', err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        <div className="auth-header">
          <div className="auth-header-icon">🦸</div>
          <h2 className="auth-title">Welcome to Community Hero</h2>
          <p className="auth-subtitle">Join your community in making a difference</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            id="login-tab"
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
            id="signup-tab"
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form id="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                type="email"
                className="form-input"
                id="login-email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                type="password"
                className="form-input"
                id="login-password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div id="login-error" className="form-error" style={{ display: 'flex', marginBottom: 'var(--space-4)' }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full btn-ripple"
              id="login-submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="btn-spinner"></span> Logging in...</>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form id="signup-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                id="signup-name"
                placeholder="Your full name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                className="form-input"
                id="signup-email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-input"
                id="signup-password"
                placeholder="At least 6 characters"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {signupError && (
              <div id="signup-error" className="form-error" style={{ display: 'flex', marginBottom: 'var(--space-4)' }}>
                {signupError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full btn-ripple"
              id="signup-submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="btn-spinner"></span> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <div className="auth-divider">or try a demo account</div>

        <button
          type="button"
          className="btn btn-secondary w-full"
          id="demo-login-btn"
          style={{ gap: 'var(--space-2)' }}
          onClick={handleDemoLogin}
          disabled={demoLoading}
        >
          {demoLoading ? (
            <><span className="btn-spinner"></span> Logging in...</>
          ) : (
            '⚡ Quick Demo Login'
          )}
        </button>

        <div className="auth-footer" style={{ marginTop: 'var(--space-4)' }}>
          <small style={{ color: 'var(--color-text-tertiary)' }}>Demo: arjun@demo.com / demo123</small>
        </div>
      </div>
    </div>
  );
}
