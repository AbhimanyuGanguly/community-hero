import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Utils } from '../utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPage() {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    API.getIssues({ limit: 100 })
      .then(res => setIssues(res.issues))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([28.6139, 77.2090], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = issues.filter(issue => {
      const matchCat = filter === 'all' || issue.category === filter;
      const matchSearch = !search || issue.title?.toLowerCase().includes(search.toLowerCase()) || issue.address?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    filtered.forEach(issue => {
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
        <div style="font-family: inherit; min-width: 220px;">
          ${issue.image_url ? `<img src="${issue.image_url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${issue.title}</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">📍 ${issue.address || 'Unknown'}</p>
          <a href="#/issue/${issue.id}" style="display: inline-block; padding: 4px 8px; background: #3b82f6; color: white; border-radius: 4px; text-decoration: none; font-size: 12px;">View Details</a>
        </div>
      `);
      markersRef.current.push(marker);
    });
  }, [issues, filter, search]);

  return (
    <div className="map-page">
      <div ref={mapRef} style={{ width: '100%', height: 'calc(100vh - 64px)' }}></div>

      <div className="map-filters">
        <div className="search-bar" style={{ background: 'white', boxShadow: 'var(--shadow-lg)' }}>
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Search issues on map..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="map-filter-bar">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} style={{ background: 'white' }} onClick={() => setFilter('all')}>All</button>
          {Object.entries(Utils.categoryConfig).map(([key, cat]) => (
            <button key={key} className={`chip ${filter === key ? 'active' : ''}`} style={{ background: 'white' }} onClick={() => setFilter(key)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-legend">
        <div className="map-legend-title">Categories</div>
        {Object.entries(Utils.categoryConfig).map(([key, cat]) => (
          <div key={key} className="map-legend-item">
            <span className="map-legend-dot" style={{ background: cat.color }}></span>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
