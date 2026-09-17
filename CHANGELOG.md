# Changelog — Data Center Visitor Log

Version numbering uses a single digit after the decimal point (the version after x.9 is (x+1).0).
The version is shown in the page header and footer; the release folder carries the version in its name.

## v1.5 — 2026-09-17

### Changed — typography
- **Section titles** (Visitor identification, Visit details, Currently Inside, Visitor register): 14 px → **18 px**, bold, slightly more header padding.
- **Field labels** above every input box: 12 px semi-bold grey → **14 px bold** in the primary ink colour, for readability at the reception desk.
- **Table headers**: 13 px → **14 px** bold.
- **Stat card labels**: 12 px → 13 px semi-bold.
- Register toolbar filter labels deliberately kept at 12 px so the filter row stays compact.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.5.

---

## v1.4 — 2026-09-17

### Removed
- **Organization / department** field from the Visitor identification section, together with its `datalist` of suggested units and its required validation.

### Changed
- **Notes** now occupies that slot in Visitor identification (moved up from Visit details, and changed from a textarea to a single-line input to match the surrounding fields).
- The *Org / Dept* column in both the **Currently Inside** and **Visitor Register** tables is replaced by **Notes**.
- Register search now matches on Notes instead of organization/department.
- `Organization` and `Department` are written empty on check-in; both columns are retained in the Google Sheet and in the CSV export so historical rows and any existing report stay intact.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.4.

---

## v1.3 — 2026-09-17

### Added
- **Official SRU header band** at the top of the page: ICTD logo left, Sulaiman Alrajhi University logo right, on white, closed by a grey rule with a purple accent — matching the approved letterhead.
- Both logos are embedded as base64 PNGs (resized to 96 px tall, ~66 KB total), so the page stays a single self-contained file with no external image requests.
- The band is **kept in print output**, so printed registers and evidence packs carry the official identity.
- `sru-header.html` — the same band as a ready-to-paste snippet (style + markup, logos embedded) for reuse in any other SRU HTML deliverable. It reads `--purple` from the host page when defined and falls back to `#501e8c`.

### Changed
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.3.
- Logos scale down to 30 px tall below 640 px viewport width.

---

## v1.2 — 2026-09-17

### Added
- Production Apps Script Web App URL hardcoded in `SHEET_URL` — the console connects to Google Sheets on load, with no configuration step for operators.
- Inline **operator name** field in the status bar (remembered per browser), replacing the setting that lived in the removed Setup tab.
- `OPEN_VISIT_HOURS` constant (default 4) controlling the open-visit alert threshold.
- GitHub-ready repository layout: `index.html` at root for GitHub Pages, plus `.gitignore` and `.nojekyll`.

### Removed
- **Setup tab** — the whole tab, its nav button, the Web App URL field, the operator/threshold settings, and the *Save settings* / *Test connection* buttons.
- The yellow **"Backend not connected"** banner and its show/hide logic.

### Changed
- `index.html` is version-free in its filename per the GitHub deliverable convention; the version appears in the folder name and inside the page.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.2.

### Unchanged
- Google Sheet schema (23 headers), Apps Script actions, check-in/check-out logic, filters, CSV export, print layout, offline fallback.

---

## v1.1 — 2026-09-17

### Removed
- SRU department / unit dropdown, its hint line, the embedded Arabic department dataset and `buildDeptSelect()`.
- The visitor-type toggle that swapped the department dropdown for the organization field.

### Changed
- Single **Organization / department** text field for all visitors, with an English type-ahead `datalist`.
- Value written to both `Organization` and `Department` sheet columns for backward compatibility.
- Table renderers show `Organization || Department`.

---

## v1.0 — 2026-09-17

Initial release: reception/NOC console (check-in, currently-inside with one-click check-out, register with filters/CSV/print, stat cards), Google Apps Script backend with header-name column mapping and `LockService`, offline fallback, and the optional `notifyOpenVisits()` daily alert.
