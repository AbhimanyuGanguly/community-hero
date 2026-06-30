// ============================================
// Community Hero — Login / Signup Page
// ============================================

function renderLoginPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-header-icon">🦸</div>
          <h2 class="auth-title">Welcome to Community Hero</h2>
          <p class="auth-subtitle">Join your community in making a difference</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login" id="login-tab">Log In</button>
          <button class="auth-tab" data-tab="signup" id="signup-tab">Sign Up</button>
        </div>

        <!-- Login Form -->
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <input type="email" class="form-input" id="login-email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required>
          </div>
          <div id="login-error" class="form-error" style="display:none; margin-bottom: var(--space-4);"></div>
          <button type="submit" class="btn btn-primary btn-lg w-full btn-ripple" id="login-submit">
            Log In
          </button>
        </form>

        <!-- Signup Form -->
        <form id="signup-form" style="display: none;">
          <div class="form-group">
            <label class="form-label" for="signup-name">Full Name <span class="required">*</span></label>
            <input type="text" class="form-input" id="signup-name" placeholder="Your full name" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-email">Email <span class="required">*</span></label>
            <input type="email" class="form-input" id="signup-email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-password">Password <span class="required">*</span></label>
            <input type="password" class="form-input" id="signup-password" placeholder="At least 6 characters" required minlength="6">
          </div>
          <div id="signup-error" class="form-error" style="display:none; margin-bottom: var(--space-4);"></div>
          <button type="submit" class="btn btn-primary btn-lg w-full btn-ripple" id="signup-submit">
            Create Account
          </button>
        </form>

        <div class="auth-divider">or try a demo account</div>

        <button class="btn btn-secondary w-full" id="demo-login-btn" style="gap: var(--space-2);">
          ⚡ Quick Demo Login
        </button>

        <div class="auth-footer" style="margin-top: var(--space-4);">
          <small style="color: var(--color-text-tertiary);">Demo: arjun@demo.com / demo123</small>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('signup-tab').addEventListener('click', () => switchAuthTab('signup'));

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-submit');
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Logging in...';

    try {
      await Auth.login(email, password);
      Utils.toast('success', 'Welcome back!', `Logged in as ${Auth.getUser().name}`);
      window.location.hash = '#home';
      updateNavbar();
    } catch (err) {
      errorEl.textContent = '⚠ ' + err.message;
      errorEl.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });

  // Signup form
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signup-submit');
    const errorEl = document.getElementById('signup-error');
    errorEl.style.display = 'none';

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Creating account...';

    try {
      await Auth.signup(name, email, password);
      Utils.toast('success', 'Account created!', 'Welcome to Community Hero 🎉');
      window.location.hash = '#home';
      updateNavbar();
    } catch (err) {
      errorEl.textContent = '⚠ ' + err.message;
      errorEl.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  // Demo login
  document.getElementById('demo-login-btn').addEventListener('click', async () => {
    const btn = document.getElementById('demo-login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Logging in...';

    try {
      await Auth.login('arjun@demo.com', 'demo123');
      Utils.toast('success', 'Welcome, Arjun!', 'You\'re using a demo account');
      window.location.hash = '#home';
      updateNavbar();
    } catch (err) {
      Utils.toast('error', 'Demo login failed', err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '⚡ Quick Demo Login';
    }
  });
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
}

window.renderLoginPage = renderLoginPage;
