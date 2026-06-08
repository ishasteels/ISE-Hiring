// ============================================================
// ISHA STEEL ENTERPRISES — HIRING PORTAL v3.1
// Premium Enterprise PWA | GitHub Pages + GAS JSONP
// Clean Labels | Full CRUD | Maximum Analytics | Agencies | Quick Actions
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbwo02Jus1lN3sHMys2C-Cw_YFgzpMcI1O3cpzwpF8UuJMpmGPirsYSXQiZFmX74znvm/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;
var _charts = {};

// ─── PAGINATION STATE ─────────────────────────────────────────
var _PG = { jobs:1, candidates:1, interviews:1, offers:1, agencies:1 };
var _FS = {}; // filter state cache

function _fsave(id) { var el=document.getElementById(id); if(el) _FS[id]=el.value; }
function _fload(id, def) { 
  var el=document.getElementById(id); 
  if(!el) return _FS[id]||def||'all'; 
  if(_FS[id]!==undefined) el.value=_FS[id]; 
  return el.value||def||'all'; 
}
function _fval(id, def) { var el=document.getElementById(id); return el?el.value:(def||'all'); }
var _ROWS = 10;

function _paginate(arr, view) {
  var pg = _PG[view] || 1;
  var pages = Math.max(1, Math.ceil(arr.length / _ROWS));
  if (pg > pages) { _PG[view] = 1; pg = 1; }
  var s = (pg-1)*_ROWS;
  return { slice:arr.slice(s,s+_ROWS), pg:pg, pages:pages, total:arr.length, start:s+1, end:Math.min(s+_ROWS,arr.length) };
}

function _pgBtnS(active) {
  return 'min-width:32px;height:32px;padding:0 8px;border-radius:8px;border:1.5px solid '+(active?'var(--brand)':'var(--bdr)')+';background:'+(active?'var(--brand)':'var(--surf)')+';color:'+(active?'#fff':'var(--t2)')+';font-size:12px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;';
}

function _pagerHtml(view, pag) {
  if (pag.pages <= 1) return '';
  var b = '';
  b += '<button onclick="_pgGo(\'' +view+ '\',' +(pag.pg-1)+ ')" ' +(pag.pg<=1?'disabled':'')+ ' style="'+_pgBtnS(false)+'"><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>';
  var s2=Math.max(1,pag.pg-2), e2=Math.min(pag.pages,s2+4);
  if(s2>1) b+='<span style="color:var(--t4);padding:0 4px;font-size:12px;">…</span>';
  for(var i=s2;i<=e2;i++) b+='<button onclick="_pgGo(\'' +view+ '\',' +i+ ')" style="'+_pgBtnS(i===pag.pg)+'">'+i+'</button>';
  if(e2<pag.pages) b+='<span style="color:var(--t4);padding:0 4px;font-size:12px;">…</span>';
  b += '<button onclick="_pgGo(\'' +view+ '\',' +(pag.pg+1)+ ')" ' +(pag.pg>=pag.pages?'disabled':'')+ ' style="'+_pgBtnS(false)+'"><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>';
  return '<div style="padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;border-radius:0 0 var(--r-md) var(--r-md);">'
    +'<span style="font-size:12px;color:var(--t3);">Showing <strong style="color:var(--t1)">'+pag.start+'–'+pag.end+'</strong> of <strong style="color:var(--t1)">'+pag.total+'</strong> records</span>'
    +'<div style="display:flex;align-items:center;gap:4px;">'+b+'</div></div>';
}



// ─── FORMAT DATE / EXCEL SERIAL DATE ─────────────────────────
function _fmtDate(val) {
  if (!val || val === '—') return '—';
  var s = String(val).trim();
  // If it's already a yyyy-MM-dd string, return as is
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  // If it's a number (Excel serial date), convert it
  var n = parseFloat(s);
  if (!isNaN(n) && n > 1000) {
    // Excel serial: days since 1900-01-01 (with leap year bug offset)
    var d = new Date((n - 25569) * 86400 * 1000);
    return d.toISOString().slice(0,10);
  }
  // If it's a date string in other format, try parsing
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0,10);
  return s;
}

// ─── IST DATE HELPERS (UTC+5:30) ─────────────────────────────
function _istDate() {
  // Returns today's date in IST as yyyy-MM-dd
  var now = new Date();
  // IST = UTC + 5h 30m = UTC + 330 minutes
  var ist = new Date(now.getTime() + (330 * 60 * 1000));
  return ist.toISOString().slice(0,10);
}
function _istMonth() {
  var now = new Date();
  var ist = new Date(now.getTime() + (330 * 60 * 1000));
  return ist.toISOString().slice(0,7);
}
function _istYear() {
  var now = new Date();
  var ist = new Date(now.getTime() + (330 * 60 * 1000));
  return ist.toISOString().slice(0,4);
}

function _pgGo(view, pg) {
  _PG[view] = pg;
  var r={jobs:_renderJobs,candidates:_renderCandidates,interviews:_renderInterviews,offers:_renderOffers,agencies:_renderAgencies};
  if(r[view]) r[view]();
  var el=document.getElementById('v-'+view);
  if(el){ el.scrollTop=0; var tc=el.querySelector('.table-card'); if(tc) tc.scrollIntoView({behavior:'smooth',block:'nearest'}); }
}

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
  document.body.classList.remove('sb-open','sb-collapsed');
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
  var av      = (_U.name || 'U').charAt(0).toUpperCase();
  var role    = _U.role || 'viewer';
  var roleCap = role.charAt(0).toUpperCase() + role.slice(1);

  // Topbar user chip
  if (_el('sbUserName'))  _el('sbUserName').textContent  = _U.name;
  if (_el('sbUserRole'))  _el('sbUserRole').textContent  = roleCap;
  if (_el('sbUserEmail')) _el('sbUserEmail').textContent = _U.email;
  if (_el('sbAvatar'))    _el('sbAvatar').textContent    = av;
  if (_el('ddAvatar'))    _el('ddAvatar').textContent    = av;
  if (_el('ddName'))      _el('ddName').textContent      = _U.name;
  if (_el('ddEmail'))     _el('ddEmail').textContent     = _U.email;
  if (_el('ddRole'))      _el('ddRole').textContent      = roleCap;

  // ── Role-based nav visibility ──────────────────────────────
  // admin:     everything
  // hr:        dashboard, jobs, candidates, interviews, offers, agencies (no close-job, no user mgmt)
  // viewer:    dashboard, jobs, candidates, interviews, offers, agencies (read-only)
  // candidate: only jobs (read-only, no candidate details)

  var hiddenNavViews = [];
  if (role === 'candidate') {
    hiddenNavViews = ['candidates','interviews','offers','agencies'];
  } else if (role === 'viewer') {
    hiddenNavViews = []; // viewer can see all, just can't edit
  }

  // Hide/show nav items
  document.querySelectorAll('[data-v]').forEach(function(el) {
    if (el.closest('#sb') || el.closest('#bnav')) {
      el.style.display = hiddenNavViews.indexOf(el.dataset.v) >= 0 ? 'none' : '';
    }
  });

  // Default landing view based on role
  if (role === 'candidate') {
    _V = 'jobs';
    // Candidate: restrict data - show only open jobs
    // Data is filtered server-side, but add UI lock
    document.querySelectorAll('[data-v="candidates"],[data-v="interviews"],[data-v="offers"],[data-v="agencies"]').forEach(function(el){
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.4';
    });
  }

  // Role badge color
  var badgeColors = { admin:'#e31e24', hr:'#3b82f6', viewer:'#10b981', candidate:'#f59e0b' };
  if (_el('ddRole')) {
    _el('ddRole').style.background = badgeColors[role] || '#64748b';
  }
}

function _lv(v) {
  // Role-based navigation restriction
  var role = _U ? _U.role : 'viewer';
  var restricted = {
    candidate: ['candidates','interviews','offers','agencies'],
    viewer:     []
  };
  var roleRestrict = restricted[role] || [];
  if (roleRestrict.indexOf(v) >= 0) {
    _toast('Access restricted — ' + (role==='candidate'?'Candidates can only view Job Openings':'Your role cannot access this section.'), 'warning');
    return;
  }
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = _el('v-' + v); if (el) el.style.display = 'block';
  document.querySelectorAll('[data-v]').forEach(function(b) {
    b.classList.toggle('active', b.dataset.v === v);
  });
  var titles = {
    home: 'Dashboard', jobs: 'Job Openings', candidates: 'Candidates',
    interviews: 'Interviews', offers: 'Offer Letters', agencies: 'Agencies'
  };
  _el('tbTitle').textContent = titles[v] || 'ISHA Hiring';
  var renderers = { home: _renderHome, jobs: _renderJobs, candidates: _renderCandidates, interviews: _renderInterviews, offers: _renderOffers, agencies: _renderAgencies };
  if (renderers[v]) renderers[v]();
  document.body.classList.remove('sb-open');
}

function openMobileSb() {
  document.body.classList.add('sb-open');
  var ov = document.getElementById('sbOv');
  if(ov) ov.classList.add('on');
}
function closeMobileSb() {
  document.body.classList.remove('sb-open');
  var ov = document.getElementById('sbOv');
  if(ov) ov.classList.remove('on');
}

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
  var agys  = _D.agencies    || [];

  // KPIs
  var openJobs     = jobs.filter(function(j){ return j['Status'] === 'Open'; }).length;
  var totalCands   = cands.length;
  var applied      = cands.filter(function(c){ return c['Stage'] === 'Applied'; }).length;
  var interviewing = cands.filter(function(c){ return c['Stage'] === 'Interview'; }).length;
  var selected     = cands.filter(function(c){ return c['Stage'] === 'Selected'; }).length;
  var offered      = cands.filter(function(c){ return c['Stage'] === 'Offered'; }).length;
  var joined       = cands.filter(function(c){ return c['Stage'] === 'Joined'; }).length;
  var rejected     = cands.filter(function(c){ return c['Stage'] === 'Rejected'; }).length;
  var activeAgys   = agys.filter(function(a){ return a['Status'] === 'Active'; }).length;

  var today        = _istDate();
  var thisMonth    = _istMonth();
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

  // Agency breakdown
  var agyData = {};
  cands.forEach(function(c){ var a = c['Agency Name']||'Direct'; agyData[a] = (agyData[a]||0)+1; });

  // Monthly trend (last 6 months)
  var monthLabels = [], monthJoined = [];
  for (var m = 5; m >= 0; m--) {
    var d2 = new Date(new Date().getTime()+(330*60*1000)); d2.setMonth(d2.getMonth() - m);
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
    ${_kpiCard('fa-building','Active Agencies', activeAgys, 'slate', 'Recruitment partners')}
  </div>

  <!-- Pipeline Stage Bar -->
  <div class="section-card">
    <div class="section-head">
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
    <div class="pipeline-leg">
      ${_pipeLeg('Applied',      applied,      '#3B82F6')}
      ${_pipeLeg('Interviewing', interviewing, '#F59E0B')}
      ${_pipeLeg('Selected',     selected,     '#8B5CF6')}
      ${_pipeLeg('Offered',      offered,      '#EC4899')}
      ${_pipeLeg('Joined',       joined,       '#10B981')}
      ${_pipeLeg('Rejected',     rejected,     '#EF4444')}
    </div>
  </div>

  <!-- Charts Row 1 -->
  <div class="charts-2">
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-chart-pie mr-2 text-blue-600"></i>Candidate Stage Distribution</h3>
      </div>
      <div class="chart-h-md"><canvas id="cStage"></canvas></div>
    </div>
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-building mr-2 text-violet-600"></i>Hiring by Department</h3>
      </div>
      <div class="chart-h-md"><canvas id="cDept"></canvas></div>
    </div>
  </div>

  <!-- Charts Row 2 -->
  <div class="charts-2">
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-chart-line mr-2 text-green-600"></i>Joinings Trend (6 Months)</h3>
      </div>
      <div class="chart-h-md"><canvas id="cTrend"></canvas></div>
    </div>
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-satellite-dish mr-2 text-amber-600"></i>Candidate Source Mix</h3>
      </div>
      <div class="chart-h-md"><canvas id="cSource"></canvas></div>
    </div>
  </div>

  <!-- Charts Row 3 -->
  <div class="charts-2">
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-ranking-star mr-2 text-red-600"></i>Top Jobs by Applications</h3>
      </div>
      <div class="chart-h-md"><canvas id="cTopJobs"></canvas></div>
    </div>
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-handshake mr-2 text-teal-600"></i>Top Agencies by Candidates</h3>
      </div>
      <div class="chart-h-md"><canvas id="cAgency"></canvas></div>
    </div>
  </div>

  <!-- Bottom Grid: Activity + Upcoming -->
  <div class="charts-2">
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-bolt mr-2 text-amber-500"></i>Recent Applications</h3>
        <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('candidates')">View All →</button>
      </div>
      <div class="act-list">
        ${recentCands.length ? recentCands.map(function(c){
          var job = (jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});
          return `<div class="act-row">
            <div class="act-av">${(c['Full Name']||'?').charAt(0)}</div>
            <div class="act-info">
              <div class="act-name">${c['Full Name']}</div>
              <div class="act-sub">${job ? job['Title'] : '—'} · ${c['Source']||'—'} ${c['Agency Name'] ? '· ' + c['Agency Name'] : ''}</div>
            </div>
            <span class="${_stageClass(c['Stage'])}">${c['Stage']}</span>
          </div>`;
        }).join('') : '<div class="empty-sm">No recent applications</div>'}
      </div>
    </div>
    <div class="section-card">
      <div class="section-head">
        <h3><i class="fa-solid fa-calendar-days mr-2 text-blue-500"></i>Upcoming Interviews</h3>
        <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('interviews')">View All →</button>
      </div>
      <div class="act-list">
        ${recentInts.length ? recentInts.map(function(i){
          var c = (cands||[]).find(function(x){return x['Candidate ID']===i['Candidate ID'];});
          return `<div class="act-row">
            <div class="act-ico-wrap"><i class="fa-solid fa-video text-blue-500"></i></div>
            <div class="act-info">
              <div class="act-name">${c ? c['Full Name'] : '—'}</div>
              <div class="act-sub">Round ${i['Round']} · ${i['Type']} · ${i['Mode']}</div>
            </div>
            <div class="act-date">${(i['Scheduled On']||'').slice(0,10)}</div>
          </div>`;
        }).join('') : '<div class="empty-sm">No upcoming interviews</div>'}
      </div>
    </div>
  </div>

  <!-- Job Status Summary Table -->
  <div class="section-card">
    <div class="section-head">
      <h3><i class="fa-solid fa-table-list mr-2 text-slate-600"></i>Job Opening Summary</h3>
      <button class="text-xs text-red-600 font-semibold hover:underline" onclick="_lv('jobs')">Manage Jobs →</button>
    </div>
    <div class="tbl-scroll">
      <table class="ins-table">
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
              <td><span class="${j['Status']==='Open'?'badge b-open':'badge b-closed'}">${j['Status']}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  _el('v-home').innerHTML = html;

  // Render all 7 charts
  setTimeout(function() {
    if (typeof Chart === 'undefined') return;
    ['cStage','cDept','cTrend','cSource','cTopJobs','cAgency','cIntResult'].forEach(function(k){ _destroyChart(k); });

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

    // 6) Agency bar chart
    var el6 = _el('cAgency');
    var agyLabels = Object.keys(agyData).slice(0,6);
    var agyValues = agyLabels.map(function(k){ return agyData[k]; });
    if (el6) _charts['cAgency'] = new Chart(el6, { type: 'bar', data: {
      labels: agyLabels,
      datasets: [{ label: 'Candidates', data: agyValues, backgroundColor: COLORS.slice(2), borderRadius: 6, borderSkipped: false }]
    }, options: Object.assign({}, defOpts, { plugins: { legend: { display: false } }, scales: {
      x: { grid: { display: false }, ticks: { color: labelColor } },
      y: { grid: { color: gridColor }, ticks: { color: labelColor, stepSize: 1 } }
    }}) });

    // 7) Interview result pie
    var intPass2  = ints.filter(function(i){ return i['Result']==='Pass'; }).length;
    var intFail   = ints.filter(function(i){ return i['Result']==='Fail'; }).length;
    var intPend   = ints.filter(function(i){ return i['Status']==='Scheduled'; }).length;
    var intCanc   = ints.filter(function(i){ return i['Status']==='Cancelled'; }).length;
    var el7 = _el('cIntResult');
    if (el7) _charts['cIntResult'] = new Chart(el7, { type: 'doughnut', data: {
      labels: ['Pass','Fail','Scheduled','Cancelled'],
      datasets: [{ data: [intPass2, intFail, intPend, intCanc], backgroundColor: ['#10B981','#EF4444','#F59E0B','#94A3B8'], borderWidth: 2, borderColor: '#fff' }]
    }, options: Object.assign({}, defOpts, { cutout: '60%' }) });

  }, 150);
}

function _kpiCard(icon, label, value, color, sub) {
  var colorMap = { red:'', blue:'', amber:'', violet:'', green:'', teal:'', rose:'', slate:'' };
  var borderMap = {
    red: 'kc-red', blue: 'kc-blue',
    amber: 'kc-amber', violet: 'kc-violet',
    green: 'kc-green', teal: 'kc-teal',
    rose: 'kc-rose', slate: 'kc-slate'
  };
  return `<div class="kpi-card ${borderMap[color]||''}">
    <div class="kpi-ico"><i class="fa-solid fa-${icon}"></i></div>
    <div class="kpi-body">
      <div class="kpi-val">${value}</div>
      <div class="kpi-lbl">${label}</div>
      <div class="kpi-sub">${sub}</div>
    </div>
  </div>`;
}

function _pipeBar(label, count, total, color) {
  var pct = total > 0 ? Math.max(count / total * 100, count > 0 ? 4 : 0) : 0;
  return `<div class="pipe-seg" style="width:${pct}%;background:${color}" title="${label}: ${count}"></div>`;
}

function _pipeLeg(label, count, color) {
  return `<div class="pl-item"><span class="pl-dot" style="background:${color}"></span><span class="pl-lbl">${label}</span><span class="pl-cnt">${count}</span></div>`;
}

function _stageClass(stage) {
  var m = { Applied:'badge b-applied', Interview:'badge b-interview', Selected:'badge b-selected', Offered:'badge b-offered', Joined:'badge b-joined', Rejected:'badge b-rejected' };
  return m[stage] || 'badge b-applied';
}

function _stageNext(stage) {
  var m = { 'Applied':'Interview', 'Interview':'Selected', 'Selected':'Offered', 'Offered':'Joined' };
  return m[stage] || null;
}

function _stagePrev(stage) {
  var m = { 'Interview':'Applied', 'Selected':'Interview', 'Offered':'Selected', 'Joined':'Offered' };
  return m[stage] || null;
}


// ─── JOB OPENINGS ─────────────────────────────────────────────

// ─── JOB OPENINGS ─────────────────────────────────────────────
function _renderJobs() {
  var jobs  = _D.jobs        || [];
  var cands = _D.candidates  || [];
  var ints  = _D.interviews  || [];

  var search  = _el('jobSearch')     ? _el('jobSearch').value.toLowerCase()  : '';
  var stF     = (_el('jobFilter') ? _el('jobFilter').value : null) || _FS['jobFilter'] || 'all';
  var deptF   = _el('jobDeptFilter') ? _el('jobDeptFilter').value             : 'all';
  var locF    = _el('jobLocFilter')  ? _el('jobLocFilter').value              : 'all';
  var sortF   = _el('jobSort')       ? _el('jobSort').value                   : 'newest';
  var expF    = _el('jobExpFilter')  ? _el('jobExpFilter').value              : 'all';

  var allDepts = ['all'].concat([...new Set(jobs.map(function(j){return j['Department']||'';}).filter(Boolean))]);
  var allLocs  = ['all'].concat([...new Set(jobs.map(function(j){return j['Location']||'';}).filter(Boolean))]);

  // Count cards
  var openCount   = jobs.filter(function(j){return j['Status']==='Open';}).length;
  var closedCount = jobs.filter(function(j){return j['Status']==='Closed';}).length;
  var holdCount   = jobs.filter(function(j){return j['Status']==='On Hold';}).length;

  var visible = jobs.filter(function(j) {
    if (stF   !== 'all' && j['Status']     !== stF)   return false;
    if (deptF !== 'all' && j['Department'] !== deptF) return false;
    if (locF  !== 'all' && j['Location']   !== locF)  return false;
    if (expF  !== 'all') {
      var me = parseFloat(j['Min Experience']||0);
      if (expF==='0'  && me>0)           return false;
      if (expF==='1-3'&& (me<1||me>3))  return false;
      if (expF==='3-6'&& (me<3||me>6))  return false;
      if (expF==='6+' && me<6)           return false;
    }
    if (search && !(j['Title']||'').toLowerCase().includes(search) &&
                  !(j['Department']||'').toLowerCase().includes(search) &&
                  !(j['Location']||'').toLowerCase().includes(search) &&
                  !(j['Job ID']||'').toLowerCase().includes(search) &&
                  !(j['Description']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  if (sortF==='newest') visible.sort(function(a,b){return (b['Posted On']||'').localeCompare(a['Posted On']||'');});
  if (sortF==='oldest') visible.sort(function(a,b){return (a['Posted On']||'').localeCompare(b['Posted On']||'');});
  if (sortF==='title')  visible.sort(function(a,b){return (a['Title']||'').localeCompare(b['Title']||'');});
  if (sortF==='apps-hi')visible.sort(function(a,b){
    return cands.filter(function(c){return c['Job ID']===b['Job ID'];}).length
          -cands.filter(function(c){return c['Job ID']===a['Job ID'];}).length;
  });
  if (sortF==='deadline')visible.sort(function(a,b){return (a['Deadline']||'9').localeCompare(b['Deadline']||'9');});

  var deptOpts = allDepts.map(function(d){return '<option value="'+d+'" '+(deptF===d?'selected':'')+'>'+(d==='all'?'All Departments':d)+'</option>';}).join('');
  var locOpts  = allLocs.map(function(l){return '<option value="'+l+'" '+(locF===l?'selected':'')+'>'+(l==='all'?'All Locations':l)+'</option>';}).join('');

  var _pag = _paginate(visible, 'jobs');
  var _slice = _pag.slice;

  var html = `
  <!-- Status summary pills -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
    ${[['all','All Jobs',jobs.length,'var(--t1)','var(--surf)','var(--bdr)'],
       ['Open','Open',openCount,'#059669','rgba(16,185,129,.1)','rgba(16,185,129,.3)'],
       ['Closed','Closed',closedCount,'#dc2626','rgba(239,68,68,.1)','rgba(239,68,68,.3)'],
       ['On Hold','On Hold',holdCount,'#d97706','rgba(245,158,11,.1)','rgba(245,158,11,.3)']
    ].map(function(x){
      var active = stF===x[0];
      return '<button onclick="_jobStatusQuick(\''+x[0]+'\')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:50px;border:1.5px solid '+(active?'transparent':x[5])+';background:'+(active?x[3]:x[4])+';color:'+(active?'#fff':x[3])+';font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;">'
        +x[1]+' <span style="background:'+(active?'rgba(255,255,255,.25)':'var(--surf)')+';color:'+(active?'#fff':x[3])+';padding:1px 7px;border-radius:10px;font-size:10px;font-weight:800;">'+x[2]+'</span></button>';
    }).join('')}
  </div>

  <!-- Toolbar -->
  <div class="view-bar" style="flex-wrap:wrap;gap:10px;align-items:flex-start;">
    <div class="vb-left" style="flex-wrap:wrap;gap:8px;">
      <div class="search-box" style="max-width:280px;">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="jobSearch" type="text" placeholder="Title, dept, location, ID..." value="${search}" oninput="_PG.jobs=1;_renderJobs()">
        ${search?'<button onclick="_el(\'jobSearch\').value=\'\';_renderJobs()" style="background:none;border:none;cursor:pointer;color:var(--t4);padding:0 4px;font-size:11px;">✕</button>':''}
      </div>
      <select id="jobDeptFilter" class="f-select" onchange="_PG.jobs=1;_renderJobs()">${deptOpts}</select>
      <select id="jobLocFilter"  class="f-select" onchange="_PG.jobs=1;_renderJobs()">${locOpts}</select>
      <select id="jobExpFilter"  class="f-select" onchange="_PG.jobs=1;_renderJobs()">
        <option value="all" ${expF==='all'?'selected':''}>All Experience</option>
        <option value="0"   ${expF==='0'?'selected':''}>Fresher (0 yrs)</option>
        <option value="1-3" ${expF==='1-3'?'selected':''}>1–3 yrs</option>
        <option value="3-6" ${expF==='3-6'?'selected':''}>3–6 yrs</option>
        <option value="6+"  ${expF==='6+'?'selected':''}>6+ yrs</option>
      </select>
      <select id="jobSort" class="f-select" onchange="_PG.jobs=1;_renderJobs()">
        <option value="newest"   ${sortF==='newest'?'selected':''}>⬇ Newest First</option>
        <option value="oldest"   ${sortF==='oldest'?'selected':''}>⬆ Oldest First</option>
        <option value="title"    ${sortF==='title'?'selected':''}>🔤 Title A–Z</option>
        <option value="apps-hi"  ${sortF==='apps-hi'?'selected':''}>👥 Most Applicants</option>
        <option value="deadline" ${sortF==='deadline'?'selected':''}>⏰ Deadline Soon</option>
      </select>
    </div>
    <div class="vb-right" style="gap:8px;">
      <span class="res-count">${visible.length} of ${jobs.length}</span>
      ${_hasWrite()?'<button class="btn-add" onclick="_openJobModal()"><i class="fa-solid fa-plus" style="margin-right:6px"></i>Post Job</button>':''}
    </div>
  </div>

  ${_U&&_U.role==='candidate'?'<div class="role-banner"><i class="fa-solid fa-eye" style="margin-right:8px"></i>Viewing as Candidate — Read Only</div>':''}

  <div class="table-card">
    <div class="tbl-scroll">
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Job</th>
            <th>Department</th>
            <th>Location</th>
            <th>Exp. Req.</th>
            <th>Salary Range</th>
            <th style="text-align:center;">Openings</th>
            <th style="text-align:center;">Applied</th>
            <th style="text-align:center;">Interviews</th>
            <th>Deadline</th>
            <th>Posted By</th>
            <th>Status</th>
            ${_hasWrite()?'<th style="min-width:130px;">Actions</th>':''}
          </tr>
        </thead>
        <tbody>
          ${visible.length ? _slice.map(function(j) {
            var cnt  = cands.filter(function(c){return c['Job ID']===j['Job ID'];}).length;
            var iCnt = ints.filter(function(i){return i['Job ID']===j['Job ID']&&i['Status']==='Scheduled';}).length;
            var sel  = cands.filter(function(c){return c['Job ID']===j['Job ID']&&(c['Stage']==='Selected'||c['Stage']==='Offered'||c['Stage']==='Joined');}).length;
            var isExp = j['Deadline'] && j['Deadline'] < _today;
            var fillPct = j['Openings'] > 0 ? Math.min(100, Math.round(sel/j['Openings']*100)) : 0;
            return `<tr>
              <td>
                <div style="font-weight:700;color:var(--t1);font-size:13px;margin-bottom:2px;">${j['Title']}</div>
                <div style="font-size:10.5px;color:var(--t4);font-family:'Courier New',monospace;">${j['Job ID']}</div>
              </td>
              <td><span class="src-tag">${j['Department']||'—'}</span></td>
              <td style="font-size:12px;color:var(--t2);"><i class="fa-solid fa-location-dot" style="color:var(--brand);font-size:10px;margin-right:4px;"></i>${j['Location']||'—'}</td>
              <td style="font-size:12px;color:var(--t2);text-align:center;">${j['Min Experience']?j['Min Experience']+' yrs':'—'}</td>
              <td style="font-weight:600;color:#059669;font-size:12.5px;">${j['Salary Range']||'—'}</td>
              <td style="text-align:center;">
                <div style="font-weight:800;color:var(--t1);font-size:14px;">${j['Openings']||1}</div>
                ${fillPct>0?'<div style="height:3px;border-radius:2px;background:var(--surf2);margin-top:4px;overflow:hidden;width:40px;margin-left:auto;margin-right:auto;"><div style="height:100%;width:'+fillPct+'%;background:#10b981;border-radius:2px;"></div></div>':''}
              </td>
              <td style="text-align:center;">
                <button class="lnk-btn" onclick="_viewJobCands('${j['Job ID']}')" style="font-size:14px;font-weight:800;">${cnt}</button>
              </td>
              <td style="text-align:center;">
                ${iCnt>0?'<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,.1);color:#d97706;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;">'+iCnt+'</span>':'<span style="color:var(--t4);font-size:12px;">—</span>'}
              </td>
              <td style="font-size:12px;${isExp?'color:#dc2626;font-weight:600;':'color:var(--t2);'}">
                ${isExp?'<i class="fa-solid fa-triangle-exclamation" style="font-size:10px;margin-right:4px;"></i>':''}${j['Deadline']||'—'}
              </td>
              <td style="font-size:12px;color:var(--t2);">${j['Posted By']||'—'}</td>
              <td><span class="${j['Status']==='Open'?'badge b-open':j['Status']==='Closed'?'badge b-closed':'badge b-scheduled'}">${j['Status']}</span></td>
              ${_hasWrite()?`<td>
                <div class="act-btns">
                  <button class="ic-btn" title="Edit Job" onclick="_editJob('${j['Job ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="ic-btn" title="View Candidates" style="color:#3b82f6;border-color:rgba(59,130,246,.3);background:rgba(59,130,246,.07);" onclick="_viewJobCands('${j['Job ID']}')"><i class="fa-solid fa-users"></i></button>
                  ${j['Status']==='Open'?`<button class="ic-btn" title="Schedule Interview for this Job" style="color:#f59e0b;border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.07);" onclick="_openInterviewModal(null,null,'${j['Job ID']}')"><i class="fa-solid fa-calendar-plus"></i></button>`:''}
                  ${_isAdmin()&&j['Status']==='Open'?`<button class="ic-btn rej" title="Close Job" onclick="_closeJob('${j['Job ID']}')"><i class="fa-solid fa-ban"></i></button>`:''}
                  ${_isAdmin()&&j['Status']==='Closed'?`<button class="ic-btn fwd" title="Reopen Job" onclick="_reopenJob('${j['Job ID']}')"><i class="fa-solid fa-rotate-left"></i></button>`:''}
                </div>
              </td>`:''}
            </tr>`;
          }).join('') : `<tr><td colspan="12" class="empty-row"><i class="fa-solid fa-briefcase" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No jobs match your filters.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${(_pag.pages<=1&&visible.length>0)?`<div style="padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2);display:flex;align-items:center;gap:16px;font-size:11.5px;color:var(--t3);flex-wrap:wrap;">
      <span><strong style="color:var(--t1)">${visible.length}</strong> jobs</span>
      <span>Open: <strong style="color:#10b981">${openCount}</strong></span>
      <span>Closed: <strong style="color:#ef4444">${closedCount}</strong></span>
      <span>On Hold: <strong style="color:#f59e0b">${holdCount}</strong></span>
    </div>`:''}
  </div>`;

  // Build final html with pagination bar
  var _pi=_pagerHtml('jobs',_pag);
  if(_pi){ var _li=html.lastIndexOf('</div>'); if(_li>=0) html=html.slice(0,_li)+_pi+'</div>'; }
  _el('v-jobs').innerHTML = html;

}

var _today = _istDate();

function _jobStatusQuick(st) {
  _PG.jobs=1; _FS['jobFilter']=st; _renderJobs();
}

function _reopenJob(jobId) {
  if (!confirm('Reopen this job opening?')) return;
  _api('updateJob', { jobId: jobId, status: 'Open' }, function(r) {
    if (r.success) { _toast('Job reopened.', 'success'); _loadData(); }
    else _toast(r.error, 'error');
  });
}

// ─── INTERVIEWS ───────────────────────────────────────────────
function _renderInterviews() {
  var ints  = _D.interviews || [];
  var cands = _D.candidates || [];
  var jobs  = _D.jobs       || [];

  var search  = _el('intSearch')      ? _el('intSearch').value.toLowerCase()  : '';
  var stF     = (_el('intFilter') ? _el('intFilter').value : null) || _FS['intFilter'] || 'all';
  var typeF   = _el('intTypeFilter')  ? _el('intTypeFilter').value             : 'all';
  var modeF   = _el('intModeFilter')  ? _el('intModeFilter').value             : 'all';
  var roundF  = _el('intRoundFilter') ? _el('intRoundFilter').value            : 'all';
  var resultF = _el('intResultFilter')? _el('intResultFilter').value           : 'all';
  var sortF   = _el('intSort')        ? _el('intSort').value                   : 'date-asc';
  var dateF   = _el('intDateFilter')  ? _el('intDateFilter').value             : 'all';

  var allTypes = ['all'].concat([...new Set(ints.map(function(i){return i['Type']||'';}).filter(Boolean))]);
  var allModes = ['all'].concat([...new Set(ints.map(function(i){return i['Mode']||'';}).filter(Boolean))]);

  // Count by status
  var scheduled = ints.filter(function(i){return i['Status']==='Scheduled';}).length;
  var done      = ints.filter(function(i){return i['Status']==='Done';}).length;
  var cancelled = ints.filter(function(i){return i['Status']==='Cancelled';}).length;
  var today = _istDate();
  var todayInts = ints.filter(function(i){return (i['Scheduled On']||'').slice(0,10)===today&&i['Status']==='Scheduled';}).length;

  var visible = ints.filter(function(i) {
    if (stF    !=='all' && i['Status']!==stF)               return false;
    if (typeF  !=='all' && i['Type']  !==typeF)             return false;
    if (modeF  !=='all' && i['Mode']  !==modeF)             return false;
    if (roundF !=='all' && String(i['Round'])!==roundF)     return false;
    if (resultF!=='all' && i['Result'] !==resultF)          return false;
    if (dateF==='today')    { if ((i['Scheduled On']||'').slice(0,10)!==today)  return false; }
    if (dateF==='week') {
      var d = new Date(new Date(today).getTime()); d.setDate(d.getDate()+7);
      var wEnd = d.toISOString().slice(0,10);
      if (!i['Scheduled On']||(i['Scheduled On']<today||i['Scheduled On']>wEnd)) return false;
    }
    if (dateF==='past') { if ((i['Scheduled On']||'')>=today) return false; }
    if (search) {
      var c = cands.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
      var j = jobs.find(function(x){return x['Job ID']===i['Job ID'];});
      if (!(c&&(c['Full Name']||'').toLowerCase().includes(search)) &&
          !(j&&(j['Title']||'').toLowerCase().includes(search)) &&
          !(i['Interviewer']||'').toLowerCase().includes(search)) return false;
    }
    return true;
  });

  if (sortF==='date-asc')  visible.sort(function(a,b){return (a['Scheduled On']||'').localeCompare(b['Scheduled On']||'');});
  if (sortF==='date-desc') visible.sort(function(a,b){return (b['Scheduled On']||'').localeCompare(a['Scheduled On']||'');});
  if (sortF==='round')     visible.sort(function(a,b){return (a['Round']||1)-(b['Round']||1);});
  if (sortF==='name')      visible.sort(function(a,b){
    var ca=cands.find(function(x){return x['Candidate ID']===a['Candidate ID'];})||{};
    var cb=cands.find(function(x){return x['Candidate ID']===b['Candidate ID'];})||{};
    return (ca['Full Name']||'').localeCompare(cb['Full Name']||'');
  });

  var typeOpts = allTypes.map(function(t){return '<option value="'+t+'" '+(typeF===t?'selected':'')+'>'+(t==='all'?'All Types':t)+'</option>';}).join('');
  var modeOpts = allModes.map(function(m){return '<option value="'+m+'" '+(modeF===m?'selected':'')+'>'+(m==='all'?'All Modes':m)+'</option>';}).join('');

  var _pag = _paginate(visible, 'interviews');
  var _slice = _pag.slice;

  var html = `
  <!-- Status summary pills -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
    ${[['all','All',ints.length],['Scheduled','Scheduled',scheduled],['Done','Done',done],['Cancelled','Cancelled',cancelled]].map(function(x){
      var ac=stF===x[0];
      var col=x[0]==='Scheduled'?'#d97706':x[0]==='Done'?'#059669':x[0]==='Cancelled'?'#dc2626':'var(--t1)';
      return '<button onclick="_intStatusQuick(\''+x[0]+'\')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:50px;border:1.5px solid '+(ac?'transparent':col==='var(--t1)'?'var(--bdr)':col.replace('#','rgba(').replace(/^rgba\((.*)\)$/,function(m,p){return 'rgba('+p+', .3)'}))+';background:'+(ac?col:col==='var(--t1)'?'var(--surf)':col.replace('#','rgba(').replace(/^rgba\((.*)\)$/,function(m,p){return 'rgba('+p+', .1)'}))+';color:'+(ac?'#fff':col)+';font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;">'
        +x[1]+' <span style="background:'+(ac?'rgba(255,255,255,.25)':'var(--surf)')+';color:'+(ac?'#fff':col)+';padding:1px 7px;border-radius:10px;font-size:10px;font-weight:800;">'+x[2]+'</span></button>';
    }).join('')}
    ${todayInts>0?'<span style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:50px;background:rgba(227,30,36,.08);border:1.5px solid rgba(227,30,36,.25);color:var(--brand);font-size:12px;font-weight:700;"><i class="fa-solid fa-clock" style="font-size:10px;"></i>'+todayInts+' Today</span>':''}
  </div>

  <!-- Toolbar -->
  <div class="view-bar" style="flex-wrap:wrap;gap:10px;align-items:flex-start;">
    <div class="vb-left" style="flex-wrap:wrap;gap:8px;">
      <div class="search-box" style="max-width:280px;">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="intSearch" type="text" placeholder="Candidate, job, interviewer..." value="${search}" oninput="_PG.interviews=1;_renderInterviews()">
        ${search?'<button onclick="_el(\'intSearch\').value=\'\';_renderInterviews()" style="background:none;border:none;cursor:pointer;color:var(--t4);padding:0 4px;font-size:11px;">✕</button>':''}
      </div>
      <select id="intTypeFilter"   class="f-select" onchange="_PG.interviews=1;_renderInterviews()">${typeOpts}</select>
      <select id="intModeFilter"   class="f-select" onchange="_PG.interviews=1;_renderInterviews()">${modeOpts}</select>
      <select id="intRoundFilter"  class="f-select" onchange="_PG.interviews=1;_renderInterviews()">
        <option value="all" ${roundF==='all'?'selected':''}>All Rounds</option>
        <option value="1"   ${roundF==='1'?'selected':''}>Round 1</option>
        <option value="2"   ${roundF==='2'?'selected':''}>Round 2</option>
        <option value="3"   ${roundF==='3'?'selected':''}>Round 3</option>
      </select>
      <select id="intResultFilter" class="f-select" onchange="_PG.interviews=1;_renderInterviews()">
        <option value="all"  ${resultF==='all'?'selected':''}>All Results</option>
        <option value="Pass" ${resultF==='Pass'?'selected':''}>✅ Pass</option>
        <option value="Fail" ${resultF==='Fail'?'selected':''}>❌ Fail</option>
        <option value="Hold" ${resultF==='Hold'?'selected':''}>⏸ Hold</option>
      </select>
      <select id="intDateFilter"   class="f-select" onchange="_PG.interviews=1;_renderInterviews()">
        <option value="all"   ${dateF==='all'?'selected':''}>All Dates</option>
        <option value="today" ${dateF==='today'?'selected':''}>📅 Today</option>
        <option value="week"  ${dateF==='week'?'selected':''}>📆 This Week</option>
        <option value="past"  ${dateF==='past'?'selected':''}>⏮ Past</option>
      </select>
      <select id="intSort"         class="f-select" onchange="_PG.interviews=1;_renderInterviews()">
        <option value="date-asc"  ${sortF==='date-asc'?'selected':''}>⬆ Date (earliest)</option>
        <option value="date-desc" ${sortF==='date-desc'?'selected':''}>⬇ Date (latest)</option>
        <option value="round"     ${sortF==='round'?'selected':''}>🔢 Round</option>
        <option value="name"      ${sortF==='name'?'selected':''}>🔤 Name A–Z</option>
      </select>
    </div>
    <div class="vb-right" style="gap:8px;">
      <span class="res-count">${visible.length} of ${ints.length}</span>
      ${_hasWrite()?'<button class="btn-add" onclick="_openInterviewModal()"><i class="fa-solid fa-calendar-plus" style="margin-right:6px"></i>Schedule</button>':''}
    </div>
  </div>

  <div class="table-card">
    <div class="tbl-scroll">
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Job Role</th>
            <th style="text-align:center;">Round</th>
            <th>Type</th>
            <th>Mode</th>
            <th>Scheduled On</th>
            <th>Interviewer</th>
            <th>Status</th>
            <th>Result</th>
            <th>Feedback</th>
            ${_hasWrite()?'<th style="min-width:120px;">Actions</th>':''}
          </tr>
        </thead>
        <tbody>
          ${visible.length ? _slice.map(function(i) {
            var c   = cands.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
            var j   = jobs.find(function(x){return x['Job ID']===i['Job ID'];});
            var isToday  = (i['Scheduled On']||'').slice(0,10)===today;
            var isPast   = i['Status']==='Scheduled' && (i['Scheduled On']||'')< today;
            var stCls    = i['Status']==='Done'?'badge b-done':i['Status']==='Cancelled'?'badge b-cancelled':'badge b-scheduled';
            var resCls   = i['Result']==='Pass'?'badge b-joined':i['Result']==='Fail'?'badge b-rejected':i['Result']==='Hold'?'badge b-offered':'';
            return `<tr style="${isToday&&i['Status']==='Scheduled'?'background:rgba(245,158,11,.04);':isPast?'opacity:.75;':''}">
              <td>
                <div class="name-cell">
                  <div class="n-av sm" style="background:${_avatarGrad(c?c['Full Name']:'')}">${c?(c['Full Name']||'?').charAt(0).toUpperCase():'?'}</div>
                  <div>
                    <div class="n-name">${c?c['Full Name']:'—'}</div>
                    <div class="n-email" style="font-family:'Courier New',monospace;">${i['Candidate ID']}</div>
                  </div>
                </div>
              </td>
              <td style="font-size:12.5px;color:var(--t2);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${j?j['Title']:'—'}</td>
              <td style="text-align:center;"><span class="round-b" style="font-size:11px;">R${i['Round']||1}</span></td>
              <td style="font-size:12px;color:var(--t2);">${i['Type']||'—'}</td>
              <td>
                ${i['Meeting Link']
                  ?'<a href="'+i['Meeting Link']+'" style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:600;text-decoration:none;border:1px solid #bfdbfe;"><i class="fa-solid fa-video" style="font-size:9px;"></i>'+i['Mode']+'</a>'
                  :'<span class="src-tag" style="font-size:11px;">'+i['Mode']+'</span>'}
              </td>
              <td>
                <div style="font-size:12.5px;color:var(--t1);font-weight:${isToday?'700':'400'};">${(i['Scheduled On']||'').replace('T',' ').slice(0,16)||'—'}</div>
                ${isToday&&i['Status']==='Scheduled'?'<div style="font-size:10px;color:var(--brand);font-weight:700;">TODAY</div>':''}
                ${isPast?'<div style="font-size:10px;color:#dc2626;font-weight:600;">OVERDUE</div>':''}
              </td>
              <td style="font-size:12px;color:var(--t2);">${i['Interviewer']||'—'}</td>
              <td><span class="${stCls}">${i['Status']}</span></td>
              <td>${i['Result']?'<span class="'+resCls+'">'+i['Result']+'</span>':'<span style="color:var(--t4);font-size:12px;">—</span>'}</td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:var(--t3);" title="${i['Feedback']||''}">${i['Feedback']?'<i class="fa-solid fa-comment-dots" style="color:#8b5cf6;margin-right:4px;font-size:10px;"></i>'+i['Feedback'].slice(0,40)+(i['Feedback'].length>40?'…':''):'—'}</td>
              ${_hasWrite()?`<td>
                <div class="act-btns">
                  <button class="ic-btn" title="Edit Interview" onclick="_openInterviewModal((_D.interviews||[]).find(function(x){return x['Interview ID']==='${i['Interview ID']}';}))"><i class="fa-solid fa-pen-to-square"></i></button>
                  ${i['Status']==='Scheduled'?`
                    <button class="ic-btn fwd" title="Mark Result" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')"><i class="fa-solid fa-check-to-slot"></i></button>
                    <button class="ic-btn rej" title="Cancel Interview" onclick="_cancelInterview('${i['Interview ID']}')"><i class="fa-solid fa-xmark"></i></button>
                  `:''}
                  ${i['Status']==='Done'&&!i['Result']?`<button class="ic-btn" title="Add Result" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')"><i class="fa-solid fa-pen"></i></button>`:''}
                  <button class="ic-btn" title="View Candidate" onclick="_openCndDetail('${i['Candidate ID']}')"><i class="fa-solid fa-user"></i></button>
                </div>
              </td>`:''}
            </tr>`;
          }).join('') : `<tr><td colspan="11" class="empty-row"><i class="fa-solid fa-calendar-xmark" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No interviews found.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${(_pag.pages<=1&&_pag.total>0)?`<div style="padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2);display:flex;align-items:center;gap:16px;font-size:11.5px;color:var(--t3);flex-wrap:wrap;">
      <span>Showing <strong style="color:var(--t1)">${_pag.total}</strong> interview${_pag.total!==1?'s':''}</span>
      ${todayInts>0?'<span style="color:var(--brand);font-weight:700;"><i class="fa-solid fa-clock" style="margin-right:4px;font-size:10px;"></i>'+todayInts+' scheduled today</span>':''}
    </div>`:''}
  </div>`;

  // Build final html with pagination bar
  var _pi=_pagerHtml('interviews',_pag);
  if(_pi){ var _li=html.lastIndexOf('</div>'); if(_li>=0) html=html.slice(0,_li)+_pi+'</div>'; }
  _el('v-interviews').innerHTML = html;

}

function _intStatusQuick(st) {
  _PG.interviews=1; _FS['intFilter']=st; _renderInterviews();
}

function _rescheduleInterview(interviewId) {
  var i = (_D.interviews||[]).find(function(x){return x['Interview ID']===interviewId;});
  if (!i) return;
  _showModal('Reschedule Interview', `
    <div class="fg1">
      <div class="fg">
        <label>New Date & Time <span class="req">*</span></label>
        <input id="rs_sched" type="datetime-local" value="${i['Scheduled On']||''}">
      </div>
      <div class="fg">
        <label>Interviewer</label>
        <input id="rs_iname" value="${i['Interviewer']||''}">
      </div>
      <div class="fg">
        <label>Meeting Link (optional)</label>
        <input id="rs_link" value="${i['Meeting Link']||''}" placeholder="https://meet.google.com/...">
      </div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitReschedule('${interviewId}')"><i class="fa-solid fa-calendar-check" style="margin-right:6px;"></i>Reschedule</button>`
  );
}
function _submitReschedule(interviewId) {
  var sched = _val('rs_sched');
  if (!sched) { _toast('Please select a date.','error'); return; }
  _api('updateInterview', { interviewId: interviewId, status: 'Scheduled', scheduledOn: sched, interviewer: _val('rs_iname'), meetingLink: _val('rs_link') }, function(r) {
    if (r.success) { _closeModal(); _toast('Interview rescheduled.','success'); _loadData(); }
    else _toast(r.error,'error');
  });
}

// ─── OFFER LETTERS ────────────────────────────────────────────
function _renderOffers() {
  var offs  = _D.offers     || [];
  var cands = _D.candidates || [];
  var jobs  = _D.jobs       || [];

  var search  = _el('offSearch')       ? _el('offSearch').value.toLowerCase()  : '';
  var stF     = (_el('offFilter') ? _el('offFilter').value : null) || _FS['offFilter'] || 'all';
  var monthF  = _el('offMonthFilter')  ? _el('offMonthFilter').value            : 'all';
  var sortF   = _el('offSort')         ? _el('offSort').value                   : 'newest';
  var deptF   = _el('offDeptFilter')   ? _el('offDeptFilter').value             : 'all';

  var allDepts = ['all'].concat([...new Set(jobs.map(function(j){return j['Department']||'';}).filter(Boolean))]);
  var deptOpts = allDepts.map(function(d){return '<option value="'+d+'" '+(deptF===d?'selected':'')+'>'+(d==='all'?'All Departments':d)+'</option>';}).join('');

  // Status counts
  var sentCount     = offs.filter(function(o){return o['Offer Status']==='Sent';}).length;
  var acceptedCount = offs.filter(function(o){return o['Offer Status']==='Accepted';}).length;
  var declinedCount = offs.filter(function(o){return o['Offer Status']==='Declined';}).length;

  var today = _istDate();
  var thisMonth = today.slice(0,7);
  var _lmDate = new Date(new Date().getTime()+(330*60*1000)); _lmDate.setMonth(_lmDate.getMonth()-1); var lastMonth = _lmDate.toISOString().slice(0,7);

  var visible = offs.filter(function(o) {
    if (stF!=='all' && o['Offer Status']!==stF) return false;
    if (monthF==='this_month' && (o['Sent On']||'').slice(0,7)!==thisMonth) return false;
    if (monthF==='last_month' && (o['Sent On']||'').slice(0,7)!==lastMonth) return false;
    if (monthF==='this_year'  && (o['Sent On']||'').slice(0,4)!==_istYear()) return false;
    if (deptF!=='all') {
      var c = cands.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
      var j = c ? jobs.find(function(x){return x['Job ID']===c['Job ID'];}) : null;
      if (!j || j['Department']!==deptF) return false;
    }
    if (search) {
      var c2 = cands.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
      if (!c2||(!(c2['Full Name']||'').toLowerCase().includes(search)&&!(c2['Email']||'').toLowerCase().includes(search))) return false;
    }
    return true;
  });

  if (sortF==='newest')  visible.sort(function(a,b){return (b['Sent On']||'').localeCompare(a['Sent On']||'');});
  if (sortF==='oldest')  visible.sort(function(a,b){return (a['Sent On']||'').localeCompare(b['Sent On']||'');});
  if (sortF==='ctc-hi')  visible.sort(function(a,b){return parseFloat(b['Offered CTC']||0)-parseFloat(a['Offered CTC']||0);});
  if (sortF==='ctc-lo')  visible.sort(function(a,b){return parseFloat(a['Offered CTC']||0)-parseFloat(b['Offered CTC']||0);});
  if (sortF==='joining') visible.sort(function(a,b){return (a['Joining Date']||'9').localeCompare(b['Joining Date']||'9');});

  // CTC stats
  var acceptedCTC = offs.filter(function(o){return o['Offer Status']==='Accepted';})
    .reduce(function(s,o){return s+parseFloat(o['Offered CTC']||0);},0);
  var avgCTC = acceptedCount>0 ? (acceptedCTC/acceptedCount).toFixed(1) : '—';

  var _pag = _paginate(visible, 'offers');
  var _slice = _pag.slice;

  var html = `
  <!-- KPI strip -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">
    ${[
      ['fa-file-signature','Total Offers',offs.length,'var(--brand)','rgba(227,30,36,.08)'],
      ['fa-paper-plane','Pending',sentCount,'#d97706','rgba(245,158,11,.08)'],
      ['fa-circle-check','Accepted',acceptedCount,'#059669','rgba(16,185,129,.08)'],
      ['fa-circle-xmark','Declined',declinedCount,'#dc2626','rgba(239,68,68,.08)'],
      ['fa-indian-rupee-sign','Avg CTC',avgCTC+' LPA','#7c3aed','rgba(139,92,246,.08)'],
    ].map(function(x){
      return '<div style="background:var(--surf);border-radius:var(--r-md);padding:14px 16px;border:1px solid var(--bdr);box-shadow:var(--shadow-xs);">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        +'<div style="width:30px;height:30px;border-radius:8px;background:'+x[4]+';display:flex;align-items:center;justify-content:center;font-size:12px;color:'+x[3]+';"><i class="fa-solid '+x[0]+'"></i></div>'
        +'<span style="font-size:11px;font-weight:700;color:var(--t3);">'+x[1]+'</span></div>'
        +'<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:22px;font-weight:800;color:'+x[3]+';">'+x[2]+'</div>'
        +'</div>';
    }).join('')}
  </div>

  <!-- Status pills -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
    ${[['all','All',offs.length],['Sent','Pending',sentCount],['Accepted','Accepted',acceptedCount],['Declined','Declined',declinedCount]].map(function(x){
      var ac=stF===x[0];
      var col=x[0]==='Sent'?'#d97706':x[0]==='Accepted'?'#059669':x[0]==='Declined'?'#dc2626':'var(--t1)';
      return '<button onclick="_offStatusQuick(\''+x[0]+'\')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:50px;border:1.5px solid '+(ac?'transparent':col==='var(--t1)'?'var(--bdr)':'rgba(0,0,0,.12)')+';background:'+(ac?col:col==='var(--t1)'?'var(--surf)':'var(--surf)')+';color:'+(ac?'#fff':col)+';font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;">'
        +x[1]+' <span style="background:'+(ac?'rgba(255,255,255,.25)':'var(--surf2)')+';color:'+(ac?'#fff':col)+';padding:1px 7px;border-radius:10px;font-size:10px;font-weight:800;">'+x[2]+'</span></button>';
    }).join('')}
  </div>

  <!-- Toolbar -->
  <div class="view-bar" style="flex-wrap:wrap;gap:10px;align-items:flex-start;">
    <div class="vb-left" style="flex-wrap:wrap;gap:8px;">
      <div class="search-box" style="max-width:260px;">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="offSearch" type="text" placeholder="Candidate name or email..." value="${search}" oninput="_PG.offers=1;_renderOffers()">
        ${search?'<button onclick="_el(\'offSearch\').value=\'\';_renderOffers()" style="background:none;border:none;cursor:pointer;color:var(--t4);padding:0 4px;font-size:11px;">✕</button>':''}
      </div>
      <select id="offDeptFilter"  class="f-select" onchange="_PG.offers=1;_renderOffers()">${deptOpts}</select>
      <select id="offMonthFilter" class="f-select" onchange="_PG.offers=1;_renderOffers()">
        <option value="all"        ${monthF==='all'?'selected':''}>All Time</option>
        <option value="this_month" ${monthF==='this_month'?'selected':''}>This Month</option>
        <option value="last_month" ${monthF==='last_month'?'selected':''}>Last Month</option>
        <option value="this_year"  ${monthF==='this_year'?'selected':''}>This Year</option>
      </select>
      <select id="offSort" class="f-select" onchange="_PG.offers=1;_renderOffers()">
        <option value="newest"  ${sortF==='newest'?'selected':''}>⬇ Newest First</option>
        <option value="oldest"  ${sortF==='oldest'?'selected':''}>⬆ Oldest First</option>
        <option value="ctc-hi"  ${sortF==='ctc-hi'?'selected':''}>💰 CTC High–Low</option>
        <option value="ctc-lo"  ${sortF==='ctc-lo'?'selected':''}>💰 CTC Low–High</option>
        <option value="joining" ${sortF==='joining'?'selected':''}>📅 Joining Soon</option>
      </select>
    </div>
    <div class="vb-right" style="gap:8px;">
      <span class="res-count">${visible.length} of ${offs.length}</span>
      ${_hasWrite()?'<button class="btn-add" onclick="_openOfferModal()"><i class="fa-solid fa-file-signature" style="margin-right:6px"></i>Create Offer</button>':''}
    </div>
  </div>

  <div class="table-card">
    <div class="tbl-scroll">
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Department</th>
            <th>Job Role</th>
            <th>Offered CTC</th>
            <th>Joining Date</th>
            <th>Sent On</th>
            <th>Status</th>
            <th>Days Since</th>
            ${_hasWrite()?'<th style="min-width:140px;">Actions</th>':''}
          </tr>
        </thead>
        <tbody>
          ${visible.length ? _slice.map(function(o) {
            var c   = cands.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
            var j   = jobs.find(function(x){return x['Job ID']===o['Job ID'];});
            var dept= j?j['Department']||'—':'—';
            var stCls = o['Offer Status']==='Accepted'?'badge b-accepted':o['Offer Status']==='Declined'?'badge b-declined':'badge b-sent';
            var daysSince = o['Sent On'] ? Math.floor((new Date()-new Date(o['Sent On']))/(1000*60*60*24)) : '—';
            var isUrgent = o['Offer Status']==='Sent' && typeof daysSince==='number' && daysSince>=7;
            var joiningIsNear = (function(){ var d=new Date(new Date().getTime()+(330*60*1000)+7*864e5); return o['Joining Date'] && o['Joining Date']<=d.toISOString().slice(0,10) && o['Joining Date']>=_istDate(); })();
            return `<tr style="${isUrgent?'background:rgba(245,158,11,.04);':''}">
              <td>
                <div class="name-cell">
                  <div class="n-av sm" style="background:${_avatarGrad(c?c['Full Name']:'')};">${c?(c['Full Name']||'?').charAt(0).toUpperCase():'?'}</div>
                  <div>
                    <div class="n-name">${c?c['Full Name']:'—'}</div>
                    <div class="n-email">${c?c['Email']||'':'—'}</div>
                  </div>
                </div>
              </td>
              <td><span class="src-tag" style="font-size:11px;">${dept}</span></td>
              <td style="font-size:12.5px;color:var(--t2);">${j?j['Title']:'—'}</td>
              <td style="font-weight:800;color:#059669;font-size:15px;">${o['Offered CTC']?o['Offered CTC']+' LPA':'—'}</td>
              <td style="font-size:12.5px;${joiningIsNear?'color:#e31e24;font-weight:700;':'color:var(--t2);'}">
                ${joiningIsNear?'<i class="fa-solid fa-triangle-exclamation" style="font-size:10px;margin-right:4px;"></i>':''}${o['Joining Date']||'—'}
              </td>
              <td style="font-size:11.5px;color:var(--t4);">${o['Sent On']||'—'}</td>
              <td>
                <span class="${stCls}">${o['Offer Status']}</span>
                ${isUrgent?'<div style="font-size:9.5px;color:#d97706;font-weight:700;margin-top:2px;">⚠ Awaiting '+daysSince+'d</div>':''}
              </td>
              <td style="font-size:12px;${isUrgent?'color:#d97706;font-weight:700;':'color:var(--t4);'}">
                ${typeof daysSince==='number'?daysSince+'d':'—'}
              </td>
              ${_hasWrite()?`<td>
                <div class="act-btns">
                  <button class="ic-btn" title="Edit Offer" onclick="_editOffer('${o['Offer ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="ic-btn" title="View Candidate" onclick="_openCndDetail('${o['Candidate ID']}')"><i class="fa-solid fa-eye"></i></button>
                  ${o['Offer Status']==='Sent'?`
                    <button class="ic-btn fwd" title="Mark Accepted" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Accepted')"><i class="fa-solid fa-check"></i></button>
                    <button class="ic-btn rej" title="Mark Declined" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Declined')"><i class="fa-solid fa-xmark"></i></button>
                    <button class="ic-btn" title="Mark Expired" style="color:#64748b;border-color:rgba(100,116,139,.3);" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Expired')"><i class="fa-solid fa-clock-rotate-left"></i></button>
                  `:''}
                  ${o['Offer Status']==='Accepted'?`
                    <button class="ic-btn fwd" title="Confirm Joining" onclick="_confirmJoining('${o['Offer ID']}','${o['Candidate ID']}')"><i class="fa-solid fa-flag-checkered"></i></button>
                  `:''}
                  ${o['Offer Status']==='Declined'?`
                    <button class="ic-btn" title="Re-send Offer" style="color:#8b5cf6;border-color:rgba(139,92,246,.3);" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Sent')"><i class="fa-solid fa-rotate-right"></i></button>
                  `:''}
                </div>
              </td>`:''}
            </tr>`;
          }).join('') : `<tr><td colspan="9" class="empty-row"><i class="fa-solid fa-file-circle-xmark" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No offer letters found.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${(_pag.pages<=1&&visible.length>0)?`<div style="padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2);display:flex;align-items:center;gap:16px;font-size:11.5px;color:var(--t3);flex-wrap:wrap;">
      <span>Pending: <strong style="color:#d97706">${sentCount}</strong></span>
      <span>Accepted: <strong style="color:#10b981">${acceptedCount}</strong></span>
      <span>Declined: <strong style="color:#ef4444">${declinedCount}</strong></span>
      ${avgCTC!=='—'?'<span>Avg CTC: <strong style="color:#7c3aed">'+avgCTC+' LPA</strong></span>':''}
    </div>`:''}
  </div>`;

  // Build final html with pagination bar
  var _pi=_pagerHtml('offers',_pag);
  if(_pi){ var _li=html.lastIndexOf('</div>'); if(_li>=0) html=html.slice(0,_li)+_pi+'</div>'; }
  _el('v-offers').innerHTML = html;

}

function _offStatusQuick(st) {
  _PG.offers=1; _FS['offFilter']=st; _renderOffers();
}

function _openJobModal(job) {
  var j = job || {};
  var depts = ['Production','Quality','Accounts','HR','Purchase','Sales','Admin','IT','Maintenance'];
  _showModal(j['Job ID'] ? 'Edit Job Opening' : 'New Job Opening', `
    <div class="fg2">
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
      <div class="fg">
        <label>Status</label>
        <select id="f_status">
          ${['Open','Closed','On Hold'].map(function(s){return '<option '+(j['Status']===s?'selected':'')+((!j['Job ID']&&s==='Open')?' selected':'')+'>'+s+'</option>';}).join('')}
        </select>
      </div>
      <div class="fg">
        <label>Posted By</label>
        <input id="f_by" value="${j['Posted By']||(_U?_U.name:'')}" placeholder="HR Manager name">
      </div>
      <div class="fg full">
        <label>Job Description</label>
        <textarea id="f_desc" rows="3" placeholder="Describe responsibilities, skills needed...">${j['Description']||''}</textarea>
      </div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitJob('${j['Job ID']||''}')"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>Save Job</button>`
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
    deadline: _val('f_ddl'), description: _val('f_desc'),
    status: _val('f_status') || 'Open',
    postedBy: _val('f_by') || (_U?_U.name:'')
  };
  if (!data.title) { _toast('Job title is required.','error'); _submitting=false; return; }
  _setBtnLoading('mbtn-p', true, 'Saving...');
  _api(existingId ? 'updateJob' : 'saveJob', data, function(r) {
    _submitting = false; _setBtnLoading('mbtn-p', false, 'Save Job');
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
  var agys   = _D.agencies   || [];

  // Read filter state (persist across re-renders)
  var search  = _el('cndSearch') ? _el('cndSearch').value.toLowerCase() : '';
  var stgF    = (_el('cndStageFilter') ? _el('cndStageFilter').value : null) || _FS['cndStageFilter'] || 'all';
  var jobF    = (_el('cndJobFilter') ? _el('cndJobFilter').value : null) || _FS['cndJobFilter'] || 'all';
  var srcF    = (_el('cndSrcFilter') ? _el('cndSrcFilter').value : null) || _FS['cndSrcFilter'] || 'all';
  var agyF    = (_el('cndAgyFilter') ? _el('cndAgyFilter').value : null) || _FS['cndAgyFilter'] || 'all';
  var expF    = _el('cndExpFilter')   ? _el('cndExpFilter').value              : 'all';
  var deptF   = (_el('cndDeptFilter') ? _el('cndDeptFilter').value : null) || _FS['cndDeptFilter'] || 'all';
  var ctcF    = _el('cndCtcFilter')   ? _el('cndCtcFilter').value              : 'all';
  var sortF   = (_el('cndSort') ? _el('cndSort').value : null) || _FS['cndSort'] || 'newest';

  // Build option lists
  var allSources = ['all'].concat([...new Set(cands.map(function(c){return c['Source']||'';}).filter(Boolean))]);
  // Agency filter: show active agencies from master list + any in existing candidates
  var activeAgys  = (_D.agencies||[]).filter(function(a){ return a['Status']==='Active'; }).map(function(a){ return a['Agency Name']; });
  var candAgys    = cands.map(function(c){return c['Agency Name']||'';}).filter(Boolean);
  var allAgysSet  = new Set(activeAgys.concat(candAgys));
  var allAgys     = ['all'].concat([...allAgysSet].sort());
  var allDepts   = ['all'].concat([...new Set(jobs.map(function(j){return j['Department']||'';}).filter(Boolean))]);

  // Stage counts for pills
  var stageCounts = {};
  ['Applied','Interview','Selected','Offered','Joined','Rejected'].forEach(function(s){
    stageCounts[s] = cands.filter(function(c){ return c['Stage']===s; }).length;
  });

  // Filter
  var visible = cands.filter(function(c) {
    if (stgF  !== 'all' && c['Stage']       !== stgF)  return false;
    if (jobF  !== 'all' && c['Job ID']      !== jobF)  return false;
    if (srcF  !== 'all' && c['Source']      !== srcF)  return false;
    if (agyF  !== 'all' && c['Agency Name'] !== agyF)  return false;
    if (deptF !== 'all') {
      var cJob = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
      if (!cJob || cJob['Department'] !== deptF) return false;
    }
    if (expF !== 'all') {
      var exp = parseFloat(c['Experience (Yrs)']||0);
      if (expF==='0-2'  && exp>2)               return false;
      if (expF==='2-5'  && (exp<2||exp>5))      return false;
      if (expF==='5-10' && (exp<5||exp>10))     return false;
      if (expF==='10+'  && exp<10)              return false;
    }
    if (ctcF !== 'all') {
      var ectc = parseFloat(c['Expected CTC']||0);
      if (ctcF==='0-3'   && ectc>3)             return false;
      if (ctcF==='3-6'   && (ectc<3||ectc>6))  return false;
      if (ctcF==='6-10'  && (ectc<6||ectc>10)) return false;
      if (ctcF==='10+'   && ectc<10)            return false;
    }
    if (search && !(c['Full Name']||'').toLowerCase().includes(search) &&
                  !(c['Email']||'').toLowerCase().includes(search) &&
                  !(c['Phone']||'').toLowerCase().includes(search) &&
                  !(c['Current Company']||'').toLowerCase().includes(search) &&
                  !(c['Candidate ID']||'').toLowerCase().includes(search) &&
                  !(c['Agency Name']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort
  if (sortF === 'newest')  visible.sort(function(a,b){ return (b['Applied On']||'').localeCompare(a['Applied On']||''); });
  if (sortF === 'oldest')  visible.sort(function(a,b){ return (a['Applied On']||'').localeCompare(b['Applied On']||''); });
  if (sortF === 'name')    visible.sort(function(a,b){ return (a['Full Name']||'').localeCompare(b['Full Name']||''); });
  if (sortF === 'exp-hi')  visible.sort(function(a,b){ return parseFloat(b['Experience (Yrs)']||0)-parseFloat(a['Experience (Yrs)']||0); });
  if (sortF === 'exp-lo')  visible.sort(function(a,b){ return parseFloat(a['Experience (Yrs)']||0)-parseFloat(b['Experience (Yrs)']||0); });
  if (sortF === 'ctc-hi')  visible.sort(function(a,b){ return parseFloat(b['Expected CTC']||0)-parseFloat(a['Expected CTC']||0); });
  if (sortF === 'modified')visible.sort(function(a,b){ return (b['Last Modified']||'').localeCompare(a['Last Modified']||''); });

  // Build select options
  var jobOpts  = '<option value="all">All Jobs</option>'
    + jobs.map(function(j){ return '<option value="'+j['Job ID']+'" '+(jobF===j['Job ID']?'selected':'')+'>'+j['Title']+'</option>'; }).join('');
  var srcOpts  = allSources.map(function(s){ return '<option value="'+s+'" '+(srcF===s?'selected':'')+'>'+(s==='all'?'All Sources':s)+'</option>'; }).join('');
  var agyOpts  = allAgys.map(function(a){ return '<option value="'+a+'" '+(agyF===a?'selected':'')+'>'+(a==='all'?'All Agencies':a)+'</option>'; }).join('');
  var deptOpts = allDepts.map(function(d){ return '<option value="'+d+'" '+(deptF===d?'selected':'')+'>'+(d==='all'?'All Departments':d)+'</option>'; }).join('');

  // Stage pill bar (quick filter)
  var stagePills = ['Applied','Interview','Selected','Offered','Joined','Rejected'].map(function(s){
    var sc = _stageClass(s);
    var active = stgF === s;
    return '<button onclick="_cndStageQuick(\''+s+'\')" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1.5px solid '+(active?'transparent':'var(--bdr)')+';background:'+(active?'var(--brand)':'var(--surf)')+';color:'+(active?'#fff':'var(--t2)')+';font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;">'
      + s + ' <span style="background:'+(active?'rgba(255,255,255,.3)':'var(--surf2)')+';color:'+(active?'#fff':'var(--t3)')+';padding:1px 6px;border-radius:10px;font-size:10px;font-weight:800;">'+stageCounts[s]+'</span></button>';
  }).join('');

  var _pag = _paginate(visible, 'candidates');
  var _slice = _pag.slice;

  var html = `
  <!-- Stage quick-filter pills -->
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding:12px 16px;background:var(--surf);border-radius:var(--r-md);border:1px solid var(--bdr);box-shadow:var(--shadow-xs);">
    <span style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-right:4px;">Stage</span>
    <button onclick="_cndStageQuick('all')" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1.5px solid ${stgF==='all'?'transparent':'var(--bdr)'};background:${stgF==='all'?'var(--t1)':'var(--surf)'};color:${stgF==='all'?'#fff':'var(--t2)'};font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;">
      All <span style="background:${stgF==='all'?'rgba(255,255,255,.25)':'var(--surf2)'};color:${stgF==='all'?'#fff':'var(--t3)'};padding:1px 6px;border-radius:10px;font-size:10px;font-weight:800;">${cands.length}</span>
    </button>
    ${stagePills}
  </div>

  <!-- Main toolbar -->
  <div class="view-bar" style="flex-wrap:wrap;gap:10px;align-items:flex-start;">
    <div class="vb-left" style="flex-wrap:wrap;gap:8px;">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="cndSearch" type="text" placeholder="Name, email, phone, company, ID..." value="${search}" oninput="_PG.candidates=1;_renderCandidates()">
        ${search ? '<button onclick="_el(\'cndSearch\').value=\'\';_renderCandidates()" style="background:none;border:none;cursor:pointer;color:var(--t4);font-size:11px;padding:0 4px;">✕</button>' : ''}
      </div>
      <select id="cndJobFilter"   class="f-select" onchange="_PG.candidates=1;_FS['cndJobFilter']=this.value;_renderCandidates()">${jobOpts}</select>
      <select id="cndDeptFilter"  class="f-select" onchange="_PG.candidates=1;_FS['cndDeptFilter']=this.value;_renderCandidates()">${deptOpts}</select>
      <select id="cndSrcFilter"   class="f-select" onchange="_PG.candidates=1;_FS['cndSrcFilter']=this.value;_renderCandidates()">${srcOpts}</select>
      <select id="cndAgyFilter"   class="f-select" onchange="_PG.candidates=1;_FS['cndAgyFilter']=this.value;_renderCandidates()">${agyOpts}</select>
      <select id="cndExpFilter"   class="f-select" onchange="_PG.candidates=1;_renderCandidates()">
        <option value="all" ${expF==='all'?'selected':''}>All Experience</option>
        <option value="0-2"  ${expF==='0-2'?'selected':''}>0–2 yrs</option>
        <option value="2-5"  ${expF==='2-5'?'selected':''}>2–5 yrs</option>
        <option value="5-10" ${expF==='5-10'?'selected':''}>5–10 yrs</option>
        <option value="10+"  ${expF==='10+'?'selected':''}>10+ yrs</option>
      </select>
      <select id="cndCtcFilter"   class="f-select" onchange="_PG.candidates=1;_renderCandidates()">
        <option value="all"  ${ctcF==='all'?'selected':''}>All CTC</option>
        <option value="0-3"  ${ctcF==='0-3'?'selected':''}>Exp. ≤ 3 LPA</option>
        <option value="3-6"  ${ctcF==='3-6'?'selected':''}>Exp. 3–6 LPA</option>
        <option value="6-10" ${ctcF==='6-10'?'selected':''}>Exp. 6–10 LPA</option>
        <option value="10+"  ${ctcF==='10+'?'selected':''}>Exp. 10+ LPA</option>
      </select>
      <select id="cndSort" class="f-select" onchange="_PG.candidates=1;_renderCandidates()">
        <option value="newest"  ${sortF==='newest'?'selected':''}>⬇ Newest First</option>
        <option value="oldest"  ${sortF==='oldest'?'selected':''}>⬆ Oldest First</option>
        <option value="name"    ${sortF==='name'?'selected':''}>🔤 Name A–Z</option>
        <option value="exp-hi"  ${sortF==='exp-hi'?'selected':''}>📈 Exp. High–Low</option>
        <option value="exp-lo"  ${sortF==='exp-lo'?'selected':''}>📉 Exp. Low–High</option>
        <option value="ctc-hi"  ${sortF==='ctc-hi'?'selected':''}>💰 CTC High–Low</option>
        <option value="modified"${sortF==='modified'?'selected':''}>🕐 Recently Modified</option>
      </select>
    </div>
    <div class="vb-right" style="gap:8px;">
      <span class="res-count">${visible.length} of ${cands.length}</span>
      ${_hasWrite() ? `
        <button class="btn-add" onclick="_openCndModal()"><i class="fa-solid fa-user-plus" style="margin-right:6px"></i>Add Candidate</button>
        ${visible.length > 0 ? `<button onclick="_bulkExportCsv()" title="Export CSV" style="display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:var(--surf);color:var(--t2);border:1.5px solid var(--bdr);border-radius:50px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;"><i class="fa-solid fa-download"></i></button>` : ''}
      ` : ''}
    </div>
  </div>

  ${_U && _U.role === 'candidate' ? '<div class="role-banner"><i class="fa-solid fa-eye" style="margin-right:8px"></i>Viewing as Candidate — Read Only Mode</div>' : ''}

  <div class="table-card">
    <div class="tbl-scroll">
      <table class="data-tbl">
        <thead>
          <tr>
            <th style="width:36px;"></th>
            <th>Candidate</th>
            <th>Contact</th>
            <th>Job Applied</th>
            <th>Department</th>
            <th>Company</th>
            <th>Exp.</th>
            <th>Current CTC</th>
            <th>Expected CTC</th>
            <th>Source</th>
            <th>Agency</th>
            <th>Resume</th>
            <th>Stage</th>
            <th>Applied On</th>
            <th>Last Modified</th>
            <th style="min-width:${_hasWrite()?'240px':'80px'};">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${visible.length ? _slice.map(function(c) {
            var job     = jobs.find(function(j){ return j['Job ID']===c['Job ID']; });
            var nextStg = _stageNext(c['Stage']);
            var prevStg = _stagePrev(c['Stage']);
            var canAdv  = _hasWrite() && nextStg && ['Applied','Interview','Selected','Offered'].indexOf(c['Stage'])>=0;
            var canRej  = _hasWrite() && c['Stage']!=='Rejected' && c['Stage']!=='Joined';
            var canRev  = _hasWrite() && prevStg && c['Stage']!=='Joined';
            var hasIntv = (_D.interviews||[]).some(function(i){ return i['Candidate ID']===c['Candidate ID'] && i['Status']==='Scheduled'; });
            var hasOff  = (_D.offers||[]).some(function(o){ return o['Candidate ID']===c['Candidate ID']; });

            // Row highlight based on stage
            var rowBg = '';
            if (c['Stage']==='Joined')   rowBg = 'background:rgba(16,185,129,.04)';
            if (c['Stage']==='Rejected') rowBg = 'background:rgba(239,68,68,.03)';
            if (c['Stage']==='Offered')  rowBg = 'background:rgba(139,92,246,.04)';

            return `<tr style="${rowBg};cursor:pointer;" onclick="if(event.target.closest('.ic-btn'))return;_openCndDetail('${c['Candidate ID']}')">
              <td style="padding:8px 10px;">
                <div style="width:8px;height:8px;border-radius:50%;background:${
                  c['Stage']==='Applied'?'#3b82f6':c['Stage']==='Interview'?'#f59e0b':c['Stage']==='Selected'?'#8b5cf6':c['Stage']==='Offered'?'#ec4899':c['Stage']==='Joined'?'#10b981':'#ef4444'
                };margin:0 auto;"></div>
              </td>
              <td>
                <div class="name-cell">
                  <div class="n-av sm" style="background:${_avatarGrad(c['Full Name'])};flex-shrink:0;">${(c['Full Name']||'?').charAt(0).toUpperCase()}</div>
                  <div style="min-width:0;">
                    <div class="n-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;" title="${c['Full Name']||''}">${c['Full Name']||'—'}</div>
                    <div class="n-email" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;" title="${c['Email']||''}">${c['Email']||'—'}</div>
                  </div>
                </div>
              </td>
              <td style="color:var(--t2);font-size:12px;">${c['Phone']||'—'}</td>
              <td style="font-weight:600;color:var(--t1);font-size:12.5px;">${job ? job['Title'] : '—'}</td>
              <td style="font-size:12px;">${job ? (job['Department']||'—') : '—'}</td>
              <td style="font-size:12px;color:var(--t2);">${c['Current Company']||'—'}</td>
              <td style="text-align:center;font-weight:700;color:var(--t1);">${c['Experience (Yrs)']||0}<span style="font-size:10px;color:var(--t4);font-weight:400;"> yr</span></td>
              <td style="font-size:12px;color:var(--t2);">${c['Current CTC']?c['Current CTC']+' LPA':'—'}</td>
              <td style="font-weight:700;color:#059669;font-size:12.5px;">${c['Expected CTC']?c['Expected CTC']+' LPA':'—'}</td>
              <td><span class="src-tag">${c['Source']||'—'}</span></td>
              <td>${c['Agency Name'] ? '<span class="agy-tag"><i class="fa-solid fa-handshake" style="font-size:9px;margin-right:4px;opacity:.7"></i>'+c['Agency Name']+'</span>' : '<span style="color:var(--t4);font-size:11px;">Direct</span>'}</td>
              <td style="text-align:center;">
                ${c['Resume Link'] ? '<a href="'+c['Resume Link']+'" title="View Resume" style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:rgba(59,130,246,.1);color:#3b82f6;font-size:11px;border:1px solid rgba(59,130,246,.25);text-decoration:none;"><i class="fa-solid fa-file-pdf"></i></a>' : '<span style="color:var(--t4);font-size:11px;">—</span>'}
              </td>
              <td>
                <span class="${_stageClass(c['Stage'])}" style="white-space:nowrap;">${c['Stage']}</span>
                ${hasIntv ? '<span title="Interview Scheduled" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#f59e0b;margin-left:5px;vertical-align:middle;"></span>' : ''}
                ${hasOff  ? '<span title="Offer Issued"        style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#8b5cf6;margin-left:5px;vertical-align:middle;"></span>' : ''}
              </td>
              <td style="font-size:11px;color:var(--t4);white-space:nowrap;">${c['Applied On']||'—'}</td>
              <td style="font-size:11px;color:var(--t4);white-space:nowrap;">${c['Last Modified']?c['Last Modified'].slice(0,10):'—'}</td>
              <td style="max-width:150px;">
                ${c['Rejection Reason']
                  ? '<span title="'+c['Rejection Reason']+'" style="display:inline-block;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#dc2626;background:rgba(239,68,68,.08);padding:2px 7px;border-radius:6px;border:1px solid rgba(239,68,68,.2);">'+c['Rejection Reason']+'</span>'
                  : '<span style="color:var(--t4);font-size:11px;">—</span>'}
              </td>
              <td>
                <div class="act-btns" style="gap:3px;flex-wrap:nowrap;justify-content:flex-end;">
                  <!-- View Profile -->
                  <button class="ic-btn" title="View Profile" onclick="_openCndDetail('${c['Candidate ID']}')"><i class="fa-solid fa-eye"></i></button>
                  ${_hasWrite() ? `
                  <!-- Edit -->
                  <button class="ic-btn" title="Edit Candidate" onclick="_editCnd('${c['Candidate ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  <!-- Advance Stage -->
                  ${canAdv ? `<button class="ic-btn fwd" title="Advance → ${nextStg}" onclick="_quickStageChange('${c['Candidate ID']}','${nextStg}')"><i class="fa-solid fa-circle-chevron-right"></i></button>` : ''}
                  <!-- Revert Stage -->
                  ${canRev ? `<button class="ic-btn bwd" title="← Revert to ${prevStg}" onclick="_quickStageChange('${c['Candidate ID']}','${prevStg}')"><i class="fa-solid fa-circle-chevron-left"></i></button>` : ''}
                  <!-- Schedule Interview (Applied/Interview stage) -->
                  ${(c['Stage']==='Applied'||c['Stage']==='Interview') ? `<button class="ic-btn" title="Schedule Interview" style="color:#f59e0b;border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.08);" onclick="_scheduleInterviewFrom('${c['Candidate ID']}')"><i class="fa-solid fa-calendar-plus"></i></button>` : ''}
                  <!-- Mark Interview Result (Interview stage + has interview) -->
                  ${c['Stage']==='Interview' && hasIntv ? `<button class="ic-btn" title="Mark Interview Result" style="color:#8b5cf6;border-color:rgba(139,92,246,.35);background:rgba(139,92,246,.08);" onclick="_markInterviewResultFromCand('${c['Candidate ID']}')"><i class="fa-solid fa-check-to-slot"></i></button>` : ''}
                  <!-- Create Offer (Selected) -->
                  ${c['Stage']==='Selected' ? `<button class="ic-btn" title="Create Offer Letter" style="color:#ec4899;border-color:rgba(236,72,153,.35);background:rgba(236,72,153,.08);" onclick="_createOfferFrom('${c['Candidate ID']}')"><i class="fa-solid fa-file-signature"></i></button>` : ''}
                  <!-- Confirm Joining (Offered + offer accepted) -->
                  ${c['Stage']==='Offered' && hasOff ? `<button class="ic-btn" title="Confirm Joining" style="color:#10b981;border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08);" onclick="_confirmJoiningFromCand('${c['Candidate ID']}')"><i class="fa-solid fa-flag-checkered"></i></button>` : ''}
                  <!-- Reject -->
                  ${canRej ? `<button class="ic-btn rej" title="Reject Candidate" onclick="_quickStageChange('${c['Candidate ID']}','Rejected')"><i class="fa-solid fa-ban"></i></button>` : ''}
                  <!-- Restore (Rejected) -->
                  ${c['Stage']==='Rejected' ? `<button class="ic-btn" title="Restore to Applied" style="color:#6366f1;border-color:rgba(99,102,241,.35);background:rgba(99,102,241,.08);" onclick="_quickStageChange('${c['Candidate ID']}','Applied')"><i class="fa-solid fa-rotate-left"></i></button>` : ''}
                  ` : ''}
                </div>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="16" class="empty-row"><i class="fa-solid fa-users-slash" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No candidates match your filters.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${(_pag.pages<=1&&visible.length > 0) ? `
    <div style="padding:12px 16px;border-top:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;background:var(--surf2);font-size:12px;color:var(--t3);">
      <span><strong style="color:var(--t1)">${_pag.total}</strong> candidates</span>
      <div style="display:flex;gap:16px;">
        <span>Applied: <strong style="color:#3b82f6">${stageCounts['Applied']}</strong></span>
        <span>Interview: <strong style="color:#f59e0b">${stageCounts['Interview']}</strong></span>
        <span>Selected: <strong style="color:#8b5cf6">${stageCounts['Selected']}</strong></span>
        <span>Joined: <strong style="color:#10b981">${stageCounts['Joined']}</strong></span>
      </div>
    </div>` : ''}
  </div>`;

  // Build final html with pagination bar
  var _pi=_pagerHtml('candidates',_pag);
  if(_pi){ var _li=html.lastIndexOf('</div>'); if(_li>=0) html=html.slice(0,_li)+_pi+'</div>'; }
  _el('v-candidates').innerHTML = html;

}

// Helper: avatar gradient based on name
function _avatarGrad(name) {
  var grads = [
    'linear-gradient(135deg,#e31e24,#f59e0b)',
    'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    'linear-gradient(135deg,#10b981,#14b8a6)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#ec4899,#f43f5e)',
    'linear-gradient(135deg,#14b8a6,#10b981)'
  ];
  var code = (name||'').charCodeAt(0) % grads.length;
  return grads[code];
}

// Stage quick filter helper
function _cndStageQuick(stage) {
  _PG.candidates=1; _FS['cndStageFilter']=stage; _renderCandidates();
}

// Quick stage change — no confirm dialog for forward movement, confirm for reject
function _quickStageChange(candidateId, newStage) {
  if (newStage === 'Rejected') {
    // Show rejection reason modal instead of confirm popup
    _openRejectModal(candidateId);
    return;
  }
  var btn = event && event.currentTarget;
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
  _api('updateCandidateStage', { candidateId: candidateId, stage: newStage }, function(r) {
    if (r.success) {
      _toast('Stage updated → ' + newStage, 'success');
      _loadData();
    } else {
      _toast(r.error, 'error');
      if (btn) { btn.disabled = false; }
    }
  }, function(e) { _toast(e.message, 'error'); if (btn) btn.disabled = false; });
}


// Rejection modal — no confirm() popup, captures reason
function _openRejectModal(candidateId) {
  _rejectCandId = candidateId;
  var c = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; });
  if (!c) return;
  _showModal('Reject Candidate', 
    '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(239,68,68,.07);border-radius:10px;border:1px solid rgba(239,68,68,.2);margin-bottom:16px;">'
      +'<div style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ef4444;"><i class="fa-solid fa-ban"></i></div>'
      +'<div><div style="font-size:13px;font-weight:700;color:var(--t1);">Reject: '+c['Full Name']+'</div>'
        +'<div style="font-size:12px;color:var(--t3);">Current stage: '+c['Stage']+'</div></div>'
    +'</div>'
    +'<div class="fg">'
      +'<label>Rejection Reason <span style="color:var(--t3);font-size:10px;font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>'
      +'<select id="rej_reason_sel" onchange="var _ro=document.getElementById(\'rej_reason_other\');if(_ro)_ro.style.display=this.value===\'Other\'?\'block\':\'none\';">'
        +'<option value="">— Select reason —</option>'
        +'<option>Salary expectation too high</option>'
        +'<option>Under-qualified for the role</option>'
        +'<option>Over-qualified for the role</option>'
        +'<option>Failed technical round</option>'
        +'<option>Failed HR round</option>'
        +'<option>Not a culture fit</option>'
        +'<option>Communication issues</option>'
        +'<option>Position filled internally</option>'
        +'<option>Position on hold / closed</option>'
        +'<option>Candidate withdrew</option>'
        +'<option>Better candidate selected</option>'
        +'<option>Other</option>'
      +'</select>'
      +'<textarea id="rej_reason_other" rows="2" placeholder="Enter reason..." style="display:none;margin-top:8px;"></textarea>'
    +'</div>',
    '<button class="mbtn-s" onclick="_closeModal()">Cancel</button>'
    +'<button class="mbtn-d" id="rej_submit_btn" onclick="_submitRejectModal()"><i class="fa-solid fa-ban" style="margin-right:6px;"></i>Reject Candidate</button>'
  );
}


function _submitRejectModal() { _submitReject(_rejectCandId); }
function _submitReject(candidateId) {
  var sel    = _el('rej_reason_sel');
  var other  = _el('rej_reason_other');
  var reason = sel ? (sel.value === 'Other' ? (other?other.value:'')||'Other' : sel.value) : '';
  var btn    = document.querySelector('#modal .mbtn-d');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>Rejecting...'; }
  _api('updateCandidateStage', { candidateId: candidateId, stage: 'Rejected', rejectionReason: reason }, function(r) {
    if (r.success) {
      _closeModal();
      _toast('Candidate rejected' + (reason ? ' — ' + reason.slice(0,30) : ''), 'success');
      _loadData();
    } else {
      _toast(r.error, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-ban" style="margin-right:6px;"></i>Reject Candidate'; }
    }
  }, function(e) {
    _toast(e.message, 'error');
    if (btn) { btn.disabled = false; }
  });
}

// Mark interview result directly from candidates table
function _markInterviewResultFromCand(candidateId) {
  var ints = (_D.interviews||[]).filter(function(i){ return i['Candidate ID']===candidateId && i['Status']==='Scheduled'; });
  if (!ints.length) { _toast('No scheduled interview found.', 'warning'); return; }
  _markInterviewResult(ints[0]['Interview ID'], candidateId);
}

// Confirm joining directly from candidates table
function _confirmJoiningFromCand(candidateId) {
  var offer = (_D.offers||[]).find(function(o){ return o['Candidate ID']===candidateId && (o['Offer Status']==='Accepted'||o['Offer Status']==='Sent'); });
  if (!offer) { _toast('No offer found. Create an offer first.', 'warning'); return; }
  _confirmJoining(offer['Offer ID'], candidateId);
}

// CSV Export of visible candidates
function _bulkExportCsv() {
  var cands  = _D.candidates || [];
  var jobs   = _D.jobs       || [];
  var stgF   = (_el('cndStageFilter') ? _el('cndStageFilter').value : null) || _FS['cndStageFilter'] || 'all';
  var search = _el('cndSearch')      ? _el('cndSearch').value.toLowerCase() : '';

  var visible = cands.filter(function(c) {
    if (stgF !== 'all' && c['Stage'] !== stgF) return false;
    if (search && !(c['Full Name']||'').toLowerCase().includes(search) &&
                  !(c['Email']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  var headers = ['Candidate ID','Full Name','Email','Phone','Job Title','Department',
    'Current Company','Experience (Yrs)','Current CTC','Expected CTC','Source',
    'Agency Name','Stage','Applied On','Last Modified','Resume Link'];

  var rows = visible.map(function(c){
    var job = jobs.find(function(j){ return j['Job ID']===c['Job ID']; });
    return [
      c['Candidate ID'], c['Full Name'], c['Email'], c['Phone'],
      job?job['Title']:'', job?job['Department']||'':'',
      c['Current Company'], c['Experience (Yrs)'], c['Current CTC'], c['Expected CTC'],
      c['Source'], c['Agency Name']||'', c['Stage'],
      c['Applied On'], c['Last Modified'], c['Resume Link']||''
    ].map(function(v){ return '"'+(v||'').toString().replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var a   = document.createElement('a');
  a.href  = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'ISE_Candidates_' + _istDate() + '.csv';
  a.click();
  _toast('Exported ' + visible.length + ' candidates', 'success');
}


// ─── AGENCIES ─────────────────────────────────────────────────
function _renderAgencies() {
  var agys  = _D.agencies   || [];
  var cands = _D.candidates || [];
  var ints  = _D.interviews || [];
  var offs  = _D.offers     || [];

  var filter = (_el('agyFilter') ? _el('agyFilter').value : null) || _FS['agyFilter'] || 'all';
  var search = _el('agySearch') ? _el('agySearch').value.toLowerCase() : '';
  var sortA  = _el('agySort')   ? _el('agySort').value   : 'name';

  // Enrich agency stats
  agys.forEach(function(a) {
    var ac = cands.filter(function(c){ return c['Agency Name']===a['Agency Name']; });
    a._totalCands   = ac.length;
    a._placements   = ac.filter(function(c){ return c['Stage']==='Joined'; }).length;
    a._inPipeline   = ac.filter(function(c){ return ['Applied','Interview','Selected','Offered'].indexOf(c['Stage'])>=0; }).length;
    a._rejected     = ac.filter(function(c){ return c['Stage']==='Rejected'; }).length;
    a._convRate     = a._totalCands > 0 ? Math.round(a._placements/a._totalCands*100) : 0;
    a._activeInts   = ints.filter(function(i){ return ac.some(function(c){ return c['Candidate ID']===i['Candidate ID'] && i['Status']==='Scheduled'; }); }).length;
    a._pendingOffs  = offs.filter(function(o){ return ac.some(function(c){ return c['Candidate ID']===o['Candidate ID'] && o['Offer Status']==='Sent'; }); }).length;
    // Estimated commission (if placement)
    var comm = parseFloat(a['Commission (%)']||0);
    a._estCommission = ac.filter(function(c){ return c['Stage']==='Joined'; })
      .reduce(function(sum,c){ return sum + (parseFloat(c['Expected CTC']||0)*100000*comm/100); }, 0);
  });

  // Filter
  var visible = agys.filter(function(a) {
    if (filter==='Active'   && a['Status']!=='Active')   return false;
    if (filter==='Inactive' && a['Status']!=='Inactive') return false;
    if (filter==='has-cands'&& a._totalCands===0)        return false;
    if (filter==='top'      && a._placements===0)        return false;
    if (search && !(a['Agency Name']||'').toLowerCase().includes(search) &&
                  !(a['Contact Person']||'').toLowerCase().includes(search) &&
                  !(a['Email']||'').toLowerCase().includes(search) &&
                  !(a['Phone']||'').toLowerCase().includes(search) &&
                  !(a['Address']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort
  if (sortA==='name')     visible.sort(function(a,b){ return (a['Agency Name']||'').localeCompare(b['Agency Name']||''); });
  if (sortA==='cands')    visible.sort(function(a,b){ return b._totalCands-a._totalCands; });
  if (sortA==='placed')   visible.sort(function(a,b){ return b._placements-a._placements; });
  if (sortA==='conv')     visible.sort(function(a,b){ return b._convRate-a._convRate; });
  if (sortA==='comm-hi')  visible.sort(function(a,b){ return parseFloat(b['Commission (%)']||0)-parseFloat(a['Commission (%)']||0); });
  if (sortA==='newest')   visible.sort(function(a,b){ return (b['Created On']||'').localeCompare(a['Created On']||''); });

  // Summary KPIs
  var totalCands   = agys.reduce(function(s,a){ return s+a._totalCands; },0);
  var totalPlaced  = agys.reduce(function(s,a){ return s+a._placements; },0);
  var totalPipe    = agys.reduce(function(s,a){ return s+a._inPipeline; },0);
  var avgConv      = totalCands > 0 ? Math.round(totalPlaced/totalCands*100) : 0;
  var activeCount  = agys.filter(function(a){ return a['Status']==='Active'; }).length;
  var topAgency    = agys.slice().sort(function(a,b){ return b._placements-a._placements; })[0];
  var totalCommEst = agys.reduce(function(s,a){ return s+a._estCommission; },0);

  var _pag = _paginate(visible, 'agencies');
  var _slice = _pag.slice;

  var html = `
  <!-- Agency Summary KPIs -->
  <div class="kpi-grid" style="margin-bottom:16px;">
    ${_kpiCard('fa-building','Total Agencies', agys.length, 'blue', activeCount+' active · '+(agys.length-activeCount)+' inactive')}
    ${_kpiCard('fa-users','Agency Candidates', totalCands, 'violet', totalPipe+' in pipeline')}
    ${_kpiCard('fa-user-check','Total Placements', totalPlaced, 'green', 'Confirmed joinings')}
    ${_kpiCard('fa-percent','Avg Conversion', avgConv+'%', 'teal', topAgency?'Best: '+topAgency['Agency Name']:'—')}
  </div>

  <!-- Toolbar -->
  <div class="view-bar" style="flex-wrap:wrap;gap:10px;">
    <div class="vb-left" style="flex-wrap:wrap;gap:8px;">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="agySearch" type="text" placeholder="Search by name, person, email, phone..." value="${search}" oninput="_PG.agencies=1;_renderAgencies()">
        ${search ? '<button onclick="_el(\'agySearch\').value=\'\';_renderAgencies()" style="background:none;border:none;cursor:pointer;color:var(--t4);font-size:11px;padding:0 4px;">✕</button>' : ''}
      </div>
      <select id="agyFilter" class="f-select" onchange="_PG.agencies=1;_renderAgencies()">
        <option value="all"       ${filter==='all'?'selected':''}>All Agencies</option>
        <option value="Active"    ${filter==='Active'?'selected':''}>🟢 Active Only</option>
        <option value="Inactive"  ${filter==='Inactive'?'selected':''}>🔴 Inactive Only</option>
        <option value="has-cands" ${filter==='has-cands'?'selected':''}>📁 Has Candidates</option>
        <option value="top"       ${filter==='top'?'selected':''}>⭐ Has Placements</option>
      </select>
      <select id="agySort" class="f-select" onchange="_PG.agencies=1;_renderAgencies()">
        <option value="name"    ${sortA==='name'?'selected':''}>🔤 Name A–Z</option>
        <option value="cands"   ${sortA==='cands'?'selected':''}>👥 Most Candidates</option>
        <option value="placed"  ${sortA==='placed'?'selected':''}>✅ Most Placements</option>
        <option value="conv"    ${sortA==='conv'?'selected':''}>📈 Best Conversion</option>
        <option value="comm-hi" ${sortA==='comm-hi'?'selected':''}>💸 Highest Commission</option>
        <option value="newest"  ${sortA==='newest'?'selected':''}>🕐 Newest First</option>
      </select>
    </div>
    <div class="vb-right" style="gap:8px;">
      <span class="res-count">${visible.length} of ${agys.length}</span>
      ${_hasWrite() ? '<button class="btn-add" onclick="_openAgencyModal()"><i class="fa-solid fa-plus" style="margin-right:6px"></i>Add Agency</button>' : ''}
    </div>
  </div>

  <!-- Agencies Table -->
  <div class="table-card" style="margin-bottom:16px;">
    <div class="tbl-scroll">
      <table class="data-tbl">
        <thead>
          <tr>
            <th>Agency</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Commission</th>
            <th style="text-align:center;">Candidates</th>
            <th style="text-align:center;">Pipeline</th>
            <th style="text-align:center;">Placed</th>
            <th style="text-align:center;">Conversion</th>
            <th style="text-align:center;">Active Int.</th>
            <th style="text-align:center;">Pending Offers</th>
            <th>Status</th>
            <th>Since</th>
            ${_hasWrite() ? '<th style="min-width:140px;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${visible.length ? _slice.map(function(a) {
            var isActive = a['Status']==='Active';
            var convColor = a._convRate>=50?'#10b981':a._convRate>=25?'#f59e0b':'#ef4444';
            return `<tr style="${isActive?'':'opacity:.7'};cursor:pointer;" onclick="_openAgencyDetail('${a['Agency ID']}')">
              <td>
                <div class="name-cell">
                  <div class="n-av" style="background:linear-gradient(135deg,#8b5cf6,#ec4899);flex-shrink:0;">
                    <i class="fa-solid fa-handshake" style="font-size:11px;"></i>
                  </div>
                  <div>
                    <div class="n-name">${a['Agency Name']||'—'}</div>
                    <div class="n-email">${a['Agency ID']||'—'}</div>
                  </div>
                </div>
              </td>
              <td style="font-size:12.5px;color:var(--t2);">${a['Contact Person']||'—'}</td>
              <td style="font-size:11.5px;">
                ${a['Email'] ? '<a href="mailto:'+a['Email']+'" style="color:var(--brand);text-decoration:none;font-size:11.5px;">'+a['Email']+'</a>' : '—'}
              </td>
              <td style="font-size:12px;color:var(--t2);">${a['Phone']||'—'}</td>
              <td style="font-size:11px;color:var(--t3);max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${a['Address']||''}">${a['Address']||'—'}</td>
              <td style="text-align:center;">
                <span style="background:rgba(139,92,246,.12);color:#7c3aed;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;">${a['Commission (%)']||0}%</span>
              </td>
              <td style="text-align:center;">
                <button class="lnk-btn" onclick="_viewAgencyCands('${a['Agency Name']}')" style="font-size:15px;font-weight:800;">${a._totalCands}</button>
              </td>
              <td style="text-align:center;">
                <span style="font-weight:700;color:#f59e0b;font-size:13px;">${a._inPipeline}</span>
              </td>
              <td style="text-align:center;">
                <span style="font-weight:800;color:#10b981;font-size:14px;">${a._placements}</span>
              </td>
              <td style="text-align:center;">
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                  <div style="width:40px;height:5px;border-radius:3px;background:var(--surf2);overflow:hidden;">
                    <div style="height:100%;width:${a._convRate}%;background:${convColor};border-radius:3px;transition:width .5s;"></div>
                  </div>
                  <span style="font-size:11px;font-weight:700;color:${convColor};">${a._convRate}%</span>
                </div>
              </td>
              <td style="text-align:center;">
                ${a._activeInts > 0 ? '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,.1);color:#d97706;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-calendar-check" style="font-size:9px"></i>'+a._activeInts+'</span>' : '<span style="color:var(--t4);font-size:11px;">—</span>'}
              </td>
              <td style="text-align:center;">
                ${a._pendingOffs > 0 ? '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(236,72,153,.1);color:#be185d;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-file-signature" style="font-size:9px"></i>'+a._pendingOffs+'</span>' : '<span style="color:var(--t4);font-size:11px;">—</span>'}
              </td>
              <td>
                <span class="${isActive?'badge b-active':'badge b-inactive'}">${a['Status']}</span>
              </td>
              <td style="font-size:11px;color:var(--t4);">${_fmtDate(a['Created On']||'—')}</td>
              ${_hasWrite() ? `<td>
                <div class="act-btns" style="gap:4px;">
                  <!-- Edit -->
                  <button class="ic-btn" title="Edit Agency" onclick="_editAgency('${a['Agency ID']}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  <!-- View Candidates -->
                  <button class="ic-btn" title="View Candidates" style="color:#3b82f6;border-color:rgba(59,130,246,.3);background:rgba(59,130,246,.07);" onclick="_viewAgencyCands('${a['Agency Name']}')"><i class="fa-solid fa-users"></i></button>
                  <!-- Toggle Status -->
                  <button class="ic-btn ${isActive?'rej':'fwd'}" title="${isActive?'Deactivate Agency':'Activate Agency'}" onclick="_toggleAgencyStatus('${a['Agency ID']}','${a['Status']}')"><i class="fa-solid fa-power-off"></i></button>
                  ${a._totalCands>0 ? `<!-- Performance Detail -->
                  <button class="ic-btn" title="Performance Report" style="color:#8b5cf6;border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.07);" onclick="_showAgencyReport('${a['Agency ID']}')"><i class="fa-solid fa-chart-column"></i></button>` : ''}
                </div>
              </td>` : ''}
            </tr>`;
          }).join('') : `<tr><td colspan="15" class="empty-row"><i class="fa-solid fa-building-circle-xmark" style="font-size:28px;display:block;margin-bottom:10px;opacity:.3"></i>No agencies found.</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Performance Cards — individual agency breakdown -->
  ${visible.filter(function(a){return a._totalCands>0;}).length > 0 ? `
  <div class="section-card">
    <div class="section-head">
      <h3><i class="fa-solid fa-chart-bar" style="margin-right:8px;color:#8b5cf6"></i>Agency Performance Breakdown</h3>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
      ${visible.filter(function(a){return a._totalCands>0;}).map(function(a){
        var pct = a._convRate;
        var barC = pct>=50?'#10b981':pct>=25?'#f59e0b':'#ef4444';
        return `<div style="background:var(--surf2);border-radius:12px;padding:16px;border:1px solid var(--bdr);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="font-size:13px;font-weight:700;color:var(--t1);">${a['Agency Name']}</div>
            <span class="${a['Status']==='Active'?'badge b-active':'badge b-inactive'}" style="font-size:9.5px;">${a['Status']}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;text-align:center;">
            <div style="background:var(--surf);border-radius:8px;padding:8px 4px;"><div style="font-size:16px;font-weight:800;color:var(--t1);">${a._totalCands}</div><div style="font-size:9px;color:var(--t4);font-weight:600;text-transform:uppercase;">Total</div></div>
            <div style="background:var(--surf);border-radius:8px;padding:8px 4px;"><div style="font-size:16px;font-weight:800;color:#f59e0b;">${a._inPipeline}</div><div style="font-size:9px;color:var(--t4);font-weight:600;text-transform:uppercase;">Pipeline</div></div>
            <div style="background:var(--surf);border-radius:8px;padding:8px 4px;"><div style="font-size:16px;font-weight:800;color:#10b981;">${a._placements}</div><div style="font-size:9px;color:var(--t4);font-weight:600;text-transform:uppercase;">Placed</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;border-radius:3px;background:var(--surf);overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${barC};border-radius:3px;transition:width .6s;"></div>
            </div>
            <span style="font-size:11px;font-weight:800;color:${barC};min-width:34px;">${pct}%</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
            <span style="font-size:11px;color:var(--t3);">Commission: <strong style="color:#7c3aed;">${a['Commission (%)']||0}%</strong></span>
            <button onclick="_viewAgencyCands('${a['Agency Name']}')" style="font-size:11px;color:var(--brand);background:none;border:none;cursor:pointer;font-weight:600;font-family:inherit;padding:0;">View Candidates →</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>` : ''}
  `;

  // Build final html with pagination bar
  var _pi=_pagerHtml('agencies',_pag);
  if(_pi){ var _li=html.lastIndexOf('</div>'); if(_li>=0) html=html.slice(0,_li)+_pi+'</div>'; }
  _el('v-agencies').innerHTML = html;

}

function _openAgencyDetail(agencyId) {
  var a = (_D.agencies||[]).find(function(x){return x['Agency ID']===agencyId;});
  if(!a) return;
  var cands = (_D.candidates||[]).filter(function(c){return c['Agency Name']===a['Agency Name'];});
  var jobs  = _D.jobs   || [];
  var ints  = _D.interviews || [];
  var offs  = _D.offers || [];

  // Compute stats
  var byStage = {};
  ['Applied','Interview','Selected','Offered','Joined','Rejected'].forEach(function(s){
    byStage[s]=cands.filter(function(c){return c['Stage']===s;}).length;
  });
  var placed   = byStage['Joined']||0;
  var pipeline = (byStage['Applied']||0)+(byStage['Interview']||0)+(byStage['Selected']||0)+(byStage['Offered']||0);
  var convRate = cands.length>0 ? Math.round(placed/cands.length*100) : 0;
  var convCol  = convRate>=50?'#10b981':convRate>=25?'#f59e0b':'#ef4444';

  // Recent candidates (last 5)
  var recent = cands.slice().sort(function(a,b){return (b['Applied On']||'').localeCompare(a['Applied On']||'');}).slice(0,5);

  // Active interviews
  var activeInts = ints.filter(function(i){
    return cands.some(function(c){return c['Candidate ID']===i['Candidate ID']&&i['Status']==='Scheduled';});
  });

  // Pending offers
  var pendOffs = offs.filter(function(o){
    return cands.some(function(c){return c['Candidate ID']===o['Candidate ID']&&o['Offer Status']==='Sent';});
  });

  // Top jobs
  var jobMap={};
  cands.forEach(function(c){var j=jobs.find(function(x){return x['Job ID']===c['Job ID'];});var t=j?j['Title']:'Unknown';jobMap[t]=(jobMap[t]||0)+1;});
  var topJobs=Object.keys(jobMap).sort(function(a,b){return jobMap[b]-jobMap[a];}).slice(0,4);

  // Estimated commission
  var estComm = cands.filter(function(c){return c['Stage']==='Joined';})
    .reduce(function(s,c){return s+(parseFloat(c['Expected CTC']||0)*100000*parseFloat(a['Commission (%)']||0)/100);},0);

  var isActive = a['Status']==='Active';

  _showModal(a['Agency Name']+' — Agency Profile',
    // Header card
    '<div style="background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(236,72,153,.07));border-radius:14px;padding:18px;margin-bottom:16px;border:1px solid rgba(139,92,246,.2);">'
      +'<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'
        +'<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
          +'<i class="fa-solid fa-handshake" style="color:#fff;font-size:20px;"></i>'
        +'</div>'
        +'<div style="flex:1;">'
          +'<div style="font-family:Bricolage Grotesque,sans-serif;font-size:18px;font-weight:800;color:var(--t1);margin-bottom:4px;">'+a['Agency Name']+'</div>'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            +'<span class="'+(isActive?'badge b-active':'badge b-inactive')+'">'+a['Status']+'</span>'
            +'<span style="font-size:12px;color:var(--t3);">Since: '+_fmtDate(a['Created On']||'—')+'</span>'
            +'<span style="background:rgba(139,92,246,.12);color:#7c3aed;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">'+(isNaN(parseFloat(a['Commission (%)']))?'—%':parseFloat(a['Commission (%)']).toFixed(1)+'%')+' Commission</span>'
          +'</div>'
        +'</div>'
      +'</div>'
      // KPI mini row
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">'
        +[['Total',cands.length,'var(--t1)'],['Pipeline',pipeline,'#f59e0b'],['Placed',placed,'#10b981'],['Conversion',convRate+'%',convCol]]
          .map(function(x){return '<div style="background:var(--surf);border-radius:9px;padding:10px 8px;text-align:center;border:1px solid var(--bdr);">'
            +'<div style="font-family:Bricolage Grotesque,sans-serif;font-size:20px;font-weight:800;color:'+x[2]+';">'+x[1]+'</div>'
            +'<div style="font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.06em;">'+x[0]+'</div>'
          +'</div>';}).join('')
      +'</div>'
    +'</div>'

    // Contact info
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">'
      +'<div class="det-field"><label>Contact Person</label><span>'+(a['Contact Person']||'—')+'</span></div>'
      +'<div class="det-field"><label>Phone</label><span>'+(a['Phone']?'<a href="tel:'+a['Phone']+'" style="color:var(--brand);font-weight:600;text-decoration:none;">'+a['Phone']+'</a>':'—')+'</span></div>'
      +'<div class="det-field"><label>Email</label><span>'+(a['Email']?'<a href="mailto:'+a['Email']+'" style="color:var(--brand);text-decoration:none;font-size:12px;">'+a['Email']+'</a>':'—')+'</span></div>'
      +'<div class="det-field"><label>Address</label><span style="font-size:12px;">'+(a['Address']||'—')+'</span></div>'
      +(estComm>0?'<div class="det-field" style="grid-column:1/-1;background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.18);"><label style="color:#7c3aed;">Est. Commission Earned</label><span style="font-size:16px;font-weight:800;color:#7c3aed;">₹'+Math.round(estComm).toLocaleString('en-IN')+'</span></div>':'')
    +'</div>'

    // Stage breakdown
    +'<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--bdr);">'
      +'<i class="fa-solid fa-chart-bar" style="margin-right:6px;color:#8b5cf6;"></i>Stage Breakdown'
    +'</div>'
    +(cands.length>0
      ?'<div style="margin-bottom:14px;">'
        +['Applied','Interview','Selected','Offered','Joined','Rejected'].map(function(s){
          var col=s==='Applied'?'#3b82f6':s==='Interview'?'#f59e0b':s==='Selected'?'#8b5cf6':s==='Offered'?'#ec4899':s==='Joined'?'#10b981':'#ef4444';
          var pct=cands.length>0?Math.round((byStage[s]||0)/cands.length*100):0;
          return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">'
            +'<span style="font-size:11.5px;color:var(--t2);min-width:70px;font-weight:500;">'+s+'</span>'
            +'<div style="flex:1;height:7px;border-radius:4px;background:var(--surf2);overflow:hidden;">'
              +'<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:4px;transition:width .5s;"></div></div>'
            +'<span style="font-size:12px;font-weight:700;color:var(--t1);min-width:24px;text-align:right;">'+(byStage[s]||0)+'</span>'
          +'</div>';
        }).join('')
      +'</div>'
      :'<div style="text-align:center;padding:12px;color:var(--t4);font-size:13px;">No candidates yet.</div>'
    )

    // Top jobs
    +(topJobs.length
      ?'<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--bdr);"><i class="fa-solid fa-briefcase" style="margin-right:6px;color:#3b82f6;"></i>Top Applied Roles</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">'
          +topJobs.map(function(t){return '<div style="background:var(--surf2);border-radius:8px;padding:8px 12px;border:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center;">'
            +'<span style="font-size:12px;color:var(--t1);font-weight:500;">'+t+'</span>'
            +'<span style="font-size:12px;font-weight:800;color:var(--brand);">'+jobMap[t]+'</span>'
          +'</div>';}).join('')
        +'</div>'
      :''
    )

    // Recent candidates
    +(recent.length
      ?'<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--bdr);">'
        +'<i class="fa-solid fa-users" style="margin-right:6px;color:#10b981;"></i>Recent Candidates</div>'
        +'<div style="display:flex;flex-direction:column;gap:0;">'
          +recent.map(function(c){
            var j=jobs.find(function(x){return x['Job ID']===c['Job ID'];});
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr2);">'
              +'<div style="width:32px;height:32px;border-radius:50%;background:'+_avatarGrad(c['Full Name'])+';color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+c['Full Name'].charAt(0).toUpperCase()+'</div>'
              +'<div style="flex:1;min-width:0;">'
                +'<div style="font-size:13px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+c['Full Name']+'</div>'
                +'<div style="font-size:11px;color:var(--t4);">'+(j?j['Title']:'—')+' · '+(c['Applied On']||'—')+'</div>'
              +'</div>'
              +'<span class="'+_stageClass(c['Stage'])+'">'+c['Stage']+'</span>'
              +'<button onclick="(function(){_openCndDetail(\"'+c['Candidate ID']+'\")})()" style="width:28px;height:28px;border-radius:7px;border:1.5px solid var(--bdr);background:var(--surf);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;flex-shrink:0;"><i class="fa-solid fa-eye"></i></button>'
            +'</div>';
          }).join('')
        +'</div>'
      :''
    )


    ,
    // Footer — use pre-stored agencyName to avoid quote issues
    (function(){
      var _aN = a['Agency Name'];
      return '<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">'
        +(_hasWrite()?'<button class="mbtn-s" onclick="_editAgency(\''+agencyId+'\');_closeModal()"><i class="fa-solid fa-pen" style="margin-right:6px;"></i>Edit</button>':'')
        +(cands.length>0?'<button class="mbtn-p" onclick="_viewAgencyCands(\''+_aN.replace(/\'/g,"\\'")+'\');_closeModal()"><i class="fa-solid fa-users" style="margin-right:6px;"></i>View Candidates</button>':'')
        +(_hasWrite()?'<button class="mbtn-p" style="background:#8b5cf6;" onclick="_showAgencyReport(\''+agencyId+'\');_closeModal()"><i class="fa-solid fa-chart-column" style="margin-right:6px;"></i>Performance</button>':'')
        +'<button class="mbtn-s" style="margin-left:auto;" onclick="_closeModal()">Close</button>'
        +'</div>';
    })()
  );
}

function _viewAgencyCands(agencyName) {
  // Store in _FS first, then navigate
  _FS['cndAgyFilter'] = agencyName;
  _PG.candidates = 1;
  _lv('candidates');
  // After render, also try setting DOM select
  setTimeout(function() {
    var el = _el('cndAgyFilter');
    if (el) { el.value = agencyName; }
  }, 200);
}

// Agency performance report modal
function _showAgencyReport(agencyId) {
  var a     = (_D.agencies||[]).find(function(x){ return x['Agency ID']===agencyId; });
  if (!a)   return;
  var cands = (_D.candidates||[]).filter(function(c){ return c['Agency Name']===a['Agency Name']; });
  var jobs  = _D.jobs||[];

  var byStage = {};
  ['Applied','Interview','Selected','Offered','Joined','Rejected'].forEach(function(s){
    byStage[s] = cands.filter(function(c){ return c['Stage']===s; }).length;
  });

  var byJob = {};
  cands.forEach(function(c){
    var job = jobs.find(function(j){ return j['Job ID']===c['Job ID']; });
    var title = job ? job['Title'] : 'Unknown';
    byJob[title] = (byJob[title]||0)+1;
  });

  var topJobs = Object.keys(byJob).sort(function(a,b){ return byJob[b]-byJob[a]; }).slice(0,5);

  _showModal('📊 ' + a['Agency Name'] + ' — Performance Report', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:var(--surf2);border-radius:10px;padding:12px 16px;border:1px solid var(--bdr);">
        <div style="font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Total Candidates</div>
        <div style="font-size:28px;font-weight:800;color:var(--t1);">${cands.length}</div>
      </div>
      <div style="background:rgba(16,185,129,.08);border-radius:10px;padding:12px 16px;border:1px solid rgba(16,185,129,.2);">
        <div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Placements</div>
        <div style="font-size:28px;font-weight:800;color:#10b981;">${byStage['Joined']||0}</div>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Stage Breakdown</div>
      ${['Applied','Interview','Selected','Offered','Joined','Rejected'].map(function(s){
        var pct = cands.length > 0 ? Math.round((byStage[s]||0)/cands.length*100) : 0;
        var col = s==='Applied'?'#3b82f6':s==='Interview'?'#f59e0b':s==='Selected'?'#8b5cf6':s==='Offered'?'#ec4899':s==='Joined'?'#10b981':'#ef4444';
        return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
          +'<span style="font-size:12px;color:var(--t2);min-width:76px;">'+s+'</span>'
          +'<div style="flex:1;height:8px;border-radius:4px;background:var(--surf2);overflow:hidden;">'
          +'<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:4px;"></div></div>'
          +'<span style="font-size:12px;font-weight:700;color:var(--t1);min-width:28px;text-align:right;">'+(byStage[s]||0)+'</span>'
          +'</div>';
      }).join('')}
    </div>
    ${topJobs.length > 0 ? `
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Top Jobs Applied</div>
      ${topJobs.map(function(title){
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surf2);border-radius:8px;margin-bottom:6px;">'
          +'<span style="font-size:12.5px;color:var(--t1);">'+title+'</span>'
          +'<span style="font-size:12px;font-weight:700;color:var(--brand);">'+byJob[title]+' candidate'+(byJob[title]!==1?'s':'')+'</span>'
          +'</div>';
      }).join('')}
    </div>` : ''}
    <div style="margin-top:16px;padding:12px 16px;background:rgba(139,92,246,.08);border-radius:10px;border:1px solid rgba(139,92,246,.15);">
      <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Commission Details</div>
      <div style="font-size:13px;color:var(--t2);">Rate: <strong style="color:#7c3aed">${a['Commission (%)']||0}%</strong> · Contact: <strong style="color:var(--t1)">${a['Contact Person']||'—'}</strong></div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Close</button>
     <button class="mbtn-p" onclick="_viewAgencyCands('${a['Agency Name']}');_closeModal()"><i class="fa-solid fa-users" style="margin-right:6px"></i>View All Candidates</button>`
  );
}

function _openAgencyModal(agency) {
  var a = agency || {};
  _showModal(a['Agency ID'] ? 'Edit Agency' : 'Add New Agency', `
    <div class="fg2">
      <div class="fg full">
        <label>Agency Name <span class="req">*</span></label>
        <input id="a_name" value="${a['Agency Name']||''}" placeholder="e.g. ABC Recruitment Pvt. Ltd.">
      </div>
      <div class="fg">
        <label>Contact Person</label>
        <input id="a_person" value="${a['Contact Person']||''}" placeholder="e.g. Rajesh Kumar">
      </div>
      <div class="fg">
        <label>Email</label>
        <input id="a_email" type="email" value="${a['Email']||''}" placeholder="agency@email.com">
      </div>
      <div class="fg">
        <label>Phone</label>
        <input id="a_phone" value="${a['Phone']||''}" placeholder="10-digit mobile">
      </div>
      <div class="fg">
        <label>Commission (%)</label>
        <input id="a_comm" type="number" min="0" max="50" step="0.5" value="${a['Commission (%)']||''}" placeholder="e.g. 8.5">
      </div>
      <div class="fg full">
        <label>Address</label>
        <input id="a_addr" value="${a['Address']||''}" placeholder="City / Full address">
      </div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitAgency('${a['Agency ID']||''}')"><i class="fa-solid fa-floppy-disk" style="margin-right:6px"></i>Save Agency</button>`
  );
}

function _editAgency(agencyId) {
  var a = (_D.agencies||[]).find(function(x){ return x['Agency ID']===agencyId; });
  if (a) _openAgencyModal(a);
}

function _submitAgency(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    agencyId: existingId||null,
    agencyName:    _val('a_name'),
    contactPerson: _val('a_person'),
    email:         _val('a_email'),
    phone:         _val('a_phone'),
    address:       _val('a_addr'),
    commission:    _val('a_comm')
  };
  if (!data.agencyName) { _toast('Agency name is required.','error'); _submitting=false; return; }
  _api(existingId ? 'updateAgency' : 'saveAgency', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _toggleAgencyStatus(agencyId, currentStatus) {
  var action = currentStatus==='Active' ? 'deactivate' : 'activate';
  if (!confirm('Are you sure you want to ' + action + ' this agency?')) return;
  _api('toggleAgencyStatus', { agencyId: agencyId }, function(r) {
    if (r.success) { _toast(r.message, 'success'); _loadData(); }
    else _toast(r.error, 'error');
  });
}

// Resume file selection handler
function _handleResumeSelect(input) {
  var file = input.files[0];
  if (!file) return;
  var lbl  = _el('c_res_lbl');
  var prev = _el('c_res_preview');
  if (lbl)  lbl.textContent = '📎 ' + file.name + ' (' + (file.size/1024).toFixed(0) + ' KB)';
  if (prev) prev.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(16,185,129,.07);border-radius:8px;border:1px solid rgba(16,185,129,.2);font-size:12px;color:#059669;">'
    +'<i class="fa-solid fa-circle-check"></i><span>Ready to upload: <strong>'+file.name+'</strong></span></div>';
  // Store file reference for submit
  window._resumeFile = file;
}

// Upload resume to Drive via GAS (base64)
function _uploadAndSaveResume(file, candidateId, onDone) {
  if (!file) { onDone(null); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var b64 = e.target.result.split(',')[1];
    _api('uploadResume', {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64:   b64,
      candidateId: candidateId
    }, function(r) {
      onDone(r.success ? r.url : null);
    }, function() { onDone(null); });
  };
  reader.readAsDataURL(file);
}

function _openCndModal(cnd) {
  var c = cnd || {};
  var jobs = _D.jobs || [];
  var agys = _D.agencies || [];
  var jobOpts = jobs.map(function(j){ return `<option value="${j['Job ID']}" ${c['Job ID']===j['Job ID']?'selected':''}>${j['Title']}</option>`; }).join('');
  // Dropdown: value=AgencyID, text=AgencyName (all active agencies)
  // Pre-select: match by existing Agency Name stored in candidate
  var agyOpts = '<option value="">Direct / No Agency</option>'
    + agys.map(function(a){
        var inactive = a['Status']==='Inactive';
        // Pre-select by matching stored Agency Name OR Agency ID
        var isSelected = (c['Agency Name'] && c['Agency Name']===a['Agency Name'])
                      || (c['Agency ID']   && c['Agency ID']===a['Agency ID']);
        return '<option value="'+a['Agency ID']+'" '+(isSelected?'selected':'')+' '+(inactive?'style="color:var(--t3);"':'')+'>'+a['Agency Name']+(inactive?' (Inactive)':'')+'</option>';
      }).join('');
  var sources = ['Portal','Referral','LinkedIn','Direct Walk-in','Agency','Campus','Other'];

  _showModal(c['Candidate ID'] ? 'Edit Candidate' : 'Add Candidate', `
    <div class="fg2">
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
        <label>Agency (if applicable)</label>
        <select id="c_agy">${agyOpts}</select>
      </div>
      <div class="fg">
        <label>Stage</label>
        <select id="c_stage">
          ${['Applied','Interview','Selected','Offered','Joined','Rejected'].map(function(s){return '<option '+(c['Stage']===s?'selected':'')+((!c['Candidate ID']&&s==='Applied')?' selected':'')+'>'+s+'</option>';}).join('')}
        </select>
      </div>
      <div class="fg">
        <label>Applied On</label>
        <input id="c_adon" type="date" value="${c['Applied On']||_istDate()}">
      </div>
      <div class="fg full">
        <label>Resume / CV</label>
        <div id="c_res_wrap" style="display:flex;flex-direction:column;gap:8px;">
          ${c['Resume Link']
            ? '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(59,130,246,.07);border-radius:8px;border:1px solid rgba(59,130,246,.2);">'
              +'<i class="fa-solid fa-file-pdf" style="color:#3b82f6;font-size:14px;"></i>'
              +'<a href="'+c['Resume Link']+'" target="_blank" style="font-size:12px;color:#3b82f6;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">View Existing Resume</a>'
              +'<button type="button" onclick="_el(\'c_res\').value=\'\';_el(\'c_res_preview\').innerHTML=\'\';" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:11px;font-weight:600;font-family:inherit;">Remove</button>'
            +'</div>'
            : ''}
          <div id="c_res_preview"></div>
          <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:9px;cursor:pointer;font-size:13px;color:var(--t3);transition:all .15s;" onmouseover="this.style.borderColor=\'var(--brand)\';this.style.color=\'var(--brand)\'" onmouseout="this.style.borderColor=\'var(--bdr)\';this.style.color=\'var(--t3)\'">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:16px;"></i>
            <span id="c_res_lbl">Click to upload resume (PDF/DOC)</span>
            <input type="file" id="c_res_file" accept=".pdf,.doc,.docx" style="display:none;" onchange="_handleResumeSelect(this)">
          </label>
          <input type="hidden" id="c_res" value="${c['Resume Link']||''}">
        </div>
      </div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitCandidate('${c['Candidate ID']||''}')"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>Save Candidate</button>`
  );
}

function _editCnd(candidateId) {
  var c = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===candidateId; });
  if (c) _openCndModal(c);
}

function _submitCandidate(existingId) {
  if (_submitting) return; _submitting = true;
  var name  = _val('c_name'), phone = _val('c_phone');
  if (!name || !phone) { _toast('Name and phone are required.','error'); _submitting=false; return; }
  var file  = window._resumeFile || null;
  var resLink = _val('c_res');

  function _doSave(resumeUrl) {
    window._resumeFile = null;
    var data = {
      candidateId: existingId||null,
      name: name, phone: phone, email: _val('c_email'),
      jobId: _val('c_job'), currentCompany: _val('c_co'), experience: _val('c_exp'),
      currentCtc: _val('c_cctc'), expectedCtc: _val('c_ectc'),
      source: _val('c_src'),
      agencyId: _val('c_agy'),
      agencyName: (function(){
        var aid = _val('c_agy');
        if (!aid) return '';
        var ag = (_D.agencies||[]).find(function(a){ return a['Agency ID']===aid; });
        return ag ? ag['Agency Name'] : aid; // fallback to id if not found
      })(),
      resumeLink: resumeUrl || resLink
    };
    _api(existingId ? 'updateCandidate' : 'saveCandidate', data, function(r) {
      _submitting = false;
      if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
      else { _toast(r.error,'error'); }
    }, function(e) { _submitting=false; _toast(e.message,'error'); });
  }

  if (file) {
    _toast('Uploading resume...','info');
    _uploadAndSaveResume(file, existingId||'NEW', function(url) {
      if (!url) { _toast('Resume upload failed — saving without resume.','warning'); }
      _doSave(url);
    });
  } else {
    _doSave(null);
  }
}

// Global context for candidate detail modal actions
var _cndCtx = {};
var _rejectCandId = '';
var _editOfferId = '';
var _editOfferCandId = '';

function _openCndDetail(candidateId) {
  var c    = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  if(!c) return;
  var job  = (_D.jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});
  var ints = (_D.interviews||[]).filter(function(i){return i['Candidate ID']===candidateId;})
             .sort(function(a,b){return (a['Scheduled On']||'').localeCompare(b['Scheduled On']||'');});
  var offs = (_D.offers||[]).filter(function(o){return o['Candidate ID']===candidateId;});
  var agy  = c['Agency Name'] ? (_D.agencies||[]).find(function(a){return a['Agency Name']===c['Agency Name'];}) : null;

  // Store context for modal button handlers
  _cndCtx = { candidateId: candidateId, nextStage: _stageNext(c['Stage']), stage: c['Stage'], offs: offs };

  var stageColor = {Applied:'#3b82f6',Interview:'#f59e0b',Selected:'#8b5cf6',Offered:'#ec4899',Joined:'#10b981',Rejected:'#ef4444'}[c['Stage']] || '#64748b';

  // Interview timeline HTML
  var intHtml = ints.length ? ints.map(function(i){
    var dotCls = i['Result']==='Pass'?'tl-g':i['Result']==='Fail'?'tl-r':'tl-a';
    var resCls = i['Result']==='Pass'?'badge b-joined':i['Result']==='Fail'?'badge b-rejected':i['Result']==='Hold'?'badge b-offered':'badge b-scheduled';
    var resultBadge = i['Result'] ? '<span class="'+resCls+'" style="margin-left:8px;">'+i['Result']+'</span>'
                                  : '<span class="badge b-scheduled" style="margin-left:8px;">'+i['Status']+'</span>';
    var meetLink = i['Meeting Link'] ? '<br><a href="'+i['Meeting Link']+'" target="_blank" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#3b82f6;margin-top:4px;"><i class="fa-solid fa-video" style="font-size:9px;"></i>Join Meeting</a>' : '';
    var feedback = i['Feedback'] ? '<div class="tl-fb" style="margin-top:6px;">"'+i['Feedback']+'"</div>' : '';
    var markBtn  = (_hasWrite() && i['Status']==='Scheduled')
      ? '<br><button class="lnk-btn" style="margin-top:6px;font-size:12px;" data-iid="'+i['Interview ID']+'" onclick="_cndModalMarkResult(this)"><i class="fa-solid fa-check-to-slot" style="margin-right:4px;font-size:10px;"></i>Mark Result</button>'
      : '';
    return '<div class="tl-item">'
      +'<div class="tl-dot '+dotCls+'"></div>'
      +'<div class="tl-body">'
        +'<div class="tl-head">Round '+i['Round']+' — '+i['Type']+resultBadge+'</div>'
        +'<div class="tl-sub" style="margin-bottom:2px;">'+((i['Scheduled On']||'').replace('T',' ').slice(0,16)||'—')+' · '+(i['Interviewer']||'—')+' · '+(i['Mode']||'—')+'</div>'
        +meetLink+feedback+markBtn
      +'</div></div>';
  }).join('') : '<div style="text-align:center;padding:16px;color:var(--t4);font-size:13px;">No interviews scheduled yet.</div>';

  // Offer cards HTML
  var offHtml = offs.length ? offs.map(function(o, oi){
    var oStCls = o['Offer Status']==='Accepted'?'badge b-accepted':o['Offer Status']==='Declined'?'badge b-declined':'badge b-sent';
    var acceptBtn  = (_hasWrite() && o['Offer Status']==='Sent') ? '<button class="mbtn-g" style="flex:1;justify-content:center;" data-oi="'+oi+'" data-act="accept" onclick="_cndModalOfferAct(this)"><i class="fa-solid fa-check" style="margin-right:6px;"></i>Accept</button>' : '';
    var declineBtn = (_hasWrite() && o['Offer Status']==='Sent') ? '<button class="mbtn-d" style="flex:1;justify-content:center;" data-oi="'+oi+'" data-act="decline" onclick="_cndModalOfferAct(this)"><i class="fa-solid fa-xmark" style="margin-right:6px;"></i>Decline</button>' : '';
    var joinBtn    = (_hasWrite() && o['Offer Status']==='Accepted') ? '<button class="mbtn-g" style="width:100%;justify-content:center;margin-top:6px;" data-oi="'+oi+'" onclick="_cndModalJoinAct(this)"><i class="fa-solid fa-flag-checkered" style="margin-right:6px;"></i>Confirm Joining</button>' : '';
    var btns = (acceptBtn||declineBtn) ? '<div style="display:flex;gap:8px;margin-top:8px;">'+acceptBtn+declineBtn+'</div>' : '';
    return '<div class="offer-card" style="margin-bottom:10px;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
        +'<div style="font-weight:700;color:var(--t1);font-size:13px;"><i class="fa-solid fa-file-signature" style="color:#ec4899;margin-right:6px;font-size:11px;"></i>'+o['Offer ID']+'</div>'
        +'<span class="'+oStCls+'">'+o['Offer Status']+'</span>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
        +'<div style="background:var(--surf);border-radius:8px;padding:8px 12px;border:1px solid var(--bdr);"><div style="font-size:10px;font-weight:700;color:var(--t4);margin-bottom:2px;">Offered CTC</div><div style="font-size:16px;font-weight:800;color:#059669;">'+o['Offered CTC']+' LPA</div></div>'
        +'<div style="background:var(--surf);border-radius:8px;padding:8px 12px;border:1px solid var(--bdr);"><div style="font-size:10px;font-weight:700;color:var(--t4);margin-bottom:2px;">Joining Date</div><div style="font-size:14px;font-weight:700;color:var(--t1);">'+(o['Joining Date']||'\u2014')+'</div></div>'
      +'</div>'
      +btns+joinBtn
    +'</div>';
  }).join('') : '';

  // Agency block
  var agyHtml = agy ? '<div style="grid-column:1/-1;background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(236,72,153,.06));border-radius:10px;padding:12px 14px;border:1px solid rgba(139,92,246,.2);">'
    +'<div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;"><i class="fa-solid fa-handshake" style="margin-right:5px;"></i>Recruiting Agency</div>'
    +'<div style="font-size:14px;font-weight:700;color:#6d28d9;margin-bottom:4px;">'+agy['Agency Name']+'</div>'
    +'<div style="font-size:12px;color:var(--t3);">Contact: '+(agy['Contact Person']||'\u2014')+' \xb7 '+(agy['Phone']?'<a href="tel:'+agy['Phone']+'" style="color:var(--brand);">'+agy['Phone']+'</a>':'\u2014')+' \xb7 Commission: <strong style="color:#7c3aed">'+(agy['Commission (%)']||0)+'%</strong></div>'
  +'</div>' : '';

  // Build modal content
  var body = ''
    // Profile header
    +'<div style="background:linear-gradient(135deg,'+stageColor+'18,'+stageColor+'08);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid '+stageColor+'30;">'
      +'<div style="display:flex;align-items:center;gap:14px;">'
        +'<div style="width:56px;height:56px;border-radius:50%;background:'+_avatarGrad(c['Full Name'])+';color:#fff;font-size:22px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+c['Full Name'].charAt(0).toUpperCase()+'</div>'
        +'<div style="flex:1;min-width:0;">'
          +'<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:18px;font-weight:800;color:var(--t1);margin-bottom:2px;">'+c['Full Name']+'</div>'
          +'<div style="font-size:12px;color:var(--t3);margin-bottom:6px;">'+(c['Email']||'')+((c['Email']&&c['Phone'])?' \xb7 ':'')+( c['Phone']||'')+'</div>'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            +'<span class="'+_stageClass(c['Stage'])+'">'+c['Stage']+'</span>'
            +(job?'<span class="src-tag">'+job['Title']+'</span>':'')
            +(job&&job['Department']?'<span class="src-tag">'+job['Department']+'</span>':'')
          +'</div>'
        +'</div>'
      +'</div>'
    +'</div>'
    // Details grid
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">'
      +'<div class="det-field"><label>Candidate ID</label><span style="font-family:monospace;font-size:11px;color:var(--t3);">'+c['Candidate ID']+'</span></div>'
      +'<div class="det-field"><label>Applied On</label><span>'+(c['Applied On']||'\u2014')+'</span></div>'
      +'<div class="det-field"><label>Current Company</label><span>'+(c['Current Company']||'\u2014')+'</span></div>'
      +'<div class="det-field"><label>Experience</label><span>'+(c['Experience (Yrs)']||0)+' years</span></div>'
      +'<div class="det-field"><label>Current CTC</label><span>'+(c['Current CTC']?c['Current CTC']+' LPA':'\u2014')+'</span></div>'
      +'<div class="det-field"><label>Expected CTC</label><span style="font-weight:700;color:#059669;">'+(c['Expected CTC']?c['Expected CTC']+' LPA':'\u2014')+'</span></div>'
      +'<div class="det-field"><label>Source</label><span>'+(c['Source']||'\u2014')+'</span></div>'
    +(c['Rejection Reason']?'<div class="det-field" style="grid-column:1/-1;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);"><label style="color:#dc2626;">Rejection Reason</label><span style="color:#991b1b;">'+c['Rejection Reason']+'</span></div>':'')
      +'<div class="det-field"><label>Last Modified</label><span style="font-size:11px;">'+(c['Last Modified']?c['Last Modified'].slice(0,16):'\u2014')+'</span></div>'
      +agyHtml
      +(c['Resume Link']?'<div class="det-field" style="grid-column:1/-1;"><label>Resume</label><a href="'+c['Resume Link']+'" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(59,130,246,.1);color:#3b82f6;border-radius:8px;font-size:12.5px;font-weight:600;text-decoration:none;border:1px solid rgba(59,130,246,.25);"><i class="fa-solid fa-file-pdf"></i>View Resume</a></div>':'')
    +'</div>'
    // Interview section
    +'<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--bdr);"><i class="fa-solid fa-calendar-days" style="margin-right:6px;color:#f59e0b;"></i>Interview History ('+ints.length+')</div>'
    +'<div class="tl" style="margin-bottom:16px;">'+intHtml+'</div>'
    // Offers section
    +(offs.length?'<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--bdr);"><i class="fa-solid fa-file-signature" style="margin-right:6px;color:#ec4899;"></i>Offer Letters ('+offs.length+')</div>'+offHtml:'');

  // Footer buttons
  var footer = '<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">'
    +(_hasWrite()?'<button class="mbtn-s" onclick="_cndModalEdit()"><i class="fa-solid fa-pen" style="margin-right:6px;"></i>Edit</button>':'')
    +(_hasWrite()&&(c['Stage']==='Applied'||c['Stage']==='Interview')?'<button class="mbtn-p" style="background:#f59e0b;" onclick="_cndModalInt()"><i class="fa-solid fa-calendar-plus" style="margin-right:6px;"></i>Interview</button>':'')
    +(_hasWrite()&&c['Stage']==='Selected'?'<button class="mbtn-p" style="background:#ec4899;" onclick="_cndModalOffer()"><i class="fa-solid fa-file-signature" style="margin-right:6px;"></i>Create Offer</button>':'')
    +(_hasWrite()&&_stageNext(c['Stage'])?'<button class="mbtn-g" onclick="_cndModalAdv()"><i class="fa-solid fa-circle-chevron-right" style="margin-right:6px;"></i>\u2192 '+_stageNext(c['Stage'])+'</button>':'')
    +'<button class="mbtn-s" style="margin-left:auto;" onclick="_closeModal()">Close</button>'
  +'</div>';

  _showModal(c['Full Name']+' \u2014 Full Profile', body, footer);
}

// Candidate detail modal action handlers
function _cndModalEdit()  { var id=_cndCtx.candidateId; _closeModal(); setTimeout(function(){_editCnd(id);},150); }
function _cndModalInt()   { var id=_cndCtx.candidateId; _closeModal(); setTimeout(function(){_openInterviewModal(null,id);},250); }
function _cndModalOffer() { var id=_cndCtx.candidateId; _closeModal(); setTimeout(function(){_openOfferModal(null,id);},250); }
function _cndModalAdv()   { var id=_cndCtx.candidateId; var ns=_cndCtx.nextStage; _quickStageChange(id,ns); _closeModal(); }
function _cndModalMarkResult(btn) { var iid=btn.getAttribute('data-iid'); var id=_cndCtx.candidateId; _markInterviewResult(iid,id); }
function _cndModalOfferAct(btn) {
  var oi=parseInt(btn.getAttribute('data-oi')); var act=btn.getAttribute('data-act');
  var o=_cndCtx.offs[oi]; if(!o) return;
  _updateOfferStatus(o['Offer ID'],_cndCtx.candidateId,act==='accept'?'Accepted':'Declined');
}
function _cndModalJoinAct(btn) {
  var oi=parseInt(btn.getAttribute('data-oi'));
  var o=_cndCtx.offs[oi]; if(!o) return;
  _confirmJoining(o['Offer ID'],_cndCtx.candidateId);
}

function _scheduleInterviewFrom(cid) { _closeModal(); setTimeout(function() { _openInterviewModal(null, cid); }, 250); }

// Helpers for offer actions inside candidate detail modal
function _detailOfferAction(btn) {
  var oid = btn.getAttribute('data-oid');
  var cid = btn.getAttribute('data-cid');
  var st  = btn.getAttribute('data-st');
  _updateOfferStatus(oid, cid, st);
}
function _detailJoinAction(btn) {
  var oid = btn.getAttribute('data-oid');
  var cid = btn.getAttribute('data-cid');
  _confirmJoining(oid, cid);
}
function _createOfferFrom(cid)       { _closeModal(); setTimeout(function() { _openOfferModal(null, cid); }, 250); }


function _openInterviewModal(interview, preCandidateId, preJobId) {
  var i = interview || {};
  var allCands = _D.candidates||[];
  var eligibleCands = allCands.filter(function(c){ return ['Applied','Interview','Selected'].indexOf(c['Stage']) >= 0; });
  // When editing existing interview, ensure that candidate is in list
  if (i['Candidate ID'] && !eligibleCands.find(function(c){return c['Candidate ID']===i['Candidate ID'];})) {
    var ec = allCands.find(function(c){return c['Candidate ID']===i['Candidate ID'];});
    if (ec) eligibleCands.unshift(ec);
  }
  if (preJobId) { eligibleCands = eligibleCands.filter(function(c){return c['Job ID']===preJobId;}).concat(eligibleCands.filter(function(c){return c['Job ID']!==preJobId;})); }
  var preCid = preCandidateId || i['Candidate ID'] || '';
  var cndOpts = eligibleCands.map(function(c){ return '<option value="'+c['Candidate ID']+'" '+(preCid===c['Candidate ID']?'selected':'')+'>'+(c['Full Name'])+' — '+(c['Stage'])+'</option>'; }).join('');
  if (!cndOpts) { _toast('No eligible candidates found.', 'warning'); return; }

  var isEdit = !!i['Interview ID'];
  _showModal(isEdit ? 'Edit Interview' : 'Schedule Interview', `
    <div class="fg2">
      <div class="fg full">
        <label>Candidate <span class="req">*</span></label>
        <select id="i_cnd" ${isEdit?'disabled':''}>${cndOpts}</select>
      </div>
      <div class="fg">
        <label>Round</label>
        <select id="i_round">
          <option value="1" ${(i['Round']||1)==1?'selected':''}>Round 1</option>
          <option value="2" ${i['Round']==2?'selected':''}>Round 2</option>
          <option value="3" ${i['Round']==3?'selected':''}>Round 3 (Final)</option>
        </select>
      </div>
      <div class="fg">
        <label>Interview Type</label>
        <select id="i_type">
          ${['HR','Technical','Final','Task / Assignment','Group Discussion'].map(function(t){return '<option '+(i['Type']===t?'selected':'')+'>'+t+'</option>';}).join('')}
        </select>
      </div>
      <div class="fg full">
        <label>Scheduled Date & Time <span class="req">*</span></label>
        <input id="i_sched" type="datetime-local" value="${i['Scheduled On']||''}">
      </div>
      <div class="fg">
        <label>Interviewer Name <span class="req">*</span></label>
        <input id="i_iname" value="${i['Interviewer']||''}" placeholder="e.g. Rahul Sharma">
      </div>
      <div class="fg">
        <label>Mode</label>
        <select id="i_mode">
          ${['In-Person','Online (Video)','Telephonic'].map(function(m){return '<option '+(i['Mode']===m?'selected':'')+'>'+m+'</option>';}).join('')}
        </select>
      </div>
      <div class="fg full">
        <label>Meeting Link (optional)</label>
        <input id="i_link" value="${i['Meeting Link']||''}" placeholder="https://meet.google.com/...">
      </div>
    </div>`,
    '<button class="mbtn-s" onclick="_closeModal()">Cancel</button>'
    +' <button class="mbtn-p" onclick="_submitInterview(\''+( i['Interview ID']||'')+'\')">'
    +'<i class="fa-solid fa-calendar-check" style="margin-right:4px;"></i>'+(isEdit?'Update':'Schedule')+'</button>'
  );
}

function _submitInterview(existingId) {
  if (_submitting) return; _submitting = true;
  var cid = _val('i_cnd');
  var c   = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===cid; });
  var data = {
    interviewId: existingId||null,
    candidateId: cid, candidateName: c?c['Full Name']:'', candidateEmail: c?c['Email']:'',
    jobId: c?c['Job ID']:'', round: _val('i_round'), type: _val('i_type'),
    scheduledOn: _val('i_sched'), interviewer: _val('i_iname'),
    mode: _val('i_mode'), meetingLink: _val('i_link')
  };
  if (!data.scheduledOn || !data.interviewer) { _toast('Date and interviewer are required.','error'); _submitting=false; return; }
  _api(existingId ? 'updateInterview' : 'saveInterview', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast(r.message,'success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e) { _submitting=false; _toast(e.message,'error'); });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal('Mark Interview Result', `
    <div class="fg1">
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
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitInterviewResult('${interviewId}','${candidateId}')"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>Save Result</button>`
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


function _editOffer(offerId) {
  var o = (_D.offers||[]).find(function(x){return x['Offer ID']===offerId;});
  if(!o) return;
  _editOfferId = offerId; _editOfferCandId = o['Candidate ID'];
  var o = (_D.offers||[]).find(function(x){ return x['Offer ID']===offerId; });
  if (!o) return;
  var c = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===o['Candidate ID']; });
  _showModal('Edit Offer — ' + (c?c['Full Name']:''), `
    <div class="fg2">
      <div class="fg full" style="background:var(--surf2);border-radius:10px;padding:10px 14px;border:1px solid var(--bdr);margin-bottom:2px;">
        <label style="margin-bottom:3px;">Candidate</label>
        <span style="font-size:13px;font-weight:700;color:var(--t1);">${c?c['Full Name']:'—'} · ${o['Offer ID']}</span>
      </div>
      <div class="fg">
        <label>Offered CTC (LPA) <span class="req">*</span></label>
        <input id="eo_ctc" type="number" step="0.1" value="${o['Offered CTC']||''}">
      </div>
      <div class="fg">
        <label>Joining Date <span class="req">*</span></label>
        <input id="eo_jdate" type="date" value="${o['Joining Date']||''}">
      </div>
      <div class="fg">
        <label>Designation</label>
        <input id="eo_desg" value="${o['Designation']||''}" placeholder="e.g. Production Engineer">
      </div>
      <div class="fg">
        <label>Offer Status</label>
        <select id="eo_status">
          ${['Sent','Accepted','Declined','Expired'].map(function(s){return '<option '+(o['Offer Status']===s?'selected':'')+'>'+s+'</option>';}).join('')}
        </select>
      </div>
    </div>`,
    '<button class="mbtn-s" onclick="_closeModal()">Cancel</button>'
    +' <button class="mbtn-p" id="eo_save_btn" onclick="_submitEditOfferModal()"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>Save Changes</button>'
  );
}

function _submitEditOfferModal() { _submitEditOffer(_editOfferId, _editOfferCandId); }
function _submitEditOffer(offerId, candidateId) {
  if (_submitting) return; _submitting = true;
  var ctc    = _val('eo_ctc');
  var jdate  = _val('eo_jdate');
  if (!ctc||!jdate){ _toast('CTC and joining date required.','error'); _submitting=false; return; }
  _api('updateOffer', { offerId:offerId, candidateId:candidateId, offeredCtc:ctc, joiningDate:jdate, designation:_val('eo_desg'), status:_val('eo_status') }, function(r){
    _submitting=false;
    if(r.success){ _closeModal(); _toast('Offer updated.','success'); _loadData(); }
    else _toast(r.error,'error');
  }, function(e){ _submitting=false; _toast(e.message,'error'); });
}
function _openOfferModal(offer, preCandidateId) {
  var selCands = (_D.candidates||[]).filter(function(c){ return c['Stage']==='Selected'; });
  var cndOpts  = selCands.map(function(c){ return `<option value="${c['Candidate ID']}" ${preCandidateId===c['Candidate ID']?'selected':''}>${c['Full Name']}</option>`; }).join('');
  if (!cndOpts) { _toast('No candidates in "Selected" stage. Mark interview as Pass first.','warning'); return; }

  _showModal('Create Offer Letter', `
    <div class="fg2">
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
      <div class="fg full">
        <label>Offer Notes / Terms (optional)</label>
        <textarea id="o_notes" rows="2" placeholder="Any special terms or conditions..."></textarea>
      </div>
    </div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-p" onclick="_submitOffer()"><i class="fa-solid fa-file-signature" style="margin-right:4px;"></i>Create Offer</button>`
  );
}

function _submitOffer() {
  if (_submitting) return; _submitting = true;
  var cid = _val('o_cnd');
  var c   = (_D.candidates||[]).find(function(x){ return x['Candidate ID']===cid; });
  var data = {
    candidateId: cid, jobId: c?c['Job ID']:'',
    offeredCtc: _val('o_ctc'), joiningDate: _val('o_jdate'), designation: _val('o_desg'),
    notes: _val('o_notes')
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
    <div class="joining-banner">
      <i class="fa-solid fa-champagne-glasses text-2xl"></i>
      <div>
        <div class="font-bold">${c['Full Name']} is joining!</div>
        <div class="text-sm opacity-75">Joining Date: ${offer['Joining Date']} · CTC: ${offer['Offered CTC']} LPA</div>
      </div>
    </div>
    <div class="fg2">
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
    <div class="info-note"><i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>An Employee record will be auto-created in the Employees sheet.</div>`,
    `<button class="mbtn-s" onclick="_closeModal()">Cancel</button>
     <button class="mbtn-g" onclick="_submitJoining('${offerId}','${candidateId}')"><i class="fa-solid fa-flag-checkered" style="margin-right:4px;"></i>Confirm Joining</button>`
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
  _el('mOv').style.display = 'block';
  _el('modal').style.display = 'flex';
  setTimeout(function() { _el('modal').classList.add('mv'); }, 10);
}

function _closeModal() {
  _submitting = false;
  _el('modal').classList.remove('mv');
  setTimeout(function() { _el('mOv').style.display='none'; _el('modal').style.display='none'; }, 280);
}

// ─── TOAST ────────────────────────────────────────────────────
function _toast(msg, type) {
  var t = _el('toast');
  var typeMap = { success:'suc', error:'err', warning:'wrn', info:'inf' };
  t.className = 'toast t-' + (typeMap[type] || 'inf');
  var icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  t.innerHTML = '<i class="fa-solid fa-' + (icons[type]||'circle-info') + '" style="margin-right:8px"></i>' + msg;
  t.classList.add('ts');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('ts'); }, 3500);
}

// ─── UTILS ────────────────────────────────────────────────────
function _setBtnLoading(cls, loading, label) {
  var btns = document.querySelectorAll('.' + cls);
  btns.forEach(function(b) {
    b.disabled = loading;
    if (loading) b.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>' + label;
  });
}
