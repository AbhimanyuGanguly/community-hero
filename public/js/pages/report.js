// ============================================
// Community Hero — Report Issue Page
// ============================================

let reportState = {
  step: 1,
  title: '',
  description: '',
  category: '',
  severity: 'medium',
  images: [],
  imageFiles: [],
  lat: 28.6139,
  lng: 77.2090,
  address: '',
  aiSuggestion: null,
  miniMap: null,
  marker: null
};

function renderReportPage() {
  if (!Auth.isLoggedIn()) {
    window.location.hash = '#login';
    Utils.toast('warning', 'Login Required', 'Please log in to report an issue');
    return;
  }

  reportState = { ...reportState, step: 1, title: '', description: '', category: '', severity: 'medium', images: [], imageFiles: [], address: '', aiSuggestion: null, miniMap: null, marker: null };

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="report-page">
      <div class="container report-container">
        <div class="section-header text-center" style="margin-bottom: var(--space-6);">
          <h2 class="section-title">Report an Issue</h2>
          <p class="section-subtitle" style="margin: 0 auto;">Help your community by reporting local problems</p>
        </div>

        <!-- Progress Steps -->
        <div class="steps" id="report-steps">
          <div class="step active"><span class="step-number">1</span><span class="step-label">Details</span></div>
          <div class="step"><span class="step-number">2</span><span class="step-label">Media</span></div>
          <div class="step"><span class="step-number">3</span><span class="step-label">Location</span></div>
          <div class="step"><span class="step-number">4</span><span class="step-label">Review</span></div>
        </div>

        <div id="report-step-content"></div>
      </div>
    </div>
  `;

  renderReportStep(1);
}

function renderReportStep(step) {
  reportState.step = step;
  updateReportSteps();

  const container = document.getElementById('report-step-content');
  if (!container) return;

  switch (step) {
    case 1: renderStep1(container); break;
    case 2: renderStep2(container); break;
    case 3: renderStep3(container); break;
    case 4: renderStep4(container); break;
  }
}

function updateReportSteps() {
  const steps = document.querySelectorAll('#report-steps .step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'completed');
    if (i + 1 < reportState.step) s.classList.add('completed');
    if (i + 1 === reportState.step) s.classList.add('active');
  });
}

// Step 1: Details
function renderStep1(container) {
  container.innerHTML = `
    <div class="report-step-content animate-fade-in-up">
      <h3 class="report-step-title">Issue Details</h3>
      <p class="report-step-desc">What's the problem? Describe it clearly so others can help.</p>

      <div class="form-group">
        <label class="form-label" for="report-title">Title <span class="required">*</span></label>
        <input type="text" class="form-input" id="report-title" placeholder="e.g. Large pothole on MG Road" value="${Utils.escapeHtml(reportState.title)}" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="report-desc">Description <span class="required">*</span></label>
        <textarea class="form-textarea" id="report-desc" placeholder="Describe the issue in detail — size, impact, how long it's been there..." rows="4">${Utils.escapeHtml(reportState.description)}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="report-category">Category</label>
        <select class="form-select" id="report-category">
          <option value="">Auto-detect with AI ✨</option>
          ${Object.entries(Utils.categoryConfig).map(([key, cat]) =>
            `<option value="${key}" ${reportState.category === key ? 'selected' : ''}>${cat.icon} ${cat.label}</option>`
          ).join('')}
        </select>
      </div>

      <div id="ai-suggestion-box"></div>

      <div class="form-group">
        <label class="form-label">Severity</label>
        <div class="severity-slider">
          <input type="range" id="report-severity" min="0" max="3" step="1"
            value="${['low','medium','high','critical'].indexOf(reportState.severity)}">
          <div class="severity-labels">
            <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
          </div>
        </div>
      </div>

      <div class="report-nav">
        <span></span>
        <button class="btn btn-primary" id="step1-next">Next: Add Photos →</button>
      </div>
    </div>
  `;

  // AI auto-suggestion on description change
  const descInput = document.getElementById('report-desc');
  const titleInput = document.getElementById('report-title');

  const triggerAI = Utils.debounce(async () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    if (desc.length < 20) return;

    const box = document.getElementById('ai-suggestion-box');
    box.innerHTML = `<div class="ai-suggestion"><div class="ai-suggestion-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:var(--color-blue);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div><div class="ai-suggestion-label">AI Analyzing...</div><div class="ai-suggestion-text"><span class="loading-dots"><span></span><span></span><span></span></span></div></div></div>`;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', desc);
      const result = await API.analyzeIssue(formData);
      reportState.aiSuggestion = result;

      const catInfo = Utils.getCategoryInfo(result.category);
      const sevInfo = Utils.getSeverityInfo(result.severity);
      box.innerHTML = `
        <div class="ai-suggestion">
          <div class="ai-suggestion-icon">
            <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:var(--color-blue);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div class="ai-suggestion-label">AI Suggestion</div>
            <div class="ai-suggestion-text">
              Category: <strong>${catInfo.icon} ${catInfo.label}</strong> (${Math.round(result.confidence * 100)}% confidence)<br>
              Severity: <strong style="color:${sevInfo.color}">${sevInfo.label}</strong>
              ${result.summary ? `<br><em>${result.summary}</em>` : ''}
            </div>
          </div>
        </div>
      `;

      // Auto-fill category if not manually set
      const catSelect = document.getElementById('report-category');
      if (!catSelect.value) {
        catSelect.value = result.category;
        reportState.category = result.category;
      }
    } catch (err) {
      box.innerHTML = '';
    }
  }, 1000);

  descInput.addEventListener('input', triggerAI);
  titleInput.addEventListener('input', triggerAI);

  document.getElementById('step1-next').addEventListener('click', () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();

    if (!title) { Utils.toast('warning', 'Title required'); titleInput.focus(); return; }
    if (!desc) { Utils.toast('warning', 'Description required'); descInput.focus(); return; }

    reportState.title = title;
    reportState.description = desc;
    reportState.category = document.getElementById('report-category').value || (reportState.aiSuggestion?.category || 'other');
    const sevIdx = parseInt(document.getElementById('report-severity').value);
    reportState.severity = ['low', 'medium', 'high', 'critical'][sevIdx];

    renderReportStep(2);
  });
}

// Step 2: Media
function renderStep2(container) {
  container.innerHTML = `
    <div class="report-step-content animate-fade-in-up">
      <h3 class="report-step-title">Add Media</h3>
      <p class="report-step-desc">Upload photos or videos of the issue to help others understand the problem.</p>

      <div class="dropzone" id="report-dropzone">
        <div class="dropzone-icon">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="width:36px; height:36px; color:var(--color-text-tertiary);"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <div class="dropzone-text">Drag & drop media here, or <strong>click to browse</strong></div>
        <div class="dropzone-hint">Supports JPG, PNG, WebP, MP4, MOV, WEBM, OGG — Max 50MB per file</div>
      </div>
      <input type="file" id="report-file-input" accept="image/*,video/*" multiple style="display: none;">

      <div class="image-preview-grid" id="image-previews"></div>

      <div class="report-nav">
        <button class="btn btn-secondary" id="step2-back">← Back</button>
        <button class="btn btn-primary" id="step2-next">Next: Set Location →</button>
      </div>
    </div>
  `;

  renderImagePreviews();

  const dropzone = document.getElementById('report-dropzone');
  const fileInput = document.getElementById('report-file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  document.getElementById('step2-back').addEventListener('click', () => renderReportStep(1));
  document.getElementById('step2-next').addEventListener('click', () => renderReportStep(3));
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    if (reportState.imageFiles.length >= 5) { Utils.toast('warning', 'Max 5 files'); return; }

    reportState.imageFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      reportState.images.push({ src: e.target.result, type: file.type });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const grid = document.getElementById('image-previews');
  if (!grid) return;
  grid.innerHTML = reportState.images.map((media, i) => `
    <div class="image-preview-item">
      ${media.type.startsWith('video/') ? `<video src="${media.src}" autoplay muted loop style="width: 100%; height: 100%; object-fit: cover;"></video>` : `<img src="${media.src}" alt="Preview ${i + 1}">`}
      <button class="image-preview-remove" onclick="removeReportImage(${i})">✕</button>
    </div>
  `).join('');
}

window.removeReportImage = function(index) {
  reportState.images.splice(index, 1);
  reportState.imageFiles.splice(index, 1);
  renderImagePreviews();
};

// Step 3: Location
function renderStep3(container) {
  container.innerHTML = `
    <div class="report-step-content animate-fade-in-up">
      <h3 class="report-step-title">Issue Location</h3>
      <p class="report-step-desc">Drag the pin or use your current location to mark where the issue is.</p>

      <div class="report-map" id="report-mini-map"></div>

      <div class="flex gap-3" style="margin-bottom: var(--space-4);">
        <button class="btn btn-secondary flex-1" id="use-my-location">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; margin-right:6px; display:inline-block; vertical-align:middle;"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>Use My Location
        </button>
      </div>

      <div class="form-group">
        <label class="form-label" for="report-address">Address / Landmark</label>
        <input type="text" class="form-input" id="report-address" placeholder="e.g. Near Rajiv Chowk Metro Station" value="${Utils.escapeHtml(reportState.address)}">
      </div>

      <div class="flex gap-4" style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
        <span>Lat: <strong id="report-lat">${reportState.lat.toFixed(4)}</strong></span>
        <span>Lng: <strong id="report-lng">${reportState.lng.toFixed(4)}</strong></span>
      </div>

      <div class="report-nav">
        <button class="btn btn-secondary" id="step3-back">← Back</button>
        <button class="btn btn-primary" id="step3-next">Next: Review →</button>
      </div>
    </div>
  `;

  // Initialize mini map
  setTimeout(() => {
    const map = L.map('report-mini-map').setView([reportState.lat, reportState.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([reportState.lat, reportState.lng], { draggable: true }).addTo(map);
    reportState.miniMap = map;
    reportState.marker = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reportState.lat = pos.lat;
      reportState.lng = pos.lng;
      document.getElementById('report-lat').textContent = pos.lat.toFixed(4);
      document.getElementById('report-lng').textContent = pos.lng.toFixed(4);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      reportState.lat = e.latlng.lat;
      reportState.lng = e.latlng.lng;
      document.getElementById('report-lat').textContent = e.latlng.lat.toFixed(4);
      document.getElementById('report-lng').textContent = e.latlng.lng.toFixed(4);
    });
  }, 100);

  document.getElementById('use-my-location').addEventListener('click', async () => {
    try {
      const pos = await Utils.getCurrentPosition();
      reportState.lat = pos.lat;
      reportState.lng = pos.lng;
      if (reportState.miniMap && reportState.marker) {
        reportState.miniMap.setView([pos.lat, pos.lng], 16);
        reportState.marker.setLatLng([pos.lat, pos.lng]);
      }
      document.getElementById('report-lat').textContent = pos.lat.toFixed(4);
      document.getElementById('report-lng').textContent = pos.lng.toFixed(4);
      Utils.toast('success', 'Location updated');
    } catch (err) {
      Utils.toast('error', 'Location access denied', 'Please enable location permissions');
    }
  });

  document.getElementById('step3-back').addEventListener('click', () => renderReportStep(2));
  document.getElementById('step3-next').addEventListener('click', () => {
    reportState.address = document.getElementById('report-address').value.trim();
    renderReportStep(4);
  });
}

// Step 4: Review
function renderStep4(container) {
  const catInfo = Utils.getCategoryInfo(reportState.category);
  const sevInfo = Utils.getSeverityInfo(reportState.severity);

  container.innerHTML = `
    <div class="report-step-content animate-fade-in-up">
      <h3 class="report-step-title">Review & Submit</h3>
      <p class="report-step-desc">Make sure everything looks good before submitting.</p>

      <div class="review-summary">
        <div class="review-row">
          <span class="review-label">Title</span>
          <span class="review-value">${Utils.escapeHtml(reportState.title)}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Category</span>
          <span class="review-value"><span class="badge ${catInfo.badgeClass}">${catInfo.icon} ${catInfo.label}</span></span>
        </div>
        <div class="review-row">
          <span class="review-label">Severity</span>
          <span class="review-value" style="color: ${sevInfo.color}; font-weight: 700;">${sevInfo.label}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Location</span>
          <span class="review-value">${Utils.escapeHtml(reportState.address) || `${reportState.lat.toFixed(4)}, ${reportState.lng.toFixed(4)}`}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Media</span>
          <span class="review-value">${reportState.images.length} attached</span>
        </div>
        <div class="review-row" style="border-bottom: none;">
          <span class="review-label">Description</span>
          <span class="review-value" style="max-width: 70%;">${Utils.escapeHtml(reportState.description).substring(0, 150)}${reportState.description.length > 150 ? '...' : ''}</span>
        </div>
      </div>

      ${reportState.images.length > 0 ? `
        <div class="image-preview-grid" style="margin-top: var(--space-4);">
          ${reportState.images.map((media, i) => `
            <div class="image-preview-item">
              ${media.type.startsWith('video/') ? `<video src="${media.src}" style="width: 100%; height: 100%; object-fit: cover;"></video>` : `<img src="${media.src}" alt="Preview ${i + 1}">`}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="report-nav">
        <button class="btn btn-secondary" id="step4-back">← Edit</button>
        <button class="btn btn-success btn-lg btn-ripple" id="submit-report">
          Submit Report
        </button>
      </div>
    </div>
  `;

  document.getElementById('step4-back').addEventListener('click', () => renderReportStep(1));
  document.getElementById('submit-report').addEventListener('click', submitReport);
}

async function submitReport() {
  const btn = document.getElementById('submit-report');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Submitting...';

  try {
    const formData = new FormData();
    formData.append('title', reportState.title);
    formData.append('description', reportState.description);
    formData.append('category', reportState.category);
    formData.append('severity', reportState.severity);
    formData.append('lat', reportState.lat);
    formData.append('lng', reportState.lng);
    formData.append('address', reportState.address);

    if (reportState.imageFiles.length > 0) {
      formData.append('image', reportState.imageFiles[0]); // First image
    }

    const result = await API.createIssue(formData);

    Utils.toast('success', 'Issue Reported! +10 pts', 'Thank you for helping your community');

    // Navigate to the new issue
    window.location.hash = `#issue/${result.issue.id}`;
  } catch (err) {
    Utils.toast('error', 'Submission Failed', err.message);
    btn.disabled = false;
    btn.innerHTML = 'Submit Report';
  }
}

window.renderReportPage = renderReportPage;
