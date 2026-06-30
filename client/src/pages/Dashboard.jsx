import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Activity, User, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { API } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    async function loadUserIssues() {
      try {
        const data = await API.getIssues({ author_id: 'me' });
        setIssues(data.issues || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUserIssues();
  }, [user, navigate]);

  if (!user) return null;

  // Extract badge names from badge objects (backend returns [{badge_type, earned_at}])
  const badges = user.badges
    ? user.badges.map(b => typeof b === 'string' ? b : b.badge_type)
    : [];

  const badgeDisplay = {
    first_responder: { icon: Shield, label: 'First Responder', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
    eagle_eye: { icon: Star, label: 'Eagle Eye', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
    problem_solver: { icon: Activity, label: 'Problem Solver', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    community_star: { icon: Award, label: 'Community Star', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    civic_champion: { icon: BarChart3, label: 'Civic Champion', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' },
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      <div className="mb-10 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Civic Dashboard</h1>
        <p className="text-textMuted">Track your impact and community standing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-3xl md:col-span-2 flex items-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary flex flex-shrink-0 items-center justify-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-textMuted flex items-center gap-2 text-sm">
              <User className="w-4 h-4" /> {user.email}
            </p>
            {user.stats && (
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-textMuted">Reported: <strong className="text-white">{user.stats.total_reported}</strong></span>
                <span className="text-textMuted">Resolved: <strong className="text-success">{user.stats.total_resolved || 0}</strong></span>
                <span className="text-textMuted">Verified: <strong className="text-primary">{user.stats.total_verifications}</strong></span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent"></div>
          <Star className="w-8 h-8 text-accent mb-2 relative z-10" />
          <div className="text-4xl font-bold text-white mb-1 relative z-10">{user.points}</div>
          <div className="text-sm font-medium text-accent uppercase tracking-wider relative z-10">Civic Points</div>
        </motion.div>
      </div>

      <h3 className="text-xl font-bold mb-6">Your Badges</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {badges.length > 0 ? (
          badges.map((badgeKey, idx) => {
            const display = badgeDisplay[badgeKey] || { icon: Award, label: badgeKey.replace(/_/g, ' '), color: 'text-white', bg: 'bg-surface', border: 'border-borderLight' };
            const IconComponent = display.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center border ${display.border} ${display.bg}`}
              >
                <IconComponent className={`w-8 h-8 ${display.color} mb-2`} />
                <div className="font-semibold text-white capitalize text-sm">{display.label}</div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-textMuted italic bg-surface p-6 rounded-2xl border border-borderLight text-center">
            You haven't earned any badges yet. Start reporting and verifying issues!
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" /> Your Reports
      </h3>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : issues.length > 0 ? (
          issues.map(issue => (
            <div key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)} className="glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors group">
              <div>
                <h4 className="font-bold text-white mb-1 group-hover:text-primary transition-colors">{issue.title}</h4>
                <div className="text-xs text-textMuted capitalize">Status: <span className="text-white">{issue.status.replace('_', ' ')}</span> &middot; {issue.category}</div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-primary">{issue.upvotes} Upvotes</span>
                <span className="text-success">{issue.verifications} Verified</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-textMuted italic bg-surface p-6 rounded-2xl border border-borderLight text-center">
            You haven't reported any issues yet. Click "Report Issue" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
