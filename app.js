// ============================================================
// ISE HIRING PROCESS — ADVANCED ENTERPRISE (app.js)
// GitHub Pages + GAS JSONP Realtime Analytics Engine
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbx_SVnhAkYyFyIBd6X20bqoX0OPxEoT4qzHzzhR4mRHCLVzvN5XdUrCijJGXftj7NHp/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;

// Global Chart References Tracker
var charts = { pipeline: null, department: null, metrics: null, horizontal: null };

// ─── CONTROL HANDLERS INTERFACE UI ───────────────────────────
function toggleTheme() {
  var b = document.body;
  var current = b.getAttribute('data-theme');
  var target = (current === 'dark') ? 'light' : 'dark';
  b.setAttribute('data-theme', target);
  if(_V === 'home') _renderHome(); 
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

// ─── CORE NETWORK COMMS LAYER (JSONP) ────────────────────────
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
  s.onerror = function() { clearTimeout(timeout); if (err) err({ message: 'Network layer protocol failure.' }); };
  document.body.appendChild(s);
}

// ─── ENVIRONMENT INITIALIZER ──────────────────────────────────
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
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing System Auth...';

  document.getElementById('loginErr').textContent = '';

  _api('login', { email: email, password: pass }, function(r) {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate System';
    if (!r.success) { document.getElementById('loginErr').textContent = r.error || 'Access Denied.'; return; }
    _U = r.user; _TOKEN = r.token;
    try { localStorage.setItem('ise_hiring_session', JSON.stringify({ user: _U, token: _TOKEN })); } catch(e) {}
    _showApp(); _loadData();
  }, function(e) {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate System';
    _toast(e.message);
  });
}

function _signOut() {
  try { localStorage.removeItem('ise_hiring_session'); } catch(e) {}
  _U = null; _TOKEN = null; _D = {}; _showLogin();
}

function _loadData(cb) {
  _api('getAllData', {}, function(r) {
    if (r.success) { _D = r.data || {}; _lv(_V); if (cb) cb(); } 
    else { _toast('Error mapping matrix sync streams: ' + r.error); }
  }, function(e) { _toast('Network missing sync loops.'); });
}

function _refresh() { _loadData(function() { _toast('Cloud Database Synchronized.'); }); }

function _showLogin() { document.getElementById('sLogin').style.display = 'flex'; document.getElementById('sApp').style.display = 'none'; }
function _showApp() {
  document.getElementById('sLogin').style.display = 'none'; document.getElementById('sApp').style.display = 'block';
  document.getElementById('sbUserName').textContent = _U.name;
  document.getElementById('sbUserRole').textContent = _U.role.toUpperCase();
  document.getElementById('sbAvatar').textContent = (_U.name || 'U').charAt(0).toUpperCase();
}

function _lv(v) {
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = document.getElementById('v-' + v); if (el) el.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.toggle('on', b.dataset.v === v); });

  var titles = { home: 'Zoho Advanced Analytics Platform', jobs: 'Deployment Active Pipelines', candidates: 'Talent Repository Pool', interviews: 'Assessment coordinates', offers: 'Clearance Operations' };
  document.getElementById('tbTitle').textContent = titles[v] || 'ISHA Executive Hub';

  var renderers = { home: _renderHome, jobs: _renderJobs, candidates: _renderCandidates, interviews: _renderInterviews, offers: _renderOffers };
  if (renderers[v]) renderers[v]();
}

// ─── VIEW 1: ADVANCED REALTIME ANALYTICS DASHBOARD ──────────────
function _renderHome() {
  var jobs = _D.jobs || [], cands = _D.candidates || [], ints = _D.interviews || [], offs = _D.offers || [];

  var openJobs = jobs.filter(function(j) { return j['Status'] === 'Open'; }).length;
  var pipelineReview = cands.filter(function(c) { return c['Stage'] === 'Applied'; }).length;
  var verifiedActive = cands.filter(function(c) { return c['Stage'] === 'Interview'; }).length;
  var closedHired = cands.filter(function(c) { return c['Stage'] === 'Joined'; }).length;

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
      <div class="chart-card"><h3><i class="fa-solid fa-chart-line"></i> Conversion Funnel Performance</h3><div class="chart-wrapper"><canvas id="cPipeline"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-pie-chart"></i> Department Spread Matrix</h3><div class="chart-wrapper"><canvas id="cDepartment"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-chart-bar"></i> Performance Aggregates Run-Rate</h3><div class="chart-wrapper"><canvas id="cMetrics"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-align-left"></i> Funnel Stage Velocity Index</h3><div class="chart-wrapper"><canvas id="cHorizontal"></canvas></div></div>
    </div>
  `;

  setTimeout(function() {
    try {
      if (typeof Chart === 'undefined') return;
      Object.keys(charts).forEach(function(k) { if(charts[k]) charts[k].destroy(); });

      var isDark = document.body.getAttribute('data-theme') === 'dark';
      var labelColor = isDark ? '#9CA3AF' : '#64748B';
      var gridColor = isDark ? '#1F2937' : '#E2E8F0';

      var elP = document.getElementById('cPipeline');
      if (elP) {
        charts.pipeline = new Chart(elP.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Inbound Applied', 'Assessments', 'Selected Pool', 'Joined Workforce'],
            datasets: [{
              data: [pipelineReview, verifiedActive, cands.filter(function(c){return c['Stage']==='Selected';}).length, closedHired],
              backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#E31E24'],
              borderWidth: 0
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: labelColor } } } }
        });
      }

      var elD = document.getElementById('cDepartment');
      if (elD) {
        charts.department = new Chart(elD.getContext('2d'), {
          type: 'polarArea',
          data: {
            labels: Object.keys(deptCounts).length ? Object.keys(deptCounts) : ['Production Pool'],
            datasets: [{ data: Object.values(deptCounts).length ? Object.values(deptCounts) : [openJobs], backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(227,30,36,0.7)'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: gridColor }, ticks: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: labelColor } } } }
        });
      }

      var elM = document.getElementById('cMetrics');
      if (elM) {
        charts.metrics = new Chart(elM.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Q1 Benchmarking', 'Q2 Evaluation Track', 'Current Velocity'],
            datasets: [{ label: 'Performance Metric', data: [openJobs * 2 || 2, pipelineReview + 4, closedHired + 1], backgroundColor: '#E31E24', borderRadius: 4 }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: labelColor } }, y: { grid: { color: gridColor }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
        });
      }

      var elH = document.getElementById('cHorizontal');
      if (elH) {
        charts.horizontal = new Chart(elH.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Sourcing Window', 'Screening Threshold', 'Clearance Rate'],
            datasets: [{ data: [14, 21, 9], backgroundColor: '#3B82F6', borderRadius: 4 }]
          },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: gridColor }, ticks: { color: labelColor } }, y: { grid: { display: false }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
        });
      }
    } catch(err) { console.warn("Interception shield handled Chart library safely.", err); }
  }, 120);
}

// ─── VIEW 2: PIPELINES MONITOR WORKSPACE ──────────────────────
function _renderJobs() {
  var jobs = _D.jobs || [];
  var filter = document.getElementById('jobFilter') ? document.getElementById('jobFilter').value : 'all';
  var search = document.getElementById('jobSearch') ? document.getElementById('jobSearch').value.toLowerCase() : '';

  var html = `
    <div class="toolbar">
      <div class="filter-box-group">
        <div class="search-container">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="jobSearch" type="text" placeholder="Filter positions / departments..." value="${search ? search : ''}" oninput="_renderJobs()">
        </div>
        <select id="jobFilter" class="custom-select-filter" onchange="_renderJobs()">
          <option value="all" ${filter==='all'?'selected':''}>All Operational States</option>
          <option value="Open" ${filter==='Open'?'selected':''}>Open</option>
          <option value="Closed" ${filter==='Closed'?'selected':''}>Closed</option>
        </select>
      </div>
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openJobModal()"><i class="fa-solid fa-plus"></i> Add Job Opening</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Pipeline Hash ID</th>
            <th>Deployment Title</th>
            <th>Department Group</th>
            <th>Terminal Location Node</th>
            <th>Compensation Base</th>
            <th>Capacity Quantifier</th>
            <th>Status State</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Operations Panel</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  jobs.forEach(function(j) {
    if (filter !== 'all' && j['Status'] !== filter) return;
    if (search && !(j['Title']||'').toLowerCase().includes(search) && !(j['Department']||'').toLowerCase().includes(search)) return;
    
    var state = j['Status'] === 'Open' ? 'badge-success' : 'badge-error';
    html += `
      <tr>
        <td style="font-family:monospace; font-weight:700; color:var(--text-muted);">${j['Job ID']}</td>
        <td style="font-weight:700; color:var(--text-main);">${j['Title']}</td>
        <td>${j['Department']}</td>
        <td><i class="fa-solid fa-location-dot" style="font-size:11px; color:var(--text-disabled);"></i> ${j['Location']}</td>
        <td>${j['Salary Range'] || 'As per norms'}</td>
        <td><strong>${j['Openings']}</strong> Openings</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-circle"></i> ${j['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm" onclick="_editJob('${j['Job ID']}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            ${_isAdmin() && j['Status']==='Open' ? `<button class="btn btn-danger btn-sm" style="margin-left:4px;" onclick="_closeJob('${j['Job ID']}')">Archive</button>` : ''}
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
    (j['Job ID'] ? 'Modify' : 'Initiate') + ' Pipeline Frame Vector',
    `<div class="fg"><label>Deployment Structural Title</label><input id="f_title" value="${j['Title']||''}" placeholder="e.g. Production Supervisor"></div>
     <div class="form-row">
       <div class="fg"><label>Functional Workspace Unit</label><select id="f_dept"><option ${j['Department']==='Production'?'selected':''}>Production</option><option ${j['Department']==='Quality'?'selected':''}>Quality</option><option ${j['Department']==='Accounts'?'selected':''}>Accounts</option><option ${j['Department']==='HR'?'selected':''}>HR</option></select></div>
       <div class="fg"><label>Geographical Station Node</label><input id="f_loc" value="${j['Location']||'Delhi'}"></div>
     </div>
     <div class="form-row">
       <div class="fg"><label>Experience Capacity Factor (Yrs)</label><input id="f_exp" type="number" value="${j['Min Experience']||0}"></div>
       <div class="fg"><label>Target Allocation Volume</label><input id="f_open" type="number" value="${j['Openings']||1}"></div>
     </div>
     <div class="fg"><label>Salary Range Framework</label><input id="f_sal" value="${j['Salary Range']||''}" placeholder="e.g. 4-6 LPA"></div>
     <div class="fg"><label>Closing Timeline Constrain</label><input id="f_ddl" type="date" value="${j['Deadline']||''}"></div>
     <div class="fg"><label>Technical Domain Requirements Description</label><textarea id="f_desc" rows="3">${j['Description']||''}</textarea></div>`,
    `<button class="btn btn-primary" onclick="_submitJob('${j['Job ID']||''}')">Commit Allocation Stream</button>`
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
    minExp: document.getElementById('f_exp').value, openings: document.getElementById('f_open').value,
    salaryRange: document.getElementById('f_sal').value.trim(), deadline: document.getElementById('f_ddl').value,
    description: document.getElementById('f_desc').value.trim()
  };
  _api(existingId ? 'updateJob' : 'saveJob', data, function(r) { _submitting = false; if (r.success) { _closeModal(); _loadData(); } });
}

function _closeJob(jobId) {
  if (!confirm('Close this job tracking structural matrix?')) return;
  _api('closeJob', { jobId: jobId }, function(r) { if (r.success) { _loadData(); } });
}

// ─── VIEW 3: TALENT STORAGE PIPELINE POOL ─────────────────────
function _renderCandidates() {
  var candidates = _D.candidates || [], jobs = _D.jobs || [];
  var search = document.getElementById('cndSearch') ? document.getElementById('cndSearch').value.toLowerCase() : '';
  var stgFilter = document.getElementById('cndStageFilter') ? document.getElementById('cndStageFilter').value : 'all';

  var html = `
    <div class="toolbar">
      <div class="filter-box-group">
        <div class="search-container">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="cndSearch" type="text" placeholder="Query identity names / endpoints..." value="${search ? search : ''}" oninput="_renderCandidates()">
        </div>
        <select id="cndStageFilter" class="custom-select-filter" onchange="_renderCandidates()">
          <option value="all" ${stgFilter==='all'?'selected':''}>All Pipeline Phases</option>
          <option ${stgFilter==='Applied'?'selected':''}>Applied</option>
          <option ${stgFilter==='Interview'?'selected':''}>Interview</option>
          <option ${stgFilter==='Selected'?'selected':''}>Selected</option>
          <option ${stgFilter==='Offered'?'selected':''}>Offered</option>
          <option ${stgFilter==='Joined'?'selected':''}>Joined</option>
          <option ${stgFilter==='Rejected'?'selected':''}>Rejected</option>
        </select>
      </div>
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openCndModal()"><i class="fa-solid fa-user-plus"></i> Register Profile Element</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Legal Identity</th>
            <th>Target Operational Assignment</th>
            <th>Communication Channels</th>
            <th>Tenure Matrix</th>
            <th>Ecosystem Funnel Phase</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Audit Matrix</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  candidates.forEach(function(c) {
    if (stgFilter !== 'all' && c['Stage'] !== stgFilter) return;
    if (search && !(c['Full Name']||'').toLowerCase().includes(search) && !(c['Email']||'').toLowerCase().includes(search)) return;
    
    var job = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
    var tag = 'badge-info';
    if(c['Stage'] === 'Joined' || c['Stage'] === 'Selected') tag = 'badge-success';
    if(c['Stage'] === 'Rejected') tag = 'badge-error';

    html += `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${c['Full Name']}</td>
        <td><span style="font-weight:600; color:var(--text-muted);">${job ? job['Title'] : 'Global Track Spec'}</span></td>
        <td><i class="fa-solid fa-envelope"></i> ${c['Email']}<br><i class="fa-solid fa-phone"></i> ${c['Phone']}</td>
        <td>${c['Experience (Yrs)']} Academic Yrs</td>
        <td><span class="badge ${tag}"><i class="fa-solid fa-circle-nodes"></i> ${c['Stage']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm" onclick="_openCndDetail('${c['Candidate ID']}')"><i class="fa-solid fa-eye"></i> Audit Node</button>
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
  var jobOpts = jobs.map(function(j){return `<option value="${j['Job ID']}" ${c['Job ID']===j['Job ID']?'selected':''}>${j['Title']}</option>`;}).join('');

  _showModal(
    'Compile Profile Node Elements',
    `<div class="fg"><label>Legal Identification Label Name</label><input id="c_name" value="${c['Full Name']||''}"></div>
     <div class="form-row">
       <div class="fg"><label>Routing Data Email Endpoint</label><input id="c_email" type="email" value="${c['Email']||''}"></div>
       <div class="fg"><label>Mobile Link Terminal Stream</label><input id="c_phone" type="tel" value="${c['Phone']||''}"></div>
     </div>
     <div class="fg"><label>Target Structural Pipeline Assignment</label><select id="c_job">${jobOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Prior Industry Operational Space</label><input id="c_co" value="${c['Current Company']||''}"></div>
       <div class="fg"><label>Tenure Load Metric (Yrs)</label><input id="c_exp" type="number" value="${c['Experience (Yrs)']||0}"></div>
     </div>
     <div class="form-row">
       <div class="fg"><label>Current Financial Valuation Matrix</label><input id="c_cctc" value="${c['Current CTC']||''}"></div>
       <div class="fg"><label>Target Financial Expectation Vector</label><input id="c_ectc" value="${c['Expected CTC']||''}"></div>
     </div>
     <div class="fg"><label>Acquisition Channel Stream Vector</label><select id="c_src"><option ${c['Source']==='LinkedIn'?'selected':''}>LinkedIn</option><option ${c['Source']==='Portal'?'selected':''}>Portal</option><option ${c['Source']==='Referral'?'selected':''}>Referral</option></select></div>
     <div class="fg"><label>Digital Dossier Resume Storage Link</label><input id="c_res" value="${c['Resume Link']||''}"></div>`,
    `<button class="btn btn-primary" onclick="_submitCandidate('${c['Candidate ID']||''}')">Write Node Matrix to Cloud</button>`
  );
}

function _submitCandidate(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    candidateId: existingId||null, name: document.getElementById('c_name').value.trim(),
    email: document.getElementById('c_email').value.trim(), phone: document.getElementById('c_phone').value.trim(),
    jobId: document.getElementById('c_job').value, currentCompany: document.getElementById('c_co').value.trim(),
    experience: document.getElementById('c_exp').value, currentCtc: document.getElementById('c_cctc').value.trim(),
    expectedCtc: document.getElementById('c_ectc').value.trim(), source: document.getElementById('c_src').value,
    resumeLink: document.getElementById('c_res').value.trim()
  };
  _api(existingId ? 'updateCandidate' : 'saveCandidate', data, function(r) { _submitting = false; if (r.success) { _closeModal(); _loadData(); } });
}

function _openCndDetail(candidateId) {
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;}); if (!c) return;
  var job = (_D.jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});
  var offer = (_D.offers||[]).find(function(o){return o['Candidate ID']===candidateId;});
  
  _showModal(`Audit Record Ledger: ${c['Full Name']}`, `
    <div style="line-height:2.2; font-size:13px;">
      <p><i class="fa-solid fa-fingerprint"></i> <strong>Ecosystem Hash Identifier:</strong> ${c['Candidate ID']}</p>
      <p><i class="fa-solid fa-briefcase"></i> <strong>Target Track Sequence:</strong> ${job ? job['Title'] : 'Unassigned Vector'}</p>
      <p><i class="fa-solid fa-layer-group"></i> <strong>Clearance Stage Constraint:</strong> ${c['Stage']}</p>
      <p><i class="fa-solid fa-money-bill-wave"></i> <strong>Financial Index Matrix:</strong> CCTC: ${c['Current CTC'] || '—'} / ECTC: ${c['Expected CTC'] || '—'}</p>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="_openCndModal(${JSON.stringify(c)})"><i class="fa-solid fa-marker"></i> Modify Profile</button>
    ${c['Stage']==='Applied' ? `<button class="btn btn-primary btn-sm" onclick="_scheduleInterviewFrom('${c['Candidate ID']}')"><i class="fa-solid fa-calendar-days"></i> Deploy Assessment Track</button>` : ''}
    ${c['Stage']==='Selected' ? `<button class="btn btn-primary btn-sm" style="background:var(--color-success);" onclick="_createOfferFrom('${c['Candidate ID']}')"><i class="fa-solid fa-stamp"></i> Build Clearance Offer</button>` : ''}
    ${c['Stage']==='Accepted' ? `<button class="btn btn-primary btn-sm" style="background:var(--color-success);" onclick="_confirmJoiningFrom('${c['Candidate ID']}')"><i class="fa-solid fa-circle-check"></i> Finalize Induction</button>` : ''}
  `);
}

function _scheduleInterviewFrom(cid) { _closeModal(); setTimeout(function() { _openInterviewModal(null, cid); }, 200); }
function _createOfferFrom(cid) { _closeModal(); setTimeout(function() { _openOfferModal(null, cid); }, 200); }
function _confirmJoiningFrom(cid) {
  _closeModal();
  var offer = (_D.offers||[]).find(function(o){return o['Candidate ID']===cid;});
  if(offer) setTimeout(function() { _confirmJoining(offer['Offer ID'], cid); }, 200);
}

// ─── VIEW 4: ASSESSMENT SYSTEM SCHEDULER ─────────────────────
function _renderInterviews() {
  var interviews = _D.interviews || [], candidates = _D.candidates || [];
  var intFilter = document.getElementById('intFilter') ? document.getElementById('intFilter').value : 'all';

  var html = `
    <div class="toolbar">
      <select id="intFilter" class="custom-select-filter" onchange="_renderInterviews()">
        <option value="all" ${intFilter==='all'?'selected':''}>All Assessment Tracks</option>
        <option value="Scheduled" ${intFilter==='Scheduled'?'selected':''}>Scheduled</option>
        <option value="Done" ${intFilter==='Done'?'selected':''}>Done</option>
      </select>
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openInterviewModal()"><i class="fa-solid fa-calendar-plus"></i> Configure Evaluation Block</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Element Link</th>
            <th>Verification Module Coordinates</th>
            <th>Timeline Constraints Axis</th>
            <th>Assigned Systems Auditor</th>
            <th>State Lock Lock Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Decision Terminal</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  interviews.forEach(function(i) {
    if (intFilter !== 'all' && i['Status'] !== intFilter) return;
    var c = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
    var state = i['Status'] === 'Scheduled' ? 'badge-warning' : 'badge-success';
    
    html += `
      <tr>
        <td style="font-weight:700;">${c ? c['Full Name'] : 'Redacted User Integrity Node'}</td>
        <td>Sequence Module Phase ${i['Round']} — [${i['Type']}]</td>
        <td><i class="fa-regular fa-clock"></i> ${i['Scheduled On']}</td>
        <td><i class="fa-solid fa-user-tie"></i> ${i['Interviewer']}</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-lock"></i> ${i['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            ${i['Status']==='Scheduled' ? `<button class="btn btn-secondary btn-sm" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')">Log Evaluation Outcome</button>` : '<span style="color:var(--text-disabled); font-weight:600;">Stream Finalized</span>'}
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
    'Initiate Technical Assessment Protocol',
    `<div class="fg"><label>Target Assessment Profile Anchor</label><select id="i_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Execution Index Loop (Round)</label><input id="i_round" type="number" value="1"></div>
       <div class="fg"><label>Track Core Targets Mode</label><select id="i_type"><option>HR Architecture</option><option>Technical Infrastructure</option><option>Executive Panel Board</option></select></div>
     </div>
     <div class="fg"><label>Execution Schedule Coordinate Timestamp</label><input id="i_sched" type="datetime-local"></div>
     <div class="form-row">
       <div class="fg"><label>Assigned Systems Auditor Lead</label><input id="i_iname" placeholder="Auditor Full Name"></div>
       <div class="fg"><label>Transmission Telepresence Matrix</label><select id="i_mode"><option>Online Video Grid</option><option>Physical Workspace Board</option></select></div>
     </div>
     <div class="fg"><label>Video Session Interface Grid Link</label><input id="i_link" placeholder="https://meet.google.com/..."></div>`,
    `<button class="btn btn-primary" onclick="_submitInterview()">Authorize Verification Pipeline</button>`
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
    mode: document.getElementById('i_mode').value, meetingLink: document.getElementById('i_link').value.trim()
  };
  _api('saveInterview', data, function(r){ _submitting = false; if(r.success) { _closeModal(); _loadData(); } });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal(
    'Log Audit Diagnostics Evaluation Vector',
    `<div class="fg"><label>Ecosystem Core Pass/Fail Determination Conclusion</label><select id="r_res"><option value="Pass">Pass Threshold Clear</option><option value="Fail">Fail Structural Dismissal</option></select></div>
     <div class="fg"><label>Auditor Synthesized Feedback Dossier Summary</label><textarea id="r_fb" rows="3"></textarea></div>`,
    `<button class="btn btn-primary" onclick="_submitInterviewResult('${interviewId}','${candidateId}')">Write Metrics to Cloud</button>`
  );
}

function _submitInterviewResult(interviewId, candidateId) {
  if (_submitting) return; _submitting = true;
  _api('updateInterview', {
    interviewId: interviewId, candidateId: candidateId, status: 'Done',
    result: document.getElementById('r_res').value, feedback: document.getElementById('r_fb').value.trim()
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _loadData(); } });
}

// ─── VIEW 5: SECURITY CLEARANCE OPERATIONS MATRIX ───────────
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
            <th>Target Node Allocation Identity</th>
            <th>Financial Matrix Scale Metrics (CTC)</th>
            <th>Projected System Inception Live Date</th>
            <th>Authorization Status Code State</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Control Registry Operations</th>' : ''}
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
              <button class="btn btn-primary btn-sm" style="background:var(--color-success);" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Accepted')"><i class="fa-solid fa-square-check"></i> Confirm Acceptance</button>
            ` : ''}
            ${o['Offer Status'] === 'Accepted' ? `
              <button class="btn btn-secondary btn-sm" onclick="_confirmJoining('${o['Offer ID']}','${o['Candidate ID']}')"><i class="fa-solid fa-circle-user"></i> Finalize Induction</button>
            ` : ''}
            ${o['Offer Status'] === 'Joined' ? '<span style="color:var(--text-disabled); font-weight:600;">Induction Cleared</span>' : ''}
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
  if (!cndOpts && !preCandidateId) { _toast('No profile elements pass evaluation constraints yet.'); return; }

  _showModal(
    'Draft Global Compensation Allocation Matrix Offer',
    `<div class="fg"><label>Candidate Component Core Target Node</label><select id="o_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Allocated Valuation Array Metric Base (LPA)</label><input id="o_ctc" type="number" step="0.1" placeholder="e.g. 5.5"></div>
       <div class="fg"><label>System Integration Sequence Live Timestamp</label><input id="o_jdate" type="date"></div>
     </div>
     <div class="fg"><label>Assigned Systems Infrastructure Role Designation</label><input id="o_desg" placeholder="e.g. Systems Quality Lead"></div>`,
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
    joiningDate: document.getElementById('o_jdate').value, designation: document.getElementById('o_desg').value.trim()
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _loadData(); } });
}

function _updateOfferStatus(offerId, candidateId, status) {
  _api('updateOfferStatus', { offerId: offerId, candidateId: candidateId, status: status }, function(r) { if (r.success) { _loadData(); } });
}

function _confirmJoining(offerId, candidateId) {
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var offer = (_D.offers||[]).find(function(o){return o['Offer ID']===offerId;});
  if (!c || !offer) return;
  
  _showModal('🎉 Authorize Systems Workforce Induction Protocol', `
    <div style="margin-bottom:16px; font-weight:500; color:var(--color-success);">Deploying auto-population script to create active Employee ledger node row dynamically.</div>
    <div class="form-row">
      <div class="fg"><label>Target Allocation Unit Department</label><input id="j_dept" value="Production"></div>
      <div class="fg"><label>Role Operational Designation Tag</label><input id="j_desg" value="${offer['Designation'] || 'Core Operator'}"></div>
    </div>
    <div class="fg"><label>Assigned Strategic Network Supervisor (Reporting Manager)</label><input id="j_mgr" placeholder="Manager Identity Full Name"></div>
  `, `<button class="btn btn-primary" onclick="_submitJoining('${offerId}','${candidateId}')">Write Records & Finalize Lock</button>`);
}

function _submitJoining(offerId, candidateId) {
  if (_submitting) return; _submitting = true;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var offer = (_D.offers||[]).find(function(o){return o['Offer ID']===offerId;});
  _api('confirmJoining', {
    offerId: offerId, candidateId: candidateId, candidateName: c['Full Name'], candidateEmail: c['Email'], candidatePhone: c['Phone'],
    department: document.getElementById('j_dept').value.trim(), designation: document.getElementById('j_desg').value.trim(),
    joiningDate: offer['Joining Date'], offeredCtc: offer['Offered CTC']
  }, function(r) { _submitting = false; if (r.success) { _closeModal(); _loadData(); } });
}

// ─── SYSTEM MODALS & LAYOUT UTILITIES OVERLAYS ──────────────────
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
