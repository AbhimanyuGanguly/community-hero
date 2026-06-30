// ============================================
// Community Hero — Leaderboard Page
// ============================================

function renderLeaderboardPage() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="leaderboard-page">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="section-title">Community Heroes Leaderboard</h2>
          <p class="section-subtitle" style="margin: 0 auto;">Recognizing the citizens making the biggest impact</p>
        </div>

        <!-- Top 3 -->
        <div class="leaderboard-top3 stagger-children" id="top3-container">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>

        <!-- Points Breakdown -->
        <div class="grid grid-2" style="gap: var(--space-6); margin-bottom: var(--space-8);">
          <div class="points-breakdown">
            <h4 style="margin-bottom: var(--space-4);">Points System</h4>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>Report an issue</span><span class="points-value">+10 pts</span></div>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>Verify an issue</span><span class="points-value">+5 pts</span></div>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Post a comment</span><span class="points-value">+2 pts</span></div>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>Upvote an issue</span><span class="points-value">+1 pt</span></div>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/></svg>File with Govt Portal</span><span class="points-value">+15 pts</span></div>
            <div class="points-row"><span class="points-action"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>Issue resolved (reporter)</span><span class="points-value">+20 pts</span></div>
          </div>
          <div class="points-breakdown">
            <h4 style="margin-bottom: var(--space-4);">Badges</h4>
            ${Object.entries(Utils.badgeConfig).map(([key, b]) => `
              <div class="points-row">
                <span class="points-action" style="display: flex; align-items: center; gap: 6px;">${b.icon} ${b.label}</span>
                <span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">${b.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Full Leaderboard Table -->
        <div class="card" style="overflow-x: auto;">
          <h4 style="margin-bottom: var(--space-4);">Full Rankings</h4>
          <table class="leaderboard-table" id="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hero</th>
                <th>Points</th>
                <th class="hide-mobile">Reported</th>
                <th class="hide-mobile">Resolved</th>
                <th class="hide-mobile">Verified</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              <tr><td colspan="7" style="text-align:center; padding: var(--space-8);"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  loadLeaderboard();
}

async function loadLeaderboard() {
  try {
    const users = await API.getLeaderboard();

    // Top 3
    const top3Container = document.getElementById('top3-container');
    if (users.length >= 3) {
      const trophies = [
        `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:26px; height:26px; color:#d97706;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z"/></svg>`,
        `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:26px; height:26px; color:#64748b;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z"/></svg>`,
        `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:26px; height:26px; color:#b45309;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z"/></svg>`
      ];
      const classes = ['first', 'second', 'third'];
      top3Container.innerHTML = users.slice(0, 3).map((user, i) => `
        <div class="top3-card ${classes[i]}">
          <div class="top3-trophy">${trophies[i]}</div>
          <div class="avatar avatar-lg" style="background: ${Utils.getAvatarColor(user.name)}">${Utils.getInitials(user.name)}</div>
          <div class="top3-name">${Utils.escapeHtml(user.name)}</div>
          <div class="top3-points">${user.points} points</div>
          <div class="top3-issues">${user.issues_reported} reported · ${user.issues_resolved} resolved</div>
          <div class="badge-showcase" style="margin-top: var(--space-3); justify-content: center;">
            ${user.badges.map(b => {
              const info = Utils.getBadgeInfo(b.badge_type);
              return `<div class="achievement-badge earned" title="${info.label}" style="display:inline-flex; align-items:center; justify-content:center;">${info.icon}<div class="badge-tooltip">${info.label}</div></div>`;
            }).join('')}
          </div>
        </div>
      `).join('');
    } else {
      top3Container.innerHTML = '<p style="text-align: center; color: var(--color-text-tertiary);">Not enough users for top 3 yet</p>';
    }

    // Full table
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = users.map((user, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default';
      return `
        <tr>
          <td><div class="rank-badge ${rankClass}">${user.rank}</div></td>
          <td>
            <div class="flex items-center gap-3">
              <div class="avatar avatar-sm" style="background: ${Utils.getAvatarColor(user.name)}">${Utils.getInitials(user.name)}</div>
              <div>
                <div style="font-weight: 600;">${Utils.escapeHtml(user.name)}</div>
                <div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">Joined ${Utils.formatDate(user.created_at)}</div>
              </div>
            </div>
          </td>
          <td><strong style="color: var(--color-blue);">${user.points}</strong></td>
          <td class="hide-mobile">${user.issues_reported}</td>
          <td class="hide-mobile">${user.issues_resolved}</td>
          <td class="hide-mobile">${user.verifications_count}</td>
          <td>
            <div class="flex gap-1">
              ${user.badges.map(b => {
                const info = Utils.getBadgeInfo(b.badge_type);
                return `<span title="${info.label}" style="font-size: 18px; cursor: default;">${info.icon}</span>`;
              }).join('')}
              ${user.badges.length === 0 ? '<span style="color: var(--color-text-muted);">—</span>' : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Leaderboard error:', err);
    Utils.toast('error', 'Failed to load leaderboard');
  }
}

window.renderLeaderboardPage = renderLeaderboardPage;
