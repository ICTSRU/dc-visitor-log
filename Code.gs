/**
 * SRU ICTD — Data Center Visitor Log
 * Google Apps Script backend (Web App)
 * Version: 2.5
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

/* Columns that must stay PLAIN TEXT. Without this, Google Sheets converts
   "11:13" into a time value and "2026-09-17" into a date value, and the value
   then reads back shifted by the offset between the spreadsheet timezone and
   the script timezone. Storing them as text removes that whole class of bug. */
var TEXT_COLUMNS = ['VisitDate', 'TimeIn', 'TimeOut'];

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
  forceTextColumns_(sh);
  sh.autoResizeColumns(1, sh.getLastColumn());
  return 'Sheet ready: ' + SHEET_NAME;
}

/** Sets the date/time columns to plain text so Sheets stops coercing them. */
function forceTextColumns_(sh) {
  var map = headerMap_(sh);
  var rows = Math.max(1, sh.getMaxRows() - 1);
  TEXT_COLUMNS.forEach(function (k) {
    if (map[k] === undefined) return;
    sh.getRange(2, map[k] + 1, rows, 1).setNumberFormat('@');
  });
}

/** The timezone the SPREADSHEET displays values in — not the script's. */
function tz_() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); }
  catch (e) { return Session.getScriptTimeZone(); }
}

function pad2_(n) { return (n < 10 ? '0' : '') + n; }

/** Reads a cell that should hold HH:mm, whatever Sheets turned it into. */
function readTime_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {                 /* serial time: fraction of a day */
    var mins = Math.round((v % 1) * 1440);
    return pad2_(Math.floor(mins / 60) % 24) + ':' + pad2_(mins % 60);
  }
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'HH:mm');
  var m = String(v).match(/(\d{1,2}):(\d{2})/);
  return m ? pad2_(Number(m[1])) + ':' + m[2] : String(v);
}

/** Reads a cell that should hold yyyy-MM-dd, whatever Sheets turned it into. */
function readDate_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  if (typeof v === 'number') {
    var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
    return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
  }
  var m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : String(v);
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
    if (action === 'ping')     return { ok: true, sheet: SHEET_NAME, version: '2.5',
                                       spreadsheetTimeZone: tz_(), scriptTimeZone: Session.getScriptTimeZone() };
    if (action === 'list')     return { ok: true, rows: listRows_() };
    if (action === 'repair')   return { ok: true, result: repairTimeColumns() };
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

  return values.filter(function (row) {
    return String(row[map.RecordID] || '').trim() !== '';
  }).map(function (row) {
    var obj = {};
    Object.keys(map).forEach(function (k) {
      var v = row[map[k]];
      if (k === 'VisitDate')                      v = readDate_(v);
      else if (k === 'TimeIn' || k === 'TimeOut') v = readTime_(v);
      else if (v instanceof Date)                 v = v.toISOString();
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

    /* Write into a row whose date/time cells are plain text, so "11:13" is
       stored exactly as sent instead of being converted to a time value. */
    var r = sh.getLastRow() + 1;
    TEXT_COLUMNS.forEach(function (k) {
      if (map[k] !== undefined) sh.getRange(r, map[k] + 1).setNumberFormat('@');
    });
    sh.getRange(r, 1, 1, width).setValues([row]);
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
        if (map.TimeOut     !== undefined) sh.getRange(r, map.TimeOut + 1).setNumberFormat('@').setValue(p.timeOut || '');
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
