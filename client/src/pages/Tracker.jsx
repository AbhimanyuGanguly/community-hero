import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ThumbsUp, Shield, ArrowUpRight, Search, Filter } from 'lucide-react';
import { API } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Tracker() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchIssues = async (statusFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await API.getIssues(params);
      // data is { issues: [...], total: N }
      setIssues(data.issues || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(filter);
  }, [filter]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'reported': return 'bg-white/10 text-white';
      case 'verified': return 'bg-primary/20 text-primary border border-primary/30';
      case 'in_progress': return 'bg-warning/20 text-warning border border-warning/30';
      case 'resolved': return 'bg-success/20 text-success border border-success/30';
      default: return 'bg-white/10 text-white';
    }
  };

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'high':
      case 'critical': return <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span></span>;
      default: return null;
    }
  };

  const filterButtons = [
    { label: 'All Issues', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Resolved', value: 'resolved' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 mt-4 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Live Tracker</h1>
          <p className="text-textMuted">Monitor, verify, and escalate community issues.</p>
        </div>
        <div className="flex gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={cn(
                "glass-button bg-surface px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === btn.value ? "text-white border-primary/50" : "text-textMuted hover:text-white"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 glass-panel rounded-3xl animate-pulse bg-surface/50"></div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-textMuted text-lg">No issues found.</div>
          <p className="text-textMuted/60 text-sm mt-2">Try changing the filter or report a new issue.</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.07 }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {issues.map((issue, idx) => (
            <motion.div
              key={issue.id}
              onClick={() => navigate(`/issue/${issue.id}`)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={cn(
                "glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden group cursor-pointer border border-borderLight hover:border-primary/50 transition-colors duration-300 min-h-[260px]",
                idx === 0 && issues.length > 3 ? "md:col-span-2 md:row-span-1" : ""
              )}
            >
              {getSeverityBadge(issue.severity)}
              
              {/* Background Glow */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/40 transition-colors duration-500"></div>

              {/* Photo thumbnail */}
              {issue.image_url && (
                <div className="w-full h-32 mb-4 rounded-xl overflow-hidden relative">
                  <img src={issue.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", getStatusColor(issue.status))}>
                  {issue.status.replace('_', ' ')}
                </span>
                <div className="bg-surface border border-borderLight px-2 py-1 rounded-md text-xs text-textMuted capitalize">
                  {issue.category}
                </div>
              </div>

              <h3 className={cn("font-bold tracking-tight mb-2 relative z-10 text-lg line-clamp-2")}>
                {issue.title}
              </h3>
              
              <p className="text-textMuted relative z-10 line-clamp-2 text-sm flex-grow">
                {issue.description}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-borderLight/50 relative z-10">
                <div className="flex items-center gap-1 text-xs text-textMuted">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{issue.address || "Location attached"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <ThumbsUp className="w-3 h-3" /> {issue.upvotes}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <Shield className="w-3 h-3" /> {issue.verifications}
                  </span>
                </div>
              </div>

              {/* Hover Reveal Button */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-black p-2 rounded-full shadow-xl">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
