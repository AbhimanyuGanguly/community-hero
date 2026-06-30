// ============================================
// Community Hero — Home Page (Clerk Layout)
// ============================================

function renderHomePage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <!-- Hero Section — Centered like Clerk.com -->
    <section class="clerk-hero">
      <div class="clerk-hero-bg"></div>
      <div class="container" style="position:relative; z-index:2;">
        <div class="clerk-hero-inner">
          <h1 class="clerk-hero-title">
            More than complaints,<br>Complete Civic Resolution
          </h1>
          <p class="clerk-hero-desc">
            Need more than a complaint box? Community Hero gives you full civic reporting,
            tracking, and government escalation — so your neighborhood issues actually get fixed.
          </p>
          <div class="clerk-hero-actions">
            <a href="#report" class="btn btn-primary btn-lg" id="hero-report-btn">
              Start reporting for free
            </a>
            <a href="#map" class="clerk-hero-btn-outline" id="hero-map-btn">
              Explore live map
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2l4 4-4 4"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Trusted By Strip — Horizontal like Clerk -->
    <section class="clerk-trusted-strip">
      <div class="container">
        <div class="clerk-trusted-inner">
          <p class="clerk-trusted-label">Trusted by active civic groups<br>across Delhi NCR.</p>
          <div class="clerk-trusted-logos">
            <span class="clerk-logo-item">Noida Authority</span>
            <span class="clerk-logo-item">MCD Delhi</span>
            <span class="clerk-logo-item">PWD NCR</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Components Section — Two column like Clerk -->
    <section class="clerk-components-section">
      <div class="container">
        <div class="clerk-components-grid">

          <!-- Left Column: Text + Tabs -->
          <div class="clerk-comp-left">
            <span class="clerk-section-label">Community Action Platform</span>
            <h2 class="clerk-comp-title">Verified civic actions,<br>embedded in minutes</h2>
            <p class="clerk-comp-desc">
              Drop-in workflows for issue reporting, community verification,
              and government escalation. Match to your locality, then track resolution in real time.
            </p>
            <a href="#tracker" class="clerk-explore-link">
              Explore all features
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2l4 4-4 4"/></svg>
            </a>

            <div class="clerk-comp-divider"></div>

            <div class="clerk-comp-tabs" id="feature-tabs-list">
              <div class="clerk-comp-tab active" data-tab="report">
                <div class="clerk-tab-dot"></div>
                <div class="clerk-tab-content">
                  <span class="clerk-tab-label">REPORT CIVIC ISSUES</span>
                  <p class="clerk-tab-desc">Snap photos and drop map markers. AI scans and tags details instantly.</p>
                  <div class="clerk-tab-code">&lt;ReportIssue /&gt;</div>
                </div>
              </div>
              <div class="clerk-comp-tab" data-tab="track">
                <div class="clerk-tab-dot"></div>
                <div class="clerk-tab-content">
                  <span class="clerk-tab-label">UPVOTE & VERIFY</span>
                  <p class="clerk-tab-desc">Neighbors upvote problems. High-priority tasks are highlighted automatically.</p>
                  <div class="clerk-tab-code">&lt;TrackProgress /&gt;</div>
                </div>
              </div>
              <div class="clerk-comp-tab" data-tab="escalate">
                <div class="clerk-tab-dot"></div>
                <div class="clerk-tab-content">
                  <span class="clerk-tab-label">GOVERNMENT ESCALATION</span>
                  <p class="clerk-tab-desc">Dispatch detailed grievance forms directly to local authority portals.</p>
                  <div class="clerk-tab-code">&lt;EscalateGovt /&gt;</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Floating Form Card -->
          <div class="clerk-comp-right">
            <div class="clerk-form-card-wrapper">
              <div class="clerk-form-card" id="mock-form-container">
                <!-- Dynamic content -->
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Dark Section — Wave transition like Clerk -->
    <section class="clerk-dark-section">
      <div class="clerk-dark-wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V0H0Z" fill="#ffffff"/>
        </svg>
      </div>
      <div class="container" style="position:relative; z-index:2;">
        <div class="clerk-dark-header">
          <span class="clerk-section-label" style="color:#a78bfa;">Civic Intelligence Platform</span>
          <h2 class="clerk-dark-title">Empowering communities with<br>AI-driven accountability</h2>
          <p class="clerk-dark-desc">
            Community Hero transforms passive complaints into actionable, verifiable data. 
            We ensure municipal authorities have the exact details needed to resolve issues faster.
          </p>
          <a href="#dashboard" class="clerk-explore-link" style="color:#a78bfa;">
            Explore civic dashboard
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2l4 4-4 4"/></svg>
          </a>
        </div>

        <div class="clerk-dark-grid">
          <div class="clerk-dark-card">
            <div class="clerk-dark-card-visual">
              <div class="clerk-visual-bars">
                <div class="clerk-bar" style="height:20px; opacity:0.3;"></div>
                <div class="clerk-bar" style="height:35px; opacity:0.5;"></div>
                <div class="clerk-bar" style="height:50px; opacity:0.7;"></div>
                <div class="clerk-bar" style="height:40px; opacity:0.5;"></div>
                <div class="clerk-bar" style="height:25px; opacity:0.3;"></div>
              </div>
            </div>
            <h3 class="clerk-dark-card-title">AI Classification</h3>
            <p class="clerk-dark-card-desc">AI reads issue descriptions, auto-labels categories, and estimates severity scores.</p>
          </div>

          <div class="clerk-dark-card">
            <div class="clerk-dark-card-visual">
              <div class="clerk-visual-code">
                <span class="code-keyword">const</span> report = {<br>
                &nbsp;&nbsp;category: <span class="code-string">"drainage"</span>,<br>
                &nbsp;&nbsp;status: <span class="code-string">"escalated"</span>,<br>
                &nbsp;&nbsp;ref: <span class="code-string">"ND/MCD/2026"</span><br>
                };
              </div>
            </div>
            <h3 class="clerk-dark-card-title">Structured Dossiers</h3>
            <p class="clerk-dark-card-desc">Compile professional complaint documents with maps, comments, and timeline records.</p>
          </div>

          <div class="clerk-dark-card">
            <div class="clerk-dark-card-visual">
              <div class="clerk-visual-rank">
                <div class="rank-row"><span class="rank-pos">#1</span><div class="rank-bar" style="width:90%;"></div></div>
                <div class="rank-row"><span class="rank-pos">#2</span><div class="rank-bar" style="width:70%;"></div></div>
                <div class="rank-row"><span class="rank-pos">#3</span><div class="rank-bar" style="width:50%;"></div></div>
              </div>
            </div>
            <h3 class="clerk-dark-card-title">Citizen Rankings</h3>
            <p class="clerk-dark-card-desc">Earn points and unlock badges for active reports, upvotes, comments, and verifications.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories — Clean grid -->
    <section class="section" style="background:#ffffff; border-top:1px solid #e4e4e7;">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="section-title">Issue Categories</h2>
          <p class="section-subtitle" style="margin: 0 auto;">We track and resolve all types of community issues</p>
        </div>
        <div class="grid grid-3 stagger-children" style="margin-top: var(--space-8);" id="category-grid"></div>
      </div>
    </section>
  `;

  initInteractiveMockup();
  renderCategories();
}

// ---- Mock Form States ----
const mockFormStates = {
  report: {
    title: "Report a Community Issue",
    subtitle: "Select a category and specify location details.",
    inputs: `
      <div class="clerk-form-group">
        <label class="clerk-form-label">Location Address</label>
        <input type="text" class="clerk-form-input" value="Sector 62, Noida, UP" readonly>
      </div>
      <div class="clerk-form-group">
        <label class="clerk-form-label">Issue Details</label>
        <textarea class="clerk-form-input clerk-textarea" readonly>Large pothole near main traffic light causing blockages.</textarea>
      </div>
      <button class="clerk-form-submit" onclick="window.location.hash='#report'">File Grievance Dossier</button>
    `
  },
  track: {
    title: "Verify & Track Grievance",
    subtitle: "Upvote community reports to fast-track municipal action.",
    inputs: `
      <div class="clerk-form-issue-preview">
        <div class="clerk-form-issue-title">Pothole Near Noida Sec 62</div>
        <div class="clerk-form-issue-meta">Total Upvotes: <strong>147 heroes</strong></div>
        <span class="clerk-form-status-pill">In Progress</span>
      </div>
      <button class="clerk-form-submit" onclick="window.location.hash='#tracker'">Upvote & Verify Issue (+5 pts)</button>
    `
  },
  escalate: {
    title: "Escalate to Govt Portal",
    subtitle: "Official grievance dossier generated by AI solver.",
    inputs: `
      <div class="clerk-form-group">
        <label class="clerk-form-label">Grievance Reference ID</label>
        <div class="clerk-form-mono">ND/MCD/2026/09281A</div>
      </div>
      <div class="clerk-form-group">
        <label class="clerk-form-label">Escalation Log</label>
        <div class="clerk-form-log">
          <strong>09:30 AM</strong> — AI Grievance Draft Formulated.<br>
          <strong>09:32 AM</strong> — Dispatched to Municipal Commissioner.
        </div>
      </div>
      <button class="clerk-form-submit clerk-form-submit-dark" onclick="window.location.hash='#dashboard'">View Official Dossier</button>
    `
  }
};

function renderMockupForm(stateKey) {
  const container = document.getElementById('mock-form-container');
  if (!container) return;
  const state = mockFormStates[stateKey];
  container.innerHTML = `
    <h3 class="clerk-form-title">${state.title}</h3>
    <p class="clerk-form-subtitle">${state.subtitle}</p>
    <div class="clerk-form-or-divider"><span>or</span></div>
    ${state.inputs}
  `;
}

function initInteractiveMockup() {
  renderMockupForm('report');
  const list = document.getElementById('feature-tabs-list');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.clerk-comp-tab');
    if (!btn) return;
    document.querySelectorAll('.clerk-comp-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMockupForm(btn.dataset.tab);
  });
}

function renderCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  const categories = Object.entries(Utils.categoryConfig);
  grid.innerHTML = categories.map(([key, cat]) => `
    <a href="#tracker?category=${key}" class="category-card">
      <div class="category-card-icon" style="background: ${cat.color}15; color: ${cat.color};">
        ${cat.icon}
      </div>
      <div class="category-card-name">${cat.label}</div>
    </a>
  `).join('');
}

window.renderHomePage = renderHomePage;
