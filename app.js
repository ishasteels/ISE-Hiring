// ============================================================
// ISE HIRING PROCESS — UPGRADED ARCHITECTURE (app.js)
// GitHub Pages + GAS JSONP Enterprise Mode
// ============================================================

var API = 'https://script.google.com/macros/s/AKfycbx_SVnhAkYyFyIBd6X20bqoX0OPxEoT4qzHzzhR4mRHCLVzvN5XdUrCijJGXftj7NHp/exec';

var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;

// ─── UI CONTROLS (THEME & SIDEBAR) ──────────────────────────
function toggleTheme() {
  var b = document.body;
  var current = b.getAttribute('data-theme');
  var target = (current === 'dark') ? 'light' : 'dark';
  b.setAttribute('data-theme', target);
  event.target.textContent = (target === 'dark') ? 'Light Mode' : 'Dark Mode';
}

function toggleSidebar() {
  document.body.classList.toggle('sidebar-collapsed');
  var btn = document.querySelector('.sb-toggle');
  if(document.body.classList.contains('sidebar-collapsed')) {
    if(btn) btn.textContent = '⇨';
  } else {
    if(btn) btn.textContent = '⇦';
  }
}

function _hasWriteAccess() {
  if (!_U || !_U.role) return false;
  return (_U.role === 'hr' || _U.role === 'admin');
}

function _isAdmin() {
  return (_U && _U.role === 'admin');
}

// ─── JSONP CORE ENGINE ────────────────────────────────────────
function _api(action, data, ok, err) {
  var cbName = '_gcb' + (++_cbIdx);
  var timeout;

  window[cbName] = function(r) {
    clearTimeout(timeout);
    try { delete window[cbName]; } catch(e) {}
    var s = document.getElementById('_s_' + cbName);
    if (s) s.remove();
    if (r && r.success === false && r.error === 'NOT_AUTHENTICATED') {
      _signOut(); return;
    }
    if (ok) ok(r);
  };

  timeout = setTimeout(function() {
    try { delete window[cbName]; } catch(e) {}
    if (err) err({ message: 'Request timed out.' });
  }, 25000);

  var url = API + '?callback=' + cbName + '&payload='
    + encodeURIComponent(JSON.stringify({ action: action, data: data || {}, token: _TOKEN || '' }));

  var s = document.createElement('script');
  s.id  = '_s_' + cbName;
  s.src = url;
  s.onerror = function() {
    clearTimeout(timeout);
    if (err) err({ message: 'Network layer failure.' });
  };
  document.body.appendChild(s);
}

// ─── INIT SYSTEM ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.body.setAttribute('data-theme', 'light');
  try {
    var stored = localStorage.getItem('ise_hiring_session');
    if (stored) {
      var s = JSON.parse(stored);
      _U = s.user; _TOKEN = s.token;
      _showApp();
      _loadData();
      return;
    }
  } catch(e) {}
  _showLogin();
});

// ─── SECURITY LAYER (AUTHENTICATION) ──────────────────────────
function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { _loginErr('Enter details.'); return; }
  var btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Processing...';

  _api('login', { email: email, password: pass }, function(r) {
    btn.disabled = false; btn.textContent = 'Authenticate';
    if (!r.success) { _loginErr(r.error || 'Access Denied.'); return; }
    _U = r.user; _TOKEN = r.token;
    try { localStorage.setItem('ise_hiring_session', JSON.stringify({ user: _U, token: _TOKEN })); } catch(e) {}
    _showApp();
    _loadData();
  }, function(e) {
    btn.disabled = false; btn.textContent = 'Authenticate';
    _loginErr(e.message || 'System error.');
  });
}

function _loginErr(msg) { document.getElementById('loginErr').textContent = msg; }

function _signOut() {
  try { localStorage.removeItem('ise_hiring_session'); } catch(e) {}
  _U = null; _TOKEN = null; _D = {};
  _showLogin();
}

function _loadData(cb) {
  _api('getAllData', {}, function(r) {
    if (r.success) {
      _D = r.data || {};
      _lv(_V);
      if (cb) cb();
    } else {
      _toast('Sync Fail: ' + r.error);
    }
  }, function(e) { _toast('Network error.'); });
}

function _refresh() { _loadData(function() { _toast('Data Synced Clean.'); }); }

function _showLogin() {
  document.getElementById('sLogin').style.display = 'flex';
  document.getElementById('sApp').style.display   = 'none';
}

function _showApp() {
  document.getElementById('sLogin').style.display = 'none';
  document.getElementById('sApp').style.display   = 'block';
  document.getElementById('sbUserName').textContent = _U.name;
  document.getElementById('sbUserRole').textContent = _U.role.toUpperCase();
  document.getElementById('sbAvatar').textContent = (_U.name || 'U').charAt(0).toUpperCase();
}

// ─── ROUTER ENGINE & VIEW RENDERING ───────────────────────────
function _lv(v) {
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = document.getElementById('v-' + v);
  if (el) el.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.toggle('on', b.dataset.v === v);
  });

  var titles = { home: 'System Overview', jobs: 'Job Postings', candidates: 'Talent Pool', interviews: 'Schedules', offers: 'Clearance Letters' };
  document.getElementById('tbTitle').textContent = titles[v] || 'ISHA System';

  var renderers = { home: _renderHome, jobs: _renderJobs, candidates: _renderCandidates, interviews: _renderInterviews, offers: _renderOffers };
  if (renderers[v]) renderers[v]();
}

// ─── VIEW 1: ENTERPRISE DASHBOARD ─────────────────────────────
function _renderHome() {
  var jobs = _D.jobs || [], cands = _D.candidates || [], ints = _D.interviews || [], offs = _D.offers || [];
  
  var openJobs = jobs.filter(function(j) { return j['Status'] === 'Open'; }).length;
  var pendingOff = offs.filter(function(o) { return o['Offer Status'] === 'Sent'; }).length;
  var inReview = cands.filter(function(c) { return c['Stage'] === 'Applied'; }).length;
  var totalSelected = cands.filter(function(c) { return c['Stage'] === 'Selected'; }).length;

  document.getElementById('v-home').innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card"><span class="kpi-title">Active Vacancies</span><span class="kpi-value">${openJobs}</span></div>
      <div class="kpi-card"><span class="kpi-title">In Screening Pipeline</span><span class="kpi-value">${inReview}</span></div>
      <div class="kpi-card"><span class="kpi-title">Awaiting Action Pack</span><span class="kpi-value">${totalSelected}</span></div>
      <div class="kpi-card"><span class="kpi-title">Pending Offers</span><span class="kpi-value">${pendingOff}</span></div>
    </div>
    <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--r-base); padding:24px; text-align:center;">
      <h3 style="margin-bottom:8px; font-weight:600;">Welcome to Isha Steel Enterprises ERP-Hiring Architecture</h3>
      <p style="color:var(--text-muted);">Use the sidebar matrix panel to navigate securely based on your assigned authorization clearing role.</p>
    </div>
  `;
}

// ─── VIEW 2: JOB VACANCIES (TABLE MODE) ────────────────────────
function _renderJobs() {
  var jobs = _D.jobs || [];
  var search = document.getElementById('jobSearch') ? document.getElementById('jobSearch').value.toLowerCase() : '';
  
  var html = `
    <div class="toolbar">
      <input id="jobSearch" type="text" placeholder="Filter positions..." class="fg input search-input" oninput="_renderJobs()" style="max-width:300px; margin-bottom:0;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openJobModal()">+ Create Posting</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Position ID</th>
            <th>Job Title</th>
            <th>Department</th>
            <th>Location</th>
            <th>Openings</th>
            <th>Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  var count = 0;
  jobs.forEach(function(j) {
    if (search && !(j['Title']||'').toLowerCase().includes(search) && !(j['Department']||'').toLowerCase().includes(search)) return;
    count++;
    var st = j['Status'] === 'Open' ? 'badge-success' : 'badge-error';
    html += `
      <tr>
        <td style="font-family:monospace; font-weight:600;">${j['Job ID']}</td>
        <td style="font-weight:600; color:var(--text-main);">${j['Title']}</td>
        <td>${j['Department']}</td>
        <td>${j['Location']}</td>
        <td>${j['Openings']}</td>
        <td><span class="badge ${st}">${j['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary" style="padding:4px 8px;" onclick="_editJob('${j['Job ID']}')">Modify</button>
            ${_isAdmin() && j['Status']==='Open' ? `<button class="btn btn-danger" style="padding:4px 8px; margin-left:4px;" onclick="_closeJob('${j['Job ID']}')">Archive</button>` : ''}
          </td>
        ` : ''}
      </tr>
    `;
  });

  if(count === 0) html += `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-disabled);">No deployment metrics discovered.</td></tr>`;
  html += `</tbody></table></div>`;
  document.getElementById('v-jobs').innerHTML = html;
}

function _openJobModal(job) {
  var j = job || {};
  _showModal(
    (j['Job ID'] ? 'Modify' : 'Initiate') + ' Job Asset Record',
    `<div class="fg"><label>Job Title</label><input id="f_title" value="${j['Title']||''}" placeholder="e.g. Quality Systems Manager"></div>
     <div class="form-row">
       <div class="fg"><label>Department</label><select id="f_dept"><option>Production</option><option>Quality</option><option>Accounts</option><option>HR</option><option>Sales</option></select></div>
       <div class="fg"><label>Location</label><input id="f_loc" value="${j['Location']||'Delhi'}"></div>
     </div>
     <div class="form-row">
       <div class="fg"><label>Experience Required (Yrs)</label><input id="f_exp" type="number" value="${j['Min Experience']||0}"></div>
       <div class="fg"><label>Open Vacancies</label><input id="f_open" type="number" value="${j['Openings']||1}"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitJob('${j['Job ID']||''}')">Commit Data</button>`
  );
}

function _editJob(jobId) {
  var j = (_D.jobs||[]).find(function(x){return x['Job ID']===jobId;});
  if (j) _openJobModal(j);
}

function _submitJob(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    jobId: existingId||null,
    title: document.getElementById('f_title').value.trim(),
    department: document.getElementById('f_dept').value,
    location: document.getElementById('f_loc').value.trim(),
    minExp: document.getElementById('f_exp').value,
    openings: document.getElementById('f_open').value
  };
  var action = existingId ? 'updateJob' : 'saveJob';
  _api(action, data, function(r) {
    _submitting = false; if (r.success) { _closeModal(); _toast('Matrix Saved Successfully.'); _loadData(); }
  });
}

function _closeJob(jobId) {
  if (!confirm('Archive this opening structural matrix?')) return;
  _api('closeJob', { jobId: jobId }, function(r) { if (r.success) { _toast('Archived.'); _loadData(); } });
}

// ─── VIEW 3: CANDIDATES PIPELINE ──────────────────────────────
function _renderCandidates() {
  var candidates = _D.candidates || [], jobs = _D.jobs || [];
  var search = document.getElementById('cndSearch') ? document.getElementById('cndSearch').value.toLowerCase() : '';

  var html = `
    <div class="toolbar">
      <input id="cndSearch" type="text" placeholder="Search operational profiles..." class="fg input search-input" oninput="_renderCandidates()" style="max-width:300px; margin-bottom:0;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openCndModal()">+ Register Candidate</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Target Assignment</th>
            <th>Contact Metrics</th>
            <th>Experience</th>
            <th>Pipeline Phase</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  candidates.forEach(function(c) {
    if (search && !(c['Full Name']||'').toLowerCase().includes(search)) return;
    var job = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
    var phaseColor = 'badge-info';
    if(c['Stage'] === 'Joined' || c['Stage'] === 'Selected') phaseColor = 'badge-success';
    if(c['Stage'] === 'Rejected') phaseColor = 'badge-error';

    html += `
      <tr>
        <td style="font-weight:600;">${c['Full Name']}</td>
        <td>${job ? job['Title'] : 'Unassigned Profile'}</td>
        <td>${c['Phone']} / ${c['Email']}</td>
        <td>${c['Experience (Yrs)']} Yrs</td>
        <td><span class="badge ${phaseColor}">${c['Stage']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            <button class="btn btn-secondary" style="padding:4px 8px;" onclick="_openCndDetail('${c['Candidate ID']}')">Inspect</button>
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
    'Establish Operational Profile Matrix',
    `<div class="fg"><label>Full Identity Legal Name</label><input id="c_name" value="${c['Full Name']||''}"></div>
     <div class="form-row">
       <div class="fg"><label>Email Endpoint</label><input id="c_email" type="email" value="${c['Email']||''}"></div>
       <div class="fg"><label>Mobile Network Stream</label><input id="c_phone" type="tel" value="${c['Phone']||''}"></div>
     </div>
     <div class="fg"><label>Target Asset Opening</label><select id="c_job">${jobOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Prior Domain Firm</label><input id="c_co" value="${c['Current Company']||''}"></div>
       <div class="fg"><label>Delta Experience Metrics</label><input id="c_exp" type="number" value="${c['Experience (Yrs)']||0}"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitCandidate('${c['Candidate ID']||''}')">Save Node</button>`
  );
}

function _submitCandidate(existingId) {
  if (_submitting) return; _submitting = true;
  var data = {
    candidateId: existingId||null,
    name: document.getElementById('c_name').value.trim(),
    email: document.getElementById('c_email').value.trim(),
    phone: document.getElementById('c_phone').value.trim(),
    jobId: document.getElementById('c_job').value,
    currentCompany: document.getElementById('c_co').value.trim(),
    experience: document.getElementById('c_exp').value,
    source: 'Portal Direct System Layer'
  };
  var action = existingId ? 'updateCandidate' : 'saveCandidate';
  _api(action, data, function(r) {
    _submitting = false; if (r.success) { _closeModal(); _toast('Profile Matrix Modified.'); _loadData(); }
  });
}

function _openCndDetail(candidateId) {
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  if (!c) return;
  _showModal(c['Full Name'], `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <p><strong>Security Identifier:</strong> ${c['Candidate ID']}</p>
      <p><strong>Endpoint Comm:</strong> ${c['Email']} / ${c['Phone']}</p>
      <p><strong>Active Phase State:</strong> ${c['Stage']}</p>
    </div>
  `, _hasWriteAccess() ? `
    ${c['Stage']==='Applied' ? `<button class="btn btn-primary" onclick="_scheduleInterviewFrom('${c['Candidate ID']}')">Dispatch Schedule Protocol</button>` : ''}
    ${c['Stage']==='Selected' ? `<button class="btn btn-success" onclick="_createOfferFrom('${c['Candidate ID']}')">Deploy Structural Offer</button>` : ''}
  ` : '');
}

function _scheduleInterviewFrom(candidateId) { _closeModal(); setTimeout(function() { _openInterviewModal(null, candidateId); }, 200); }
function _createOfferFrom(candidateId) { _closeModal(); setTimeout(function() { _openOfferModal(null, candidateId); }, 200); }

// ─── VIEW 4: INTERVIEWS MANAGEMENT ────────────────────────────
function _renderInterviews() {
  var interviews = _D.interviews || [], candidates = _D.candidates || [];
  var html = `
    <div class="toolbar" style="justify-content:flex-end;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openInterviewModal()">+ Setup Block Assessment</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Candidate Matrix</th>
            <th>Phase Matrix</th>
            <th>Date Constraint Timeline</th>
            <th>Auditor Vector</th>
            <th>Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  interviews.forEach(function(i) {
    var c = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
    var st = i['Status'] === 'Scheduled' ? 'badge-warning' : 'badge-success';
    html += `
      <tr>
        <td style="font-weight:600;">${c ? c['Full Name'] : 'Unknown Master'}</td>
        <td>Round ${i['Round']} (${i['Type']})</td>
        <td>${i['Scheduled On']}</td>
        <td>${i['Interviewer']}</td>
        <td><span class="badge ${st}">${i['Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            ${i['Status']==='Scheduled' ? `<button class="btn btn-secondary" style="padding:4px 8px;" onclick="_markInterviewResult('${i['Interview ID']}','${i['Candidate ID']}')">Log Result</button>` : 'Logged'}
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
    'Schedule Assessment Track Matrix',
    `<div class="fg"><label>Select Profile Node</label><select id="i_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Verification Round</label><input id="i_round" type="number" value="1"></div>
       <div class="fg"><label>Track Classification</label><select id="i_type"><option>HR</option><option>Technical</option><option>Final Evaluation</option></select></div>
     </div>
     <div class="fg"><label>Execution Date Vector</label><input id="i_sched" type="datetime-local"></div>
     <div class="fg"><label>Assigned Verification Auditor</label><input id="i_iname" placeholder="Auditor Name"></div>`,
    `<button class="btn btn-primary" onclick="_submitInterview()">Deploy Protocol</button>`
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
    mode: 'Online Grid Video', meetingLink: ''
  };
  _api('saveInterview', data, function(r){
    _submitting = false; if(r.success) { _closeModal(); _toast('Assessment Logged.'); _loadData(); }
  });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal(
    'Evaluate Node Verification Matrix',
    `<div class="fg"><label>Audit Matrix Conclusion</label><select id="r_res"><option value="Pass">Pass / Move Forward</option><option value="Fail">Fail / Terminate Track</option></select></div>
     <div class="fg"><label>Auditor Technical Summarized Notes</label><textarea id="r_fb" rows="3"></textarea></div>`,
    `<button class="btn btn-primary" onclick="_submitInterviewResult('${interviewId}','${candidateId}')">Log Decision</button>`
  );
}

function _submitInterviewResult(interviewId, candidateId) {
  if (_submitting) return; _submitting = true;
  _api('updateInterview', {
    interviewId: interviewId, candidateId: candidateId, status: 'Done',
    result: document.getElementById('r_res').value, feedback: document.getElementById('r_fb').value.trim()
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _toast('Node Cleared.'); _loadData(); } });
}

// ─── VIEW 5: OFFER LETTERS PIPELINE ───────────────────────────
function _renderOffers() {
  var offers = _D.offers || [], candidates = _D.candidates || [];
  var html = `
    <div class="toolbar" style="justify-content:flex-end;">
      ${_hasWriteAccess() ? '<button class="btn btn-primary" onclick="_openOfferModal()">+ Standardize Asset Offer</button>' : ''}
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Target Node Identity</th>
            <th>Package Structure Metric</th>
            <th>Projected Timeline Trigger</th>
            <th>Offer Status</th>
            ${_hasWriteAccess() ? '<th style="text-align:right;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  offers.forEach(function(o) {
    var c = candidates.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
    var st = o['Offer Status'] === 'Sent' ? 'badge-info' : 'badge-success';
    html += `
      <tr>
        <td style="font-weight:600;">${c ? c['Full Name'] : 'Unknown Target Component'}</td>
        <td>${o['Offered CTC']} LPA</td>
        <td>${o['Joining Date']}</td>
        <td><span class="badge ${st}">${o['Offer Status']}</span></td>
        ${_hasWriteAccess() ? `
          <td style="text-align:right;">
            ${o['Offer Status'] === 'Sent' ? `
              <button class="btn btn-primary" style="padding:4px 8px;" onclick="_updateOfferStatus('${o['Offer ID']}','${o['Candidate ID']}','Accepted')">Confirm Accept</button>
            ` : 'Cleared'}
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
  if (!cndOpts && !preCandidateId) { _toast('No profiles clear verification matrix yet.'); return; }

  _showModal(
    'Draft Asset Allocator Clearance Offer',
    `<div class="fg"><label>Candidate Profile Node</label><select id="o_cnd">${cndOpts}</select></div>
     <div class="form-row">
       <div class="fg"><label>Compensation Matrix Structure (LPA)</label><input id="o_ctc" type="number" step="0.1"></div>
       <div class="fg"><label>Target Inception Integration Date</label><input id="o_jdate" type="date"></div>
     </div>`,
    `<button class="btn btn-primary" onclick="_submitOffer()">Authorize & Deploy Offer</button>`
  );
  if (preCandidateId) document.getElementById('o_cnd').value = preCandidateId;
}

function _submitOffer() {
  if (_submitting) return; _submitting = true;
  var cid = document.getElementById('o_cnd').value;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===cid;});
  _api('saveOffer', {
    candidateId: cid, jobId: c?c['Job ID']:'',
    offeredCtc: document.getElementById('o_ctc').value, joiningDate: document.getElementById('o_jdate').value, designation: 'System Engineer Asset'
  }, function(r) { _submitting = false; if(r.success) { _closeModal(); _toast('Offer Matrix Dispatched.'); _loadData(); } });
}

function _updateOfferStatus(offerId, candidateId, status) {
  _api('updateOfferStatus', { offerId: offerId, candidateId: candidateId, status: status }, function(r) {
    if (r.success) { _toast('State Updated.'); _loadData(); }
  });
}

// ─── UTILITIES & COMPONENT CONTEXT CONTROLS ───────────────────
function _showModal(title, body, footer) {
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').innerHTML = body;
  document.getElementById('mFoot').innerHTML = footer || '';
  document.getElementById('mOv').style.display = 'block';
  document.getElementById('modal').style.display = 'flex';
}

function _closeModal() {
  _submitting = false;
  document.getElementById('mOv').style.display = 'none';
  document.getElementById('modal').style.display = 'none';
}

function _toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 3000);
}
