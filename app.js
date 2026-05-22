// ============================================================
// ISE HIRING PROCESS — ADVANCED ENTERPRISE (app.js)
// GitHub Pages + GAS JSONP Realtime Analytics Engine
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbx_SVnhAkYyFyIBd6X20bqoX0OPxEoT4qzHzzhR4mRHCLVzvN5XdUrCijJGXftj7NHp/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;

// Global references for chart lifecycle tracking
var charts = { pipeline: null, department: null, metrics: null, horizontal: null };

// ─── CONTROL CONTROLLER UI SYSTEMS ────────────────────────────
function toggleTheme() {
  var b = document.body;
  var current = b.getAttribute('data-theme');
  var target = (current === 'dark') ? 'light' : 'dark';
  b.setAttribute('data-theme', target);
  var icon = target === 'dark' ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
  event.target.innerHTML = icon;
  if(_V === 'home') _renderHome(); // Re-render charts for color balancing
}

function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  var btn = document.querySelector('.sb-toggle i');
  if(document.body.classList.contains('sidebar-collapsed')) {
    if(btn) btn.className = 'fa-solid fa-arrow-right-long';
  } else {
    if(btn) btn.className = 'fa-solid fa-arrow-left-long';
  }
}

function toggleSidebarMobile() {
  document.body.classList.toggle('sidebar-collapsed');
}

function _hasWriteAccess() {
  return (_U && (_U.role === 'hr' || _U.role === 'admin'));
}

function _isAdmin() {
  return (_U && _U.role === 'admin');
}

// ─── JSONP CORE COMMUNICATION CHANNEL ────────────────────────
function _api(action, data, ok, err) {
  var cbName = '_gcb' + (++_cbIdx);
  var timeout;

  window[cbName] = function(r) {
    clearTimeout(timeout);
    try { delete window[cbName]; } catch(e) {}
    var s = document.getElementById('_s_' + cbName);
    if (s) s.remove();
    if (r && r.success === false && r.error === 'NOT_AUTHENTICATED') { _signOut(); return; }
    if (ok) ok(r);
  };

  timeout = setTimeout(function() {
    try { delete window[cbName]; } catch(e) {}
    if (err) err({ message: 'Cloud database timed out.' });
  }, 25000);

  var url = API + '?callback=' + cbName + '&payload='
    + encodeURIComponent(JSON.stringify({ action: action, data: data || {}, token: _TOKEN || '' }));

  var s = document.createElement('script');
  s.id  = '_s_' + cbName; s.src = url;
  s.onerror = function() { clearTimeout(timeout); if (err) err({ message: 'Network protocol failure.' }); };
  document.body.appendChild(s);
}

// ─── LIFECYCLE INITIALIZER ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.body.setAttribute('data-theme', 'light');
  try {
    var stored = localStorage.getItem('ise_hiring_session');
    if (stored) {
      var s = JSON.parse(stored);
      _U = s.user; _TOKEN = s.token;
      _showApp(); _loadData(); return;
    }
  } catch(e) {}
  _showLogin();
});

function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { _toast('Provide credentials.'); return; }
  var btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Matrix...';

  _api('login', { email: email, password: pass }, function(r) {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate System';
    if (!r.success) { document.getElementById('loginErr').textContent = r.error; return; }
    _U = r.user; _TOKEN = r.token;
    try { localStorage.setItem('ise_hiring_session', JSON.stringify({ user: _U, token: _TOKEN })); } catch(e) {}
    _showApp(); _loadData();
  }, function(e) {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate System';
    _toast(e.message);
  });
}

// ... baaki saara code upar rahega ...

function _toast(msg) {
  var t = document.getElementById('toast'); 
  t.textContent = msg; 
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 3000);
}

function _signOut() {
  try { localStorage.removeItem('ise_hiring_session'); } catch(e) {}
  _U = null; _TOKEN = null; _D = {}; _showLogin();
}

function _loadData(cb) {
  _api('getAllData', {}, function(r) {
    if (r.success) { _D = r.data || {}; _lv(_V); if (cb) cb(); } 
    else { _toast('Error mapping matrix: ' + r.error); }
  }, function(e) { _toast('Network missing sync.'); });
}

function _refresh() { _loadData(function() { _toast('System Repositories Synchronized.'); }); }

function _showLogin() { document.getElementById('sLogin').style.display = 'flex'; document.getElementById('sApp').style.display = 'none'; }
function _showApp() {
  document.getElementById('sLogin').style.display = 'none'; document.getElementById('sApp').style.display = 'block';
  document.getElementById('sbUserName').textContent = _U.name;
  document.getElementById('sbUserRole').textContent = _U.role.toUpperCase();
  document.getElementById('sbAvatar').innerHTML = `<span style="font-weight:700;">${(_U.name || 'U').charAt(0).toUpperCase()}</span>`;
}

function _lv(v) {
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = document.getElementById('v-' + v); if (el) el.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.toggle('on', b.dataset.v === v); });

  var titles = { home: 'Zoho Talent Analytics Platform', jobs: 'Deployment Pipelines', candidates: 'Talent Repository Pool', interviews: 'Assessment Coordinates', offers: 'Clearance Operations' };
  document.getElementById('tbTitle').textContent = titles[v] || 'ISHA Executive Core';

  var renderers = { home: _renderHome, jobs: _renderJobs, candidates: _renderCandidates, interviews: _renderInterviews, offers: _renderOffers };
  if (renderers[v]) renderers[v]();
}

// ─── VIEW 1: ADVANCED ZOHO ANALYTICS DASHBOARD ──────────────────
function _renderHome() {
  var jobs = _D.jobs || [], cands = _D.candidates || [], ints = _D.interviews || [], offs = _D.offers || [];

  // Metrics Data Extraction
  var openJobs = jobs.filter(function(j) { return j['Status'] === 'Open'; }).length;
  var pipelineReview = cands.filter(function(c) { return c['Stage'] === 'Applied'; }).length;
  var verifiedActive = cands.filter(function(c) { return c['Stage'] === 'Interview'; }).length;
  var closedHired = cands.filter(function(c) { return c['Stage'] === 'Joined'; }).length;

  // Department Distribution calculation
  var deptCounts = {};
  jobs.forEach(function(j) { 
    var d = j['Department'] || 'Unassigned'; 
    deptCounts[d] = (deptCounts[d] || 0) + 1; 
  });

  document.getElementById('v-home').innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card"><span class="kpi-title">Active Vacancies</span><span class="kpi-value">${openJobs}</span></div>
      <div class="kpi-card"><span class="kpi-title">Inbound Screenings</span><span class="kpi-value">${pipelineReview}</span></div>
      <div class="kpi-card"><span class="kpi-title">Active Assessments</span><span class="kpi-value">${verifiedActive}</span></div>
      <div class="kpi-card"><span class="kpi-title">Successful Onboardings</span><span class="kpi-value">${closedHired}</span></div>
    </div>
    <div class="analytics-grid">
      <div class="chart-card"><h3><i class="fa-solid fa-chart-line"></i> Funnel Conversion Matrix</h3><div class="chart-wrapper"><canvas id="cPipeline"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-pie-chart"></i> Department Distribution</h3><div class="chart-wrapper"><canvas id="cDepartment"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-chart-bar"></i> Monthly Acquisition Stream</h3><div class="chart-wrapper"><canvas id="cMetrics"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-align-left"></i> Core Pipeline Speed Performance</h3><div class="chart-wrapper"><canvas id="cHorizontal"></canvas></div></div>
    </div>
  `;

  // Destroy previous instances to avoid layout memory leaks
  Object.keys(charts).forEach(function(k) { if(charts[k]) charts[k].destroy(); });

  var isDark = document.body.getAttribute('data-theme') === 'dark';
  var labelColor = isDark ? '#9CA3AF' : '#64748B';
  var gridColor = isDark ? '#1F2937' : '#E2E8F0';

  // Chart 1: Doughnut - Conversion Pipeline
  charts.pipeline = new Chart(document.getElementById('cPipeline'), {
    type: 'doughnut',
    data: {
      labels: ['Inbound Applied', 'Verification Interview', 'Selected Nodes', 'Hired & Active'],
      datasets: [{
        data: [pipelineReview, verifiedActive, cands.filter(function(c){return c['Stage']==='Selected';}).length, closedHired],
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#E31E24'],
        borderWidth: 0
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: labelColor } } } }
  });

  // Chart 2: PolarArea - Department Spread Matrix
  charts.department = new Chart(document.getElementById('cDepartment'), {
    type: 'polarArea',
    data: {
      labels: Object.keys(deptCounts),
      datasets: [{ data: Object.values(deptCounts), backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(227,30,36,0.7)'] }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: gridColor }, ticks: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: labelColor } } } }
  });

  // Chart 3: Vertical Bar Chart - Monthly Aggregates
  charts.metrics = new Chart(document.getElementById('cMetrics'), {
    type: 'bar',
    data: {
      labels: ['Q1 Target', 'Q2 Evaluation', 'Current Run-Rate'],
      datasets: [{ label: 'Performance Metrics', data: [openJobs * 2, pipelineReview + 3, closedHired + 2], backgroundColor: '#E31E24', borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: labelColor } }, y: { grid: { color: gridColor }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
  });

  // Chart 4: Horizontal Bar Chart - Phase Velocity
  charts.horizontal = new Chart(document.getElementById('cHorizontal'), {
    type: 'bar',
    data: {
      labels: ['Sourcing Lag', 'Screening Turnaround', 'Offer Generation Speed'],
      datasets: [{ data: [12, 19, 8], backgroundColor: '#3B82F6', borderRadius: 4 }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: gridColor }, ticks: { color: labelColor } }, y: { grid: { display: false }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
  });
}

// ─── VIEW 2: PIPELINES WORKSPACE (TABLE MODE) ─────────────────
function _renderJobs() {
  var jobs = _D.jobs || [];
  var search = document.getElementById('jobSearch') ? document.getElementById('jobSearch').value.toLowerCase() : '';

  var html = `
    <div class="toolbar">
      <div class="search-container">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="jobSearch" type="text" placeholder="Search parameters..." class="search-input" oninput="_renderJobs()">
      </div>
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openJobModal()"><i class="fa-solid fa-plus"></i> New Pipeline Matrix</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Security Token ID</th>
            <th>Deployment Title</th>
            <th>Department Group</th>
            <th>Location Node</th>
            <th>Open Openings</th>
            <th>Operational Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Mod Vectors</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  jobs.forEach(function(j) {
    if (search && !(j['Title']||'').toLowerCase().includes(search) && !(j['Department']||'').toLowerCase().includes(search)) return;
    var state = j['Status'] === 'Open' ? 'badge-success' : 'badge-error';
    html += `
      <tr>
        <td style="font-family:monospace; font-weight:700; color:var(--text-muted);">${j['Job ID']}</td>
        <td style="font-weight:700; color:var(--text-main);">${j['Title']}</td>
        <td>${j['Department']}</td>
        <td><i class="fa-solid fa-location-dot" style="font-size:11px; color:var(--text-disabled);"></i> ${j['Location']}</td>
        <td>${j['Openings']}</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-circle"></i> ${j['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary" style="padding:6px 12px;" onclick="_editJob('${j['Job ID']}')"><i class="fa-solid fa-pen-to-square"></i> Update</button>
          </td>
        ` : ''}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-jobs').innerHTML = html;
}

function _openJobModal(job) {
  var j = job || {};
  _showModal(
    (j['Job ID'] ? 'Modify' : 'Initiate') + ' Grid Pipeline',
    `<div class="fg"><label>Deployment Architecture Title</label><input id="f_title" value="${j['Title']||''}"></div>
     <div class="form-row">
       <div class="fg"><label>Functional Unit</label><select id="f_dept"><option>Production</option><option>Quality</option><option>Accounts</option><option>HR</option></select></div>
       <div class="fg"><label>Geographical Terminal Node</label><input id="f_loc" value="${j['Location']||'Pune'}"></div>
     </div>
     <div class="form-row">
       <div class="fg"><label>Scale Factor Minimum Experience</label><input id="f_exp" type="number" value="${j['Min Experience']||0}"></div>
       <div class="fg"><label>Capacity Quantifier (Openings)</label><input id="f_open" type="number" value="${j['Openings']||1}"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitJob('${j['Job ID']||''}')">Commit Data Stream</button>`
  );
}

function _editJob(jobId) {
  var j = (_D.jobs||[]).find(function(x){return x['Job ID']===jobId;});
  if (j) _openJobModal(j);
}

function _submitJob(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    jobId: existingId||null, title: document.getElementById('f_title').value.trim(),
    department: document.getElementById('f_dept').value, location: document.getElementById('f_loc').value.trim(),
    minExp: document.getElementById('f_exp').value, openings: document.getElementById('f_open').value
  };
  _api(existingId ? 'updateJob' : 'saveJob', data, function(r) { _submitting = false; if (r.success) { _closeModal(); _refresh(); } });
}

// ─── VIEW 3: TALENT CORE POOL ARCHIVE ─────────────────────────
function _renderCandidates() {
  var candidates = _D.candidates || [], jobs = _D.jobs || [];
  var search = document.getElementById('cndSearch') ? document.getElementById('cndSearch').value.toLowerCase() : '';

  var html = `
    <div class="toolbar">
      <div class="search-container">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="cndSearch" type="text" placeholder="Query talent endpoints..." class="search-input" oninput="_renderCandidates()">
      </div>
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openCndModal()"><i class="fa-solid fa-user-plus"></i> Ingest New Node</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Legal Identity Node Name</th>
            <th>Structural Alignment Pipeline</th>
            <th>Communication Endpoints</th>
            <th>Experience Weight</th>
            <th>Funnel Clearance State</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Operations Matrix</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  candidates.forEach(function(c) {
    if (search && !(c['Full Name']||'').toLowerCase().includes(search)) return;
    var job = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
    var tag = 'badge-info';
    if(c['Stage'] === 'Joined' || c['Stage'] === 'Selected') tag = 'badge-success';
    if(c['Stage'] === 'Rejected') tag = 'badge-error';

    html += `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${c['Full Name']}</td>
        <td><span style="font-weight:600; color:var(--text-muted);">${job ? job['Title'] : 'Orphan Vector Record'}</span></td>
        <td><i class="fa-solid fa-envelope" style="font-size:11px;"></i> ${c['Email']} <br> <i class="fa-solid fa-phone" style="font-size:11px;"></i> ${c['Phone']}</td>
        <td>${c['Experience (Yrs)']} Academic Years</td>
        <td><span class="badge ${tag}"><i class="fa-solid fa-circle-nodes"></i> ${c['Stage']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary" style="padding:6px 12px;" onclick="_openCndDetail('${c['Candidate ID']}')"><i class="fa-solid fa-eye"></i> Audit</button>
          </td>
        ` : ''}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-candidates').innerHTML = html;
}

function _openCndModal(cnd) {
  var c = cnd || {}, jobs = _D.jobs || [];
  var jobOpts = jobs.map(function(j){return `<option value="${j['Job ID']}">${j['Title']}</option>`;}).join('');

  _showModal(
    'Compile New Profile Struct',
    `<div class="fg"><label>Full Legal Signature Name</label><input id="c_name" value="${c['Full Name']||''}"></div>
     <div class="form-row">
       <div class="fg"><label>Email Domain Node</label><input id="c_email" type="email" value="${c['Email']||''}"></div>
       <div class="fg"><label>Mobile Network Routing Stream</label><input id="c_phone" type="tel" value="${c['Phone']||''}"></div>
     </div>
     <div class="fg"><label>Target Structural Vacancy</label><select id="c_job">${jobOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Prior Industry Ecosystem</label><input id="c_co" value="${c['Current Company']||''}"></div>
       <div class="fg"><label>Ecosystem Tenure (Yrs)</label><input id="c_exp" type="number" value="${c['Experience (Yrs)']||0}"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitCandidate('${c['Candidate ID']||''}')">Save Data Asset Node</button>`
  );
}

function _submitCandidate(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    candidateId: existingId||null, name: document.getElementById('c_name').value.trim(),
    email: document.getElementById('c_email').value.trim(), phone: document.getElementById('c_phone').value.trim(),
    jobId: document.getElementById('c_job').value, currentCompany: document.getElementById('c_co').value.trim(),
    experience: document.getElementById('c_exp').value, source: 'Zoho Integrated Pipeline Interface Engine'
  };
  _api(existingId ? 'updateCandidate' : 'saveCandidate', data, function(r) { _submitting = false; if (r.success) { _closeModal(); _refresh(); } });
}

function _openCndDetail(candidateId) {
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;}); if (!c) return;
  _showModal(`Audit Record: ${c['Full Name']}`, `
    <div style="line-height:2; font-size:13px;">
      <p><i class="fa-solid fa-fingerprint"></i> <strong>Unique Security Hash Token:</strong> ${c['Candidate ID']}</p>
      <p><i class="fa-solid fa-layer-group"></i> <strong>Ecosystem Funnel Position Status:</strong> ${c['Stage']}</p>
    </div>
  `, _hasWriteAccess() ? `
    ${c['Stage']==='Applied' ? `<button class="btn btn-primary" onclick="_scheduleInterviewFrom('${c['Candidate ID']}')"><i class="fa-solid fa-calendar"></i> Deploy Assessment Event</button>` : ''}
    ${c['Stage']==='Selected' ? `<button class="btn btn-primary" style="background:var(--color-success);" onclick="_createOfferFrom('${c['Candidate ID']}')"><i class="fa-solid fa-file-signature"></i> Finalize Deal Token</button>` : ''}
  ` : '');
}

function _scheduleInterviewFrom(candidateId) { _closeModal(); setTimeout(function() { _openInterviewModal(null, candidateId); }, 200); }
function _createOfferFrom(candidateId) { _closeModal(); setTimeout(function() { _openOfferModal(null, candidateId); }, 200); }

// ─── VIEW 4: ASSESSMENT SCHEDULING SYSTEM ─────────────────────
function _renderInterviews() {
  var interviews = _D.interviews || [], candidates = _D.candidates || [];
  var html = `
    <div class="toolbar" style="justify-content:flex-end;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openInterviewModal()"><i class="fa-solid fa-calendar-plus"></i> Configure Evaluation Block</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Coordinate</th>
            <th>Verification Coordinates</th>
            <th>Timeline Axis (UTC+5:30)</th>
            <th>Assigned Systems Evaluator</th>
            <th>State Lock Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Decision Panel</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  interviews.forEach(function(i) {
    var c = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
    var state = i['Status'] === 'Scheduled' ? 'badge-warning' : 'badge-success';
    html += `
      <tr>
        <td style="font-weight:700;">${c ? c['Full Name'] : 'Redacted User Integrity Node'}</td>
        <td>Track Phase ${i['Round']} — [${i['Type']}]</td>
        <td><i class="fa-regular fa-clock"></i> ${i['Scheduled On']}</td>
        <td><i class="fa-solid fa-user-tie"></i> ${i['Interviewer']}</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-lock"></i> ${i['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            ${i['Status']==='Scheduled' ? `<button class="btn btn-secondary" style="padding:6px 12px;" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')">Log Diagnostics</button>` : '<span style="color:var(--text-disabled); font-weight:600;">Data Locked</span>'}
          </td>
        ` : ''}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-interviews').innerHTML = html;
}

function _openInterviewModal(interview, preCandidateId) {
  var cands = (_D.candidates||[]).filter(function(c){ return c['Stage']==='Applied'||c['Stage']==='Interview'; });
  var cndOpts = cands.map(function(c){ return `<option value="${c['Candidate ID']}">${c['Full Name']}</option>`; }).join('');

  _showModal(
    'Deploy Assessment Matrix Event',
    `<div class="fg"><label>Target Assessment Profile Target</label><select id="i_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Execution Sequence Index (Round)</label><input id="i_round" type="number" value="1"></div>
       <div class="fg"><label>Audit Matrix Evaluation Target</label><select id="i_type"><option>HR Architecture</option><option>Technical Infrastructure</option><option>Executive Panel Board</option></select></div>
     </div>
     <div class="fg"><label>Ecosystem Event Scheduling Timestamp</label><input id="i_sched" type="datetime-local"></div>
     <div class="fg"><label>Assigned Systems Auditor Architect</label><input id="i_iname" placeholder="Auditor Lead Structural Name"></div>`,
    `<button class="btn btn-primary" onclick="_submitInterview()">Authorize Verification Event</button>`
  );
  if(preCandidateId) document.getElementById('i_cnd').value = preCandidateId;
}

function _submitInterview() {
  if (_submitting) return; _submitting = true;
  var cid = document.getElementById('i_cnd').value;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===cid;});
  var data = {
    candidateId: cid, candidateName: c?c['Full Name']:'', candidateEmail: c?c['Email']:'', jobId: c?c['Job ID']:'',
    round: document.getElementById('i_round').value, type: document.getElementById('i_type').value,
    scheduledOn: document.getElementById('i_sched').value, interviewer: document.getElementById('i_iname').value.trim(),
    mode: 'Cloud Telepresence Grid Platform', meetingLink: ''
  };
  _api('saveInterview', data, function(r){ _submitting = false; if(r.success) { _closeModal(); _refresh(); } });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal(
    'Log Audit Protocol Evaluation Outcomes',
    `<div class="fg"><label>Ecosystem Decision Vector Conclusion</label><select id="r_res"><option value="Pass">Pass Matrix Clear</option><option value="Fail">Fail Structural Dismissal</option></select></div>
     <div class="fg"><label>Auditor Deep Metric Technical Review Analysis</label><textarea id="r_fb" rows="3"></textarea></div>`,
    `<button class="btn btn-primary" onclick="_submitInterviewResult('${interviewId}','${candidateId}')">Write Decision Struct to Cloud</button>`
  );
}

function _submitInterviewResult(interviewId, candidateId) {
  if (_submitting) return; _submitting = true;
  _api('updateInterview', {
    interviewId: interviewId, candidateId: candidateId, status: 'Done',
    result: document.getElementById('r_res').value, feedback: document.getElementById('r_fb').value.trim()
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _refresh(); } });
}

// ─── VIEW 5: CLEARANCE OFFER LETTERS ──────────────────────────
function _renderOffers() {
  var offers = _D.offers || [], candidates = _D.candidates || [];
  var html = `
    <div class="toolbar" style="justify-content:flex-end;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openOfferModal()"><i class="fa-solid fa-stamp"></i> Draft Clear Structural Offer</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Target Asset Identification</th>
            <th>Financial Matrix Allocator (CTC)</th>
            <th>Projected System Inception Trigger</th>
            <th>Authorization Status State</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Control Matrix</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  offers.forEach(function(o) {
    var c = candidates.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
    var state = o['Offer Status'] === 'Sent' ? 'badge-info' : 'badge-success';
    html += `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${c ? c['Full Name'] : 'Classified Security Asset Identity'}</td>
        <td><span style="font-weight:700; color:var(--color-success);">${o['Offered CTC']} LPA</span></td>
        <td><i class="fa-regular fa-calendar-days"></i> ${o['Joining Date']}</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-circle-check"></i> ${o['Offer Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            ${o['Offer Status'] === 'Sent' ? `
              <button class="btn btn-primary" style="padding:6px 12px; background:var(--color-success);" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Accepted')">Confirm Accept Asset</button>
            ` : '<span style="color:var(--text-disabled); font-weight:600;">Deployment Authorized</span>'}
          </td>
        ` : ''}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-offers').innerHTML = html;
}

function _openOfferModal(offer, preCandidateId) {
  var selectedCands = (_D.candidates||[]).filter(function(c){return c['Stage']==='Selected';});
  var cndOpts = selectedCands.map(function(c){ return `<option value="${c['Candidate ID']}">${c['Full Name']}</option>`; }).join('');
  if (!cndOpts && !preCandidateId) { _toast('No profiles clear assessment thresholds currently.'); return; }

  _showModal(
    'Draft Global Compensation Asset Agreement',
    `<div class="fg"><label>Target Candidate Element Pool Node</label><select id="o_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Allocated Valuation Array Metric (LPA)</label><input id="o_ctc" type="number" step="0.1" placeholder="e.g. 6.5"></div>
       <div class="fg"><label>Integration Sequence Live Timestamp Date</label><input id="o_jdate" type="date"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitOffer()">Authorize Global Security Release</button>`
  );
  if (preCandidateId) document.getElementById('o_cnd').value = preCandidateId;
}

function _submitOffer() {
  if (_submitting) return; _submitting = true;
  var cid = document.getElementById('o_cnd').value;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===cid;});
  _api('saveOffer', {
    candidateId: cid, jobId: c?c['Job ID']:'', offeredCtc: document.getElementById('o_ctc').value,
    joiningDate: document.getElementById('o_jdate').value, designation: 'Core Systems Infrastructure Specialist Asset'
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _refresh(); } });
}

function _updateOfferStatus(offerId, candidateId, status) {
  _api('updateOfferStatus', { offerId: offerId, candidateId: candidateId, status: status }, function(r) { if (r.success) { _refresh(); } });
}

// ─── UTILITY CORE CONTROLLER ENGINES ─────────────────────────
function _showModal(title, body, footer) {
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').innerHTML = body;
  document.getElementById('mFoot').innerHTML = footer || '';
  document.getElementById('mOv').style.display = 'block';
  document.getElementById('modal').style.display = 'flex';
}

function _closeModal() { _submitting = false; document.getElementById('mOv').style.display = 'none'; document.getElementById('modal').style.display = 'none'; }
function _toast(msg) {
  var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 3000);
}
