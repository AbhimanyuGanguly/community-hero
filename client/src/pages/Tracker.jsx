import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { Utils } from '../utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Tracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialAuthor = searchParams.get('author_id') || null;

  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState('all');
  const [authorId, setAuthorId] = useState(initialAuthor);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Fetch issues
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const params = { sort, limit: 50 };
    if (category !== 'all') params.category = category;
    if (status !== 'all') params.status = status;
    if (authorId) params.author_id = authorId;
    if (search.trim()) params.search = search.trim();

    API.getIssues(params)
      .then(res => {
        if (!isCancelled) {
          setIssues(res.issues);
          setTotal(res.total);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [category, status, authorId, search, sort]);

  // Setup Leaflet Split Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const bounds = [];
    issues.forEach(issue => {
      if (!issue.lat || !issue.lng) return;

      const cat = Utils.getCategoryInfo(issue.category);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 32px; height: 32px; background: ${cat.color}; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
          <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700;">${issue.title}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${issue.address || ''}</p>
          <a href="#/issue/${issue.id}" style="font-size: 12px; color: #3b82f6; font-weight: 600;">View Details →</a>
        </div>
      `);

      markersRef.current[issue.id] = marker;
      bounds.push([issue.lat, issue.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [issues]);

  const handleCardHover = (id) => {
    const marker = markersRef.current[id];
    if (marker && mapInstanceRef.current) {
      const issue = issues.find(i => i.id === id);
      if (issue) {
        mapInstanceRef.current.panTo([issue.lat, issue.lng]);
        marker.openPopup();
      }
    }
  };

  return (
    <div className="tracker-page-fullscreen">
      <div className="tracker-split-container">
        {/* Left Side Feed */}
        <div className="tracker-feed-side">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>Issue Tracker</h2>
            <p className="section-subtitle" style={{ fontSize: 'var(--text-xs)', marginBottom: 0 }}>Browse and track reported community issues</p>
          </div>

          <div className="tracker-controls">
            <div className="search-bar">
              <span className="search-bar-icon">🔍</span>
              <input
                type="text"
                placeholder="Search issues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="tracker-sort">
              <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="severity">Severity</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="tracker-filters">
            <button className={`chip ${category === 'all' && !authorId ? 'active' : ''}`} onClick={() => { setCategory('all'); setAuthorId(null); }}>All</button>
            <button className={`chip ${authorId === 'me' ? 'active' : ''}`} onClick={() => { setAuthorId('me'); setCategory('all'); }}>👤 My Reports</button>
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 4px' }}></div>
            {Object.entries(Utils.categoryConfig).map(([key, cat]) => (
              <button key={key} className={`chip ${category === key ? 'active' : ''}`} onClick={() => { setCategory(key); setAuthorId(null); }}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="tracker-results-count" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-2) 0' }}>
            {total} issue{total !== 1 ? 's' : ''} found
          </div>

          <div className="tracker-grid">
            {loading ? (
              <div className="page-loader"><div className="spinner"></div></div>
            ) : issues.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">No issues found</h3>
                <p className="empty-state-text">Try adjusting filters or search terms</p>
              </div>
            ) : (
              issues.map(issue => {
                const cat = Utils.getCategoryInfo(issue.category);
                const statusInfo = Utils.getStatusInfo(issue.status);
                return (
                  <Link
                    to={`/issue/${issue.id}`}
                    key={issue.id}
                    className="issue-card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onMouseEnter={() => handleCardHover(issue.id)}
                  >
                    {issue.image_url ? (
                      <div className="issue-card-image">
                        <img src={issue.image_url} alt={issue.title} loading="lazy" />
                      </div>
                    ) : (
                      <div className="issue-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: `${cat.color}15` }}>
                        🛡️
                      </div>
                    )}
                    <div className="issue-card-content">
                      <div className="issue-card-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <h4 className="issue-card-title line-clamp-2" style={{ fontWeight: 700, textAlign: 'left' }}>{issue.title}</h4>
                        <span className={`status-pill ${statusInfo.cssClass}`} style={{ transform: 'scale(0.85)', transformOrigin: 'top right', flexShrink: 0 }}>{statusInfo.label}</span>
                      </div>
                      <div className="issue-card-meta">
                        <span className={`badge ${cat.badgeClass}`}>{cat.label}</span>
                        <span className="issue-card-meta-item">👍 {issue.upvotes}</span>
                        <span className="issue-card-meta-item">🕒 {Utils.relativeTime(issue.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side Fullscreen Map */}
        <div className="tracker-map-side">
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
