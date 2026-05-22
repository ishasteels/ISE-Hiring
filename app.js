// ============================================================
// ISE HIRING PROCESS — ADVANCED ENTERPRISE (app.js)
// GitHub Pages + GAS JSONP Realtime Analytics Engine
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbx_SVnhAkYyFyIBd6X20bqoX0OPxEoT4qzHzzhR4mRHCLVzvN5XdUrCijJGXftj7NHp/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;

// Global Chart Lifecycles
var charts = { pipeline: null, department: null, metrics: null, horizontal: null };

// ─── MANAGEMENT LAYOUT ENGINES ──────────────────────────────
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

// ─── ENTERPRISE SYSTEM COMMUNICATION LINK (JSONP) ───────────
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
  s.onerror = function() { clearTimeout(timeout); if (err) err({ message: 'Network layer breakdown.' }); };
  document.body.appendChild(s);
}

// ─── INITIALIZATION PROCEDURES ──────────────────────────────
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
  document.getElementById('sbAvatar').textContent = (_U.name || 'U').charAt(0).toUpperCase();
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

// ─── VIEW 1: ENTERPRISE ANALYTICS RENDERING ENGINE ───────────
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
      <div class="chart-card"><h3><i class="fa-solid fa-chart-line"></i> Funnel Conversion Matrix</h3><div class="chart-wrapper"><canvas id="cPipeline"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-pie-chart"></i> Department Distribution</h3><div class="chart-wrapper"><canvas id="cDepartment"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-chart-bar"></i> Monthly Acquisition Stream</h3><div class="chart-wrapper"><canvas id="cMetrics"></canvas></div></div>
      <div class="chart-card"><h3><i class="fa-solid fa-align-left"></i> Core Pipeline Speed Performance</h3><div class="chart-wrapper"><canvas id="cHorizontal"></canvas></div></div>
    </div>
  `;

  // Dynamic Chart Execution Layer
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
            labels: ['Inbound Applied', 'Verification Interview', 'Selected Nodes', 'Hired & Active'],
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
            labels: Object.keys(deptCounts).length ? Object.keys(deptCounts) : ['System Pool'],
            datasets: [{ data: Object.values(deptCounts).length ? Object.values(deptCounts) : [0], backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(227,30,36,0.7)'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: gridColor }, ticks: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: labelColor } } } }
        });
      }

      var elM = document.getElementById('cMetrics');
      if (elM) {
        charts.metrics = new Chart(elM.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Q1 Target', 'Q2 Evaluation', 'Current Run-Rate'],
            datasets: [{ label: 'Performance', data: [openJobs * 2 || 4, pipelineReview + 2, closedHired + 1], backgroundColor: '#E31E24', borderRadius: 4 }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: labelColor } }, y: { grid: { color: gridColor }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
        });
      }

      var elH = document.getElementById('cHorizontal');
      if (elH) {
        charts.horizontal = new Chart(elH.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Sourcing Lag', 'Screening Turnaround', 'Offer Generation Speed'],
            datasets: [{ data: [12, 19, 8], backgroundColor: '#3B82F6', borderRadius: 4 }]
          },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: gridColor }, ticks: { color: labelColor } }, y: { grid: { display: false }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
        });
      }
    } catch(err) {
      console.warn("Safety interception triggered. Charts bypassed to prevent layout freezing.", err);
    }
  }, 100);
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
            <th>Status</th>
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
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-jobs').innerHTML = html;
}

// ─── VIEW 3: TALENT POOL MANAGEMENT ───────────────────────────
function _renderCandidates() {
  var candidates = _D.candidates || [], jobs = _D.jobs || [];
  var search = document.getElementById('cndSearch') ? document.getElementById('cndSearch').value.toLowerCase() : '';

  var html = `
    <div class="toolbar">
      <div class="search-container">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="cndSearch" type="text" placeholder="Query talent endpoints..." class="search-input" oninput="_renderCandidates()">
      </div>
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
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-candidates').innerHTML = html;
}

// ─── VIEW 4: INTERVIEWS MANAGEMENT ────────────────────────────
function _renderInterviews() {
  var interviews = _D.interviews || [], candidates = _D.candidates || [];
  var html = `
    <div class="data-table-container" style="margin-top:20px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Coordinate</th>
            <th>Verification Coordinates</th>
            <th>Timeline Axis</th>
            <th>Assigned Systems Evaluator</th>
            <th>State Lock Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  interviews.forEach(function(i) {
    var c = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
    var state = i['Status'] === 'Scheduled' ? 'badge-warning' : 'badge-success';
    html += `
      <tr>
        <td style="font-weight:700;">${c ? c['Full Name'] : 'Classified Node'}</td>
        <td>Track Phase ${i['Round']} — [${i['Type']}]</td>
        <td><i class="fa-regular fa-clock"></i> ${i['Scheduled On']}</td>
        <td><i class="fa-solid fa-user-tie"></i> ${i['Interviewer']}</td>
        <td><span class="badge ${state}"><i class="fa-solid fa-lock"></i> ${i['Status']}</span></td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-interviews').innerHTML = html;
}

// ─── VIEW 5: CLEARANCE OFFER LETTERS ──────────────────────────
function _renderOffers() {
  var offers = _D.offers || [], candidates = _D.candidates || [];
  var html = `
    <div class="data-table-container" style="margin-top:20px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Target Asset Identification</th>
            <th>Financial Matrix Allocator (CTC)</th>
            <th>Projected System Inception Trigger</th>
            <th>Authorization Status State</th>
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
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  document.getElementById('v-offers').innerHTML = html;
}

// ─── UTILITY ENGINES ─────────────────────────────────────────
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
