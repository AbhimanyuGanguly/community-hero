// ============================================
// Community Hero — Issue Detail Page
// ============================================

function renderIssueDetailPage(issueId) {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="detail-page"><div class="container detail-container"><div class="page-loader"><div class="spinner"></div></div></div></div>`;

  loadIssueDetail(issueId);
}

function getLocationAuthority(address, baseAuth) {
  if (!address) return baseAuth;
  const lowerAddr = address.toLowerCase();
  
  if (lowerAddr.includes('greater noida')) {
    return { name: 'Greater Noida Authority', portal: 'https://jansunwai.up.nic.in/', email: 'ceo@gnida.in' };
  } else if (lowerAddr.includes('noida')) {
    return { name: 'Noida Authority', portal: 'https://noidaforcitizens.com/', email: 'noida@noidaauthorityonline.com' };
  } else if (lowerAddr.includes('ghaziabad')) {
    return { name: 'Ghaziabad Nagar Nigam', portal: 'https://ghaziabad.nic.in/en/service/jansunwai/', email: 'dmgha@nic.in' };
  } else if (lowerAddr.includes('faridabad')) {
    return { name: 'Municipal Corporation Faridabad', portal: 'https://grs.ulbharyana.gov.in/', email: 'complaints.mcf@gmail.com' };
  } else if (lowerAddr.includes('gurgaon') || lowerAddr.includes('gurugram')) {
    return { name: 'Municipal Corporation Gurugram', portal: 'https://mcg.gov.in/', email: 'info@mcg.gov.in' };
  } else if (lowerAddr.includes('new delhi')) {
    return { name: 'New Delhi Municipal Council (NDMC)', portal: 'https://www.ndmc.gov.in/complaints.aspx', email: baseAuth.email };
  }
  
  return baseAuth; // Default to category-based Delhi details
}

async function loadIssueDetail(issueId) {
  const container = document.querySelector('.detail-container');

  try {
    const issue = await API.getIssue(issueId);
    const cat = Utils.getCategoryInfo(issue.category);
    const status = Utils.getStatusInfo(issue.status);
    const sev = Utils.getSeverityInfo(issue.severity);

    const authorityMap = {
      pothole: { name: 'PWD Delhi / MCD', portal: 'https://mcdonline.nic.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      water: { name: 'Delhi Jal Board (DJB)', portal: 'https://delhijalboard.delhi.gov.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      streetlight: { name: 'MCD / BSES Rajdhani Power', portal: 'https://mcdonline.nic.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      waste: { name: 'MCD Sanitation Dept.', portal: 'https://mcdonline.nic.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      road: { name: 'PWD Delhi (Road Wing)', portal: 'https://pwd.delhi.gov.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      infrastructure: { name: 'MCD / DDA Maintenance', portal: 'https://dda.gov.in/', email: 'mcd-ithelpdesk@mcd.nic.in' },
      other: { name: 'Delhi Government PGMS', portal: 'https://pgms.delhi.gov.in/', email: 'mcd-ithelpdesk@mcd.nic.in' }
    };
    let authInfo = authorityMap[issue.category] || authorityMap['other'];
    authInfo = getLocationAuthority(issue.address, authInfo);
    const isGovFiled = !!issue.gov_filed;

    const statusSteps = ['reported', 'verified', 'in_progress', 'resolved'];
    const currentStepIdx = statusSteps.indexOf(issue.status);

    container.innerHTML = `
      <div class="animate-fade-in-up">
        <!-- Print-only header -->
        <div class="print-header">
          <h2 class="print-header-title">Community Hero</h2>
          <p class="print-header-subtitle">Official Public Grievance Dossier — Generated on ${Utils.formatDate(new Date().toISOString())}</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <a class="detail-back" onclick="history.back()" style="cursor: pointer;">← Back to Issues</a>
          ${Auth.getUser()?.id === issue.reported_by ? `<button class="btn btn-ghost btn-sm" style="color: var(--color-error);" onclick="handleDeleteIssue('${issue.id}')">🗑️ Delete Report</button>` : ''}
        </div>

        <div class="detail-grid">
          <!-- Main Column -->
          <div class="detail-main">
            ${issue.image_url ? `
              <div class="detail-image-gallery">
                ${issue.image_url.match(/\.(mp4|mov|webm|ogg)$/i) ? 
                  `<video src="${issue.image_url}" controls style="width: 100%; max-height: 400px; object-fit: contain; background: #000; border-radius: var(--radius-lg);"></video>` : 
                  `<img src="${issue.image_url}" alt="${Utils.escapeHtml(issue.title)}">`}
              </div>
            ` : ''}

            <h1 class="detail-title">${Utils.escapeHtml(issue.title)}</h1>

            <div class="detail-meta">
              <span class="badge ${cat.badgeClass}">${cat.icon} ${cat.label}</span>
              <span class="status-pill ${status.cssClass}">${status.label}</span>
              <span style="color: ${sev.color}; font-size: var(--text-sm); font-weight: 600;">● ${sev.label} Severity</span>
              ${issue.ai_confidence ? `
                <span class="badge badge-purple">AI ${Math.round(issue.ai_confidence * 100)}%</span>
              ` : ''}
              ${isGovFiled ? `
                <span class="badge badge-blue"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/></svg>Govt Filed</span>
              ` : ''}
            </div>

            <p class="detail-description">${Utils.escapeHtml(issue.description)}</p>

            <!-- Actions -->
            <div class="detail-actions">
              <button class="upvote-btn ${issue.userUpvoted ? 'active' : ''}" id="detail-upvote" onclick="handleUpvote('${issue.id}')">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; margin-right:4px; display:inline-block; vertical-align:middle;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>Upvote <span id="upvote-count">${issue.upvotes}</span>
              </button>
              <button class="btn btn-secondary btn-sm" id="detail-verify" onclick="handleVerify('${issue.id}')" ${issue.userVerified ? 'disabled' : ''}>
                ${issue.userVerified ? '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>Verified' : '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>I\'ve Seen This'}
                <span id="verify-count">(${issue.verifications})</span>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(window.location.href); Utils.toast('success', 'Link copied!')">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>Share
              </button>
            </div>

            <!-- Status Update (for author only) -->
            ${Auth.getUser()?.id === issue.reported_by && issue.status !== 'resolved' ? `
              <div style="margin-bottom: var(--space-6); padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                <h4 style="font-size: var(--text-base); font-weight: var(--font-bold); margin-bottom: var(--space-2);">Is this problem resolved?</h4>
                <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4);">As the author of this report, you can close this issue once the municipal authorities have fixed it.</p>
                <button class="btn btn-primary btn-sm" onclick="handleStatusUpdate('${issue.id}', 'resolved')" style="background: var(--color-emerald); border-color: var(--color-emerald);">
                  <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; margin-right:4px; display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>
                  Yes, Mark as Resolved
                </button>
              </div>
            ` : ''}

            <!-- Comments -->
            <div>
              <div class="detail-comments-header">
                <h3 style="font-size: var(--text-lg);">💬 Comments (${issue.comments.length})</h3>
              </div>

              ${Auth.isLoggedIn() ? `
                <div class="comment-form">
                  <div class="avatar avatar-sm" style="background: ${Utils.getAvatarColor(Auth.getUser()?.name)}">${Utils.getInitials(Auth.getUser()?.name)}</div>
                  <textarea id="comment-input" placeholder="Add a comment..." rows="1"></textarea>
                  <button class="btn btn-primary btn-sm" onclick="handleComment('${issue.id}')">Post</button>
                </div>
              ` : '<p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-bottom: var(--space-4);"><a href="#login">Log in</a> to comment</p>'}

              <div id="comments-list">
                ${issue.comments.length === 0 ? '<p style="color: var(--color-text-tertiary); font-size: var(--text-sm);">No comments yet. Be the first!</p>' : ''}
                ${issue.comments.map(c => `
                  <div class="comment">
                    <div class="avatar avatar-sm" style="background: ${Utils.getAvatarColor(c.user_name)}">${Utils.getInitials(c.user_name)}</div>
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">${Utils.escapeHtml(c.user_name)}</span>
                        <span class="comment-time">${Utils.relativeTime(c.created_at)}</span>
                      </div>
                      <p class="comment-text">${Utils.escapeHtml(c.text)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-sidebar">
            <!-- Status Timeline -->
            <div class="card">
              <h4 style="font-size: var(--text-base); margin-bottom: var(--space-4);">Status Timeline</h4>
              <div class="timeline">
                ${statusSteps.map((s, i) => {
      const si = Utils.getStatusInfo(s);
      const isCompleted = i < currentStepIdx;
      const isActive = i === currentStepIdx;
      const cls = isCompleted ? 'completed' : (isActive ? 'active' : '');
      return `
                    <div class="timeline-item ${cls}">
                      <div class="timeline-dot">${si.icon}</div>
                      <div class="timeline-content">
                        <div class="timeline-title">${si.label}</div>
                        ${isCompleted || isActive ? `<div class="timeline-time">${Utils.relativeTime(issue.created_at)}</div>` : ''}
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>

            <!-- Government Escalation Panel -->
            ${isGovFiled ? `
              <div class="card gov-card printed-dossier-meta">
                <div class="gov-badge-group">
                  <span class="gov-status filed"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/></svg>Govt Filed</span>
                  <span class="gov-authority-badge">${Utils.escapeHtml(issue.gov_authority)}</span>
                </div>
                <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3);">
                  This issue has been escalated to the government portal.
                </div>
                <div class="gov-meta-row">
                  <span>Authority</span>
                  <strong>${Utils.escapeHtml(issue.gov_authority)}</strong>
                </div>
                <div class="gov-meta-row">
                  <span>Complaint Ref ID</span>
                  <strong><code>${Utils.escapeHtml(issue.gov_complaint_id)}</code></strong>
                </div>
                <div class="gov-meta-row">
                  <span>Filed On</span>
                  <strong>${Utils.formatDate(issue.gov_filed_at)}</strong>
                </div>
                
                <button class="gov-action-btn btn-dossier" style="margin-top: var(--space-3); width: 100%;" onclick="window.print()">
                  Print Grievance Dossier
                </button>
              </div>
            ` : `
              <div class="card gov-card" id="gov-escalation-panel">
                <div class="gov-badge-group">
                  <span class="gov-status not-filed"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; margin-right:4px; display:inline-block; vertical-align:middle;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>Pending Escalation</span>
                  <span class="gov-authority-badge">${Utils.escapeHtml(authInfo.name)}</span>
                </div>
                <h4 class="gov-authority-name">Escalate to Government</h4>
                <p class="gov-help-text">
                  Help get this resolved. Use our AI to draft a formal grievance and file it on the official government portal.
                </p>
                
                <button class="gov-action-btn btn-escalate" onclick="triggerGrievanceDraft('${issue.id}')">
                  📄 Get AI Grievance Draft
                </button>
                
                <button class="gov-action-btn btn-dossier" onclick="window.print()">
                  🖨️ Print Grievance Dossier
                </button>

                <div class="gov-link-list">
                  <span style="font-weight: 600; font-size: var(--text-xs); color: var(--color-text-primary);">Official Grievance Portals:</span>
                  <a href="${authInfo.portal}" target="_blank" rel="noopener noreferrer" class="gov-portal-link">🌐 File on ${Utils.escapeHtml(authInfo.name)} Portal ↗</a>
                  <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" class="gov-portal-link">🌐 National PGPortal.gov.in ↗</a>
                </div>

                ${Auth.isLoggedIn() ? `
                  <div style="margin-top: var(--space-3); border-top: 1px solid var(--color-border-light); padding-top: var(--space-3); text-align: left;">
                    <a href="javascript:void(0)" onclick="toggleFilingForm()" id="toggle-filing-link" style="font-size: var(--text-xs); font-weight: 600; color: var(--color-purple); text-decoration: none;">
                      ✍️ Already filed? Enter Complaint ID
                    </a>
                    <div id="gov-filing-form" style="display: none; margin-top: var(--space-3);">
                      <div style="margin-bottom: var(--space-2);">
                        <label class="form-label" style="font-size: var(--text-xs); margin-bottom: 2px;">Filing Authority</label>
                        <input type="text" class="form-input form-input-sm" id="input-gov-auth" style="width:100%;" value="${Utils.escapeHtml(authInfo.name)}">
                      </div>
                      <div style="margin-bottom: var(--space-3);">
                        <label class="form-label" style="font-size: var(--text-xs); margin-bottom: 2px;">Complaint ID / Ticket No.</label>
                        <input type="text" class="form-input form-input-sm" id="input-gov-id" style="width:100%;" placeholder="e.g. MCD-2026-X8392">
                      </div>
                      <button class="btn btn-primary btn-sm btn-ripple" style="width:100%; background: var(--color-purple); border-color: var(--color-purple);" onclick="submitGovFiling('${issue.id}')">
                        Record & Earn +15 pts
                      </button>
                    </div>
                  </div>
                ` : `
                  <div style="margin-top: var(--space-2); font-size: var(--text-xs); text-align: center; color: var(--color-text-tertiary);">
                    <a href="#login">Log in</a> to mark as filed and earn points.
                  </div>
                `}
              </div>
            `}

            <!-- Location -->
            <div class="card card-sm">
              <h4 style="font-size: var(--text-base); margin-bottom: var(--space-3);">Location</h4>
              <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3);">${Utils.escapeHtml(issue.address || 'Location marked on map')}</p>
              <div class="detail-map" id="detail-map"></div>
            </div>

            <!-- Info -->
            <div class="card card-sm">
              <h4 style="font-size: var(--text-base); margin-bottom: var(--space-3);">Details</h4>
              <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">
                <div class="flex justify-between" style="margin-bottom: 8px;"><span>Reported by</span><strong>${Utils.escapeHtml(issue.reporter_name)}</strong></div>
                <div class="flex justify-between" style="margin-bottom: 8px;"><span>Reported</span><strong>${Utils.formatDate(issue.created_at)}</strong></div>
                <div class="flex justify-between" style="margin-bottom: 8px;"><span>Upvotes</span><strong>${issue.upvotes}</strong></div>
                <div class="flex justify-between"><span>Verifications</span><strong>${issue.verifications}</strong></div>
              </div>
            </div>

            <!-- Verifiers -->
            ${issue.verifiers && issue.verifiers.length > 0 ? `
              <div class="card card-sm">
                <h4 style="font-size: var(--text-base); margin-bottom: var(--space-3);">Verified By</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${issue.verifiers.map(v => `
                    <span class="badge badge-blue">${Utils.escapeHtml(v.user_name)}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Print-only metadata table -->
        <table class="print-metadata-table">
          <thead>
            <tr>
              <th colspan="2" style="text-align: center; font-size: 12pt;">CIVIC DOSSIER SPECIFICATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style="width: 30%;">Title of Grievance</th>
              <td>${Utils.escapeHtml(issue.title)}</td>
            </tr>
            <tr>
              <th>Issue Category</th>
              <td>${cat.label}</td>
            </tr>
            <tr>
              <th>Status of Report</th>
              <td>${status.label}</td>
            </tr>
            <tr>
              <th>Assessed Severity</th>
              <td>${sev.label}</td>
            </tr>
            <tr>
              <th>Coordinates</th>
              <td>Latitude: ${issue.lat}, Longitude: ${issue.lng}</td>
            </tr>
            <tr>
              <th>Reported Site Address</th>
              <td>${Utils.escapeHtml(issue.address || 'Not specified')}</td>
            </tr>
            <tr>
              <th>Community Support</th>
              <td>Upvoted by ${issue.upvotes} residents, verified by ${issue.verifications} independent citizens</td>
            </tr>
            <tr>
              <th>Report Source</th>
              <td>Filed by ${Utils.escapeHtml(issue.reporter_name)} on ${Utils.formatDate(issue.created_at)}</td>
            </tr>
            ${issue.gov_filed ? `
            <tr>
              <th>Escalated Authority</th>
              <td>${Utils.escapeHtml(issue.gov_authority)}</td>
            </tr>
            <tr>
              <th>Official Reference ID</th>
              <td>${Utils.escapeHtml(issue.gov_complaint_id)}</td>
            </tr>
            <tr>
              <th>Date Escalated</th>
              <td>${Utils.formatDate(issue.gov_filed_at)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- Print-only watermark -->
        <div class="print-watermark">
          This dossier was generated from the Community Hero hyperlocal citizen platform. Verify authentic records at: ${window.location.origin}/#issue/${issue.id}
        </div>
        
        <!-- AI Grievance Draft Modal (backdrop hidden by default) -->
        <div class="modal-backdrop" id="gov-draft-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
          <div class="modal animate-scale-in" style="max-width: 650px; width: 90%; background: #ffffff; border-radius: var(--radius-2xl); padding: var(--space-6); box-shadow: var(--shadow-2xl); max-height: 90vh; overflow-y: auto; text-align: left;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border-light); padding-bottom: var(--space-3); width: 100%;">
              <h3 class="modal-title" style="margin: 0; font-size: var(--text-lg); display: flex; align-items: center; gap: 8px;">AI Grievance Draft</h3>
              <button class="modal-close" onclick="closeGovDraftModal()" style="border: none; background: transparent; cursor: pointer; font-size: 1.5rem; color: var(--color-text-tertiary); padding: 0; line-height: 1;">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: var(--space-4); line-height: 1.4;">
                This official draft letter was custom-generated by Community Hero's AI. It includes GPS coordinates and community voting stats. Copy it to file on the official portal, or email it directly.
              </p>
              
              <div style="margin-bottom: var(--space-3);">
                <label class="form-label" style="font-weight: 600; font-size: var(--text-xs); display: block; margin-bottom: 4px;">Target Department</label>
                <input type="text" class="form-input form-input-sm" id="gov-draft-authority" style="width: 100%; font-size: var(--text-sm);" readonly>
              </div>
              
              <div style="margin-bottom: var(--space-3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="font-weight: 600; font-size: var(--text-xs); margin: 0;">Subject Line</label>
                  <button class="btn btn-ghost btn-xs" onclick="copyDraftSubject()" style="padding: 2px 6px; font-size: 10px;">Copy Subject</button>
                </div>
                <input type="text" class="form-input form-input-sm" id="gov-draft-subject" style="width: 100%; font-weight: 600; font-size: var(--text-sm);" readonly>
              </div>
              
              <div style="margin-bottom: var(--space-4);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="font-weight: 600; font-size: var(--text-xs); margin: 0;">Formal Grievance Letter Body</label>
                  <button class="btn btn-ghost btn-xs" onclick="copyDraftBody()" style="padding: 2px 6px; font-size: 10px;">Copy Letter Body</button>
                </div>
                <textarea class="form-input" id="gov-draft-body" style="width: 100%; height: 220px; font-family: monospace; font-size: var(--text-xs); padding: var(--space-3); line-height: 1.5; resize: vertical;" readonly></textarea>
              </div>
              
              <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--color-border-light); padding-top: var(--space-4);">
                <a class="btn btn-secondary btn-sm" id="gov-email-btn" href="#" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">Email Department</a>
                <a class="btn btn-primary btn-sm" id="gov-redirect-btn" href="${authInfo.portal}" target="_blank" rel="noopener noreferrer" onclick="closeGovDraftModal()" style="text-decoration: none; background: var(--color-purple); border-color: var(--color-purple);">Go to Filing Portal</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mini map
    setTimeout(() => {
      const map = L.map('detail-map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([issue.lat, issue.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);
      L.marker([issue.lat, issue.lng], { icon: Utils.createMarkerIcon(issue.category) }).addTo(map);
    }, 100);

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px; height:48px; opacity:0.5; display:inline-block;"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
        </div>
        <h3 class="empty-state-title">Issue not found</h3>
        <p class="empty-state-text">${err.message}</p>
        <a href="#tracker" class="btn btn-primary">Browse Issues</a>
      </div>
    `;
  }
}

// Action handlers
window.handleUpvote = async function (issueId) {
  if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
  try {
    const result = await API.upvoteIssue(issueId);
    document.getElementById('upvote-count').textContent = result.upvotes;
    const btn = document.getElementById('detail-upvote');
    btn.classList.toggle('active', result.upvoted);
    Utils.toast('success', result.upvoted ? 'Upvoted! +1 pt' : 'Upvote removed');
  } catch (err) { Utils.toast('error', 'Failed', err.message); }
};

window.handleVerify = async function (issueId) {
  if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
  try {
    const result = await API.verifyIssue(issueId);
    document.getElementById('verify-count').textContent = `(${result.verifications})`;
    const btn = document.getElementById('detail-verify');
    btn.disabled = true;
    btn.innerHTML = '✅ Verified (' + result.verifications + ')';
    Utils.toast('success', 'Verified! +5 pts', 'Thank you for confirming this issue');
  } catch (err) { Utils.toast('error', 'Failed', err.message); }
};

window.handleStatusUpdate = async function (issueId, status) {
  if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
  try {
    await API.updateIssueStatus(issueId, status);
    Utils.toast('success', 'Status Updated', `Issue marked as ${Utils.getStatusInfo(status).label}`);
    renderIssueDetailPage(issueId);
  } catch (err) { Utils.toast('error', 'Failed', err.message); }
};

window.handleComment = async function (issueId) {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;

  try {
    const comment = await API.addComment(issueId, text);
    input.value = '';

    const list = document.getElementById('comments-list');
    // Remove "no comments" message if present
    const noComments = list.querySelector('p');
    if (noComments && noComments.textContent.includes('No comments')) noComments.remove();

    list.insertAdjacentHTML('beforeend', `
      <div class="comment animate-fade-in-up">
        <div class="avatar avatar-sm" style="background: ${Utils.getAvatarColor(comment.user_name)}">${Utils.getInitials(comment.user_name)}</div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${Utils.escapeHtml(comment.user_name)}</span>
            <span class="comment-time">just now</span>
          </div>
          <p class="comment-text">${Utils.escapeHtml(comment.text)}</p>
        </div>
      </div>
    `);

    Utils.toast('success', 'Comment added! +2 pts');
  } catch (err) { Utils.toast('error', 'Failed', err.message); }
};

window.toggleFilingForm = function () {
  const form = document.getElementById('gov-filing-form');
  const link = document.getElementById('toggle-filing-link');
  if (form.style.display === 'none') {
    form.style.display = 'block';
    link.textContent = '✕ Cancel filing entry';
  } else {
    form.style.display = 'none';
    link.textContent = '✍️ Already filed? Enter Complaint ID';
  }
};

window.closeGovDraftModal = function () {
  document.getElementById('gov-draft-modal').style.display = 'none';
};

window.copyDraftSubject = function () {
  const subjectEl = document.getElementById('gov-draft-subject');
  navigator.clipboard.writeText(subjectEl.value);
  Utils.toast('success', 'Subject copied to clipboard');
};

window.copyDraftBody = function () {
  const bodyEl = document.getElementById('gov-draft-body');
  navigator.clipboard.writeText(bodyEl.value);
  Utils.toast('success', 'Letter body copied to clipboard');
};

window.handleDeleteIssue = function(issueId) {
  Utils.confirm(
    'Delete Report?',
    'Are you sure you want to permanently delete this report? This action cannot be undone.',
    async () => {
      try {
        await API.deleteIssue(issueId);
        Utils.toast('success', 'Report deleted successfully');
        window.location.hash = '#tracker';
      } catch (err) {
        Utils.toast('error', 'Failed to delete report', err.message);
      }
    }
  );
};

window.triggerGrievanceDraft = async function(issueId) {
  Utils.toast('info', 'Generating Grievance Letter', 'AI is drafting a formal complaint for you...');
  try {
    const issue = await API.getIssue(issueId);
    const authorityMap = {
      pothole: { name: 'PWD Delhi / MCD', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://mcdonline.nic.in' },
      water: { name: 'Delhi Jal Board (DJB)', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://delhijalboard.nic.in' },
      streetlight: { name: 'MCD / BSES Rajdhani Power', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://mcdonline.nic.in' },
      waste: { name: 'MCD Sanitation Dept.', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://mcdonline.nic.in' },
      road: { name: 'PWD Delhi (Road Wing)', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://pwd.delhi.gov.in' },
      infrastructure: { name: 'MCD / DDA Maintenance', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://mcdonline.nic.in' },
      other: { name: 'Delhi Government PGMS', email: 'mcd-ithelpdesk@mcd.nic.in', portal: 'https://pgms.delhi.gov.in' }
    };
    
    let baseAuth = authorityMap[issue.category] || authorityMap['other'];
    const authInfo = getLocationAuthority(issue.address, baseAuth);

    const draft = await API.getGovDraft(issueId, authInfo.name);

    document.getElementById('gov-draft-authority').value = authInfo.name;
    document.getElementById('gov-draft-subject').value = draft.subject;
    document.getElementById('gov-draft-body').value = draft.body;
    document.getElementById('gov-redirect-btn').href = authInfo.portal;

    const mailto = `mailto:${authInfo.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    document.getElementById('gov-email-btn').href = mailto;

    const modal = document.getElementById('gov-draft-modal');
    modal.style.display = 'flex';
  } catch (err) {
    Utils.toast('error', 'Generation Failed', err.message);
  }
};

window.submitGovFiling = async function (issueId) {
  const authority = document.getElementById('input-gov-auth').value.trim();
  const idInput = document.getElementById('input-gov-id');
  const complaintId = idInput.value.trim();

  if (!authority) {
    Utils.toast('warning', 'Filing Authority is required');
    return;
  }
  if (!complaintId) {
    Utils.toast('warning', 'Complaint reference ID is required');
    return;
  }

  try {
    const updated = await API.fileGovGrievance(issueId, authority, complaintId);
    Utils.toast('success', 'Civic Escalation Logged!', '+15 points awarded to your account');

    renderIssueDetailPage(issueId);
  } catch (err) {
    Utils.toast('error', 'Filing record failed', err.message);
  }
};

window.renderIssueDetailPage = renderIssueDetailPage;
