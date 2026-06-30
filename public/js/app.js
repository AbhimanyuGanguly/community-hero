// ============================================
// Community Hero — SPA Router & App Init
// ============================================

// ---- Router ----
function router() {
  const hash = window.location.hash || '#home';
  const [path, query] = hash.split('?');

  // Clean up any existing Leaflet maps
  if (window.mainMap) { window.mainMap.remove(); window.mainMap = null; }

  const main = document.getElementById('main-content');
  main.classList.add('page-enter');
  setTimeout(() => main.classList.remove('page-enter'), 400);

  // Route matching
  if (path === '#home' || path === '' || path === '#') {
    setActiveNav('home');
    renderHomePage();
  } else if (path === '#login') {
    if (Auth.isLoggedIn()) { window.location.hash = '#home'; return; }
    setActiveNav('');
    renderLoginPage();
  } else if (path === '#report') {
    setActiveNav('report');
    renderReportPage();
  } else if (path === '#map') {
    setActiveNav('map');
    renderMapPage();
  } else if (path === '#tracker') {
    setActiveNav('tracker');
    renderTrackerPage();
  } else if (path === '#dashboard') {
    setActiveNav('dashboard');
    renderDashboardPage();
  } else if (path === '#leaderboard') {
    setActiveNav('leaderboard');
    renderLeaderboardPage();
  } else if (path.startsWith('#issue/')) {
    const issueId = path.replace('#issue/', '');
    setActiveNav('tracker');
    renderIssueDetailPage(issueId);
  } else {
    setActiveNav('home');
    renderHomePage();
  }
}

// ---- Navbar Active State ----
function setActiveNav(page) {
  document.querySelectorAll('.navbar-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
}

// ---- Update Navbar Auth State ----
function updateNavbar() {
  const actionsEl = document.getElementById('navbar-actions');
  if (!actionsEl) return;

  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    actionsEl.innerHTML = `
      <a href="#report" class="btn btn-primary btn-sm btn-ripple hide-mobile" style="display: inline-flex; align-items: center; gap: 6px;">
        <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg> Report
      </a>
      <div class="navbar-user-container" id="navbar-user-container">
        <div class="navbar-user" id="user-menu-trigger">
          <div class="navbar-user-avatar" style="background: ${Utils.getAvatarColor(user.name)}">${Utils.getInitials(user.name)}</div>
          <span>${Utils.escapeHtml(user.name.split(' ')[0])}</span>
          <span style="font-size: 8px; opacity: 0.7; margin-left: 2px; transition: transform var(--transition-fast);">▼</span>
        </div>
        
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">${Utils.escapeHtml(user.name)}</div>
            <div class="user-dropdown-email">${Utils.escapeHtml(user.email || '')}</div>
          </div>
          <div class="user-dropdown-body">
            <div class="user-dropdown-stat">
              <span>Points</span>
              <strong>${user.points || 0} pts</strong>
            </div>
            <a href="#tracker?author_id=me" class="user-dropdown-item">My Reports</a>
            <a href="#leaderboard" class="user-dropdown-item" id="dropdown-leaderboard-link">Leaderboard</a>
            <a href="javascript:void(0)" class="user-dropdown-item logout-item" id="logout-btn">Log Out</a>
          </div>
        </div>
      </div>
    `;

    // Dropdown toggling
    const container = document.getElementById('navbar-user-container');
    const trigger = document.getElementById('user-menu-trigger');
    const logoutBtn = document.getElementById('logout-btn');
    const leaderboardLink = document.getElementById('dropdown-leaderboard-link');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Auth.logout();
      updateNavbar();
    });

    leaderboardLink.addEventListener('click', () => {
      container.classList.remove('open');
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
      }
    });
  } else {
    actionsEl.innerHTML = `
      <a href="#login" class="btn btn-primary btn-sm btn-ripple">
        Get Started
      </a>
    `;
  }
}

// ---- Navbar Scroll Effect ----
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ---- Mobile Menu ----
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const links = document.getElementById('navbar-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    // Close menu on link click
    links.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
      });
    });
  }
}

// ---- App Initialization ----
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize navbar
  updateNavbar();
  initNavbarScroll();
  initMobileMenu();

  // Refresh user data if logged in
  if (Auth.getToken()) {
    Auth.refreshUser().then(() => updateNavbar());
  }

  // Listen for hash changes
  window.addEventListener('hashchange', router);

  // Initial route
  router();
});

// Make updateNavbar globally accessible
window.updateNavbar = updateNavbar;
