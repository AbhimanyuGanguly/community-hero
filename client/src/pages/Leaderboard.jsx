import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Utils } from '../utils';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getLeaderboard()
      .then(res => setUsers(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Community Heroes Leaderboard</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Recognizing the citizens making the biggest impact</p>
        </div>

        {/* Top 3 Showcase */}
        {users.length >= 3 && (
          <div className="leaderboard-top3 stagger-children">
            {users.slice(0, 3).map((user, i) => {
              const trophies = ['🏆', '🥈', '🥉'];
              const classes = ['first', 'second', 'third'];
              return (
                <div key={user.id} className={`top3-card ${classes[i]}`}>
                  <div className="top3-trophy" style={{ fontSize: '28px' }}>{trophies[i]}</div>
                  <div className="avatar avatar-lg" style={{ background: Utils.getAvatarColor(user.name) }}>
                    {Utils.getInitials(user.name)}
                  </div>
                  <div className="top3-name">{user.name}</div>
                  <div className="top3-points">{user.points} points</div>
                  <div className="top3-issues">{user.issues_reported} reported · {user.issues_resolved} resolved</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Points System Breakdown */}
        <div className="grid grid-2" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div className="points-breakdown">
            <h4 style={{ marginBottom: 'var(--space-4)' }}>Points System</h4>
            <div className="points-row"><span className="points-action">📝 Report an issue</span><span className="points-value">+10 pts</span></div>
            <div className="points-row"><span className="points-action">👁️ Verify an issue</span><span className="points-value">+5 pts</span></div>
            <div className="points-row"><span className="points-action">💬 Post a comment</span><span className="points-value">+2 pts</span></div>
            <div className="points-row"><span className="points-action">👍 Upvote an issue</span><span className="points-value">+1 pt</span></div>
            <div className="points-row"><span className="points-action">🏛️ File with Govt Portal</span><span className="points-value">+15 pts</span></div>
            <div className="points-row"><span className="points-action">✅ Issue resolved (reporter)</span><span className="points-value">+20 pts</span></div>
          </div>
          <div className="points-breakdown">
            <h4 style={{ marginBottom: 'var(--space-4)' }}>Badges</h4>
            {Object.entries(Utils.badgeConfig).map(([key, b]) => (
              <div key={key} className="points-row">
                <span className="points-action">🏅 {b.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Table */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <h4 style={{ marginBottom: 'var(--space-4)' }}>Full Rankings</h4>
          {loading ? (
            <div className="page-loader"><div className="spinner"></div></div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hero</th>
                  <th>Points</th>
                  <th className="hide-mobile">Reported</th>
                  <th className="hide-mobile">Resolved</th>
                  <th className="hide-mobile">Verified</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id}>
                    <td><div className="rank-badge">{i + 1}</div></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm" style={{ background: Utils.getAvatarColor(user.name) }}>
                          {Utils.getInitials(user.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Joined {Utils.formatDate(user.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td><strong style={{ color: 'var(--color-blue)' }}>{user.points}</strong></td>
                    <td className="hide-mobile">{user.issues_reported}</td>
                    <td className="hide-mobile">{user.issues_resolved}</td>
                    <td className="hide-mobile">{user.verifications_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
