import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" id="app-footer">
      <div className="container">
        <div className="footer-content">
          <span>© 2026 Community Hero. Built for a better tomorrow.</span>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/map">Map</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
