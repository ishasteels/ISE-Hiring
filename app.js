// ============================================================
// ISE HIRING PROCESS — app.js
// GitHub Pages + GAS JSONP Architecture
// ============================================================

var API = 'YOUR_GAS_DEPLOYMENT_URL_HERE';  // ← Paste GAS web app URL after deploy

// ─── GLOBALS ─────────────────────────────────────────────────
var _U = null, _TOKEN = null, _D = {}, _V = 'home';
var _cbIdx = 0, _submitting = false;

// ─── JSONP API ────────────────────────────────────────────────
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
    if (err) err({ message: 'Request timed out. Check connection.' });
  }, 25000);

  var url = API + '?callback=' + cbName + '&payload='
    + encodeURIComponent(JSON.stringify({ action: action, data: data || {}, token: _TOKEN || '' }));

  var s = document.createElement('script');
  s.id  = '_s_' + cbName;
  s.src = url;
  s.onerror = function() {
    clearTimeout(timeout);
    if (err) err({ message: 'Network error. Check API URL.' });
  };
  document.body.appendChild(s);
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Restore session
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

// ─── AUTH ─────────────────────────────────────────────────────
function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { _loginErr('Email aur password dono bharein.'); return; }
  var btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Logging in...';
  document.getElementById('loginErr').textContent = '';

  _api('login', { email: email, password: pass }, function(r) {
    btn.disabled = false; btn.textContent = 'Login';
    if (!r.success) { _loginErr(r.error || 'Login failed.'); return; }
    _U = r.user; _TOKEN = r.token;
    try { localStorage.setItem('ise_hiring_session', JSON.stringify({ user: _U, token: _TOKEN })); } catch(e) {}
    _showApp();
    _loadData();
  }, function(e) {
    btn.disabled = false; btn.textContent = 'Login';
    _loginErr(e.message || 'Error. Try again.');
  });
}

function _loginErr(msg) { document.getElementById('loginErr').textContent = msg; }

function _signOut() {
  try { localStorage.removeItem('ise_hiring_session'); } catch(e) {}
  _U = null; _TOKEN = null; _D = {};
  _showLogin();
  _closeSb();
}

// ─── DATA LOAD ────────────────────────────────────────────────
function _loadData(cb) {
  _api('getAllData', {}, function(r) {
    if (r.success) {
      _D = r.data || {};
      _lv(_V);
      if (cb) cb();
    } else {
      _toast('⚠️ Data load failed: ' + r.error);
    }
  }, function(e) { _toast('⚠️ ' + e.message); });
}

function _refresh() { _loadData(function() { _toast('✓ Refreshed'); }); }

// ─── LAYOUT ───────────────────────────────────────────────────
function _showLogin() {
  document.getElementById('sLogin').style.display = 'flex';
  document.getElementById('sApp').style.display   = 'none';
}

function _showApp() {
  document.getElementById('sLogin').style.display = 'none';
  document.getElementById('sApp').style.display   = 'block';
  // Set user info
  var n = document.getElementById('sbUserName');
  var e = document.getElementById('sbUserEmail');
  var r = document.getElementById('sbUserRole');
  if (n) n.textContent = _U.name;
  if (e) e.textContent = _U.email;
  if (r) r.textContent = _U.role.toUpperCase();
  // Apply role-based visibility
  _applyRoles();
}

function _applyRoles() {
  var isHR    = _U.role === 'hr' || _U.role === 'admin';
  var isAdmin = _U.role === 'admin';
  document.querySelectorAll('.hr-only').forEach(function(el) {
    el.style.display = isHR ? '' : 'none';
  });
  document.querySelectorAll('.admin-only').forEach(function(el) {
    el.style.display = isAdmin ? '' : 'none';
  });
}

// ─── NAVIGATION ───────────────────────────────────────────────
function _lv(v) {
  _V = v;
  document.querySelectorAll('.view').forEach(function(el) { el.style.display = 'none'; });
  var el = document.getElementById('v-' + v);
  if (el) el.style.display = 'block';
  // Update bottom nav active
  document.querySelectorAll('.bn-item').forEach(function(b) {
    b.classList.toggle('on', b.dataset.v === v);
  });
  // Update sidebar active
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.toggle('on', b.dataset.v === v);
  });
  // Update topbar title
  var titles = {
    home: 'ISE Hiring', jobs: 'Job Openings', candidates: 'Candidates',
    interviews: 'Interviews', offers: 'Offer Letters'
  };
  document.getElementById('tbTitle').textContent = titles[v] || 'ISE Hiring';
  // Render view
  var renderers = {
    home: _renderHome, jobs: _renderJobs,
    candidates: _renderCandidates, interviews: _renderInterviews,
    offers: _renderOffers
  };
  if (renderers[v]) renderers[v]();
  _closeSb();
}

function _openSb()  { document.getElementById('sb').classList.add('open'); document.getElementById('sbOv').classList.add('on'); }
function _closeSb() { document.getElementById('sb').classList.remove('open'); document.getElementById('sbOv').classList.remove('on'); }

// ─── HOME / DASHBOARD ─────────────────────────────────────────
function _renderHome() {
  var jobs        = _D.jobs        || [];
  var candidates  = _D.candidates  || [];
  var interviews  = _D.interviews  || [];
  var offers      = _D.offers      || [];

  var openJobs    = jobs.filter(function(j) { return j['Status'] === 'Open'; }).length;
  var todayStr    = new Date().toISOString().slice(0, 10);
  var todayInt    = interviews.filter(function(i) {
    return (i['Scheduled On'] || '').slice(0, 10) === todayStr && i['Status'] === 'Scheduled';
  }).length;
  var pendingOff  = offers.filter(function(o) { return o['Offer Status'] === 'Sent'; }).length;
  var thisMonth   = new Date().toISOString().slice(0, 7);
  var joined      = candidates.filter(function(c) {
    return c['Stage'] === 'Joined' && (c['Last Modified'] || '').slice(0, 7) === thisMonth;
  }).length;
  var applied     = candidates.filter(function(c) { return c['Stage'] === 'Applied'; }).length;
  var selected    = candidates.filter(function(c) { return c['Stage'] === 'Selected'; }).length;

  document.getElementById('v-home').innerHTML = '<div class="kpi-row">'
    + _kpi(openJobs,    'Open Positions', '💼', '#2563EB', 'var(--Al)')
    + _kpi(todayInt,    'Interviews Today','📅', '#7C3AED', 'var(--Vl)')
    + _kpi(pendingOff,  'Pending Offers',  '📋', '#D97706', 'var(--Ol)')
    + _kpi(joined,      'Joined This Month','✅', '#16A34A', 'var(--Gl)')
    + '</div>'
    + '<div class="kpi-row">'
    + _kpi(applied,  'In Review',  '👀', '#0D9488', 'var(--Tl)')
    + _kpi(selected, 'Selected',   '🏆', '#16A34A', 'var(--Gl)')
    + _kpi(candidates.filter(function(c){return c['Stage']==='Interview';}).length, 'Interviewing', '🎤', '#2563EB', 'var(--Al)')
    + _kpi(candidates.filter(function(c){return c['Stage']==='Rejected';}).length, 'Rejected', '❌', '#DC2626', 'var(--Rl)')
    + '</div>'
    + '<div class="home-grid">'
    + _tile('💼','Job Openings',openJobs+' open','#2563EB','var(--Al)','jobs')
    + _tile('👤','Candidates',candidates.length+' total','#7C3AED','var(--Vl)','candidates')
    + _tile('📅','Interviews',todayInt+' today','#D97706','var(--Ol)','interviews')
    + _tile('📋','Offer Letters',pendingOff+' pending','#16A34A','var(--Gl)','offers')
    + '</div>';
}

function _kpi(val, lbl, ico, c, bg) {
  return '<div class="kpi" style="--kc:'+c+';--kib:'+bg+'">'
    + '<div class="kpi-ico">'+ico+'</div>'
    + '<div class="kpi-val">'+val+'</div>'
    + '<div class="kpi-lbl">'+lbl+'</div>'
    + '</div>';
}

function _tile(ico, name, sub, c, bg, v) {
  return '<div class="home-tile" style="--tc:'+c+';--tib:'+bg+'" onclick="_lv(\''+v+'\')">'
    + '<div class="ht-ico">'+ico+'</div>'
    + '<div><div class="ht-name">'+name+'</div><div class="ht-sub">'+sub+'</div></div>'
    + '</div>';
}

// ─── JOB OPENINGS ─────────────────────────────────────────────
function _renderJobs() {
  var jobs    = _D.jobs || [];
  var filter  = document.getElementById('jobFilter') ? document.getElementById('jobFilter').value : 'all';
  var search  = document.getElementById('jobSearch') ? document.getElementById('jobSearch').value.toLowerCase() : '';
  var visible = jobs.filter(function(j) {
    if (filter !== 'all' && j['Status'] !== filter) return false;
    if (search && !(j['Title']||'').toLowerCase().includes(search) &&
                  !(j['Department']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  var isHR    = _U.role === 'hr' || _U.role === 'admin';
  var isAdmin = _U.role === 'admin';

  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
    + '<input id="jobSearch" type="text" placeholder="🔍 Search..." style="flex:1;min-width:120px;padding:10px 12px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:13px;background:var(--sur2);color:var(--tx)" oninput="_renderJobs()">'
    + '<select id="jobFilter" style="padding:10px 12px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:13px;background:var(--sur2);color:var(--tx)" onchange="_renderJobs()">'
    + '<option value="all">All Status</option><option value="Open">Open</option><option value="Closed">Closed</option><option value="On Hold">On Hold</option>'
    + '</select>'
    + (isHR ? '<button class="btn btnP btn-sm" onclick="_openJobModal()">+ Add Job</button>' : '')
    + '</div>';

  if (!visible.length) {
    html += '<div style="text-align:center;padding:40px;color:var(--tx3)">No job openings found.</div>';
  } else {
    visible.forEach(function(j) {
      var stC = j['Status'] === 'Open' ? 'bg' : j['Status'] === 'Closed' ? 'br' : 'bo';
      var cnt = (_D.candidates || []).filter(function(c) { return c['Job ID'] === j['Job ID']; }).length;
      html += '<div class="card">'
        + '<div class="card-head">'
        + '<div class="card-title"><span>'+j['Title']+'</span>'
        + '<span class="badge '+stC+'">'+j['Status']+'</span></div>'
        + (isHR ? '<button class="btn btnO btn-sm" onclick="_editJob(\''+j['Job ID']+'\')">Edit</button>' : '')
        + '</div><div class="card-body">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--tx2);margin-bottom:10px">'
        + '<div>🏢 '+j['Department']+'</div>'
        + '<div>📍 '+j['Location']+'</div>'
        + '<div>💰 '+j['Salary Range']+'</div>'
        + '<div>📅 Deadline: '+j['Deadline']+'</div>'
        + '<div>👔 Exp: '+j['Min Experience']+' yrs</div>'
        + '<div>🔢 Openings: '+j['Openings']+'</div>'
        + '</div>'
        + '<div style="display:flex;gap:8px;align-items:center">'
        + '<span style="font-size:12px;color:var(--tx3)">👤 '+cnt+' candidates</span>'
        + '<button class="btn bb btn-sm" style="margin-left:auto;background:var(--Al);color:var(--A);border:none" onclick="_viewJobCandidates(\''+j['Job ID']+'\')">'
        + 'View Candidates</button>'
        + (isAdmin && j['Status']==='Open' ? '<button class="btn br btn-sm" style="background:var(--Rl);color:var(--R);border:none" onclick="_closeJob(\''+j['Job ID']+'\')" >Close</button>' : '')
        + '</div></div></div>';
    });
  }
  document.getElementById('v-jobs').innerHTML = html;
}

function _openJobModal(job) {
  var j = job || {};
  _showModal(
    (j['Job ID'] ? 'Edit' : 'New') + ' Job Opening',
    '<div class="fg"><label>Job Title</label><input id="f_title" value="'+(j['Title']||'')+'" placeholder="e.g. Production Supervisor"></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Department</label><select id="f_dept"><option>Production</option><option>Quality</option><option>Accounts</option><option>HR</option><option>Purchase</option><option>Sales</option><option>Admin</option><option>IT</option></select></div>'
    + '<div class="fg"><label>Location</label><input id="f_loc" value="'+(j['Location']||'Pune')+'" placeholder="Pune"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Min Experience (yrs)</label><input id="f_exp" type="number" value="'+(j['Min Experience']||0)+'" min="0"></div>'
    + '<div class="fg"><label>No. of Openings</label><input id="f_open" type="number" value="'+(j['Openings']||1)+'" min="1"></div>'
    + '</div>'
    + '<div class="fg"><label>Salary Range</label><input id="f_sal" value="'+(j['Salary Range']||'')+'" placeholder="e.g. 3-5 LPA"></div>'
    + '<div class="fg"><label>Application Deadline</label><input id="f_ddl" type="date" value="'+(j['Deadline']||'')+'"></div>'
    + '<div class="fg"><label>Description</label><textarea id="f_desc" rows="3" placeholder="Job description...">'+(j['Description']||'')+'</textarea></div>',
    '<button class="btn btnP btn-full" onclick="_submitJob(\''+(j['Job ID']||'')+'\')">💾 Save Job</button>'
  );
  // Set department
  if (j['Department']) {
    var s = document.getElementById('f_dept');
    for (var i=0;i<s.options.length;i++) if(s.options[i].value===j['Department']) s.selectedIndex=i;
  }
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
    openings: document.getElementById('f_open').value,
    salaryRange: document.getElementById('f_sal').value.trim(),
    deadline: document.getElementById('f_ddl').value,
    description: document.getElementById('f_desc').value.trim()
  };
  if (!data.title) { _toast('⚠️ Job title required.'); _submitting=false; return; }
  var action = existingId ? 'updateJob' : 'saveJob';
  _api(action, data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('✓ '+r.message); _loadData(); }
    else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

function _closeJob(jobId) {
  if (!confirm('Close this job opening?')) return;
  _api('closeJob', { jobId: jobId }, function(r) {
    if (r.success) { _toast('✓ Job closed.'); _loadData(); }
    else _toast('⚠️ '+r.error);
  });
}

function _viewJobCandidates(jobId) {
  var j = (_D.jobs||[]).find(function(x){return x['Job ID']===jobId;});
  if (j) { document.getElementById('jobFilterCnd') && (document.getElementById('jobFilterCnd').value = jobId); }
  _lv('candidates');
  // Small delay then filter
  setTimeout(function(){
    var el = document.getElementById('cndJobFilter');
    if (el) { el.value = jobId; _renderCandidates(); }
  }, 100);
}

// ─── CANDIDATES ───────────────────────────────────────────────
function _renderCandidates() {
  var candidates = _D.candidates || [];
  var jobs       = _D.jobs       || [];

  var jobFilter  = document.getElementById('cndJobFilter')   ? document.getElementById('cndJobFilter').value   : 'all';
  var stgFilter  = document.getElementById('cndStageFilter') ? document.getElementById('cndStageFilter').value : 'all';
  var search     = document.getElementById('cndSearch')      ? document.getElementById('cndSearch').value.toLowerCase() : '';

  var visible = candidates.filter(function(c) {
    if (jobFilter !== 'all'  && c['Job ID'] !== jobFilter) return false;
    if (stgFilter !== 'all'  && c['Stage']  !== stgFilter) return false;
    if (search && !(c['Full Name']||'').toLowerCase().includes(search) &&
                  !(c['Email']||'').toLowerCase().includes(search)) return false;
    return true;
  });

  var isHR = _U.role === 'hr' || _U.role === 'admin';

  var jobOpts = '<option value="all">All Jobs</option>';
  jobs.forEach(function(j) { jobOpts += '<option value="'+j['Job ID']+'">'+j['Title']+'</option>'; });

  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
    + '<input id="cndSearch" type="text" placeholder="🔍 Name / Email..." style="flex:1;min-width:100px;padding:10px 12px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:13px;background:var(--sur2);color:var(--tx)" oninput="_renderCandidates()">'
    + '<select id="cndJobFilter" style="padding:10px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:12px;background:var(--sur2);color:var(--tx)" onchange="_renderCandidates()">'+jobOpts+'</select>'
    + '<select id="cndStageFilter" style="padding:10px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:12px;background:var(--sur2);color:var(--tx)" onchange="_renderCandidates()">'
    + '<option value="all">All Stages</option><option>Applied</option><option>Interview</option><option>Selected</option><option>Offered</option><option>Joined</option><option>Rejected</option>'
    + '</select>'
    + (isHR ? '<button class="btn btnP btn-sm" onclick="_openCndModal()">+ Add</button>' : '')
    + '</div>';

  if (!visible.length) {
    html += '<div style="text-align:center;padding:40px;color:var(--tx3)">No candidates found.</div>';
  } else {
    visible.forEach(function(c) {
      var stC = _stageColor(c['Stage']);
      var job = jobs.find(function(j){return j['Job ID']===c['Job ID'];});
      html += '<div class="card">'
        + '<div class="card-head">'
        + '<div class="card-title">👤 '+c['Full Name']+'&nbsp;<span class="badge '+stC+'">'+c['Stage']+'</span></div>'
        + (isHR ? '<button class="btn btnO btn-sm" onclick="_openCndDetail(\''+c['Candidate ID']+'\')">View</button>' : '')
        + '</div><div class="card-body">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--tx2)">'
        + '<div>💼 '+(job?job['Title']:'Unknown Job')+'</div>'
        + '<div>📱 '+c['Phone']+'</div>'
        + '<div>🏢 '+(c['Current Company']||'—')+'</div>'
        + '<div>💰 Exp CTC: '+(c['Expected CTC']||'—')+'</div>'
        + '<div>📅 Applied: '+c['Applied On']+'</div>'
        + '<div>📡 '+(c['Source']||'—')+'</div>'
        + '</div>'
        + (isHR && (c['Stage']==='Applied'||c['Stage']==='Selected') ? '<div style="margin-top:10px;display:flex;gap:8px">'
          + (c['Stage']==='Applied' ? '<button class="btn btnA btn-sm" onclick="_scheduleInterviewFrom(\''+c['Candidate ID']+'\')">📅 Schedule Interview</button>' : '')
          + (c['Stage']==='Selected' ? '<button class="btn btnG btn-sm" onclick="_createOfferFrom(\''+c['Candidate ID']+'\')">📋 Create Offer</button>' : '')
          + '</div>' : '')
        + '</div></div>';
    });
  }
  document.getElementById('v-candidates').innerHTML = html;
}

function _stageColor(stage) {
  var map = { Applied:'bb', Interview:'bo', Selected:'bg', Offered:'bv', Joined:'bg', Rejected:'br' };
  return map[stage] || 'bx';
}

function _openCndModal(cnd) {
  var c = cnd || {};
  var jobs = _D.jobs || [];
  var jobOpts = jobs.map(function(j){return '<option value="'+j['Job ID']+'">'+j['Title']+'</option>';}).join('');

  _showModal(
    (c['Candidate ID'] ? 'Edit' : 'Add') + ' Candidate',
    '<div class="fg"><label>Full Name</label><input id="c_name" value="'+(c['Full Name']||'')+'" placeholder="Candidate name"></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Email</label><input id="c_email" type="email" value="'+(c['Email']||'')+'"></div>'
    + '<div class="fg"><label>Phone</label><input id="c_phone" type="tel" value="'+(c['Phone']||'')+'"></div>'
    + '</div>'
    + '<div class="fg"><label>Applying For</label><select id="c_job">'+jobOpts+'</select></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Current Company</label><input id="c_co" value="'+(c['Current Company']||'')+'"></div>'
    + '<div class="fg"><label>Experience (yrs)</label><input id="c_exp" type="number" value="'+(c['Experience (Yrs)']||0)+'" min="0"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Current CTC (LPA)</label><input id="c_cctc" value="'+(c['Current CTC']||'')+'"></div>'
    + '<div class="fg"><label>Expected CTC (LPA)</label><input id="c_ectc" value="'+(c['Expected CTC']||'')+'"></div>'
    + '</div>'
    + '<div class="fg"><label>Source</label><select id="c_src"><option>Referral</option><option>Portal</option><option>Direct Walk-in</option><option>LinkedIn</option><option>Agency</option></select></div>'
    + '<div class="fg"><label>Resume Drive Link (optional)</label><input id="c_res" value="'+(c['Resume Link']||'')+'" placeholder="https://drive.google.com/..."></div>',
    '<button class="btn btnP btn-full" onclick="_submitCandidate(\''+(c['Candidate ID']||'')+'\')">💾 Save Candidate</button>'
  );
  if (c['Job ID']) {
    var s = document.getElementById('c_job');
    for(var i=0;i<s.options.length;i++) if(s.options[i].value===c['Job ID']) s.selectedIndex=i;
  }
  if (c['Source']) {
    var s2 = document.getElementById('c_src');
    for(var j=0;j<s2.options.length;j++) if(s2.options[j].value===c['Source']) s2.selectedIndex=j;
  }
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
    currentCtc: document.getElementById('c_cctc').value.trim(),
    expectedCtc: document.getElementById('c_ectc').value.trim(),
    source: document.getElementById('c_src').value,
    resumeLink: document.getElementById('c_res').value.trim()
  };
  if (!data.name || !data.phone) { _toast('⚠️ Name & phone required.'); _submitting=false; return; }
  var action = existingId ? 'updateCandidate' : 'saveCandidate';
  _api(action, data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('✓ '+r.message); _loadData(); }
    else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

function _openCndDetail(candidateId) {
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  if (!c) return;
  var job = (_D.jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});
  var ints = (_D.interviews||[]).filter(function(i){return i['Candidate ID']===candidateId;});
  var offer = (_D.offers||[]).find(function(o){return o['Candidate ID']===candidateId;});
  var stC = _stageColor(c['Stage']);
  var isHR = _U.role === 'hr' || _U.role === 'admin';

  var intHtml = '';
  ints.forEach(function(i) {
    var rc = i['Result']==='Pass'?'bg':i['Result']==='Fail'?'br':i['Status']==='Scheduled'?'bo':'bx';
    intHtml += '<div style="padding:10px;background:var(--sur2);border-radius:var(--rS);margin-bottom:8px;font-size:12px">'
      + '<b>Round '+i['Round']+' — '+i['Type']+'</b><span class="badge '+rc+'" style="margin-left:8px">'+(i['Result']||i['Status'])+'</span><br>'
      + '📅 '+i['Scheduled On']+' | 👤 '+i['Interviewer']+'<br>'
      + (i['Feedback'] ? '<i style="color:var(--tx2)">'+i['Feedback']+'</i>' : '')
      + (isHR && i['Status']==='Scheduled' ? '<br><button class="btn btnO btn-sm" style="margin-top:6px" onclick="_markInterviewResult(\''+i['Interview ID']+'\',\''+candidateId+'\')">Mark Result</button>' : '')
      + '</div>';
  });

  _showModal(
    c['Full Name'],
    '<div style="text-align:center;margin-bottom:16px">'
    + '<div style="display:inline-block;background:var(--Al);color:var(--A);width:52px;height:52px;border-radius:50%;line-height:52px;font-size:20px;font-weight:700;margin-bottom:8px">'+c['Full Name'].charAt(0).toUpperCase()+'</div><br>'
    + '<span class="badge '+stC+'">'+c['Stage']+'</span>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--tx2);margin-bottom:16px">'
    + '<div>📧 '+c['Email']+'</div>'
    + '<div>📱 '+c['Phone']+'</div>'
    + '<div>💼 '+(job?job['Title']:'—')+'</div>'
    + '<div>🏢 '+(c['Current Company']||'—')+'</div>'
    + '<div>💰 CTC: '+(c['Current CTC']||'—')+' → '+(c['Expected CTC']||'—')+'</div>'
    + '<div>📡 '+c['Source']+'</div>'
    + '</div>'
    + (ints.length ? '<div style="font-size:12px;font-weight:700;color:var(--tx3);margin-bottom:8px">INTERVIEWS</div>'+intHtml : '')
    + (offer ? '<div style="font-size:12px;font-weight:700;color:var(--tx3);margin:8px 0 6px">OFFER</div>'
      + '<div style="padding:10px;background:var(--Gl);border-radius:var(--rS);font-size:12px">'
      + '💰 '+offer['Offered CTC']+' LPA | 📅 Joining: '+offer['Joining Date']+'<br>'
      + '<span class="badge bg">'+offer['Offer Status']+'</span>'
      + (isHR && offer['Offer Status']==='Sent' ? '<br><button class="btn btnG btn-sm" style="margin-top:8px" onclick="_confirmJoining(\''+offer['Offer ID']+'\',\''+candidateId+'\')">✅ Confirm Joining</button>' : '')
      + '</div>' : ''),
    (isHR ? '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<button class="btn btnO btn-sm" onclick="_openCndModal('+JSON.stringify(c)+')">✏️ Edit</button>'
      + (c['Stage']==='Applied' ? '<button class="btn btnA btn-sm" onclick="_scheduleInterviewFrom(\''+candidateId+'\')">📅 Schedule</button>' : '')
      + (c['Stage']==='Selected' ? '<button class="btn btnG btn-sm" onclick="_createOfferFrom(\''+candidateId+'\')">📋 Offer</button>' : '')
      + '</div>' : '')
  );
}

function _scheduleInterviewFrom(candidateId) {
  _closeModal();
  setTimeout(function() {
    _openInterviewModal(null, candidateId);
  }, 200);
}

function _createOfferFrom(candidateId) {
  _closeModal();
  setTimeout(function() {
    _openOfferModal(null, candidateId);
  }, 200);
}

// ─── INTERVIEWS ───────────────────────────────────────────────
function _renderInterviews() {
  var interviews = _D.interviews || [];
  var candidates = _D.candidates || [];

  var filter = document.getElementById('intFilter') ? document.getElementById('intFilter').value : 'all';
  var search  = document.getElementById('intSearch') ? document.getElementById('intSearch').value.toLowerCase() : '';

  var visible = interviews.filter(function(i) {
    if (filter !== 'all' && i['Status'] !== filter) return false;
    var c = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
    if (search && !(c&&(c['Full Name']||'').toLowerCase().includes(search))) return false;
    return true;
  }).sort(function(a,b){return (a['Scheduled On']||'').localeCompare(b['Scheduled On']||'');});

  var isHR = _U.role === 'hr' || _U.role === 'admin';

  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
    + '<input id="intSearch" type="text" placeholder="🔍 Candidate name..." style="flex:1;min-width:120px;padding:10px 12px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:13px;background:var(--sur2);color:var(--tx)" oninput="_renderInterviews()">'
    + '<select id="intFilter" style="padding:10px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:12px;background:var(--sur2);color:var(--tx)" onchange="_renderInterviews()">'
    + '<option value="all">All</option><option value="Scheduled">Scheduled</option><option value="Done">Done</option><option value="Cancelled">Cancelled</option>'
    + '</select>'
    + (isHR ? '<button class="btn btnP btn-sm" onclick="_openInterviewModal()">+ Schedule</button>' : '')
    + '</div>';

  if (!visible.length) {
    html += '<div style="text-align:center;padding:40px;color:var(--tx3)">No interviews found.</div>';
  } else {
    visible.forEach(function(i) {
      var c   = candidates.find(function(x){return x['Candidate ID']===i['Candidate ID'];});
      var stC = i['Status']==='Done' ? (i['Result']==='Pass'?'bg':'br') : i['Status']==='Scheduled'?'bo':'bx';
      var lbl = i['Status']==='Done' ? (i['Result']||'Done') : i['Status'];
      html += '<div class="card">'
        + '<div class="card-head">'
        + '<div class="card-title">👤 '+(c?c['Full Name']:'Unknown')+' &nbsp;'
        + '<span style="font-weight:400;font-size:12px;color:var(--tx3)">Round '+i['Round']+' — '+i['Type']+'</span>'
        + '</div><span class="badge '+stC+'">'+lbl+'</span></div>'
        + '<div class="card-body">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--tx2)">'
        + '<div>📅 '+i['Scheduled On']+'</div>'
        + '<div>🖥️ '+i['Mode']+'</div>'
        + '<div>👤 '+i['Interviewer']+'</div>'
        + (i['Meeting Link'] ? '<div><a href="'+i['Meeting Link']+'" target="_blank" style="color:var(--A)">🔗 Join Link</a></div>' : '<div></div>')
        + '</div>'
        + (i['Feedback'] ? '<div style="margin-top:8px;font-size:12px;color:var(--tx2);font-style:italic">💬 '+i['Feedback']+'</div>' : '')
        + (isHR && i['Status']==='Scheduled' ? '<div style="margin-top:10px">'
          + '<button class="btn btnG btn-sm" onclick="_markInterviewResult(\''+i['Interview ID']+'\',\''+i['Candidate ID']+'\')">Mark Result</button>'
          + '</div>' : '')
        + '</div></div>';
    });
  }
  document.getElementById('v-interviews').innerHTML = html;
}

function _openInterviewModal(interview, preCandidateId) {
  var i = interview || {};
  var candidates = (_D.candidates||[]).filter(function(c){
    return c['Stage']==='Applied'||c['Stage']==='Interview'||c['Stage']==='Selected';
  });
  var cndOpts = candidates.map(function(c){
    return '<option value="'+c['Candidate ID']+'">'+c['Full Name']+'</option>';
  }).join('');

  _showModal(
    'Schedule Interview',
    '<div class="fg"><label>Candidate</label><select id="i_cnd">'+cndOpts+'</select></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Round</label><select id="i_round"><option value="1">Round 1</option><option value="2">Round 2</option><option value="3">Round 3 (Final)</option></select></div>'
    + '<div class="fg"><label>Interview Type</label><select id="i_type"><option>HR</option><option>Technical</option><option>Final</option><option>Task/Assignment</option></select></div>'
    + '</div>'
    + '<div class="fg"><label>Scheduled Date & Time</label><input id="i_sched" type="datetime-local"></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Interviewer Name</label><input id="i_iname" placeholder="e.g. Rahul Sharma"></div>'
    + '<div class="fg"><label>Mode</label><select id="i_mode"><option>In-Person</option><option>Online (Video)</option><option>Telephonic</option></select></div>'
    + '</div>'
    + '<div class="fg"><label>Meeting Link (optional)</label><input id="i_link" placeholder="https://meet.google.com/..."></div>',
    '<button class="btn btnP btn-full" onclick="_submitInterview()">📅 Schedule Interview</button>'
  );
  if (preCandidateId) {
    var sel = document.getElementById('i_cnd');
    for(var k=0;k<sel.options.length;k++) if(sel.options[k].value===preCandidateId) sel.selectedIndex=k;
  }
}

function _submitInterview() {
  if (_submitting) return; _submitting = true;
  var sel = document.getElementById('i_cnd');
  var candidateId = sel.value;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var data = {
    candidateId: candidateId,
    candidateName: c ? c['Full Name'] : '',
    candidateEmail: c ? c['Email'] : '',
    jobId: c ? c['Job ID'] : '',
    round: document.getElementById('i_round').value,
    type: document.getElementById('i_type').value,
    scheduledOn: document.getElementById('i_sched').value,
    interviewer: document.getElementById('i_iname').value.trim(),
    mode: document.getElementById('i_mode').value,
    meetingLink: document.getElementById('i_link').value.trim()
  };
  if (!data.candidateId || !data.scheduledOn || !data.interviewer) {
    _toast('⚠️ Candidate, date, and interviewer required.'); _submitting=false; return;
  }
  _api('saveInterview', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('✓ '+r.message); _loadData(); }
    else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

function _markInterviewResult(interviewId, candidateId) {
  _showModal(
    'Mark Interview Result',
    '<div class="fg"><label>Result</label><select id="r_res"><option value="">-- Select --</option><option value="Pass">Pass ✅</option><option value="Fail">Fail ❌</option><option value="Hold">Hold ⏸️</option></select></div>'
    + '<div class="fg"><label>Feedback / Notes</label><textarea id="r_fb" rows="3" placeholder="Brief feedback about the candidate..."></textarea></div>',
    '<button class="btn btnP btn-full" onclick="_submitInterviewResult(\''+interviewId+'\',\''+candidateId+'\')">Save Result</button>'
  );
}

function _submitInterviewResult(interviewId, candidateId) {
  if (_submitting) return; _submitting = true;
  var result = document.getElementById('r_res').value;
  if (!result) { _toast('⚠️ Please select a result.'); _submitting=false; return; }
  _api('updateInterview', {
    interviewId: interviewId, candidateId: candidateId,
    status: 'Done', result: result,
    feedback: document.getElementById('r_fb').value.trim()
  }, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('✓ Result saved.'); _loadData(); }
    else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

// ─── OFFER LETTERS ────────────────────────────────────────────
function _renderOffers() {
  var offers     = _D.offers     || [];
  var candidates = _D.candidates || [];
  var jobs       = _D.jobs       || [];
  var filter     = document.getElementById('offFilter') ? document.getElementById('offFilter').value : 'all';

  var visible = offers.filter(function(o) {
    return filter === 'all' || o['Offer Status'] === filter;
  });

  var isHR = _U.role === 'hr' || _U.role === 'admin';

  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
    + '<select id="offFilter" style="padding:10px;border:1.5px solid var(--bdr);border-radius:var(--rS);font-size:12px;background:var(--sur2);color:var(--tx)" onchange="_renderOffers()">'
    + '<option value="all">All Offers</option><option value="Sent">Sent</option><option value="Accepted">Accepted</option><option value="Declined">Declined</option>'
    + '</select>'
    + (isHR ? '<button class="btn btnP btn-sm" onclick="_openOfferModal()">+ Create Offer</button>' : '')
    + '</div>';

  if (!visible.length) {
    html += '<div style="text-align:center;padding:40px;color:var(--tx3)">No offer letters found.</div>';
  } else {
    visible.forEach(function(o) {
      var c   = candidates.find(function(x){return x['Candidate ID']===o['Candidate ID'];});
      var job = jobs.find(function(j){return j['Job ID']===o['Job ID'];});
      var stC = o['Offer Status']==='Accepted'?'bg':o['Offer Status']==='Declined'?'br':'bo';
      html += '<div class="card">'
        + '<div class="card-head">'
        + '<div class="card-title">📋 '+(c?c['Full Name']:'—')+'&nbsp;<span class="badge '+stC+'">'+o['Offer Status']+'</span></div>'
        + '</div><div class="card-body">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--tx2)">'
        + '<div>💼 '+(job?job['Title']:'—')+'</div>'
        + '<div>💰 '+o['Offered CTC']+' LPA</div>'
        + '<div>📅 Joining: '+o['Joining Date']+'</div>'
        + '<div>📤 Sent: '+o['Sent On']+'</div>'
        + '</div>'
        + (isHR && o['Offer Status']==='Sent' ? '<div style="margin-top:10px;display:flex;gap:8px">'
          + '<button class="btn btnG btn-sm" onclick="_updateOfferStatus(\''+o['Offer ID']+'\',\''+o['Candidate ID']+'\',\'Accepted\')">✅ Accepted</button>'
          + '<button class="btn btnR btn-sm" onclick="_updateOfferStatus(\''+o['Offer ID']+'\',\''+o['Candidate ID']+'\',\'Declined\')">❌ Declined</button>'
          + '</div>' : '')
        + (isHR && o['Offer Status']==='Accepted' ? '<div style="margin-top:10px">'
          + '<button class="btn btnG btn-sm" onclick="_confirmJoining(\''+o['Offer ID']+'\',\''+o['Candidate ID']+'\')">🎉 Confirm Joining</button>'
          + '</div>' : '')
        + '</div></div>';
    });
  }
  document.getElementById('v-offers').innerHTML = html;
}

function _openOfferModal(offer, preCandidateId) {
  var selectedCands = (_D.candidates||[]).filter(function(c){return c['Stage']==='Selected';});
  var cndOpts = selectedCands.map(function(c){
    return '<option value="'+c['Candidate ID']+'">'+c['Full Name']+'</option>';
  }).join('');
  if (!cndOpts) {
    _toast('⚠️ No selected candidates found. Mark interview result as Pass first.'); return;
  }

  _showModal(
    'Create Offer Letter',
    '<div class="fg"><label>Candidate</label><select id="o_cnd">'+cndOpts+'</select></div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Offered CTC (LPA)</label><input id="o_ctc" type="number" step="0.1" placeholder="e.g. 4.5"></div>'
    + '<div class="fg"><label>Joining Date</label><input id="o_jdate" type="date"></div>'
    + '</div>'
    + '<div class="fg"><label>Designation</label><input id="o_desg" placeholder="e.g. Junior Engineer"></div>',
    '<button class="btn btnP btn-full" onclick="_submitOffer()">📋 Create Offer</button>'
  );
  if (preCandidateId) {
    var sel = document.getElementById('o_cnd');
    for(var k=0;k<sel.options.length;k++) if(sel.options[k].value===preCandidateId) sel.selectedIndex=k;
  }
}

function _submitOffer() {
  if (_submitting) return; _submitting = true;
  var sel = document.getElementById('o_cnd');
  var candidateId = sel.value;
  var c = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var data = {
    candidateId: candidateId,
    jobId: c ? c['Job ID'] : '',
    offeredCtc: document.getElementById('o_ctc').value,
    joiningDate: document.getElementById('o_jdate').value,
    designation: document.getElementById('o_desg').value.trim()
  };
  if (!data.offeredCtc || !data.joiningDate) {
    _toast('⚠️ CTC and joining date required.'); _submitting=false; return;
  }
  _api('saveOffer', data, function(r) {
    _submitting = false;
    if (r.success) { _closeModal(); _toast('✓ Offer created.'); _loadData(); }
    else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

function _updateOfferStatus(offerId, candidateId, status) {
  _api('updateOfferStatus', { offerId: offerId, candidateId: candidateId, status: status }, function(r) {
    if (r.success) { _toast('✓ Offer '+status.toLowerCase()+'.'); _loadData(); }
    else _toast('⚠️ '+r.error);
  });
}

function _confirmJoining(offerId, candidateId) {
  var c     = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var offer = (_D.offers||[]).find(function(o){return o['Offer ID']===offerId;});
  if (!c || !offer) { _toast('⚠️ Data not found.'); return; }
  var job   = (_D.jobs||[]).find(function(j){return j['Job ID']===c['Job ID'];});

  _showModal(
    '🎉 Confirm Joining',
    '<div class="alert-strip ok">Confirm that <b>'+c['Full Name']+'</b> is joining on <b>'+offer['Joining Date']+'</b>. This will create an Employee record automatically.</div>'
    + '<div class="form-row">'
    + '<div class="fg"><label>Department</label><input id="j_dept" value="'+(job?job['Department']||'':'')+'" placeholder="Department"></div>'
    + '<div class="fg"><label>Designation</label><input id="j_desg" placeholder="e.g. Engineer"></div>'
    + '</div>'
    + '<div class="fg"><label>Reporting Manager</label><input id="j_mgr" placeholder="Manager name"></div>',
    '<button class="btn btnG btn-full" onclick="_submitJoining(\''+offerId+'\',\''+candidateId+'\')">✅ Confirm Joining</button>'
  );
}

function _submitJoining(offerId, candidateId) {
  if (_submitting) return; _submitting = true;
  var c     = (_D.candidates||[]).find(function(x){return x['Candidate ID']===candidateId;});
  var offer = (_D.offers||[]).find(function(o){return o['Offer ID']===offerId;});
  _api('confirmJoining', {
    offerId: offerId,
    candidateId: candidateId,
    candidateName: c['Full Name'],
    candidateEmail: c['Email'],
    candidatePhone: c['Phone'],
    department: document.getElementById('j_dept').value.trim(),
    designation: document.getElementById('j_desg').value.trim(),
    joiningDate: offer['Joining Date'],
    offeredCtc: offer['Offered CTC']
  }, function(r) {
    _submitting = false;
    if (r.success) {
      _closeModal();
      _toast('🎉 Joined! '+r.message);
      _loadData();
    } else _toast('⚠️ '+r.error);
  }, function(e) { _submitting=false; _toast('⚠️ '+e.message); });
}

// ─── MODAL ────────────────────────────────────────────────────
function _showModal(title, body, footer) {
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').innerHTML   = body;
  document.getElementById('mFoot').innerHTML   = footer || '';
  document.getElementById('mOv').classList.add('on');
  var m = document.getElementById('modal');
  m.style.display = 'flex';
  setTimeout(function() { m.classList.add('on'); }, 10);
}

function _closeModal() {
  _submitting = false;
  var m = document.getElementById('modal');
  m.classList.remove('on');
  document.getElementById('mOv').classList.remove('on');
  setTimeout(function() { m.style.display='none'; }, 300);
}

// ─── TOAST ────────────────────────────────────────────────────
function _toast(msg, dur) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, dur || 3000);
}
