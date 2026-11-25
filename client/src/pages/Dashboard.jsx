import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Utils } from '../utils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getStats()
      .then(s => setStats(s))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  const categoryChartData = {
    labels: stats?.byCategory?.map(c => Utils.getCategoryInfo(c.category).label) || [],
    datasets: [{
      data: stats?.byCategory?.map(c => c.count) || [],
      backgroundColor: stats?.byCategory?.map(c => Utils.getCategoryInfo(c.category).color) || []
    }]
  };

  const statusChartData = {
    labels: stats?.byStatus?.map(s => Utils.getStatusInfo(s.status).label) || [],
    datasets: [{
      label: 'Issues',
      data: stats?.byStatus?.map(s => s.count) || [],
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };

  const trendChartData = {
    labels: stats?.trend?.map(t => Utils.formatDate(t.date)) || [],
    datasets: [{
      label: 'Issues Reported',
      data: stats?.trend?.map(t => t.count) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Impact Dashboard</h2>
          <p className="section-subtitle">Real-time civic analytics and community resolution metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats stagger-children">
          <div className="stat-card blue">
            <div className="stat-card-value">{stats?.summary?.totalIssues || 0}</div>
            <div className="stat-card-label">Total Issues</div>
          </div>
          <div className="stat-card emerald">
            <div className="stat-card-value">{stats?.summary?.resolvedIssues || 0}</div>
            <div className="stat-card-label">Resolved</div>
            <div className="stat-card-change positive">↑ {stats?.summary?.resolutionRate || 0}%</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-value">{stats?.summary?.activeMembers || 0}</div>
            <div className="stat-card-label">Active Members</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-card-value">{stats?.summary?.avgResolutionDays || 0}</div>
            <div className="stat-card-label">Avg. Resolution (days)</div>
          </div>
        </div>

        {/* Charts */}
        <div className="dashboard-charts-bento" style={{ marginTop: 'var(--space-6)' }}>
          <div className="chart-card bento-wide">
            <div className="chart-card-title">Reporting Trend (Last 30 Days)</div>
            <div style={{ height: '260px' }}>
              <Line data={trendChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="chart-card bento-normal">
            <div className="chart-card-title">Issues by Category</div>
            <div style={{ height: '260px' }}>
              <Doughnut data={categoryChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="chart-card bento-normal">
            <div className="chart-card-title">Issues by Status</div>
            <div style={{ height: '260px' }}>
              <Bar data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)', fontSize: '18px' }}>Recent Community Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.recentActivity.map(item => {
                const cat = Utils.getCategoryInfo(item.category);
                const status = Utils.getStatusInfo(item.status);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong>{item.reporter_name}</strong> reported <span style={{ color: cat.color }}>{item.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`status-pill ${status.cssClass}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{status.label}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{Utils.relativeTime(item.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
