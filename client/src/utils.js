// ============================================
// Community Hero — Utilities
// ============================================

export const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '';
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
    if (!dateStr) return '';
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

  formatNumber(num) {
    if (num == null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },

  categoryConfig: {
    pothole: { label: 'Pothole', color: 'var(--color-blue, #3b82f6)', badgeClass: 'badge-blue' },
    water: { label: 'Water & Drainage', color: '#06b6d4', badgeClass: 'badge-cyan' },
    streetlight: { label: 'Streetlight', color: '#d97706', badgeClass: 'badge-amber' },
    waste: { label: 'Waste Management', color: '#10b981', badgeClass: 'badge-emerald' },
    road: { label: 'Road & Traffic', color: '#ef4444', badgeClass: 'badge-rose' },
    infrastructure: { label: 'Infrastructure', color: '#8b5cf6', badgeClass: 'badge-purple' },
    other: { label: 'Other', color: '#64748b', badgeClass: 'badge-gray' }
  },

  getCategoryInfo(category) {
    return Utils.categoryConfig[category] || Utils.categoryConfig.other;
  },

  statusConfig: {
    reported: { label: 'Reported', cssClass: 'reported' },
    verified: { label: 'Verified', cssClass: 'verified' },
    in_progress: { label: 'In Progress', cssClass: 'in-progress' },
    resolved: { label: 'Resolved', cssClass: 'resolved' }
  },

  getStatusInfo(status) {
    return Utils.statusConfig[status] || Utils.statusConfig.reported;
  },

  severityConfig: {
    low: { label: 'Low', color: '#10b981' },
    medium: { label: 'Medium', color: '#f59e0b' },
    high: { label: 'High', color: '#f97316' },
    critical: { label: 'Critical', color: '#ef4444' }
  },

  getSeverityInfo(severity) {
    return Utils.severityConfig[severity] || Utils.severityConfig.medium;
  },

  badgeConfig: {
    first_responder: { label: 'First Responder', desc: 'Reported your first issue' },
    eagle_eye: { label: 'Eagle Eye', desc: '5+ verifications' },
    problem_solver: { label: 'Problem Solver', desc: '3+ issues resolved' },
    community_star: { label: 'Community Star', desc: '50+ points earned' },
    streak_master: { label: 'Streak Master', desc: '7-day reporting streak' },
    civic_champion: { label: 'Civic Champion', desc: 'Escalated 2+ issues to Govt' }
  },

  getBadgeInfo(type) {
    return Utils.badgeConfig[type] || { label: type, desc: '' };
  },

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
  }
};
