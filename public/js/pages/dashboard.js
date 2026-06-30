// ============================================
// Community Hero — Dashboard Page
// ============================================

function renderDashboardPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="dashboard-page">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Impact Dashboard</h2>
          <p class="section-subtitle">Real-time analytics and AI-powered insights for your community</p>
        </div>

        <!-- Stats Cards -->
        <div class="dashboard-stats stagger-children" id="dashboard-stats">
          <div class="stat-card blue">
            <div class="stat-card-icon blue">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px; height:24px;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
            </div>
            <div class="stat-card-value" id="stat-total">--</div>
            <div class="stat-card-label">Total Issues</div>
          </div>
          <div class="stat-card emerald">
            <div class="stat-card-icon emerald">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px; height:24px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
            </div>
            <div class="stat-card-value" id="stat-resolved">--</div>
            <div class="stat-card-label">Resolved</div>
            <div class="stat-card-change positive" id="stat-rate">↑ --%</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-card-icon purple">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px; height:24px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-card-value" id="stat-members">--</div>
            <div class="stat-card-label">Active Members</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-card-icon amber">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px; height:24px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-card-value" id="stat-avgtime">--</div>
            <div class="stat-card-label">Avg. Resolution (days)</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="dashboard-charts-bento">
          <div class="chart-card bento-wide">
            <div class="chart-card-title">Reporting Trend (Last 30 Days)</div>
            <div class="chart-canvas-wrapper"><canvas id="chart-trend"></canvas></div>
          </div>
          <div class="chart-card bento-normal">
            <div class="chart-card-title">Issues by Category</div>
            <div class="chart-canvas-wrapper"><canvas id="chart-category"></canvas></div>
          </div>
          <div class="chart-card bento-normal">
            <div class="chart-card-title">Issues by Status</div>
            <div class="chart-canvas-wrapper"><canvas id="chart-status"></canvas></div>
          </div>
          <div class="chart-card bento-wide">
            <div class="chart-card-title">Top Issue Areas</div>
            <div class="chart-canvas-wrapper"><canvas id="chart-areas"></canvas></div>
          </div>
        </div>

        <!-- Predictions & Activity -->
        <div class="grid grid-2" style="gap: var(--space-6);">
          <div class="prediction-card" id="predictions-card">
            <div class="prediction-header">
              <div class="prediction-icon">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:var(--color-blue);"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17v-4M15 17V7"/></svg>
              </div>
              <div>
                <div class="prediction-title">AI Predictive Insights</div>
                <div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">Powered by Gemini AI</div>
              </div>
            </div>
            <div id="predictions-list">
              <div class="page-loader" style="min-height: 100px;"><div class="spinner spinner-sm"></div></div>
            </div>
          </div>

          <div class="activity-feed">
            <h4 style="font-size: var(--text-base); font-weight: var(--font-bold); margin-bottom: var(--space-4);">Recent Activity</h4>
            <div id="activity-list">
              <div class="page-loader" style="min-height: 100px;"><div class="spinner spinner-sm"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadDashboardData();
  loadPredictions();
}

async function loadDashboardData() {
  try {
    const stats = await API.getStats();

    // Animate stat cards
    const totalEl = document.getElementById('stat-total');
    const resolvedEl = document.getElementById('stat-resolved');
    const membersEl = document.getElementById('stat-members');
    const avgEl = document.getElementById('stat-avgtime');
    const rateEl = document.getElementById('stat-rate');

    Utils.animateCount(totalEl, stats.summary.totalIssues);
    Utils.animateCount(resolvedEl, stats.summary.resolvedIssues);
    Utils.animateCount(membersEl, stats.summary.activeMembers);
    avgEl.textContent = stats.summary.avgResolutionDays.toFixed(1);
    rateEl.textContent = `↑ ${stats.summary.resolutionRate}%`;

    // Category chart (Doughnut)
    const catCtx = document.getElementById('chart-category');
    if (catCtx) {
      new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: stats.byCategory.map(c => Utils.getCategoryInfo(c.category).label),
          datasets: [{
            data: stats.byCategory.map(c => c.count),
            backgroundColor: stats.byCategory.map(c => Utils.getCategoryInfo(c.category).color),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } }
          },
          cutout: '65%'
        }
      });
    }

    // Status chart (Bar)
    const statusCtx = document.getElementById('chart-status');
    if (statusCtx) {
      const statusColors = { reported: '#f59e0b', verified: '#6366f1', in_progress: '#a855f7', resolved: '#10b981' };
      new Chart(statusCtx, {
        type: 'bar',
        data: {
          labels: stats.byStatus.map(s => Utils.getStatusInfo(s.status).label),
          datasets: [{
            data: stats.byStatus.map(s => s.count),
            backgroundColor: stats.byStatus.map(s => statusColors[s.status] || '#71717a'),
            borderRadius: 8,
            barThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f4f4f5' }, ticks: { font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
          }
        }
      });
    }

    // Trend chart (Line)
    const trendCtx = document.getElementById('chart-trend');
    if (trendCtx) {
      // Fill in missing dates
      const trendMap = {};
      stats.trend.forEach(t => { trendMap[t.date] = t.count; });

      const dates = [];
      const counts = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dates.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        counts.push(trendMap[key] || 0);
      }

      new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Issues Reported',
            data: counts,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f4f4f5' }, ticks: { font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { family: 'Inter', size: 11 } } }
          }
        }
      });
    }

    // Top Areas (Horizontal Bar)
    const areasCtx = document.getElementById('chart-areas');
    if (areasCtx) {
      new Chart(areasCtx, {
        type: 'bar',
        data: {
          labels: stats.topAreas.map(a => (a.address || 'Unknown').split(',')[0].substring(0, 25)),
          datasets: [{
            data: stats.topAreas.map(a => a.count),
            backgroundColor: '#6366f1',
            borderRadius: 6,
            barThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: '#f4f4f5' }, ticks: { font: { family: 'Inter' } } },
            y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
          }
        }
      });
    }

    // Activity feed
    const activityList = document.getElementById('activity-list');
    if (stats.recentActivity && stats.recentActivity.length > 0) {
      activityList.innerHTML = stats.recentActivity.map(item => {
        const cat = Utils.getCategoryInfo(item.category);
        const status = Utils.getStatusInfo(item.status);
        return `
          <a href="#issue/${item.id}" class="activity-item" style="text-decoration: none; color: inherit;">
            <div class="activity-icon" style="background: ${cat.color}15; color: ${cat.color};">${cat.icon}</div>
            <div class="activity-text">
              <strong>${Utils.escapeHtml(item.reporter_name)}</strong> reported
              <span style="color: ${cat.color};">${Utils.escapeHtml(item.title.substring(0, 40))}${item.title.length > 40 ? '...' : ''}</span>
            </div>
            <span class="activity-time">${Utils.relativeTime(item.created_at)}</span>
          </a>
        `;
      }).join('');
    } else {
      activityList.innerHTML = '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm);">No recent activity</p>';
    }

  } catch (err) {
    console.error('Dashboard error:', err);
    Utils.toast('error', 'Failed to load dashboard', err.message);
  }
}

async function loadPredictions() {
  const list = document.getElementById('predictions-list');
  try {
    const data = await API.getPredictions();
    if (data.predictions && data.predictions.length > 0) {
      list.innerHTML = data.predictions.map(p => `
        <div class="prediction-item">
          <div class="prediction-trend ${p.trend}">
            ${p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '📊'}
          </div>
          <div>
            <div class="prediction-text">${Utils.escapeHtml(p.text)}</div>
            <div class="prediction-confidence">Confidence: ${Math.round(p.confidence * 100)}%</div>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm);">No predictions available</p>';
    }
  } catch (err) {
    list.innerHTML = '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm);">Failed to load predictions</p>';
  }
}

window.renderDashboardPage = renderDashboardPage;
