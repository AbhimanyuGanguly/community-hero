import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Tracker from './pages/Tracker';
import MapPage from './pages/MapPage';
import Report from './pages/Report';
import IssueDetail from './pages/IssueDetail';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="main-content" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/report" element={<Report />} />
          <Route path="/issue/:id" element={<IssueDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
