# ISE HIRING PORTAL v3.1 — Setup & Migration Guide

## What's New in v3.1

### 1. ✅ Quick Action Buttons for Candidate Status
- Direct stage advancement buttons in Candidates table (no modal needed)
- Forward/Backward/Reject actions with color-coded buttons
- One-click stage changes: Applied → Interview → Selected → Offered → Joined

### 2. ✅ Agency-Wise Management
- New "Agencies" section in sidebar and mobile nav
- Add, edit, activate/deactivate agencies
- Track candidates per agency and placement conversions
- Agency performance KPIs and charts
- Filter candidates by agency

### 3. ✅ Maximum Columns in Candidates Table
- 14 columns: ID, Name, Contact, Job, Department, Company, Experience, CTC, Source, Agency, Stage, Applied Date, Modified Date, Actions
- Horizontal scroll for large tables
- Agency column with purple badge styling
- Last Modified timestamp for tracking

---

## Step 1: Update Google Sheets

### Add New Tab: Agencies
Create a new tab named **"Agencies"** with these exact headers (Row 1):

```
Agency ID | Agency Name | Contact Person | Email | Phone | Address | Commission (%) | Status | Total Candidates | Total Placements | Created By | Created On | Last Modified
```

Sample data (Row 2 onwards):
```
AGY-001 | ABC Recruitment | Rajesh Kumar | abc@email.com | 9876543210 | Mumbai | 8.5 | Active | 0 | 0 | Admin | 2025-05-01 | 2025-05-01
AGY-002 | Talent Hunt | Priya Sharma | talent@email.com | 9876543211 | Pune | 10 | Active | 0 | 0 | Admin | 2025-05-02 | 2025-05-02
```

### Update Existing Tab: Candidates
Add new column **"Agency Name"** after "Source" column.

Updated headers for Candidates tab:
```
Candidate ID | Job ID | Full Name | Email | Phone | Current Company | Current CTC | Expected CTC | Experience (Yrs) | Source | Agency Name | Resume Link | Stage | Added By | Applied On | Last Modified
```

### Update Existing Tab: AppConfig
Add new config row:
```
11 | AGENCY_COMMISSION_DEFAULT | 8.5 | Default commission percentage for new agencies
```

---

## Step 2: Update Google Apps Script (Code.gs)

1. Open your Apps Script project (Extensions → Apps Script in Google Sheet)
2. Delete ALL existing code
3. Paste the entire content from `Code_v3.1.gs`
4. **Update Line 4**: Replace `SHEET_ID` with your actual Google Sheet ID
5. **Update Line 5**: Change `MASTER_PASSWORD` if needed
6. Save (Ctrl+S)

### New GAS Functions Added:
- `saveAgency()` — Add new recruitment agency
- `updateAgency()` — Edit agency details
- `toggleAgencyStatus()` — Activate/Deactivate agency
- `updateCandidateStage()` — Quick stage update without full edit

---

## Step 3: Deploy Updated Web App

1. Apps Script → Deploy → New Deployment
2. Type: Web App
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy → Copy the URL

**Note**: If you edit Code.gs later, use "Manage Deployments → Edit → New Version" — the URL stays the same.

---

## Step 4: Update Frontend Files on GitHub

Upload these files to your GitHub Pages repository:

| File | Action |
|------|--------|
| `index.html` | Replace with `index_v3.1.html` |
| `app.js` | Replace with `app_v3.1.js` |
| `manifest.json` | Replace with new version |
| `sw.js` | Replace with new version (cache busted) |
| `icon-*.png` | Keep existing icons |

### Important: Update API URL
In `app.js` (line 7), replace with your new GAS deployment URL:
```javascript
var API = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
```

---

## Step 5: Clear Cache & Test

1. Open app in browser
2. Press `Ctrl+Shift+R` (hard refresh)
3. Clear browser cache if needed
4. Login and verify all features

---

## Role Permissions (Updated)

| Action | admin | hr | viewer | candidate |
|--------|-------|----|--------|-----------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Jobs | ✅ | ✅ | ✅ | ✅ |
| Add/Edit Jobs | ✅ | ✅ | ❌ | ❌ |
| View Candidates | ✅ | ✅ | ✅ | ❌ |
| Add/Edit Candidates | ✅ | ✅ | ❌ | ❌ |
| Quick Stage Change | ✅ | ✅ | ❌ | ❌ |
| Schedule Interview | ✅ | ✅ | ❌ | ❌ |
| Mark Interview Result | ✅ | ✅ | ❌ | ❌ |
| Create Offer | ✅ | ✅ | ❌ | ❌ |
| Close Job | ✅ | ❌ | ❌ | ❌ |
| Confirm Joining | ✅ | ✅ | ❌ | ❌ |
| **Manage Agencies** | **✅** | **✅** | **❌** | **❌** |
| View Agencies | ✅ | ✅ | ✅ | ❌ |

---

## Data Migration Tips

### Existing Candidates:
- Add "Agency Name" column and leave blank for existing rows (will show as "Direct")
- Or populate retroactively if you know the agency

### Existing Agencies:
- If you previously tracked agencies in "Source" column, migrate to new Agencies tab
- Use "Source" = "Agency" and "Agency Name" = actual agency name

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agencies tab not showing data | Check tab name is exactly "Agencies" (case-sensitive) |
| Agency filter not working | Verify "Agency Name" column exists in Candidates tab |
| Quick action buttons not appearing | Check user role is admin or hr |
| "Sheet not found" error | Ensure all tab names match exactly |
| Old data not loading | Clear browser cache and reload |
| Dark mode broken | Check CSS variables in index.html |

---

## Support

For issues or questions, check:
1. Browser console (F12) for JavaScript errors
2. Apps Script execution logs (View → Logs)
3. Google Sheet sharing permissions (must be accessible to script owner)

---

**Version**: 3.1 | **Date**: June 2026 | **Built for**: ISHA Steel Enterprises
