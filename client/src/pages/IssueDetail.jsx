import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Utils } from '../utils';

export default function IssueDetail() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Government filing state
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [govAuth, setGovAuth] = useState('');
  const [govComplaintId, setGovComplaintId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [filingLoading, setFilingLoading] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    API.getIssue(id)
      .then(res => {
        setIssue(res);
        setGovAuth(res.gov_authority || 'Municipal Corporation');
      })
      .catch(err => showToast('error', 'Failed to load issue', err.message))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleUpvote = async () => {
    if (!isLoggedIn) return showToast('warning', 'Please log in to upvote');
    try {
      const res = await API.upvoteIssue(id);
      setIssue(prev => ({
        ...prev,
        upvotes: res.upvotes,
        userUpvoted: res.upvoted
      }));
      showToast('success', res.upvoted ? 'Upvoted! (+1 pt)' : 'Upvote removed');
    } catch (e) {
      showToast('error', 'Upvote failed', e.message);
    }
  };

  const handleVerify = async () => {
    if (!isLoggedIn) return showToast('warning', 'Please log in to verify');
    try {
      const res = await API.verifyIssue(id);
      setIssue(prev => ({
        ...prev,
        verifications: res.verifications,
        userVerified: true
      }));
      showToast('success', 'Verified! (+5 pts)', 'Thank you for confirming this issue on-site');
    } catch (e) {
      showToast('error', 'Verification failed', e.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await API.addComment(id, commentText);
      setIssue(prev => ({
        ...prev,
        comments: [...(prev.comments || []), comment]
      }));
      setCommentText('');
      showToast('success', 'Comment posted! (+2 pts)');
    } catch (e) {
      showToast('error', 'Comment failed', e.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleOpenDossier = async () => {
    try {
      const d = await API.getGovDraft(id, govAuth);
      setDraft(d);
      setShowFilingModal(true);
    } catch (e) {
      showToast('error', 'Failed to generate draft', e.message);
    }
  };

  const handleSubmitGovFiling = async (e) => {
    e.preventDefault();
    if (!govAuth || !govComplaintId || !screenshotFile) {
      return showToast('warning', 'Authority, Complaint ID, and Screenshot receipt are all required');
    }

    setFilingLoading(true);
    try {
      const formData = new FormData();
      formData.append('gov_authority', govAuth);
      formData.append('gov_complaint_id', govComplaintId);
      formData.append('screenshot', screenshotFile);

      const updated = await API.fileGovGrievance(id, formData);
      setIssue(updated);
      setShowFilingModal(false);
      showToast('success', 'Escalation Verified! (+15 pts)', 'Gemini Vision confirmed the filing receipt.');
    } catch (e) {
      showToast('error', 'Filing verification failed', e.message);
    } finally {
      setFilingLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!issue) return <div className="container" style={{ padding: 'var(--space-8)' }}>Issue not found</div>;

  const cat = Utils.getCategoryInfo(issue.category);
  const statusInfo = Utils.getStatusInfo(issue.status);

  return (
    <div className="container" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '960px' }}>
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
          <div>
            <span className={`badge ${cat.badgeClass}`} style={{ marginRight: '8px' }}>{cat.label}</span>
            <span className={`status-pill ${statusInfo.cssClass}`}>{statusInfo.label}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{Utils.formatDate(issue.created_at)}</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{issue.title}</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 'var(--space-4)' }}>
          📍 {issue.address || 'Location Coordinates'} · Reported by <strong>{issue.reporter_name}</strong>
        </p>

        {issue.image_url && (
          <div style={{ marginBottom: 'var(--space-4)', maxHeight: '380px', overflow: 'hidden', borderRadius: '8px' }}>
            <img src={issue.image_url} alt={issue.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>{issue.description}</p>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-4)' }}>
          <button className={`btn btn-sm ${issue.userUpvoted ? 'btn-primary' : 'btn-secondary'}`} onClick={handleUpvote}>
            👍 Upvote ({issue.upvotes})
          </button>
          <button className={`btn btn-sm ${issue.userVerified ? 'btn-primary' : 'btn-secondary'}`} onClick={handleVerify} disabled={issue.userVerified}>
            👁️ {issue.userVerified ? 'Verified by You' : `Verify (${issue.verifications})`}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={handleOpenDossier}>
            🏛️ Escalate to Government
          </button>
        </div>
      </div>

      {/* Escalation Modal */}
      {showFilingModal && (
        <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ background: 'white', padding: 'var(--space-6)', borderRadius: '12px', maxWidth: '540px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Official Grievance Escalation</h3>
            {draft && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto' }}>
                <strong>Subject:</strong> {draft.subject}<br /><br />
                {draft.body}
              </div>
            )}

            <form onSubmit={handleSubmitGovFiling}>
              <div className="form-group">
                <label className="form-label">Authority</label>
                <input type="text" className="form-input" value={govAuth} onChange={e => setGovAuth(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Government Complaint ID / Ticket No.</label>
                <input type="text" className="form-input" placeholder="e.g. MCD-2026-X8392" value={govComplaintId} onChange={e => setGovComplaintId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Screenshot of Filing Receipt (Verified via Gemini Vision)</label>
                <input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files[0])} required />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFilingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={filingLoading}>
                  {filingLoading ? 'Verifying with Vision AI...' : 'Verify & Submit (+15 pts)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginTop: 0 }}>Community Discussion</h3>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <strong>{c.user_name || 'Community Member'}</strong>
                  <span>{Utils.relativeTime(c.created_at)}</span>
                </div>
                <div style={{ fontSize: '14px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{c.text}</div>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No comments yet. Be the first to share an update!</p>
          )}
        </div>

        {isLoggedIn ? (
          <form onSubmit={handleAddComment}>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Leave an update or comment (+2 pts)..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment} style={{ marginTop: '8px' }}>
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748b' }}>Please log in to participate in the discussion.</p>
        )}
      </div>
    </div>
  );
}
