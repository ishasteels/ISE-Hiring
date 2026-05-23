// ============================================================
// ISHA STEEL ENTERPRISES — HIRING PORTAL v3.0
// Premium Enterprise PWA | GitHub Pages + GAS JSONP
// Clean Labels | Full CRUD | Maximum Analytics
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbx_SVnhAkYyFyIBd6X20bqoX0OPxEoT4qzHzzhR4mRHCLVzvN5XdUrCijJGXftj7NHp/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;
var _charts = {};

// ─── JSONP ENGINE ─────────────────────────────────────────────
function _api(action, data, ok, err) {
  var cb = '_gcb' + (++_cbIdx), t;
  window[cb] = function(r) {
    clearTimeout(t);
    try { delete window[cb]; } catch(e) {}
    var s = document.getElementById('_s_' + cb); if (s) s.remove();
    if (r && r.success === false && r.error === 'NOT_AUTHENTICATED') { _signOut(); return; }
    if (ok) ok(r);
  };
  t = setTimeout(function() {
    try { delete window[cb]; } catch(e) {}
    if (err) err({ message: 'Request timed out. Check your connection.' });
  }, 25000);
  var url = API + '?callback=' + cb + '&payload=' + encodeURIComponent(JSON.stringify({ action: action, data: data || {}, token: _TOKEN || '' }));
  var s = document.createElement('script');
  s.id = '_s_' + cb; s.src = url;
  s.onerror = function() { clearTimeout(t); if (err) err({ message: 'Network error.' }); };
  document.body.appendChild(s);
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Restore theme
  try {
    var savedTheme = localStorage.getItem('isha_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    var btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = savedTheme === 'dark'
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  } catch(e) {}
  // Restore session
  try {
    var stored = localStorage.getItem('isha_hiring_v3');
    if (stored) {
      var s = JSON.parse(stored);
      _U = s.user; _TOKEN = s.token;
      _showApp(); _loadData(); return;
    }
  } catch(e) {}
  _showLogin();
});

// ─── AUTH ─────────────────────────────────────────────────────
function doLogin() {
  var email = _val('loginEmail'), pass = _val('loginPass');
  if (!email || !pass) { _loginErr('Please enter email and password.'); return; }
  var btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Signing in...';
  _el('loginErr').textContent = '';
  _api('login', { email: email, password: pass }, function(r) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i> Sign In';
    if (!r.success) { _loginErr(r.error || 'Invalid credentials.'); return; }
    _U = r.user; _TOKEN = r.token;
    try { localStorage.setItem('isha_hiring_v3', JSON.stringify({ user: _U, token: _TOKEN })); } catch(e) {}
    _showApp(); _loadData();
  }, function(e) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i> Sign In';
    _loginErr(e.message);
  });
}

function _loginErr(msg) { _el('loginErr').textContent = msg; }

function _signOut() {
  try { localStorage.removeItem('isha_hiring_v3'); } catch(e) {}
  _U = null; _TOKEN = null; _D = {};
  document.body.classList.remove('sb-open');
  _showLogin();
}

// ─── DATA ─────────────────────────────────────────────────────
function _loadData(cb) {
  _showPageLoader(true);
  _api('getAllData', {}, function(r) {
    _showPageLoader(false);
    if (r.success) { _D = r.data || {}; _lv(_V); if (cb) cb(); }
    else _toast('Data load failed: ' + r.error, 'error');
  }, function(e) { _showPageLoader(false); _toast(e.message, 'error'); });
}

function _refresh() {
  _loadData(function() { _toast('Data refreshed successfully', 'success'); });
}

// ─── LAYOUT ───────────────────────────────────────────────────
function _showLogin() {
  _el('sLogin').style.display = 'flex';
  _el('sApp').style.display   = 'none';
}

function _showApp() {
  _el('sLogin').style.display = 'none';
  _el('sApp').style.display   = 'block';
  var av = (_U.name || 'U').charAt(0).toUpperCase();
  var roleCap = _U.role.charAt(0).toUpperCase() + _U.role.slice(1);
  // Topbar user chip
  if (_el('sbUserName'))  _el('sbUserName').textContent  = _U.name;
  if (_el('sbUserRole'))  _el('sbUserRole').textContent  = roleCap;
  if (_el('sbUserEmail')) _el('sbUserEmail').textContent = _U.email;
  if (_el('sbAvatar'))    _el('sbAvatar').textContent    = av;
  // Dropdown
  if (_el('ddAvatar')) _el('ddAvatar').textContent = av;
  if (_el('ddName'))   _el('ddName').textContent   = _U.name;
  if (_el('ddEmail'))  _el('ddEmail').textContent  = _U.email;
  if (_el('ddRole'))   _el('ddRole').textContent   = roleCap;
  // Role visibility
  document.querySelectorAll('.hr-only').forEach(function(el) {
    el.style.display = _hasWrite() ? '' : 'none';
  });
  document.querySelectorAll('.admin-only').forEach(function(el) {
    el.style.display = _isAdmin() ? '' : 'none';
  });
  // Candidate role — show readonly banner
  if (_U.role === 'candidate') {
    document.querySelectorAll('[data-v="candidates"],[data-v="offers"]').forEach(function(el){
      el.style.display = 'none';
    });
  }
}

function _lv(v) {
  // Candidate role — restrict to jobs and home only
  if (_U && _U.role === 'candidate' && ['offers'].indexOf(v) >= 0) {
    _toast('Access restricted for your role.', 'warning'); return;
  }
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = _el('v-' + v); if (el) el.style.display = 'block';
  document.querySelectorAll('[data-v]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.v === v);
  });
  var titles = {
    home: 'Dashboard', jobs: 'Job Openings', candidates: 'Candidates',
    interviews: 'Interviews', offers: 'Offer Letters'
  };
  _el('tbTitle').textContent = titles[v] || 'ISHA Hiring';
  var renderers = { home: _renderHome, jobs: _renderJobs, candidates: _renderCandidates, interviews: _renderInterviews, offers: _renderOffers };
  if (renderers[v]) renderers[v]();
  document.body.classList.remove('sb-open');
}

function openMobileSb()  { document.body.classList.add('sb-open'); }
function closeMobileSb() { document.body.classList.remove('sb-open'); }

function _showPageLoader(show) {
  var l = _el('pageLoader');
  if (l) l.style.display = show ? 'flex' : 'none';
}

// ─── HELPERS ──────────────────────────────────────────────────
function _el(id)   { return document.getElementById(id); }
function _val(id)  { var e = _el(id); return e ? e.value.trim() : ''; }
function _hasWrite(){ return _U && (_U.role === 'hr' || _U.role === 'admin'); }
function _isAdmin() { return _U && _U.role === 'admin'; }
function _canView()  { return _U && ['admin','hr','viewer','candidate'].indexOf(_U.role) >= 0; }

// ── USER DROPDOWN ─────────────────────────────────────────────
function toggleUserMenu(e) {
  e.stopPropagation();
  var dd  = _el('userDropdown');
  var chv = _el('userChevron');
  var isOpen = dd.style.display !== 'none';
  dd.style.display  = isOpen ? 'none' : 'block';
  if (chv) chv.style.transform = isOpen ? '' : 'rotate(180deg)';
}
document.addEventListener('click', function(e) {
  var dd = _el('userDropdown');
  if (dd && !dd.contains(e.target) && e.target !== _el('userChip') && !(_el('userChip') && _el('userChip').contains(e.target))) {
    dd.style.display = 'none';
    var chv = _el('userChevron'); if (chv) chv.style.transform = '';
  }
});

// ── DARK / LIGHT MODE ─────────────────────────────────────────
function toggleTheme() {
  var cur = document.body.getAttribute('data-theme') || 'light';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  try { localStorage.setItem('isha_theme', next); } catch(e) {}
  var btn = _el('themeBtn');
  if (btn) btn.innerHTML = next === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ── COLLAPSED SIDEBAR LOGO ────────────────────────────────────
function toggleSidebar() {
  document.body.classList.toggle('sb-collapsed');
}

function _destroyChart(key) {
  if (_charts[key]) { try { _charts[key].destroy(); } catch(e) {} _charts[key] = null; }
}

// ─── DASHBOARD ────────────────────────────────────────────────
function _renderHome() {
  var jobs  = _D.jobs        || [];
  var cands = _D.candidates  || [];
  var ints  = _D.interviews  || [];
  var offs  = _D.offers      || [];

  // KPIs
  var openJobs     = jobs.filter(function(j){ return j['Status'] === 'Open'; }).length;
  var totalCands   = cands.length;
  var applied      = cands.filter(function(c){ return c['Stage'] === 'Applied'; }).length;
  var interviewing = cands.filter(function(c){ return c['Stage'] === 'Interview'; }).length;
  var selected     = cands.filter(function(c){ return c['Stage'] === 'Selected'; }).length;
  var offered      = cands.filter(function(c){ return c['Stage'] === 'Offered'; }).length;
  var joined       = cands.filter(function(c){ return c['Stage'] === 'Joined'; }).length;
  var rejected     = cands.filter(function(c){ return c['Stage'] === 'Rejected'; }).length;

  var today        = new Date().toISOString().slice(0,10);
  var thisMonth    = new Date().toISOString().slice(0,7);
  var todayInts    = ints.filter(function(i){ return (i['Scheduled On']||'').slice(0,10) === today && i['Status'] === 'Scheduled'; }).length;
  var pendingOffs  = offs.filter(function(o){ return o['Offer Status'] === 'Sent'; }).length;
  var joinedMonth  = cands.filter(function(c){ return c['Stage'] === 'Joined' && (c['Last Modified']||'').slice(0,7) === thisMonth; }).length;
  var intDone      = ints.filter(function(i){ return i['Status'] === 'Done'; }).length;
  var intPass      = ints.filter(function(i){ return i['Result'] === 'Pass'; }).length;
  var passRate     = intDone > 0 ? Math.round(intPass / intDone * 100) : 0;
  var convRate     = totalCands > 0 ? Math.round(joined / totalCands * 100) : 0;

  // Dept breakdown
  var depts = {};
  jobs.forEach(function(j){ var d = j['Department']||'Other'; depts[d] = (depts[d]||0)+1; });

  // Source breakdown
  var sources = {};
  cands.forEach(function(c){ var s = c['Source']||'Unknown'; sources[s] = (sources[s]||0)+1; });

  // Monthly trend (last 6 months)
  var monthLabels = [], monthJoined = [];
  for (var m = 5; m >= 0; m--) {
    var d2 = new Date(); d2.setMonth(d2.getMonth() - m);
    var ym = d2.toISOString().slice(0,7);
    monthLabels.push(d2.toLocaleDateString('en-IN', { month: 'short' }));
    monthJoined.push(cands.filter(function(c){ return c['Stage']==='Joined' && (c['Applied On']||'').slice(0,7)===ym; }).length);
  }

  // Top jobs by candidates
  var jobCandCounts = jobs.map(function(j){
    return { title: j['Title'], count: cands.filter(function(c){ return c['Job ID']===j['Job ID']; }).length };
  }).sort(function(a,b){ return b.count - a.count; }).slice(0,5);

  // Recent activity
  var recentCands = cands.slice().sort(function(a,b){ return (b['Applied On']||'').localeCompare(a['Applied On']||''); }).slice(0,5);
  var recentInts  = ints.filter(function(i){ return i['Status']==='Scheduled'; }).sort(function(a,b){ return (a['Scheduled On']||'').localeCompare(b['Scheduled On']||''); }).slice(0,5);

  var html = `
  <!-- KPI Row 1 -->
  <div class="kpi-grid">
    ${_kpiCard('fa-briefcase','Open Positions', openJobs, 'red', 'Active job openings')}
    ${_kpiCard('fa-users','Total Candidates', totalCands, 'blue', 'In pipeline')}
    ${_kpiCard('fa-calendar-check','Interviews Today', todayInts, 'amber', 'Scheduled today')}
    ${_kpiCard('fa-file-signature','Pending Offers', pendingOffs, 'violet', 'Awaiting response')}
    ${_kpiCard('fa-user-check','Joined This Month', joinedMonth, 'green', 'New employees')}
    ${_kpiCard('fa-percent','Interview Pass Rate', passRate+'%', 'teal', intPass+' of '+intDone+' passed')}
    ${_kpiCard('fa-chart-line','Conversion Rate', convRate+'%', 'rose', joined+' of '+totalCands+' hired')}
    ${_kpiCard('fa-clock','Avg Pipeline', '14d', 'slate', 'Application to offer')}
  </div>

  <!-- Pipeline Stage Bar -->
  <div class="dash-section-card">
    <div class="dash-section-header">
      <h3><i class="fa-solid fa-filter-circle-dollar mr-2 text-red-600"></i>Recruitment Pipeline</h3>
      <span class="text-sm text-slate-400">${totalCands} total candidates</span>
    </div>
    <div class="pipeline-bar-wrap">
      <div class="pipeline-bar">
        ${_pipeBar('Applied',      applied,     totalCands, '#3B82F6')}
        ${_pipeBar('Interviewing', interviewing, totalCands, '#F59E0B')}
        ${_pipeBar('Selected',     selected,     totalCands, '#8B5CF6')}
        ${_pipeBar('Offered',      offered,      totalCands, '#EC4899')}
        ${_pipeBar('Joined',       joined,       totalCands, '#10B981')}
        ${_pipeBar('Rejected',     rejected,     totalCands, '#EF4444')}
      </div>
    </div>
    <div class="pipeline-legend">
      ${_pipeLeg('Applied',      applied,      '#3B82F6')}
      ${_pipeLeg('Interviewing', interviewing, '#F59E0B')}
      ${_pipeLeg('Selected',     selected,     '#8B5CF6')}
      ${_pipeLeg('Offered',      offered,      '#EC4899')}
      ${_pipeLeg('Joined',       joined,       '#10B981')}
      ${_pipeLeg('Rejected',     rejected,     '#EF4444')}
    </div>
  </div>

  <!-- Charts Row 1 -->
  <div class="charts-grid-2">
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-chart-pie mr-2 text-blue-600"></i>Candidate Stage Distribution</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cStage"></canvas></div>
    </div>
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-building mr-2 text-violet-600"></i>Hiring by Department</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cDept"></canvas></div>
    </div>
  </div>

  <!-- Charts Row 2 -->
  <div class="charts-grid-2">
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-chart-line mr-2 text-green-600"></i>Joinings Trend (6 Months)</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cTrend"></canvas></div>
    </div>
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-satellite-dish mr-2 text-amber-600"></i>Candidate Source Mix</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cSource"></canvas></div>
    </div>
  </div>

  <!-- Charts Row 3 -->
  <div class="charts-grid-2">
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-ranking-star mr-2 text-red-600"></i>Top Jobs by Applications</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cTopJobs"></canvas></div>
    </div>
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-scale-balanced mr-2 text-teal-600"></i>Interview Results Overview</h3>
      </div>
      <div class="chart-wrap-md"><canvas id="cIntResult"></canvas></div>
    </div>
  </div>

  <!-- Bottom Grid: Activity + Upcoming -->
  <div class="charts-grid-2">
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-bolt mr-2 text-amber-500"></i>Recent Applications</h3>
        <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('candidates')">View All →</button>
      </div>
      <div class="activity-list">
        ${recentCands.length ? recentCands.map(function(c){
          var job = (jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});
          return `<div class="activity-row">
            <div class="act-avatar">${(c['Full Name']||'?').charAt(0)}</div>
            <div class="act-info">
              <div class="act-name">${c['Full Name']}</div>
              <div class="act-sub">${job ? job['Title'] : '—'} · ${c['Source']||'—'}</div>
            </div>
            <span class="badge-stage ${_stageClass(c['Stage'])}">${c['Stage']}</span>
          </div>`;
        }).join('') : '<div class="empty-state-sm">No recent applications</div>'}
      </div>
    </div>
    <div class="dash-section-card">
      <div class="dash-section-header">
        <h3><i class="fa-solid fa-calendar-days mr-2 text-blue-500"></i>Upcoming Interviews</h3>
        <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('interviews')">View All →</button>
      </div>
      <div class="activity-list">
        ${recentInts.length ? recentInts.map(function(i){
          var c = (cands||[]).find(function(x){return x['Candidate ID']===i['Candidate ID'];});
          return `<div class="activity-row">
            <div class="act-icon-wrap"><i class="fa-solid fa-video text-blue-500"></i></div>
            <div class="act-info">
              <div class="act-name">${c ? c['Full Name'] : '—'}</div>
              <div class="act-sub">Round ${i['Round']} · ${i['Type']} · ${i['Mode']}</div>
            </div>
            <div class="act-date">${(i['Scheduled On']||'').slice(0,10)}</div>
          </div>`;
        }).join('') : '<div class="empty-state-sm">No upcoming interviews</div>'}
      </div>
    </div>
  </div>

  <!-- Job Status Summary Table -->
  <div class="dash-section-card">
    <div class="dash-section-header">
      <h3><i class="fa-solid fa-table-list mr-2 text-slate-600"></i>Job Opening Summary</h3>
      <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('jobs')">Manage Jobs →</button>
    </div>
    <div class="overflow-x-auto">
      <table class="insight-table">
        <thead><tr><th>Job Title</th><th>Department</th><th>Openings</th><th>Applicants</th><th>Interviews</th><th>Selected</th><th>Status</th></tr></thead>
        <tbody>
          ${jobs.slice(0,8).map(function(j){
            var jCands = cands.filter(function(c){return c['Job ID']===j['Job ID'];});
            var jInts  = ints.filter(function(i){return i['Job ID']===j['Job ID'];});
            var jSel   = jCands.filter(function(c){return c['Stage']==='Selected'||c['Stage']==='Offered'||c['Stage']==='Joined';}).length;
            return `<tr>
              <td class="font-semibold">${j['Title']}</td>
              <td>${j['Department']}</td>
              <td class="text-center">${j['Openings']}</td>
              <td class="text-center">${jCands.length}</td>
              <td class="text-center">${jInts.length}</td>
              <td class="text-center">${jSel}</td>
              <td><span class="badge-stage ${j['Status']==='Open'?'stage-joined':'stage-rejected'}">${j['Status']}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  _el('v-home').innerHTML = html;

  // Render all 6 charts
  setTimeout(function() {
    if (typeof Chart === 'undefined') return;
    ['cStage','cDept','cTrend','cSource','cTopJobs','cIntResult'].forEach(function(k){ _destroyChart(k); });

    var COLORS = ['#E31E24','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];
    var gridColor = '#F1F5F9', labelColor = '#64748B';
    var defOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: labelColor, font: { family: "'Plus Jakarta Sans'" } } } } };

    // 1) Stage doughnut
    var el1 = _el('cStage');
    if (el1) _charts['cStage'] = new Chart(el1, { type: 'doughnut', data: {
      labels: ['Applied','Interviewing','Selected','Offered','Joined','Rejected'],
      datasets: [{ data: [applied, interviewing, selected, offered, joined, rejected], backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }]
    }, options: Object.assign({}, defOpts, { cutout: '65%' }) });

    // 2) Dept bar
    var el2 = _el('cDept');
    if (el2) _charts['cDept'] = new Chart(el2, { type: 'bar', data: {
      labels: Object.keys(depts),
      datasets: [{ label: 'Jobs', data: Object.values(depts), backgroundColor: COLORS, borderRadius: 6, borderSkipped: false }]
    }, options: Object.assign({}, defOpts, { plugins: { legend: { display: false } }, scales: {
      x: { grid: { display: false }, ticks: { color: labelColor } },
      y: { grid: { color: gridColor }, ticks: { color: labelColor, stepSize: 1 } }
    }}) });

    // 3) Trend line
    var el3 = _el('cTrend');
    if (el3) _charts['cTrend'] = new Chart(el3, { type: 'line', data: {
      labels: monthLabels,
      datasets: [{ label: 'Joinings', data: monthJoined, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true, tension: 0.4, pointBackgroundColor: '#10B981', pointRadius: 4 }]
    }, options: Object.assign({}, defOpts, { plugins: { legend: { display: false } }, scales: {
      x: { grid: { display: false }, ticks: { color: labelColor } },
      y: { grid: { color: gridColor }, ticks: { color: labelColor, stepSize: 1 } }
    }}) });

    // 4) Source doughnut
    var el4 = _el('cSource');
    if (el4) _charts['cSource'] = new Chart(el4, { type: 'doughnut', data: {
      labels: Object.keys(sources),
      datasets: [{ data: Object.values(sources), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }]
    }, options: Object.assign({}, defOpts, { cutout: '60%' }) });

    // 5) Top jobs horizontal bar
    var el5 = _el('cTopJobs');
    if (el5) _charts['cTopJobs'] = new Chart(el5, { type: 'bar', data: {
      labels: jobCandCounts.map(function(x){ return x.title.length > 20 ? x.title.slice(0,20)+'…' : x.title; }),
      datasets: [{ label: 'Applicants', data: jobCandCounts.map(function(x){ return x.count; }), backgroundColor: '#E31E24', borderRadius: 6, borderSkipped: false }]
    }, options: Object.assign({}, defOpts, { indexAxis: 'y', plugins: { legend: { display: false } }, scales: {
      x: { grid: { color: gridColor }, ticks: { color: labelColor, stepSize: 1 } },
      y: { grid: { display: false }, ticks: { color: labelColor } }
    }}) });

    // 6) Interview result pie
    var intPass2  = ints.filter(function(i){ return i['Result']==='Pass'; }).length;
    var intFail   = ints.filter(function(i){ return i['Result']==='Fail'; }).length;
    var intPend   = ints.filter(function(i){ return i['Status']==='Scheduled'; }).length;
    var intCanc   = ints.filter(function(i){ return i['Status']==='Cancelled'; }).length;
    var el6 = _el('cIntResult');
    if (el6) _charts['cIntResult'] = new Chart(el6, { type: 'doughnut', data: {
      labels: ['Pass','Fail','Scheduled','Cancelled'],
      datasets: [{ data: [intPass2, intFail, intPend, intCanc], backgroundColor: ['#10B981','#EF4444','#F59E0B','#94A3B8'], borderWidth: 2, borderColor: '#fff' }]
    }, options: Object.assign({}, defOpts, { cutout: '60%' }) });

  }, 150);
}

function _kpiCard(icon, label, value, color, sub) {
  var colorMap = {
    red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
    green: 'bg-green-50 text-green-600', teal: 'bg-teal-50 text-teal-600',
    rose: 'bg-rose-50 text-rose-600', slate: 'bg-slate-100 text-slate-600'
  };
  var borderMap = {
    red: 'border-t-red-500', blue: 'border-t-blue-500',
    amber: 'border-t-amber-500', violet: 'border-t-violet-500',
    green: 'border-t-green-500', teal: 'border-t-teal-500',
    rose: 'border-t-rose-500', slate: 'border-t-slate-400'
  };
  return `<div class="kpi-card ${borderMap[color]||''}">
    <div class="kpi-ico-wrap ${colorMap[color]||''}"><i class="fa-solid fa-${icon}"></i></div>
    <div class="kpi-body">
      <div class="kpi-val">${value}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-sub">${sub}</div>
    </div>
  </div>`;
}

function _pipeBar(label, count, total, color) {
  var pct = total > 0 ? Math.max(count / total * 100, count > 0 ? 4 : 0) : 0;
  return `<div class="pipe-seg" style="width:${pct}%;background:${color}" title="${label}: ${count}"></div>`;
}

function _pipeLeg(label, count, color) {
  return `<div class="pipe-legend-item"><span class="pipe-dot" style="background:${color}"></span><span class="pipe-lbl">${label}</span><span class="pipe-cnt">${count}</span></div>`;
}

function _stageClass(stage) {
  var m = { Applied:'stage-applied', Interview:'stage-interview', Selected:'stage-selected',
    Offered:'stage-offered', Joined:'stage-joined', Rejected:'stage-rejected' };
  return m[stage] || 'stage-applied';
}

// ─── JOB OPENINGS ─────────────────────────────────────────────
function _renderJobs() {
  var jobs   = _D.jobs || [];
  var filter  = _el('jobFilter')  ? _el('jobFilter').value  : 'all';
  var deptF   = _el('jobDeptFilter') ? _el('jobDeptFilter').value : 'all';
  var locF    = _el('jobLocFilter')  ? _el('jobLocFilter').value  : 'all';
  var search  = _el('jobSearch')  ? _el('jobSearch').value.toLowerCase()  : '';
  var cands   = _D.candidates || [];

  // Build department and location options from data
  var allDepts = ['all'].concat([...new Set(jobs.map(function(j){return j['Department']||'';}).filter(Boolean))]);
  var allLocs  = ['all'].concat([...new Set(jobs.map(function(j){return j['Location']||'';}).filter(Boolean))]);

  var visible = jobs.filter(function(j) {
    if (filter !== 'all' && j['Status'] !== filter) return false;
    if (deptF !== 'all' && j['Department'] !== deptF) return false;
    if (locF  !== 'all' && j['Location']   !== locF)  return false;
    if (search && !(j['Title']||'').toLowerCase().includes(search) &&
                  !(j['Department']||'').toLowerCase().includes(search) &&
                  !(j['Location']||'').toLowerCase().includes(search) &&
                  !(j['Job ID']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  var deptOptHtml = allDepts.map(function(d){ return '<option value="'+d+'" '+(deptF===d?'selected':'')+'>'+(d==='all'?'All Departments':d)+'</option>'; }).join('');
  var locOptHtml  = allLocs.map(function(l){ return '<option value="'+l+'" '+(locF===l?'selected':'')+'>'+(l==='all'?'All Locations':l)+'</option>'; }).join('');

  var html = `
  <div class="view-toolbar">
    <div class="toolbar-left">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="jobSearch" type="text" placeholder="Search by title, dept, location..." value="${search}" oninput="_renderJobs()">
      </div>
      <select id="jobFilter" class="filter-select" onchange="_renderJobs()">
        <option value="all" ${filter==='all'?'selected':''}>All Status</option>
        <option value="Open" ${filter==='Open'?'selected':''}>🟢 Open</option>
        <option value="Closed" ${filter==='Closed'?'selected':''}>🔴 Closed</option>
        <option value="On Hold" ${filter==='On Hold'?'selected':''}>🟡 On Hold</option>
      </select>
      <select id="jobDeptFilter" class="filter-select" onchange="_renderJobs()">${deptOptHtml}</select>
      <select id="jobLocFilter" class="filter-select" onchange="_renderJobs()">${locOptHtml}</select>
    </div>
    <div class="toolbar-right">
      <span class="result-count">${visible.length} of ${jobs.length} job(s)</span>
      ${_hasWrite() ? '<button class="btn-primary-sm" onclick="_openJobModal()"><i class="fa-solid fa-plus mr-1"></i>Add Job</button>' : ''}
    </div>
  </div>
  ${_U && _U.role === 'candidate' ? '<div class="role-banner"><i class="fa-solid fa-eye mr-2"></i>Viewing as Candidate — Read Only</div>' : ''}

  <div class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Job ID</th>
          <th>Title</th>
          <th>Department</th>
          <th>Location</th>
          <th>Salary Range</th>
          <th>Openings</th>
          <th>Applicants</th>
          <th>Deadline</th>
          <th>Status</th>
          ${_hasWrite() ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${visible.length ? visible.map(function(j) {
          var cnt = cands.filter(function(c){ return c['Job ID']===j['Job ID']; }).length;
          var stCls = j['Status']==='Open' ? 'stage-joined' : j['Status']==='Closed' ? 'stage-rejected' : 'stage-applied';
          return `<tr>
            <td class="id-cell">${j['Job ID']}</td>
            <td class="font-semibold text-slate-800">${j['Title']}</td>
            <td>${j['Department']||'—'}</td>
            <td><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>${j['Location']||'—'}</td>
            <td class="text-green-700 font-medium">${j['Salary Range']||'—'}</td>
            <td class="text-center">${j['Openings']||1}</td>
            <td class="text-center">
              <button class="link-btn" onclick="_viewJobCands('${j['Job ID']}')">${cnt}</button>
            </td>
            <td class="${j['Deadline'] && j['Deadline'] < today ? 'text-red-500' : ''}">${j['Deadline']||'—'}</td>
            <td><span class="badge-stage ${stCls}">${j['Status']}</span></td>
            ${_hasWrite() ? `<td>
              <div class="action-btns">
                <button class="icon-btn" title="Edit" onclick="_editJob('${j['Job ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn" title="View Candidates" onclick="_viewJobCands('${j['Job ID']}')"><i class="fa-solid fa-users"></i></button>
                ${_isAdmin() && j['Status']==='Open' ? `<button class="icon-btn danger" title="Close Job" onclick="_closeJob('${j['Job ID']}')"><i class="fa-solid fa-ban"></i></button>` : ''}
              </div>
            </td>` : ''}
          </tr>`;
        }).join('') : `<tr><td colspan="10" class="empty-row">No jobs found matching your filter.</td></tr>`}
      </tbody>
    </table>
  </div>`;

  _el('v-jobs').innerHTML = html;
}

var today = new Date().toISOString().slice(0,10);

function _openJobModal(job) {
  var j = job || {};
  var depts = ['Production','Quality','Accounts','HR','Purchase','Sales','Admin','IT','Maintenance'];
  _showModal(j['Job ID'] ? 'Edit Job Opening' : 'New Job Opening', `
    <div class="form-grid-2">
      <div class="fg full">
        <label>Job Title <span class="req">*</span></label>
        <input id="f_title" value="${j['Title']||''}" placeholder="e.g. Production Supervisor">
      </div>
      <div class="fg">
        <label>Department</label>
        <select id="f_dept">${depts.map(function(d){ return `<option ${j['Department']===d?'selected':''}>${d}</option>`; }).join('')}</select>
      </div>
      <div class="fg">
        <label>Location</label>
        <input id="f_loc" value="${j['Location']||'Pune'}" placeholder="e.g. Pune">
      </div>
      <div class="fg">
        <label>Min Experience (yrs)</label>
        <input id="f_exp" type="number" min="0" value="${j['Min Experience']||0}">
      </div>
      <div class="fg">
        <label>No. of Openings</label>
        <input id="f_open" type="number" min="1" value="${j['Openings']||1}">
      </div>
      <div class="fg">
        <label>Salary Range</label>
        <input id="f_sal" value="${j['Salary Range']||''}" placeholder="e.g. 3-5 LPA">
      </div>
      <div class="fg">
        <label>Application Deadline</label>
        <input id="f_ddl" type="date" value="${j['Deadline']||''}">
      </div>
      <div class="fg full">
        <label>Job Description</label>
        <textarea id="f_desc" rows="3" placeholder="Describe responsibilities, skills needed...">${j['Description']||''}</textarea>
      </div>
    </div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-primary" onclick="_submitJob('${j['Job ID']||''}')"><i class="fa-solid fa-floppy-disk mr-1"></i>Save Job</button>`
  );
}

function _editJob(jobId) {
  var j = (_D.jobs||[]).find(function(x){ return x['Job ID']===jobId; });
  if (j) _openJobModal(j);
}

function _submitJob(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    jobId: existingId||null,
    title: _val('f_title'), department: _val('f_dept'), location: _val('f_loc'),
    minExp: _val('f_exp'), openings: _val('f_open'), salaryRange: _val('f_sal'),
    deadline: _val('f_ddl'), description: _val('f_desc')
  };
  if (!data.title) { _toast('Job title is required.','error'); _submitting=false; return; }
  _setBtnLoading('modal-btn-primary', true, 'Saving...');
  _api(existingId ? 'updateJob' : 'saveJob', data, function(r) {
    _submitting = false; _setBtnLoading('modal-btn-primary', false, 'Save Job');
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error, 'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _closeJob(jobId) {
  if (!confirm('Close this job opening? It will no longer accept new candidates.')) return;
  _api('closeJob', { jobId: jobId }, function(r) {
    if (r.success) { _toast('Job closed successfully.','success'); _loadData(); }
    else _toast(r.error,'error');
  });
}

function _viewJobCands(jobId) {
  _lv('candidates');
  setTimeout(function() {
    var el = _el('cndJobFilter');
    if (el) { el.value = jobId; _renderCandidates(); }
  }, 100);
}

// ─── CANDIDATES ───────────────────────────────────────────────
function _renderCandidates() {
  var cands  = _D.candidates || [];
  var jobs   = _D.jobs       || [];
  var search  = _el('cndSearch')       ? _el('cndSearch').value.toLowerCase()       : '';
  var stgF    = _el('cndStageFilter')  ? _el('cndStageFilter').value                : 'all';
  var jobF    = _el('cndJobFilter')    ? _el('cndJobFilter').value                  : 'all';
  var srcF    = _el('cndSrcFilter')    ? _el('cndSrcFilter').value                  : 'all';
  var expF    = _el('cndExpFilter')    ? _el('cndExpFilter').value                  : 'all';
  var deptF   = _el('cndDeptFilter')   ? _el('cndDeptFilter').value                 : 'all';

  var allSources = ['all'].concat([...new Set(cands.map(function(c){return c['Source']||'';}).filter(Boolean))]);
  var allDepts2  = ['all'].concat([...new Set(jobs.map(function(j){return j['Department']||'';}).filter(Boolean))]);

  var visible = cands.filter(function(c) {
    if (stgF !== 'all' && c['Stage'] !== stgF) return false;
    if (jobF !== 'all' && c['Job ID'] !== jobF) return false;
    if (srcF !== 'all' && c['Source'] !== srcF) return false;
    if (deptF !== 'all') {
      var cJob = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
      if (!cJob || cJob['Department'] !== deptF) return false;
    }
    if (expF !== 'all') {
      var exp = parseFloat(c['Experience (Yrs)']||0);
      if (expF === '0-2'  && exp > 2)  return false;
      if (expF === '2-5'  && (exp < 2 || exp > 5))  return false;
      if (expF === '5-10' && (exp < 5 || exp > 10)) return false;
      if (expF === '10+'  && exp < 10) return false;
    }
    if (search && !(c['Full Name']||'').toLowerCase().includes(search) &&
                  !(c['Email']||'').toLowerCase().includes(search) &&
                  !(c['Phone']||'').toLowerCase().includes(search) &&
                  !(c['Current Company']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  var jobOpts  = '<option value="all">All Jobs</option>' + jobs.map(function(j){ return '<option value="'+j['Job ID']+'" '+(jobF===j['Job ID']?'selected':'')+'>'+j['Title']+'</option>'; }).join('');
  var srcOpts  = allSources.map(function(s){ return '<option value="'+s+'" '+(srcF===s?'selected':'')+'>'+(s==='all'?'All Sources':s)+'</option>'; }).join('');
  var deptOpts = allDepts2.map(function(d){ return '<option value="'+d+'" '+(deptF===d?'selected':'')+'>'+(d==='all'?'All Departments':d)+'</option>'; }).join('');

  var html = `
  <div class="view-toolbar" style="flex-wrap:wrap;gap:10px;">
    <div class="toolbar-left" style="flex-wrap:wrap;">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="cndSearch" type="text" placeholder="Name, email, phone, company..." value="${search}" oninput="_renderCandidates()">
      </div>
      <select id="cndStageFilter" class="filter-select" onchange="_renderCandidates()">
        <option value="all" ${stgF==='all'?'selected':''}>All Stages</option>
        ${['Applied','Interview','Selected','Offered','Joined','Rejected'].map(function(s){ return '<option value="'+s+'" '+(stgF===s?'selected':'')+'>'+s+'</option>'; }).join('')}
      </select>
      <select id="cndJobFilter" class="filter-select" onchange="_renderCandidates()">${jobOpts}</select>
      <select id="cndDeptFilter" class="filter-select" onchange="_renderCandidates()">${deptOpts}</select>
      <select id="cndSrcFilter" class="filter-select" onchange="_renderCandidates()">${srcOpts}</select>
      <select id="cndExpFilter" class="filter-select" onchange="_renderCandidates()">
        <option value="all" ${expF==='all'?'selected':''}>All Experience</option>
        <option value="0-2" ${expF==='0-2'?'selected':''}>0–2 years</option>
        <option value="2-5" ${expF==='2-5'?'selected':''}>2–5 years</option>
        <option value="5-10" ${expF==='5-10'?'selected':''}>5–10 years</option>
        <option value="10+" ${expF==='10+'?'selected':''}>10+ years</option>
      </select>
    </div>
    <div class="toolbar-right">
      <span class="result-count">${visible.length} of ${cands.length}</span>
      ${_hasWrite() ? '<button class="btn-primary-sm" onclick="_openCndModal()"><i class="fa-solid fa-user-plus mr-1"></i>Add Candidate</button>' : ''}
    </div>
  </div>
  ${_U && _U.role === 'candidate' ? '<div class="role-banner"><i class="fa-solid fa-eye mr-2"></i>Viewing as Candidate — Read Only Mode</div>' : ''}

  <div class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Contact</th><th>Job Applied</th>
          <th>Company</th><th>Experience</th><th>CTC (Curr/Exp)</th>
          <th>Source</th><th>Stage</th><th>Applied On</th>
          ${_hasWrite() ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${visible.length ? visible.map(function(c) {
          var job = jobs.find(function(j){ return j['Job ID']===c['Job ID']; });
          return `<tr>
            <td class="id-cell">${c['Candidate ID']}</td>
            <td>
              <div class="name-cell">
                <div class="name-avatar">${(c['Full Name']||'?').charAt(0)}</div>
                <div>
                  <div class="font-semibold text-slate-800">${c['Full Name']}</div>
                  <div class="text-xs text-slate-400">${c['Email']||''}</div>
                </div>
              </div>
            </td>
            <td class="text-slate-600">${c['Phone']||'—'}</td>
            <td class="text-slate-700 font-medium">${job ? job['Title'] : '—'}</td>
            <td>${c['Current Company']||'—'}</td>
            <td class="text-center">${c['Experience (Yrs)']||0} yrs</td>
            <td class="text-sm">${c['Current CTC']||'—'} / <span class="text-green-700">${c['Expected CTC']||'—'}</span></td>
            <td><span class="source-tag">${c['Source']||'—'}</span></td>
            <td><span class="badge-stage ${_stageClass(c['Stage'])}">${c['Stage']}</span></td>
            <td class="text-slate-500 text-xs">${c['Applied On']||'—'}</td>
            ${_hasWrite() ? `<td>
              <div class="action-btns">
                <button class="icon-btn" title="View Detail" onclick="_openCndDetail('${c['Candidate ID']}')"><i class="fa-solid fa-eye"></i></button>
                <button class="icon-btn" title="Edit" onclick="_editCnd('${c['Candidate ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                ${c['Stage']==='Applied' ? `<button class="icon-btn success" title="Schedule Interview" onclick="_scheduleInterviewFrom('${c['Candidate ID']}')"><i class="fa-solid fa-calendar-plus"></i></button>` : ''}
                ${c['Stage']==='Selected' ? `<button class="icon-btn success" title="Create Offer" onclick="_createOfferFrom('${c['Candidate ID']}')"><i class="fa-solid fa-file-signature"></i></button>` : ''}
              </div>
            </td>` : ''}
          </tr>`;
        }).join('') : `<tr><td colspan="11" class="empty-row">No candidates found.</td></tr>`}
      </tbody>
    </table>
  </div>`;

  _el('v-candidates').innerHTML = html;
}

function _openCndModal(cnd) {
  var c = cnd || {};
  var jobs = _D.jobs || [];
  var jobOpts = jobs.map(function(j){ return `<option value="${j['Job ID']}" ${c['Job ID']===j['Job ID']?'selected':''}>${j['Title']}</option>`; }).join('');
  var sources = ['Portal','Referral','LinkedIn','Direct Walk-in','Agency','Campus','Other'];

  _showModal(c['Candidate ID'] ? 'Edit Candidate' : 'Add Candidate', `
    <div class="form-grid-2">
      <div class="fg">
        <label>Full Name <span class="req">*</span></label>
        <input id="c_name" value="${c['Full Name']||''}" placeholder="Candidate full name">
      </div>
      <div class="fg">
        <label>Phone <span class="req">*</span></label>
        <input id="c_phone" type="tel" value="${c['Phone']||''}" placeholder="10-digit mobile">
      </div>
      <div class="fg">
        <label>Email</label>
        <input id="c_email" type="email" value="${c['Email']||''}" placeholder="email@example.com">
      </div>
      <div class="fg">
        <label>Job Applied For <span class="req">*</span></label>
        <select id="c_job">${jobOpts}</select>
      </div>
      <div class="fg">
        <label>Current Company</label>
        <input id="c_co" value="${c['Current Company']||''}" placeholder="Company name">
      </div>
      <div class="fg">
        <label>Experience (years)</label>
        <input id="c_exp" type="number" min="0" step="0.5" value="${c['Experience (Yrs)']||0}">
      </div>
      <div class="fg">
        <label>Current CTC (LPA)</label>
        <input id="c_cctc" value="${c['Current CTC']||''}" placeholder="e.g. 3.5">
      </div>
      <div class="fg">
        <label>Expected CTC (LPA)</label>
        <input id="c_ectc" value="${c['Expected CTC']||''}" placeholder="e.g. 5.0">
      </div>
      <div class="fg">
        <label>Source</label>
        <select id="c_src">${sources.map(function(s){ return `<option ${c['Source']===s?'selected':''}>${s}</option>`; }).join('')}</select>
      </div>
      <div class="fg">
        <label>Resume Link (Google Drive)</label>
        <input id="c_res" value="${c['Resume Link']||''}" placeholder="https://drive.google.com/...">
      </div>
    </div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-primary" onclick="_submitCandidate('${c['Candidate ID']||''}')"><i class="fa-solid fa-floppy-disk mr-1"></i>Save Candidate</button>`
  );
}

function _editCnd(candidateId) {
  var c = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; });
  if (c) _openCndModal(c);
}

function _submitCandidate(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    candidateId: existingId||null,
    name: _val('c_name'), phone: _val('c_phone'), email: _val('c_email'),
    jobId: _val('c_job'), currentCompany: _val('c_co'), experience: _val('c_exp'),
    currentCtc: _val('c_cctc'), expectedCtc: _val('c_ectc'),
    source: _val('c_src'), resumeLink: _val('c_res')
  };
  if (!data.name || !data.phone) { _toast('Name and phone are required.','error'); _submitting=false; return; }
  _api(existingId ? 'updateCandidate' : 'saveCandidate', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _openCndDetail(candidateId) {
  var c     = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; }); if (!c) return;
  var job   = (_D.jobs||[]).find(function(j){ return j['Job ID']===c['Job ID']; });
  var cInts = (_D.interviews||[]).filter(function(i){ return i['Candidate ID']===candidateId; });
  var offer = (_D.offers||[]).find(function(o){ return o['Candidate ID']===candidateId; });

  var intHtml = cInts.length ? cInts.map(function(i){
    var rc = i['Result']==='Pass' ? 'stage-joined' : i['Result']==='Fail' ? 'stage-rejected' : 'stage-interview';
    return `<div class="timeline-item">
      <div class="timeline-dot ${i['Result']==='Pass'?'dot-green':i['Result']==='Fail'?'dot-red':'dot-amber'}"></div>
      <div class="timeline-body">
        <div class="tl-head">Round ${i['Round']} — ${i['Type']} <span class="badge-stage ${rc} ml-2">${i['Result']||i['Status']}</span></div>
        <div class="tl-sub">${i['Scheduled On']} · ${i['Interviewer']} · ${i['Mode']}</div>
        ${i['Feedback'] ? `<div class="tl-feedback">"${i['Feedback']}"</div>` : ''}
        ${_hasWrite() && i['Status']==='Scheduled' ? `<button class="link-btn mt-1" onclick="_markInterviewResult('${i['Interview ID']}','${candidateId}')"><i class="fa-solid fa-pen mr-1"></i>Mark Result</button>` : ''}
      </div>
    </div>`;
  }).join('') : '<div class="text-slate-400 text-sm py-2">No interviews scheduled yet.</div>';

  var offerHtml = offer ? `
    <div class="detail-offer-card">
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold text-slate-700">Offer Letter</div>
        <span class="badge-stage ${offer['Offer Status']==='Accepted'?'stage-joined':offer['Offer Status']==='Declined'?'stage-rejected':'stage-offered'}">${offer['Offer Status']}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div><span class="text-slate-400">CTC:</span> <strong class="text-green-700">${offer['Offered CTC']} LPA</strong></div>
        <div><span class="text-slate-400">Joining:</span> ${offer['Joining Date']}</div>
      </div>
      ${_hasWrite() && offer['Offer Status']==='Sent' ? `
        <div class="flex gap-2 mt-3">
          <button class="modal-btn-primary small" onclick="_updateOfferStatus('${offer['Offer ID']}','${candidateId}','Accepted');_closeModal()"><i class="fa-solid fa-check mr-1"></i>Mark Accepted</button>
          <button class="modal-btn-danger small" onclick="_updateOfferStatus('${offer['Offer ID']}','${candidateId}','Declined');_closeModal()">Mark Declined</button>
        </div>` : ''}
      ${_hasWrite() && offer['Offer Status']==='Accepted' ? `
        <button class="modal-btn-primary small mt-3" onclick="_confirmJoining('${offer['Offer ID']}','${candidateId}');"><i class="fa-solid fa-flag-checkered mr-1"></i>Confirm Joining</button>` : ''}
    </div>` : '';

  _showModal(`${c['Full Name']} — Profile`, `
    <div class="detail-header">
      <div class="detail-avatar">${(c['Full Name']||'?').charAt(0)}</div>
      <div>
        <div class="detail-name">${c['Full Name']}</div>
        <div class="detail-meta">${c['Email']||''} · ${c['Phone']||''}</div>
        <span class="badge-stage ${_stageClass(c['Stage'])}">${c['Stage']}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-field"><label>Job Applied</label><span>${job ? job['Title'] : '—'}</span></div>
      <div class="detail-field"><label>Current Company</label><span>${c['Current Company']||'—'}</span></div>
      <div class="detail-field"><label>Experience</label><span>${c['Experience (Yrs)']||0} years</span></div>
      <div class="detail-field"><label>Current CTC</label><span>${c['Current CTC']||'—'}</span></div>
      <div class="detail-field"><label>Expected CTC</label><span class="text-green-700 font-semibold">${c['Expected CTC']||'—'}</span></div>
      <div class="detail-field"><label>Source</label><span>${c['Source']||'—'}</span></div>
      <div class="detail-field"><label>Applied On</label><span>${c['Applied On']||'—'}</span></div>
      ${c['Resume Link'] ? `<div class="detail-field"><label>Resume</label><a href="${c['Resume Link']}" target="_blank" class="link-btn">View Resume <i class="fa-solid fa-external-link ml-1"></i></a></div>` : ''}
    </div>
    <div class="detail-section-title">Interview History</div>
    <div class="timeline">${intHtml}</div>
    ${offerHtml}`,
    `<div class="flex gap-2 flex-wrap">
      <button class="modal-btn-secondary" onclick="_editCnd('${candidateId}');_closeModal()"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
      ${_hasWrite() && c['Stage']==='Applied' ? `<button class="modal-btn-primary" onclick="_scheduleInterviewFrom('${candidateId}')"><i class="fa-solid fa-calendar-plus mr-1"></i>Schedule Interview</button>` : ''}
      ${_hasWrite() && c['Stage']==='Selected' ? `<button class="modal-btn-primary" onclick="_createOfferFrom('${candidateId}')"><i class="fa-solid fa-file-signature mr-1"></i>Create Offer</button>` : ''}
      <button class="modal-btn-secondary ml-auto" onclick="_closeModal()">Close</button>
    </div>`
  );
}

function _scheduleInterviewFrom(cid) { _closeModal(); setTimeout(function() { _openInterviewModal(null, cid); }, 250); }
function _createOfferFrom(cid)       { _closeModal(); setTimeout(function() { _openOfferModal(null, cid); }, 250); }

// ─── INTERVIEWS ───────────────────────────────────────────────
function _renderInterviews() {
  var ints   = _D.interviews || [];
  var cands  = _D.candidates || [];
  var filter = _el('intFilter')  ? _el('intFilter').value  : 'all';
  var search = _el('intSearch')  ? _el('intSearch').value.toLowerCase()  : '';

  var visible = ints.filter(function(i) {
    if (filter !== 'all' && i['Status'] !== filter) return false;
    var c = cands.find(function(x){ return x['Candidate ID']===i['Candidate ID']; });
    if (search && !(c && (c['Full Name']||'').toLowerCase().includes(search))) return false;
    return true;
  }).sort(function(a,b){ return (a['Scheduled On']||'').localeCompare(b['Scheduled On']||''); });

  var allTypes = ['all'].concat([...new Set(ints.map(function(i){return i['Type']||'';}).filter(Boolean))]);
  var allModes = ['all'].concat([...new Set(ints.map(function(i){return i['Mode']||'';}).filter(Boolean))]);
  var typeF = _el('intTypeFilter') ? _el('intTypeFilter').value : 'all';
  var modeF = _el('intModeFilter') ? _el('intModeFilter').value : 'all';
  var roundF = _el('intRoundFilter') ? _el('intRoundFilter').value : 'all';
  var resultF = _el('intResultFilter') ? _el('intResultFilter').value : 'all';

  // re-filter with extra filters
  visible = visible.filter(function(i){
    if (typeF !== 'all'   && i['Type']   !== typeF)   return false;
    if (modeF !== 'all'   && i['Mode']   !== modeF)   return false;
    if (roundF !== 'all'  && String(i['Round']) !== roundF) return false;
    if (resultF !== 'all' && i['Result']  !== resultF) return false;
    return true;
  });

  var typeOpts = allTypes.map(function(t){ return '<option value="'+t+'" '+(typeF===t?'selected':'')+'>'+(t==='all'?'All Types':t)+'</option>'; }).join('');
  var modeOpts = allModes.map(function(m){ return '<option value="'+m+'" '+(modeF===m?'selected':'')+'>'+(m==='all'?'All Modes':m)+'</option>'; }).join('');

  var html = `
  <div class="view-toolbar" style="flex-wrap:wrap;gap:10px;">
    <div class="toolbar-left" style="flex-wrap:wrap;">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="intSearch" type="text" placeholder="Search by candidate name..." value="${search}" oninput="_renderInterviews()">
      </div>
      <select id="intFilter" class="filter-select" onchange="_renderInterviews()">
        <option value="all" ${filter==='all'?'selected':''}>All Status</option>
        <option value="Scheduled" ${filter==='Scheduled'?'selected':''}>Scheduled</option>
        <option value="Done" ${filter==='Done'?'selected':''}>Done</option>
        <option value="Cancelled" ${filter==='Cancelled'?'selected':''}>Cancelled</option>
      </select>
      <select id="intTypeFilter" class="filter-select" onchange="_renderInterviews()">${typeOpts}</select>
      <select id="intModeFilter" class="filter-select" onchange="_renderInterviews()">${modeOpts}</select>
      <select id="intRoundFilter" class="filter-select" onchange="_renderInterviews()">
        <option value="all" ${roundF==='all'?'selected':''}>All Rounds</option>
        <option value="1" ${roundF==='1'?'selected':''}>Round 1</option>
        <option value="2" ${roundF==='2'?'selected':''}>Round 2</option>
        <option value="3" ${roundF==='3'?'selected':''}>Round 3</option>
      </select>
      <select id="intResultFilter" class="filter-select" onchange="_renderInterviews()">
        <option value="all" ${resultF==='all'?'selected':''}>All Results</option>
        <option value="Pass" ${resultF==='Pass'?'selected':''}>✅ Pass</option>
        <option value="Fail" ${resultF==='Fail'?'selected':''}>❌ Fail</option>
        <option value="Hold" ${resultF==='Hold'?'selected':''}>⏸ Hold</option>
      </select>
    </div>
    <div class="toolbar-right">
      <span class="result-count">${visible.length} of ${ints.length}</span>
      ${_hasWrite() ? '<button class="btn-primary-sm" onclick="_openInterviewModal()"><i class="fa-solid fa-calendar-plus mr-1"></i>Schedule Interview</button>' : ''}
    </div>
  </div>

  <div class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Candidate</th><th>Job Role</th><th>Round</th><th>Type</th>
          <th>Scheduled On</th><th>Interviewer</th><th>Mode</th><th>Status</th><th>Result</th>
          ${_hasWrite() ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${visible.length ? visible.map(function(i) {
          var c   = cands.find(function(x){ return x['Candidate ID']===i['Candidate ID']; });
          var job = (_D.jobs||[]).find(function(j){ return j['Job ID']===i['Job ID']; });
          var stCls = i['Status']==='Done' ? 'stage-joined' : i['Status']==='Cancelled' ? 'stage-rejected' : 'stage-interview';
          var resCls = i['Result']==='Pass' ? 'stage-joined' : i['Result']==='Fail' ? 'stage-rejected' : i['Result']==='Hold' ? 'stage-offered' : '';
          return `<tr>
            <td class="id-cell">${i['Interview ID']}</td>
            <td>
              <div class="name-cell">
                <div class="name-avatar sm">${c ? (c['Full Name']||'?').charAt(0) : '?'}</div>
                <span class="font-medium text-slate-700">${c ? c['Full Name'] : '—'}</span>
              </div>
            </td>
            <td class="text-slate-600">${job ? job['Title'] : '—'}</td>
            <td class="text-center"><span class="round-badge">R${i['Round']||1}</span></td>
            <td>${i['Type']||'—'}</td>
            <td>${i['Scheduled On']||'—'}</td>
            <td>${i['Interviewer']||'—'}</td>
            <td>
              ${i['Meeting Link'] ? `<a href="${i['Meeting Link']}" target="_blank" class="link-btn"><i class="fa-solid fa-video mr-1"></i>${i['Mode']||'Online'}</a>` : (i['Mode']||'—')}
            </td>
            <td><span class="badge-stage ${stCls}">${i['Status']}</span></td>
            <td>${i['Result'] ? `<span class="badge-stage ${resCls}">${i['Result']}</span>` : '<span class="text-slate-300">—</span>'}</td>
            ${_hasWrite() ? `<td>
              <div class="action-btns">
                ${i['Status']==='Scheduled' ? `<button class="icon-btn success" title="Mark Result" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')"><i class="fa-solid fa-check-to-slot"></i></button>` : ''}
                ${i['Status']==='Scheduled' ? `<button class="icon-btn danger" title="Cancel" onclick="_cancelInterview('${i['Interview ID']}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
                ${i['Feedback'] ? `<button class="icon-btn" title="Feedback: ${i['Feedback']}"><i class="fa-solid fa-comment-dots"></i></button>` : ''}
              </div>
            </td>` : ''}
          </tr>`;
        }).join('') : `<tr><td colspan="11" class="empty-row">No interviews found.</td></tr>`}
      </tbody>
    </table>
  </div>`;

  _el('v-interviews').innerHTML = html;
}

function _openInterviewModal(interview, preCandidateId) {
  var eligibleCands = (_D.candidates||[]).filter(function(c){ return ['Applied','Interview','Selected'].indexOf(c['Stage']) >= 0; });
  var cndOpts = eligibleCands.map(function(c){ return `<option value="${c['Candidate ID']}" ${preCandidateId===c['Candidate ID']?'selected':''}>${c['Full Name']}</option>`; }).join('');
  if (!cndOpts) { _toast('No eligible candidates (Applied/Interview stage) found.', 'warning'); return; }

  _showModal('Schedule Interview', `
    <div class="form-grid-2">
      <div class="fg full">
        <label>Candidate <span class="req">*</span></label>
        <select id="i_cnd">${cndOpts}</select>
      </div>
      <div class="fg">
        <label>Round</label>
        <select id="i_round">
          <option value="1">Round 1</option><option value="2">Round 2</option>
          <option value="3">Round 3 (Final)</option>
        </select>
      </div>
      <div class="fg">
        <label>Interview Type</label>
        <select id="i_type">
          <option>HR</option><option>Technical</option><option>Final</option>
          <option>Task / Assignment</option><option>Group Discussion</option>
        </select>
      </div>
      <div class="fg full">
        <label>Scheduled Date & Time <span class="req">*</span></label>
        <input id="i_sched" type="datetime-local">
      </div>
      <div class="fg">
        <label>Interviewer Name <span class="req">*</span></label>
        <input id="i_iname" placeholder="e.g. Rahul Sharma">
      </div>
      <div class="fg">
        <label>Mode</label>
        <select id="i_mode">
          <option>In-Person</option><option>Online (Video)</option><option>Telephonic</option>
        </select>
      </div>
      <div class="fg full">
        <label>Meeting Link (optional)</label>
        <input id="i_link" placeholder="https://meet.google.com/...">
      </div>
    </div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-primary" onclick="_submitInterview()"><i class="fa-solid fa-calendar-check mr-1"></i>Schedule</button>`
  );
}

function _submitInterview() {
  if (_submitting) return; _submitting = true;
  var cid = _val('i_cnd');
  var c   = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===cid; });
  var data = {
    candidateId: cid, candidateName: c?c['Full Name']:'', candidateEmail: c?c['Email']:'',
    jobId: c?c['Job ID']:'', round: _val('i_round'), type: _val('i_type'),
    scheduledOn: _val('i_sched'), interviewer: _val('i_iname'),
    mode: _val('i_mode'), meetingLink: _val('i_link')
  };
  if (!data.scheduledOn || !data.interviewer) { _toast('Date and interviewer are required.','error'); _submitting=false; return; }
  _api('saveInterview', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal('Mark Interview Result', `
    <div class="form-grid-1">
      <div class="fg">
        <label>Result <span class="req">*</span></label>
        <select id="r_res">
          <option value="">— Select Result —</option>
          <option value="Pass">✅ Pass</option>
          <option value="Fail">❌ Fail</option>
          <option value="Hold">⏸ On Hold</option>
        </select>
      </div>
      <div class="fg">
        <label>Feedback / Notes</label>
        <textarea id="r_fb" rows="3" placeholder="Add interviewer feedback, strengths, areas of improvement..."></textarea>
      </div>
    </div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-primary" onclick="_submitInterviewResult('${interviewId}','${candidateId}')"><i class="fa-solid fa-floppy-disk mr-1"></i>Save Result</button>`
  );
}

function _submitInterviewResult(interviewId, candidateId) {
  if (_submitting) return; _submitting = true;
  var result = _val('r_res');
  if (!result) { _toast('Please select a result.','error'); _submitting=false; return; }
  _api('updateInterview', {
    interviewId: interviewId, candidateId: candidateId,
    status: 'Done', result: result, feedback: _val('r_fb')
  }, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('Result saved. Candidate stage updated.','success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _cancelInterview(interviewId) {
  if (!confirm('Cancel this interview?')) return;
  _api('updateInterview', { interviewId: interviewId, status: 'Cancelled', result: '', feedback: '' },
    function(r) { if (r.success) { _toast('Interview cancelled.','success'); _loadData(); } else _toast(r.error,'error'); }
  );
}

// ─── OFFER LETTERS ────────────────────────────────────────────
function _renderOffers() {
  var offs  = _D.offers     || [];
  var cands = _D.candidates || [];
  var jobs  = _D.jobs       || [];
  var filter = _el('offFilter') ? _el('offFilter').value : 'all';

  var visible = offs.filter(function(o){ return filter==='all' || o['Offer Status']===filter; });

  var offSearch = _el('offSearch') ? _el('offSearch').value.toLowerCase() : '';
  visible = visible.filter(function(o){
    if (!offSearch) return true;
    var c = cands.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
    return c && (c['Full Name']||'').toLowerCase().includes(offSearch);
  });
  var html = `
  <div class="view-toolbar">
    <div class="toolbar-left">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="offSearch" type="text" placeholder="Search by candidate..." value="${offSearch}" oninput="_renderOffers()">
      </div>
      <select id="offFilter" class="filter-select" onchange="_renderOffers()">
        <option value="all" ${filter==='all'?'selected':''}>All Offers</option>
        <option value="Sent" ${filter==='Sent'?'selected':''}>📤 Sent</option>
        <option value="Accepted" ${filter==='Accepted'?'selected':''}>✅ Accepted</option>
        <option value="Declined" ${filter==='Declined'?'selected':''}>❌ Declined</option>
        <option value="Expired" ${filter==='Expired'?'selected':''}>⏰ Expired</option>
      </select>
      <select id="offMonthFilter" class="filter-select" onchange="_renderOffers()">
        <option value="all">All Time</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_year">This Year</option>
      </select>
    </div>
    <div class="toolbar-right">
      <span class="result-count">${visible.length} of ${offs.length}</span>
      ${_hasWrite() ? '<button class="btn-primary-sm" onclick="_openOfferModal()"><i class="fa-solid fa-file-signature mr-1"></i>Create Offer</button>' : ''}
    </div>
  </div>

  <div class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Offer ID</th><th>Candidate</th><th>Job Role</th>
          <th>Offered CTC</th><th>Joining Date</th><th>Sent On</th>
          <th>Status</th>${_hasWrite() ? '<th>Actions</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${visible.length ? visible.map(function(o) {
          var c   = cands.find(function(x){ return x['Candidate ID']===o['Candidate ID']; });
          var job = jobs.find(function(j){ return j['Job ID']===o['Job ID']; });
          var stCls = o['Offer Status']==='Accepted' ? 'stage-joined' : o['Offer Status']==='Declined' ? 'stage-rejected' : 'stage-offered';
          return `<tr>
            <td class="id-cell">${o['Offer ID']}</td>
            <td>
              <div class="name-cell">
                <div class="name-avatar sm">${c ? (c['Full Name']||'?').charAt(0) : '?'}</div>
                <span class="font-medium text-slate-700">${c ? c['Full Name'] : '—'}</span>
              </div>
            </td>
            <td class="text-slate-600">${job ? job['Title'] : '—'}</td>
            <td class="text-green-700 font-bold">${o['Offered CTC']} LPA</td>
            <td>${o['Joining Date']||'—'}</td>
            <td class="text-slate-400 text-xs">${o['Sent On']||'—'}</td>
            <td><span class="badge-stage ${stCls}">${o['Offer Status']}</span></td>
            ${_hasWrite() ? `<td>
              <div class="action-btns">
                ${o['Offer Status']==='Sent' ? `
                  <button class="icon-btn success" title="Mark Accepted" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Accepted')"><i class="fa-solid fa-check"></i></button>
                  <button class="icon-btn danger" title="Mark Declined" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Declined')"><i class="fa-solid fa-xmark"></i></button>` : ''}
                ${o['Offer Status']==='Accepted' ? `
                  <button class="icon-btn success" title="Confirm Joining" onclick="_confirmJoining('${o['Offer ID']}','${o['Candidate ID']}')"><i class="fa-solid fa-flag-checkered"></i></button>` : ''}
              </div>
            </td>` : ''}
          </tr>`;
        }).join('') : `<tr><td colspan="8" class="empty-row">No offer letters found.</td></tr>`}
      </tbody>
    </table>
  </div>`;

  _el('v-offers').innerHTML = html;
}

function _openOfferModal(offer, preCandidateId) {
  var selCands = (_D.candidates||[]).filter(function(c){ return c['Stage']==='Selected'; });
  var cndOpts  = selCands.map(function(c){ return `<option value="${c['Candidate ID']}" ${preCandidateId===c['Candidate ID']?'selected':''}>${c['Full Name']}</option>`; }).join('');
  if (!cndOpts) { _toast('No candidates in "Selected" stage. Mark interview as Pass first.','warning'); return; }

  _showModal('Create Offer Letter', `
    <div class="form-grid-2">
      <div class="fg full">
        <label>Candidate <span class="req">*</span></label>
        <select id="o_cnd">${cndOpts}</select>
      </div>
      <div class="fg">
        <label>Offered CTC (LPA) <span class="req">*</span></label>
        <input id="o_ctc" type="number" step="0.1" placeholder="e.g. 4.5">
      </div>
      <div class="fg">
        <label>Joining Date <span class="req">*</span></label>
        <input id="o_jdate" type="date">
      </div>
      <div class="fg full">
        <label>Designation</label>
        <input id="o_desg" placeholder="e.g. Production Engineer">
      </div>
    </div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-primary" onclick="_submitOffer()"><i class="fa-solid fa-file-signature mr-1"></i>Create Offer</button>`
  );
}

function _submitOffer() {
  if (_submitting) return; _submitting = true;
  var cid = _val('o_cnd');
  var c   = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===cid; });
  var data = {
    candidateId: cid, jobId: c?c['Job ID']:'',
    offeredCtc: _val('o_ctc'), joiningDate: _val('o_jdate'), designation: _val('o_desg')
  };
  if (!data.offeredCtc || !data.joiningDate) { _toast('CTC and joining date are required.','error'); _submitting=false; return; }
  _api('saveOffer', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _updateOfferStatus(offerId, candidateId, status) {
  _api('updateOfferStatus', { offerId: offerId, candidateId: candidateId, status: status }, function(r) {
    if (r.success) { _toast('Offer marked as ' + status + '.','success'); _loadData(); }
    else _toast(r.error,'error');
  });
}

function _confirmJoining(offerId, candidateId) {
  var c     = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; });
  var offer = (_D.offers||[]).find(function(o){ return o['Offer ID']===offerId; });
  if (!c || !offer) return;
  var job = (_D.jobs||[]).find(function(j){ return j['Job ID']===c['Job ID']; });

  _showModal('🎉 Confirm Joining', `
    <div class="joining-confirm-banner">
      <i class="fa-solid fa-champagne-glasses text-2xl"></i>
      <div>
        <div class="font-bold">${c['Full Name']} is joining!</div>
        <div class="text-sm opacity-75">Joining Date: ${offer['Joining Date']} · CTC: ${offer['Offered CTC']} LPA</div>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="fg">
        <label>Department</label>
        <input id="j_dept" value="${job ? job['Department']||'' : ''}" placeholder="Department">
      </div>
      <div class="fg">
        <label>Designation</label>
        <input id="j_desg" placeholder="e.g. Production Engineer">
      </div>
      <div class="fg full">
        <label>Reporting Manager</label>
        <input id="j_mgr" placeholder="Manager name">
      </div>
    </div>
    <div class="info-note"><i class="fa-solid fa-circle-info mr-1"></i>An Employee record will be auto-created in the Employees sheet.</div>`,
    `<button class="modal-btn-secondary" onclick="_closeModal()">Cancel</button>
     <button class="modal-btn-success" onclick="_submitJoining('${offerId}','${candidateId}')"><i class="fa-solid fa-flag-checkered mr-1"></i>Confirm Joining</button>`
  );
}

function _submitJoining(offerId, candidateId) {
  if (_submitting) return; _submitting = true;
  var c     = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; });
  var offer = (_D.offers||[]).find(function(o){ return o['Offer ID']===offerId; });
  _api('confirmJoining', {
    offerId: offerId, candidateId: candidateId,
    candidateName: c['Full Name'], candidateEmail: c['Email'], candidatePhone: c['Phone'],
    department: _val('j_dept'), designation: _val('j_desg'),
    joiningDate: offer['Joining Date'], offeredCtc: offer['Offered CTC']
  }, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('🎉 ' + r.message, 'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

// ─── MODAL ────────────────────────────────────────────────────
function _showModal(title, body, footer) {
  _el('mTitle').textContent  = title;
  _el('mBody').innerHTML     = body;
  _el('mFoot').innerHTML     = footer || '';
  _el('mOv').style.display   = 'block';
  _el('modal').style.display = 'flex';
  setTimeout(function() { _el('modal').classList.add('modal-visible'); }, 10);
}

function _closeModal() {
  _submitting = false;
  _el('modal').classList.remove('modal-visible');
  setTimeout(function() { _el('mOv').style.display='none'; _el('modal').style.display='none'; }, 280);
}

// ─── TOAST ────────────────────────────────────────────────────
function _toast(msg, type) {
  var t = _el('toast');
  t.className = 'toast toast-' + (type||'info');
  var icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  t.innerHTML = '<i class="fa-solid fa-' + (icons[type]||'circle-info') + ' mr-2"></i>' + msg;
  t.classList.add('toast-show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('toast-show'); }, 3500);
}

// ─── UTILS ────────────────────────────────────────────────────
function _setBtnLoading(cls, loading, label) {
  var btns = document.querySelectorAll('.' + cls);
  btns.forEach(function(b) {
    b.disabled = loading;
    if (loading) b.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>' + label;
  });
}
