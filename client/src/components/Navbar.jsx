import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utils } from '../utils';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar" id="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', color: 'white' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="navbar-brand-text">Community<strong>Hero</strong></span>
        </Link>

        <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
          <NavLink to="/map" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Map</NavLink>
          <NavLink to="/tracker" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Tracker</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Leaderboard</NavLink>
        </div>

        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              <Link to="/report" className="btn btn-primary btn-sm btn-ripple hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>
                </svg> Report
              </Link>
              <div className={`navbar-user-container ${dropdownOpen ? 'open' : ''}`}>
                <div className="navbar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="navbar-user-avatar" style={{ background: Utils.getAvatarColor(user?.name) }}>
                    {Utils.getInitials(user?.name)}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: '8px', opacity: 0.7, marginLeft: '2px' }}>▼</span>
                </div>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user?.name}</div>
                      <div className="user-dropdown-email">{user?.email}</div>
                    </div>
                    <div className="user-dropdown-body">
                      <div className="user-dropdown-stat">
                        <span>Points</span>
                        <strong>{user?.points || 0} pts</strong>
                      </div>
                      <Link to="/tracker?author_id=me" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>My Reports</Link>
                      <Link to="/leaderboard" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>Leaderboard</Link>
                      <a href="javascript:void(0)" className="user-dropdown-item logout-item" onClick={handleLogout}>Log Out</a>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm btn-ripple">Get Started</Link>
          )}
        </div>

        <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
      </div>
    </nav>
  );
}
