// ============================================
// Community Hero — Issue Tracker / Feed Page
// ============================================

function renderTrackerPage() {
  const main = document.getElementById('main-content');

  // Parse query params from hash
  const hashParts = window.location.hash.split('?');
  const params = new URLSearchParams(hashParts[1] || '');
  const initialCategory = params.get('category') || 'all';
  const initialAuthor = params.get('author_id') || null;

  main.innerHTML = `
    <div class="tracker-page-fullscreen">
      <div class="tracker-split-container">
        <!-- Left Side Feed -->
        <div class="tracker-feed-side">
          <div class="section-header" style="margin-bottom: 0;">
            <h2 class="section-title" style="font-size: var(--text-xl);">Issue Tracker</h2>
            <p class="section-subtitle" style="font-size: var(--text-xs); margin-bottom: 0;">Browse and track reported community issues</p>
          </div>

          <div class="tracker-controls">
            <div class="search-bar">
              <span class="search-bar-icon">🔍</span>
              <input type="text" placeholder="Search issues..." id="tracker-search">
            </div>
            <div class="tracker-sort">
              <select class="form-select" id="tracker-sort">
                <option value="newest">Newest First</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="severity">Severity</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div class="tracker-filters" id="tracker-filters">
            <button class="chip ${initialCategory === 'all' && initialAuthor !== 'me' ? 'active' : ''}" data-cat="all">All</button>
            <button class="chip ${initialAuthor === 'me' ? 'active' : ''}" data-author="me">👤 My Reports</button>
            <div style="width: 1px; height: 24px; background: var(--color-border); margin: 0 4px;"></div>
            ${Object.entries(Utils.categoryConfig).map(([key, cat]) => `
              <button class="chip ${initialCategory === key ? 'active' : ''}" data-cat="${key}">${cat.icon} ${cat.label}</button>
            `).join('')}
            <div style="width: 100%; height: 1px; background: var(--color-border); margin: 4px 0;"></div>
            <button class="chip" data-status="all">All Status</button>
            ${Object.entries(Utils.statusConfig).map(([key, s]) => `
              <button class="chip" data-status="${key}">${s.icon} ${s.label}</button>
            `).join('')}
          </div>

          <div class="tracker-results-count" id="tracker-count" style="font-size: var(--text-xs); margin: 0; color: var(--color-text-secondary);"></div>
          
          <div class="tracker-grid" id="tracker-grid">
            <div class="page-loader"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- Right Side Fullscreen Map -->
        <div class="tracker-map-side">
          <div id="tracker-split-map"></div>
        </div>
      </div>
    </div>
  `;

  let activeCategory = initialCategory;
  let activeStatus = 'all';
  let activeAuthor = initialAuthor;
  let splitMap = null;
  let mapMarkersGroup = null;
  let lastLoadedIssues = null;

  // Setup UI logic
  setTimeout(() => {
    const mapEl = document.getElementById('tracker-split-map');
    if (!mapEl) return;

    // Center in Delhi NCR
    splitMap = L.map('tracker-split-map', { zoomControl: true }).setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(splitMap);

    mapMarkersGroup = L.markerClusterGroup();
    splitMap.addLayer(mapMarkersGroup);

    // Populate markers if issues already loaded
    if (lastLoadedIssues) {
      updateTrackerMap(lastLoadedIssues);
    }
  }, 100);

  // Category filter
  document.querySelectorAll('[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-cat], [data-author]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.cat;
      activeAuthor = null;
      loadTrackerIssues();
    });
  });
  
  // Author filter
  document.querySelectorAll('[data-author]').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) {
        window.location.hash = '#login';
        return;
      }
      document.querySelectorAll('[data-cat], [data-author]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = 'all';
      activeAuthor = chip.dataset.author;
      loadTrackerIssues();
    });
  });

  // Status filter
  document.querySelectorAll('[data-status]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-status]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatus = chip.dataset.status;
      loadTrackerIssues();
    });
  });

  // Sort
  document.getElementById('tracker-sort').addEventListener('change', () => loadTrackerIssues());

  // Search
  document.getElementById('tracker-search').addEventListener('input',
    Utils.debounce(() => loadTrackerIssues(), 300)
  );

  // Load initial issues
  loadTrackerIssues();

  async function loadTrackerIssues() {
    const grid = document.getElementById('tracker-grid');
    const countEl = document.getElementById('tracker-count');

    const params = {
      sort: document.getElementById('tracker-sort').value,
      limit: 50
    };

    if (activeCategory !== 'all') params.category = activeCategory;
    if (activeStatus !== 'all') params.status = activeStatus;
    if (activeAuthor) params.author_id = activeAuthor;

    const search = document.getElementById('tracker-search').value.trim();
    if (search) params.search = search;

    try {
      const data = await API.getIssues(params);
      countEl.textContent = `${data.total} issue${data.total !== 1 ? 's' : ''} found`;

      if (data.issues.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px; height:48px; opacity:0.5; display:inline-block;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 class="empty-state-title">No issues found</h3>
            <p class="empty-state-text">Try adjusting filters or search terms</p>
          </div>
        `;
        if (mapMarkersGroup) mapMarkersGroup.clearLayers();
        return;
      }

      grid.innerHTML = data.issues.map(issue => {
        const cat = Utils.getCategoryInfo(issue.category);
        const status = Utils.getStatusInfo(issue.status);
        return `
          <div class="issue-card" data-issue-id="${issue.id}" onclick="window.location.hash='#issue/${issue.id}'">
            ${issue.image_url ? `
              <div class="issue-card-image">
                ${issue.image_url.match(/\.(mp4|mov|webm|ogg)$/i) ? 
                  `<video src="${issue.image_url}" autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>` : 
                  `<img src="${issue.image_url}" alt="${Utils.escapeHtml(issue.title)}" loading="lazy">`}
              </div>
            ` : `
              <div class="issue-card-image" style="display:flex;align-items:center;justify-content:center;font-size:28px;background:${cat.color}10;">
                ${cat.icon}
              </div>
            `}
            <div class="issue-card-content">
              <div class="issue-card-header" style="align-items: flex-start; justify-content: space-between; gap: var(--space-2);">
                <h4 class="issue-card-title line-clamp-2" style="font-weight:700; text-align: left;">${Utils.escapeHtml(issue.title)}</h4>
                <span class="status-pill ${status.cssClass}" style="transform: scale(0.85); transform-origin: top right; flex-shrink: 0;">${status.label}</span>
              </div>
              <div class="issue-card-meta">
                <span class="badge ${cat.badgeClass}">${cat.icon} ${cat.label}</span>
                <span class="issue-card-meta-item" style="display:inline-flex; align-items:center; gap:2px;"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px; height:10px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>${issue.upvotes}</span>
                <span class="issue-card-meta-item" style="display:inline-flex; align-items:center; gap:2px;"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px; height:10px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${Utils.relativeTime(issue.created_at)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      updateTrackerMap(data.issues);

    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3 class="empty-state-title">Failed to load issues</h3><p class="empty-state-text">${err.message}</p></div>`;
    }
  }

  function updateTrackerMap(issues) {
    lastLoadedIssues = issues;
    if (!splitMap || !mapMarkersGroup) return;

    mapMarkersGroup.clearLayers();

    if (issues.length === 0) return;

    const bounds = [];

    issues.forEach(issue => {
      if (!issue.lat || !issue.lng) return;

      const marker = L.marker([issue.lat, issue.lng], {
        icon: Utils.createMarkerIcon(issue.category)
      });

      const cat = Utils.getCategoryInfo(issue.category);
      const status = Utils.getStatusInfo(issue.status);

      marker.bindPopup(`
        <div style="font-family: var(--font-family); min-width: 180px;">
          <h4 style="margin: 0 0 6px 0; font-size: var(--text-sm); font-weight: 700; color: var(--color-text-primary);">${Utils.escapeHtml(issue.title)}</h4>
          <div style="margin-bottom: 8px;">
            <span class="badge ${cat.badgeClass}" style="font-size: 10px; padding: 2px 6px; display:inline-block;">${cat.icon} ${cat.label}</span>
            <span class="status-pill ${status.cssClass}" style="font-size: 10px; padding: 2px 6px; margin-left: 4px; display:inline-block;">${status.label}</span>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: var(--color-text-secondary);">${Utils.escapeHtml(issue.address || '')}</p>
          <a href="#issue/${issue.id}" style="font-size: var(--text-xs); color: var(--color-blue); font-weight: 600; text-decoration: none;">View Details →</a>
        </div>
      `);

      mapMarkersGroup.addLayer(marker);
      bounds.push([issue.lat, issue.lng]);

      // Link marker
      issue._marker = marker;
    });

    if (bounds.length > 0) {
      splitMap.fitBounds(bounds, { padding: [40, 40] });
    }

    // Add list card hover listener to center markers on map
    setTimeout(() => {
      document.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          const id = card.dataset.issueId;
          const issueObj = issues.find(i => i.id === id);
          if (issueObj && issueObj._marker && splitMap) {
            splitMap.panTo([issueObj.lat, issueObj.lng]);
            issueObj._marker.openPopup();
          }
        });
      });
    }, 200);
  }
}

window.renderTrackerPage = renderTrackerPage;

