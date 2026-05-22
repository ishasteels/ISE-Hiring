# ISE HIRING PROCESS — Deploy & Setup Guide

## Step 1: Google Sheet Setup

Create ek nayi Google Sheet aur ye tabs banao (exact spelling):

### Tab 1: Users
| User ID | Name | Email | Password | Role |
|---------|------|-------|----------|------|
| USR-001 | Kunal Rao | kunal@ise.in | ise123 | admin |
| USR-002 | HR Manager | hr@ise.in | hr123 | hr |
| USR-003 | Viewer | viewer@ise.in | view123 | viewer |

**Role values:** `admin` / `hr` / `viewer`

---

### Tab 2: JobOpenings
Headers (Row 1):
```
Job ID | Title | Department | Location | Min Experience | Salary Range | Openings | Description | Deadline | Status | Posted By | Posted On | Last Modified
```

---

### Tab 3: Candidates
Headers (Row 1):
```
Candidate ID | Job ID | Full Name | Email | Phone | Current Company | Current CTC | Expected CTC | Experience (Yrs) | Source | Resume Link | Stage | Added By | Applied On | Last Modified
```

---

### Tab 4: Interviews
Headers (Row 1):
```
Interview ID | Candidate ID | Job ID | Round | Type | Scheduled On | Interviewer | Mode | Meeting Link | Status | Result | Feedback | Created By | Created On
```

---

### Tab 5: OfferLetters
Headers (Row 1):
```
Offer ID | Candidate ID | Job ID | Offered CTC | Joining Date | Offer Status | Created By | Sent On | Last Modified
```

---

### Tab 6: Employees (Optional — auto-populated on joining)
Headers (Row 1):
```
Employee ID | Full Name | Email | Phone | Department | Designation | Joining Date | CTC | Status | Added By | Source | Candidate ID | Created On
```

---

## Step 2: Apps Script Setup

1. Sheet mein: Extensions → Apps Script
2. Code.gs mein sara code paste karo
3. **Line 2 pe SHEET_ID update karo:**
   - Sheet URL mein se ID copy karo: `https://docs.google.com/spreadsheets/d/[THIS_IS_SHEET_ID]/edit`
4. Save karo (Ctrl+S)

---

## Step 3: Deploy GAS as Web App

1. Apps Script → Deploy → New Deployment
2. Type: Web App
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy → Copy the URL

---

## Step 4: GitHub Pages Setup

1. GitHub.com pe new account (or existing): `isehiring` ya similar
2. New repo banao (same name as username for `username.github.io`, or any name)
3. Ye files upload karo:
   - `index.html`
   - `app.js` ← **Line 7 pe GAS URL paste karo first!**
   - `manifest.json`
   - `sw.js`
   - `icon-192.png` (make_icons.py se generate karo)
   - `icon-512.png`
   - `icon-180.png`
4. Settings → Pages → Branch: main → Save
5. 2 min baad: `https://username.github.io/reponame`

---

## Step 5: app.js URL Update

`app.js` line 7:
```javascript
var API = 'https://script.google.com/macros/s/YOUR_ID/exec';
```
Is line mein apna GAS URL paste karo, phir GitHub pe commit karo.

---

## Step 6: Test

Browser mein: `[GAS URL]?callback=test&payload=%7B%22action%22%3A%22login%22%2C%22data%22%3A%7B%22email%22%3A%22kunal%40ise.in%22%2C%22password%22%3A%22ise123%22%7D%2C%22token%22%3A%22%22%7D`

Response aani chahiye: `test({"success":true,"user":{...},"token":"..."})`

---

## Step 7: Mobile Install

Android Chrome:
1. App URL open karo
2. 3-dot menu → Add to Home Screen
3. Install → App standalone mode mein opens (no browser bar)

---

## Updating the App

**Only HTML/JS changes** (no GAS changes):
- GitHub pe file edit karo → commit → 2 min wait → live

**GAS code changes:**
- Apps Script → Deploy → Manage Deployments → Edit → New Version → Deploy
- URL stays same, no need to update app.js

---

## Roles Summary

| Action | admin | hr | viewer |
|--------|-------|----|--------|
| View all data | ✅ | ✅ | ✅ |
| Add Job Opening | ✅ | ✅ | ❌ |
| Add Candidate | ✅ | ✅ | ❌ |
| Schedule Interview | ✅ | ✅ | ❌ |
| Mark Result | ✅ | ✅ | ❌ |
| Create Offer | ✅ | ✅ | ❌ |
| Close Job | ✅ | ❌ | ❌ |
| Confirm Joining | ✅ | ✅ | ❌ |

---

## Common Issues

| Problem | Fix |
|---------|-----|
| Login button spins forever | GAS URL galat hai app.js mein |
| "Email not found" | SHEET_ID galat hai Code.gs mein |
| App not installable | manifest.json check karo, HTTPS chahiye |
| Data not loading | Sheet tab names exactly match karo |
| "NOT_AUTHENTICATED" | Logout → Login again |
