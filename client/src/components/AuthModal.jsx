import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  // Sync mode with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await signup(name, email, password);
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel p-8 rounded-3xl w-full max-w-md relative z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-textMuted hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Join Community Hero'}
            </h2>
            <p className="text-textMuted mb-6 text-sm">
              {mode === 'login' ? 'Log in to track your reports and earn points.' : 'Create an account to start reporting issues in your city.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-surface border border-borderLight rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-medium transition-colors mt-4 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-textMuted">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary hover:text-primaryHover font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
