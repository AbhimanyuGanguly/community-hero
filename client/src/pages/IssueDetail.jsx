import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Send, FileText, Bot, MessageSquare } from 'lucide-react';
import { API } from '../lib/api';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [govDraft, setGovDraft] = useState(null);
  const [complaintId, setComplaintId] = useState('');
  const [rpaLoading, setRpaLoading] = useState(false);

  const loadIssue = async () => {
    try {
      const data = await API.getIssue(id);
      // Backend returns { ...issueFields, comments: [...], verifiers: [...], userUpvoted, userVerified }
      const { comments: fetchedComments, verifiers, userUpvoted, userVerified, ...issueData } = data;
      setIssue(issueData);
      setComments(fetchedComments || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [id]);

  const handleVerify = async () => {
    if (!user) return toast.error('Please log in first');
    try {
      setActionLoading(true);
      await API.verifyIssue(id);
      toast.success('Issue verified! +5 pts');
      loadIssue();
      refreshUser();
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!user) return toast.error('Please log in first');
    try {
      setActionLoading(true);
      await API.upvoteIssue(id);
      toast.success('Upvoted!');
      loadIssue();
      refreshUser();
    } catch (err) {
      toast.error(err.message || 'Upvote failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please log in first');
    if (!commentText.trim()) return;
    try {
      setActionLoading(true);
      await API.addComment(id, commentText);
      setCommentText('');
      toast.success('Comment added');
      loadIssue();
      refreshUser();
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!user) return toast.error('Please log in first');
    try {
      setActionLoading(true);
      const toastId = toast.loading('AI is generating the official dossier...');
      const draft = await API.getGovDraft(id);
      setGovDraft(draft);
      toast.success('Dossier generated!', { id: toastId });
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || 'AI generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRpaSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please log in first');
    if (!complaintId.trim()) return;
    try {
      setRpaLoading(true);
      const toastId = toast.loading('AI Browser Agent verifying Ticket ID...');
      await API.recordGovFiling(id, {
        gov_authority: govDraft?.authority || 'Municipal Authority',
        gov_complaint_id: complaintId
      });
      toast.success('Verified successfully! +15 pts', { id: toastId });
      loadIssue();
      refreshUser();
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || 'AI Verification failed');
    } finally {
      setRpaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!issue) return <div className="text-center text-white mt-20">Issue not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-5xl mx-auto pb-20 relative"
    >
      <button 
        onClick={() => navigate(-1)}
        className="glass-button bg-surface mb-8 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 text-textMuted hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tracker
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            {issue.photo_url && (
               <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden relative border border-borderLight shadow-inner">
                 <img src={issue.photo_url} alt="Issue" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
               </div>
            )}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="px-3 py-1 rounded-full bg-surface border border-borderLight text-xs font-semibold uppercase tracking-wider text-textMuted">
                {issue.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold uppercase tracking-wider text-primary">
                {issue.status.replace('_', ' ')}
              </span>
              {issue.gov_filed === 1 && (
                <span className="px-3 py-1 rounded-full bg-success/20 border border-success/30 text-xs font-semibold uppercase tracking-wider text-success">
                  Officially Escalated
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 relative z-10 leading-tight">
              {issue.title}
            </h1>
            
            <p className="text-lg text-textMuted leading-relaxed relative z-10 whitespace-pre-wrap">
              {issue.description}
            </p>
            <div className="mt-6 pt-6 border-t border-borderLight flex flex-col md:flex-row justify-between text-sm text-textMuted">
              <span>Reported by: <strong className="text-white">{issue.reporter_name}</strong></span>
              <span>Location: {issue.address}</span>
            </div>
          </div>

          {/* AI Drafting Section */}
          <div className={cn("glass-panel p-8 rounded-3xl border relative overflow-hidden transition-all", issue.gov_filed === 1 ? "border-success/30" : "border-accent/20")}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                {issue.gov_filed === 1 ? <CheckCircle className="w-6 h-6 text-success" /> : <Bot className="w-6 h-6 text-accent" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {issue.gov_filed === 1 ? 'Officially Escalated' : 'AI Grievance Dossier'}
                </h3>
                
                {issue.gov_filed === 1 ? (
                  <div className="bg-surface border border-borderLight p-4 rounded-xl">
                    <p className="text-sm text-textMuted mb-2">This issue was formally submitted to <strong>{issue.gov_authority}</strong>.</p>
                    <div className="font-mono text-sm text-success bg-success/10 py-2 px-3 rounded-lg border border-success/20 inline-block">
                      Ticket ID: {issue.gov_complaint_id}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-textMuted mb-6 leading-relaxed">
                      Generate a formal, legally structured complaint letter optimized for the appropriate municipal authority automatically using our AI engine.
                    </p>
                    {!govDraft ? (
                      <button 
                        onClick={handleGenerateDraft}
                        disabled={actionLoading}
                        className="glass-button bg-accent/10 hover:bg-accent/20 text-accent border-accent/50 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" /> Generate Official Draft
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-surface/50 border border-borderLight p-4 rounded-xl text-sm text-textMuted whitespace-pre-wrap font-serif">
                          <strong>Subject: {govDraft.subject}</strong><br/><br/>
                          {govDraft.body}
                        </div>
                        
                        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
                          <h4 className="text-primary font-bold text-sm mb-2">Track Filing & Earn 15 pts</h4>
                          <p className="text-xs text-textMuted mb-3">Copy this letter, file it on the official portal for {govDraft.authority}, and paste the Ticket ID below. Our AI Browser Agent will verify it instantly.</p>
                          <form onSubmit={handleRpaSubmit} className="flex gap-2">
                            <input 
                              type="text" 
                              value={complaintId}
                              onChange={e => setComplaintId(e.target.value)}
                              placeholder="e.g. MCD-12345" 
                              className="flex-1 bg-background border border-borderLight rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                              required
                            />
                            <button disabled={rpaLoading} type="submit" className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                              {rpaLoading ? 'Verifying...' : 'Verify Filing'}
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="glass-panel p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Community Discussion
            </h3>
            
            <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
              <input 
                type="text" 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-surface border border-borderLight rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors placeholder:text-textMuted/50"
              />
              <button disabled={actionLoading} type="submit" className="glass-button bg-surface px-6 rounded-xl text-white font-medium hover:bg-primary/20 hover:text-primary transition-all disabled:opacity-50">
                Post
              </button>
            </form>

            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className={cn("p-4 rounded-xl border", comment.user_id ? "bg-surface border-borderLight" : "bg-primary/10 border-primary/30")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-white">
                      {comment.user_name || 'System Auto-Log'}
                    </span>
                    <span className="text-xs text-textMuted">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className={cn("text-sm", comment.user_id ? "text-textMuted" : "text-primary/80")}>
                    {comment.text}
                  </p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-textMuted italic text-center py-4">No comments yet. Be the first to start the discussion!</p>}
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Actions Card */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">Community Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleVerify}
                disabled={actionLoading}
                className="w-full glass-button bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 py-3 rounded-xl flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" /> Verify Issue (+5 pts)
              </button>
              
              <button 
                onClick={handleUpvote}
                disabled={actionLoading}
                className="w-full glass-button bg-surface hover:bg-surfaceHover text-white border-borderLight py-3 rounded-xl flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                <Send className="w-5 h-5" /> Upvote to Escalate
              </button>
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">Impact Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/50 border border-borderLight rounded-2xl p-4 text-center shadow-inner">
                <div className="text-3xl font-bold text-white mb-1">{issue.upvotes}</div>
                <div className="text-xs text-textMuted">Upvotes</div>
              </div>
              <div className="bg-surface/50 border border-borderLight rounded-2xl p-4 text-center shadow-inner">
                <div className="text-3xl font-bold text-success mb-1">{issue.verifications}</div>
                <div className="text-xs text-success/80">Verifications</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
