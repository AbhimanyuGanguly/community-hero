// ============================================
// Community Hero — Interactive Map Page
// ============================================

let mainMap = null;
let markerCluster = null;

function renderMapPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="map-page">
      <div class="map-container" id="main-map"></div>

      <div class="map-filters">
        <div class="search-bar" style="background: white; box-shadow: var(--shadow-lg);">
          <span class="search-bar-icon">🔍</span>
          <input type="text" placeholder="Search issues..." id="map-search">
        </div>
        <div class="map-filter-bar" id="map-filter-chips"></div>
      </div>

      <div class="map-legend" id="map-legend">
        <div class="map-legend-title">Categories</div>
        ${Object.entries(Utils.categoryConfig).map(([key, cat]) => `
          <div class="map-legend-item">
            <span class="map-legend-dot" style="background: ${cat.color};"></span>
            <span>${cat.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Render filter chips
  const chipContainer = document.getElementById('map-filter-chips');
  chipContainer.innerHTML = `
    <button class="chip active" data-filter="all" style="background: white; box-shadow: var(--shadow-sm);">All</button>
    ${Object.entries(Utils.categoryConfig).map(([key, cat]) => `
      <button class="chip" data-filter="${key}" style="background: white; box-shadow: var(--shadow-sm);">${cat.icon} ${cat.label}</button>
    `).join('')}
  `;

  setTimeout(() => initMainMap(), 100);
}

async function initMainMap() {
  // Initialize map centered on Delhi NCR
  mainMap = L.map('main-map').setView([28.6139, 77.2090], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mainMap);

  // Initialize marker cluster
  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  mainMap.addLayer(markerCluster);

  // Load issues
  await loadMapIssues();

  // Filter click handlers
  document.querySelectorAll('#map-filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#map-filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadMapIssues(chip.dataset.filter);
    });
  });

  // Search
  const searchInput = document.getElementById('map-search');
  searchInput.addEventListener('input', Utils.debounce(() => {
    const activeFilter = document.querySelector('#map-filter-chips .chip.active')?.dataset.filter || 'all';
    loadMapIssues(activeFilter, searchInput.value.trim());
  }, 300));

  // Click map to report
  mainMap.on('click', (e) => {
    if (!Auth.isLoggedIn()) return;
    // Could open a popup asking to report here
  });
}

async function loadMapIssues(categoryFilter = 'all', search = '') {
  try {
    const params = { limit: 100 };
    if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
    if (search) params.search = search;

    const data = await API.getIssues(params);

    markerCluster.clearLayers();

    data.issues.forEach(issue => {
      const catInfo = Utils.getCategoryInfo(issue.category);
      const statusInfo = Utils.getStatusInfo(issue.status);
      const icon = Utils.createMarkerIcon(issue.category);

      const marker = L.marker([issue.lat, issue.lng], { icon });

      const imageHtml = issue.image_url
        ? `<img src="${issue.image_url}" class="map-popup-image" alt="${Utils.escapeHtml(issue.title)}">`
        : '';

      marker.bindPopup(`
        <div class="map-popup">
          ${imageHtml}
          <div class="map-popup-title">${Utils.escapeHtml(issue.title)}</div>
          <div class="map-popup-meta">
            <span class="badge ${catInfo.badgeClass}">${catInfo.icon} ${catInfo.label}</span>
            <span class="status-pill ${statusInfo.cssClass}">${statusInfo.label}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
            📍 ${Utils.escapeHtml(issue.address || 'Unknown location')} · ${Utils.relativeTime(issue.created_at)}
          </div>
          <div class="map-popup-actions" style="display: flex; gap: 8px; margin-top: 8px;">
            <a href="#issue/${issue.id}" class="btn btn-primary btn-sm" style="color: white; text-decoration: none;">View Details</a>
            <button class="upvote-btn btn-sm map-upvote-btn" data-id="${issue.id}" style="font-size: 12px; border: 1px solid var(--color-border); background: var(--color-bg-tertiary);">👍 <span class="upvote-count">${issue.upvotes}</span></button>
          </div>
        </div>
      `, { maxWidth: 300, minWidth: 260 });

      markerCluster.addLayer(marker);
    });

    // Add event delegation for upvote buttons in popups
    setTimeout(() => {
      const mapContainer = document.getElementById('main-map');
      if (mapContainer && !mapContainer.dataset.eventsBound) {
        mapContainer.dataset.eventsBound = 'true';
        mapContainer.addEventListener('click', async (e) => {
          const btn = e.target.closest('.map-upvote-btn');
          if (!btn) return;
          
          e.preventDefault();
          
          if (!Auth.isLoggedIn()) {
            Utils.toast('error', 'Please log in to upvote');
            return;
          }
          
          try {
            const id = parseInt(btn.dataset.id);
            const res = await API.upvoteIssue(id);
            if (res.success) {
              const countSpan = btn.querySelector('.upvote-count');
              if (countSpan) countSpan.textContent = res.issue.upvotes;
              btn.classList.add('active');
              Utils.toast('success', 'Upvoted successfully!');
            }
          } catch (err) {
            Utils.toast('error', err.message || 'Failed to upvote');
          }
        });
      }
    }, 500);
  } catch (err) {
    console.error('Failed to load map issues:', err);
    Utils.toast('error', 'Failed to load map data');
  }
}

window.renderMapPage = renderMapPage;
