/**
 * SRU ICTD — Data Center Visitor Log
 * Google Apps Script backend (Web App)
 * Version: 1.5
 *
 * Deployment:
 *   1. Create a Google Sheet, then Extensions > Apps Script, paste this file.
 *   2. Run setupSheet() once (authorize when prompted) — it creates/repairs the headers.
 *   3. Deploy > New deployment > Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy the /exec URL into the console's Setup tab (or into SHEET_URL in the HTML).
 *
 * Columns are matched BY HEADER NAME, so the sheet may be reordered or extended safely.
 */

var SHEET_NAME = 'VisitorLog';

var HEADERS = [
  'RecordID','VisitDate','TimeIn','TimeOut','DurationMin',
  'VisitorName','IDType','IDNumber','VisitorEmail','VisitorMobile',
  'VisitorType','Organization','Department',
  'Purpose','PurposeDetails',
  'EscortName','EscortBadge','ApprovedBy',
  'Status','Notes','LoggedBy','CreatedAt','UpdatedAt'
];

/* ---------------- infrastructure ---------------- */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sh;
}

/** Run once from the editor. */
function setupSheet() {
  var sh = getSheet_();
  var existing = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
                   .map(function (h) { return String(h).trim(); });
  var missing = HEADERS.filter(function (h) { return existing.indexOf(h) === -1; });
  if (missing.length) {
    sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
  sh.getRange(1, 1, 1, sh.getLastColumn())
    .setFontWeight('bold').setBackground('#f0ebf8').setFontColor('#3a1464');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, sh.getLastColumn());
  return 'Sheet ready: ' + SHEET_NAME;
}

function headerMap_(sh) {
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < head.length; i++) {
    var k = String(head[i]).trim();
    if (k) map[k] = i; // zero-based
  }
  return map;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- routing ---------------- */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  var out = handle_(action, e && e.parameter ? e.parameter : {});
  var cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(out);
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
  return json_(handle_(body.action || 'list', body));
}

function handle_(action, p) {
  try {
    if (action === 'ping')     return { ok: true, sheet: SHEET_NAME, version: '1.5' };
    if (action === 'list')     return { ok: true, rows: listRows_() };
    if (action === 'checkin')  return { ok: true, record: appendRow_(p.record || {}) };
    if (action === 'checkout') return { ok: true, updated: checkout_(p) };
    return { ok: false, error: 'Unknown action: ' + action };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

/* ---------------- operations ---------------- */

function listRows_() {
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var map = headerMap_(sh);
  var values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var tz = Session.getScriptTimeZone();

  return values.filter(function (row) {
    return String(row[map.RecordID] || '').trim() !== '';
  }).map(function (row) {
    var obj = {};
    Object.keys(map).forEach(function (k) {
      var v = row[map[k]];
      if (v instanceof Date) {
        v = (k === 'VisitDate') ? Utilities.formatDate(v, tz, 'yyyy-MM-dd')
          : (k === 'TimeIn' || k === 'TimeOut') ? Utilities.formatDate(v, tz, 'HH:mm')
          : v.toISOString();
      }
      obj[k] = (v === null || v === undefined) ? '' : String(v);
    });
    return obj;
  });
}

function appendRow_(rec) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_();
    var map = headerMap_(sh);
    var width = sh.getLastColumn();
    var row = new Array(width).fill('');
    Object.keys(map).forEach(function (k) {
      if (rec[k] !== undefined && rec[k] !== null) row[map[k]] = rec[k];
    });
    if (!row[map.RecordID]) row[map.RecordID] = 'DCV-' + new Date().getTime();
    if (map.Status !== undefined && !row[map.Status]) row[map.Status] = 'Inside';
    if (map.CreatedAt !== undefined && !row[map.CreatedAt]) row[map.CreatedAt] = new Date().toISOString();
    sh.appendRow(row);
    return rec;
  } finally {
    lock.releaseLock();
  }
}

function checkout_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_();
    var map = headerMap_(sh);
    var last = sh.getLastRow();
    if (last < 2) return false;
    var ids = sh.getRange(2, map.RecordID + 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(p.recordId).trim()) {
        var r = i + 2;
        if (map.TimeOut     !== undefined) sh.getRange(r, map.TimeOut + 1).setValue(p.timeOut || '');
        if (map.DurationMin !== undefined) sh.getRange(r, map.DurationMin + 1).setValue(p.durationMin || '');
        if (map.Status      !== undefined) sh.getRange(r, map.Status + 1).setValue('Completed');
        if (map.UpdatedAt   !== undefined) sh.getRange(r, map.UpdatedAt + 1).setValue(p.updatedAt || new Date().toISOString());
        return true;
      }
    }
    throw new Error('RecordID not found: ' + p.recordId);
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- optional: daily open-visit alert ----------------
 * Create a time-driven trigger for this function (e.g. daily 23:00)
 * to email the ICTD any visit left without a check-out.
 */
function notifyOpenVisits() {
  var TO = 'm.elmahdy@sr.edu.sa';
  var rows = listRows_().filter(function (r) { return !r.TimeOut; });
  if (!rows.length) return;
  var html = '<p>The following data center visits have no recorded check-out:</p><ul>' +
    rows.map(function (r) {
      return '<li>' + r.RecordID + ' — ' + r.VisitorName + ' (' + r.VisitDate + ' ' + r.TimeIn +
             ') — escort: ' + r.EscortName + '</li>';
    }).join('') + '</ul>';
  MailApp.sendEmail({ to: TO, subject: 'Data Center Visitor Log — open visits (' + rows.length + ')', htmlBody: html });
}
