import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Map as MapIcon, Activity, Menu, X, User, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import AuthModal from '../components/AuthModal';
import ReportModal from '../components/ReportModal';

export default function MainLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Shield },
    { name: 'Tracker', path: '/tracker', icon: Activity },
    { name: 'Map', path: '/map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Immersive Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px] mix-blend-screen animate-float"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Floating Navbar */}
      <motion.header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 sm:px-6 lg:px-8",
          isScrolled ? "py-4" : "py-6"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={cn(
          "mx-auto max-w-7xl rounded-full transition-all duration-300 flex items-center justify-between",
          isScrolled 
            ? "bg-surface/80 backdrop-blur-md border border-borderLight shadow-2xl px-6 py-3" 
            : "px-2 py-2"
        )}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(108,99,255,0.5)]">
              <Shield className="w-4 h-4 text-white z-10" />
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-glow transition-all">Community Hero</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-surface/50 rounded-full p-1 border border-borderLight/50 backdrop-blur-sm">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                    isActive ? "text-white" : "text-textMuted hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-3 relative z-10">
            <button 
              onClick={() => {
                if (user) setShowReportModal(true);
                else { setAuthMode('login'); setShowAuthModal(true); }
              }}
              className="glass-button bg-surface hover:bg-surfaceHover border-borderLight text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-primary" /> Report Issue
            </button>
            <div className="w-px h-6 bg-borderLight mx-1"></div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2 bg-surface hover:bg-surfaceHover border border-borderLight px-3 py-1.5 rounded-full transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{user.points} pts</span>
                </Link>
                <button onClick={logout} className="text-textMuted hover:text-white text-sm font-medium transition-colors px-2">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="text-textMuted hover:text-white text-sm font-medium transition-colors px-3 py-2">
                  Log in
                </button>
                <button onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} className="glass-button bg-primary text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(108,99,255,0.4)] hover:shadow-[0_0_25px_rgba(108,99,255,0.6)]">
                  <User className="w-4 h-4" />
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2 relative z-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode} 
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportSuccess={() => {}}
      />

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 pt-24 pb-6 px-4 bg-background/95 backdrop-blur-xl border-b border-borderLight z-40 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3",
                    location.pathname === link.path ? "bg-primary/20 text-white border border-primary/30" : "text-textMuted"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-borderLight my-2"></div>
              <button className="w-full text-left px-4 py-3 text-textMuted font-medium">Log in</button>
              <button className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium shadow-[0_0_15px_rgba(108,99,255,0.4)]">Sign up</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-grow flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
