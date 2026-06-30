// ============================================
// Community Hero — Utility Functions
// ============================================

const Utils = {
  // ---- Date Formatting ----
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  relativeTime(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return Utils.formatDate(dateStr);
  },

  // ---- Number Formatting ----
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },

  // ---- Category Helpers ----
  categoryConfig: {
    pothole: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--color-blue);"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`, label: 'Pothole', color: 'var(--color-blue)', badgeClass: 'badge-blue' },
    water: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#06b6d4;"><path d="M12 22a7 7 0 0 0 5-11.97L12 5l-5 5.03A7 7 0 0 0 12 22z"/></svg>`, label: 'Water & Drainage', color: '#06b6d4', badgeClass: 'badge-cyan' },
    streetlight: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#d97706;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A7 7 0 0 0 4 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`, label: 'Streetlight', color: '#d97706', badgeClass: 'badge-amber' },
    waste: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#10b981;"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>`, label: 'Waste Management', color: '#10b981', badgeClass: 'badge-emerald' },
    road: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#ef4444;"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M12 6v12M2 12h20"/></svg>`, label: 'Road & Traffic', color: '#ef4444', badgeClass: 'badge-rose' },
    infrastructure: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#8b5cf6;"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-6h6v6M9 6h2M9 10h2M13 6h2M13 10h2"/></svg>`, label: 'Infrastructure', color: '#8b5cf6', badgeClass: 'badge-purple' },
    other: { icon: `<svg class="svg-icon" viewBox="0 0 24 24" style="color:#64748b;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`, label: 'Other', color: '#64748b', badgeClass: 'badge-gray' }
  },

  getCategoryInfo(category) {
    return Utils.categoryConfig[category] || Utils.categoryConfig.other;
  },

  // ---- Status Helpers ----
  statusConfig: {
    reported: { label: 'Reported', icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>`, cssClass: 'reported' },
    verified: { label: 'Verified', icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>`, cssClass: 'verified' },
    in_progress: { label: 'In Progress', icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12.2 2h-.4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM10 5.17A4 4 0 0 0 4 9v4a4 4 0 0 0 6 3.83M14 5.17A4 4 0 0 1 20 9v4a4 4 0 0 1-6 3.83M12 18v4M8 22h8"/></svg>`, cssClass: 'in-progress' },
    resolved: { label: 'Resolved', icon: `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`, cssClass: 'resolved' }
  },

  getStatusInfo(status) {
    return Utils.statusConfig[status] || Utils.statusConfig.reported;
  },

  // ---- Severity Helpers ----
  severityConfig: {
    low: { label: 'Low', color: '#10b981' },
    medium: { label: 'Medium', color: '#f59e0b' },
    high: { label: 'High', color: '#f97316' },
    critical: { label: 'Critical', color: '#ef4444' }
  },

  getSeverityInfo(severity) {
    return Utils.severityConfig[severity] || Utils.severityConfig.medium;
  },

  renderSeverityDots(severity) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const idx = levels.indexOf(severity);
    return `<div class="severity ${severity}">
      ${[0, 1, 2, 3].map(i => `<span class="severity-dot"></span>`).join('')}
    </div>`;
  },

  // ---- Badge Helpers ----
  badgeConfig: {
    first_responder: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, label: 'First Responder', desc: 'Reported your first issue' },
    eagle_eye: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`, label: 'Eagle Eye', desc: '5+ verifications' },
    problem_solver: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z"/></svg>`, label: 'Problem Solver', desc: '3+ issues resolved' },
    community_star: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`, label: 'Community Star', desc: '50+ points earned' },
    streak_master: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`, label: 'Streak Master', desc: '7-day reporting streak' },
    civic_champion: { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/></svg>`, label: 'Civic Champion', desc: 'Escalated 2+ issues to Govt' }
  },

  getBadgeInfo(type) {
    return Utils.badgeConfig[type] || { icon: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`, label: type, desc: '' };
  },

  // ---- Avatar ----
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  },

  getAvatarColor(name) {
    const colors = [
      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #06b6d4)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #ec4899, #8b5cf6)',
      'linear-gradient(135deg, #06b6d4, #3b82f6)',
      'linear-gradient(135deg, #f97316, #f59e0b)',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  // ---- Toast Notifications ----
  _toastContainer: null,

  _ensureToastContainer() {
    if (!Utils._toastContainer) {
      Utils._toastContainer = document.createElement('div');
      Utils._toastContainer.className = 'toast-container';
      document.body.appendChild(Utils._toastContainer);
    }
    return Utils._toastContainer;
  },

  toast(type, title, message = '', duration = 4000) {
    const container = Utils._ensureToastContainer();
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  confirm(title, message, onConfirm) {
    const modalHtml = `
      <div class="modal-backdrop" id="custom-confirm-modal" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal animate-scale-in" style="max-width: 400px; width: 90%; background: #ffffff; border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-2xl); text-align: center;">
          <div style="margin-bottom: var(--space-4); color: var(--color-danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 style="margin: 0 0 var(--space-2) 0; font-size: var(--text-lg); font-weight: 700;">${title}</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6); font-size: var(--text-sm);">${message}</p>
          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-secondary" id="confirm-modal-cancel" style="flex: 1;">Cancel</button>
            <button class="btn btn-danger" id="confirm-modal-ok" style="flex: 1;">Delete</button>
          </div>
        </div>
      </div>
    `;
    
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-modal-cancel').onclick = () => {
      modal.remove();
    };
    document.getElementById('confirm-modal-ok').onclick = () => {
      modal.remove();
      onConfirm();
    };
  },

  // ---- Geolocation ----
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  // ---- Debounce ----
  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // ---- Image helpers ----
  getImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url; // relative URL served by our server
  },

  // ---- Count-up animation ----
  animateCount(element, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      element.textContent = Utils.formatNumber(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  },

  // ---- HTML escape ----
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // ---- Marker icon creation for Leaflet ----
  createMarkerIcon(category) {
    const cat = Utils.getCategoryInfo(category);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 36px; height: 36px;
        background: ${cat.color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${cat.icon}</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  }
};

// Make available globally
window.Utils = Utils;
