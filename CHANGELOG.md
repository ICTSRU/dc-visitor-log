# Changelog — Data Center Visitor Log

Version numbering uses a single digit after the decimal point (the version after x.9 is (x+1).0).
The version is shown in the page header and footer; the release folder carries the version in its name.

## v2.5 — 2026-09-17

### Fixed — wrong times in the register
Times were displayed hours away from the actual check-in (e.g. **22:00** for an 11:13 entry).

**Cause:** the page sends `TimeIn` as the text `"11:13"`, but the sheet cell had no fixed format, so Google Sheets converted it into a *time value*. On read-back the script formatted that value with `Session.getScriptTimeZone()` — the Apps Script project's timezone — while the value had been stored against the *spreadsheet's* timezone. Every time was therefore shifted by the offset between the two.

**Fix, applied at three layers:**

| Layer | Change |
|---|---|
| Storage | `VisitDate`, `TimeIn`, `TimeOut` are forced to plain text (`@`); new rows are written into pre-formatted cells, so a value is stored exactly as sent |
| Read | New `readTime_()` / `readDate_()` handle text, `Date` values and spreadsheet serial numbers, and format using the **spreadsheet's** timezone via `tz_()`, never the script's |
| Page | `normTime()` / `normDate()` reduce any shape — `HH:mm`, an ISO timestamp, a serial like `0.46736` — to `HH:mm` / `yyyy-MM-dd` before display, so a legacy row can never render wrongly |

### Added
- **`repairTimeColumns()`** — one-off repair for rows written before this version; rewrites the three columns as correct plain text in place. Run it once from the Apps Script editor (or call the Web App with `action=repair`). Safe to run more than once.
- `action=ping` now also returns `spreadsheetTimeZone` and `scriptTimeZone`, so a mismatch can be confirmed in seconds.

### Required steps for this fix
1. Open the Apps Script editor and replace `Code.gs` with this version.
2. Run **`setupSheet`** once — it applies the plain-text format to the three columns.
3. Run **`repairTimeColumns`** once — it corrects the rows already written.
4. **Deploy → Manage deployments → Edit → New version** so the `/exec` URL serves the updated code.

- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.5.

---

## v2.4 — 2026-09-17

### Added
- **Access authorized by** now opens preselected as **CIO**, exposed as the `DEFAULT_APPROVER` constant (`""` to preselect nothing).
- Like the other defaults, it is re-applied after a successful check-in and after **Clear form**, and is ignored if it no longer matches an option in `APPROVERS`.

### Form defaults after this release

| Field | Default |
|---|---|
| Purpose of visit | Guided tour / official visit |
| Host / escort | M Nawaz (badge 24425 autofilled) |
| Access authorized by | CIO |

- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.4.

---

## v2.3 — 2026-09-17

### Added — form defaults
- **Purpose of visit** now opens preselected as **Guided tour / official visit**.
- **Host / escort** now opens preselected as **M Nawaz**, and the badge box fills with **24425** at the same time.
- Defaults are re-applied after a successful check-in and after **Clear form**, so every new entry starts from the same state.
- Both are exposed as `DEFAULT_PURPOSE` and `DEFAULT_ESCORT` constants; set either to `""` to preselect nothing. A default that no longer matches an option in its list is ignored rather than breaking the form.

### Note
- Defaults are a starting point, not a lock — the operator can change either dropdown, and whatever is selected at submission is what gets saved.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.3.

---

## v2.2 — 2026-09-17

### Changed
- **Visitor full name** is now a **dropdown** instead of a free-text box. Selecting a name fills **ID type, ID number, email, mobile and visitor type** in one step.
- The list is assembled from three sources, in order: the `VISITORS` directory, every other visitor already in the Google Sheet, then **➕ Add new visitor…** at the bottom.
- **➕ Add new visitor…** reveals a name box and blanks the identification fields, so a first-time visitor is registered without leaving the form. The name joins the dropdown immediately on that console, and on every other console after their next refresh.
- Autofilled boxes stay **editable** and are tinted blue; a caption states whether the data came from the directory or from the visitor's last recorded visit.

### Added
- `VISITORS` constant seeded with the five known visitors:

  | Name | ID type | ID number | Email | Mobile | Type |
  |---|---|---|---|---|---|
  | M Nawaz | SRU Staff Card | 24425 | n.nawaz@sr.edu.sa | 581123546 | SRU Internal |
  | Nayed Alrashidi | SRU Staff Card | 360106 | n.alrashidi@sr.edu.sa | 554982887 | SRU Internal |
  | M ElMahdy | SRU Staff Card | 420156 | m.elmahdy@sr.edu.sa | 580696086 | SRU Internal |
  | Dr. Nasser AbouNar | SRU Staff Card | 25812 | nabounar@sr.edu.sa | 560274022 | SRU Internal |
  | ELSeef | SRU Staff Card | 11112 | — | — | SRU Internal |

- Directory entries take precedence over sheet history, so a corrected directory record is not overwritten by an older visit.

### Removed
- The free-text name box, its type-ahead list, and the ID-number reverse lookup — both are redundant now that the name is chosen from a list.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.2.

---

## v2.1 — 2026-09-17

### Changed
- The **Host / escort** dropdown now shows the **name only** (`M Nawaz`) instead of *name — badge*.
- The badge is still carried on each option and still autofills the read-only **Escort badge** box beside it, so nothing is lost — the number simply appears once, in its own field, instead of twice.

### Unchanged
- `ESCORTS` list, the "Other (not listed)…" path, `EscortName` / `EscortBadge` sheet columns, register and CSV export.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.1.

---

## v2.0 — 2026-09-17

### Changed
- **Access authorized by** is now a **dropdown** instead of free text:

  | Option | Meaning |
  |---|---|
  | — Not applicable — | Default; the field stays optional, so routine escorted visits need no approver |
  | CIO | |
  | Operation Manager | |

- Free text is no longer accepted for this field, so the `ApprovedBy` column now holds only controlled values — it can be grouped and counted in a report without cleanup.

### Added
- `APPROVERS` constant at the top of the script block — the single place to edit the list of approving authorities.

### Unchanged
- The field remains optional; the `ApprovedBy` sheet column, CSV export and print layout are untouched.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 2.0.

---

## v1.9 — 2026-09-17

### Changed
- **Host / escort** is now a **dropdown** instead of free text, listing each escort as *name — badge*:

  | Escort | Employee no. |
  |---|---|
  | M Nawaz | 24425 |
  | Nayed Alrashidi | 360106 |
  | M ElMahdy | 420156 |

- **Escort badge autofills** from the selected escort and is **read-only**, so name and number can no longer disagree.
- An **"Other (not listed)…"** option reveals a name box and unlocks the badge field, for a stand-in escort. Set `ALLOW_OTHER_ESCORT = false` to remove that option and restrict access strictly to the listed escorts.

### Added
- `ESCORTS` constant at the top of the script block — the single place to add, remove or edit an escort; the dropdown and the autofill both read from it.

### Unchanged
- `EscortName` and `EscortBadge` sheet columns, the register, CSV export and print layout.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.9.

---

## v1.8 — 2026-09-17

### Changed
- **Visitor email is no longer mandatory** — the red asterisk and the `required` attribute are removed, and the placeholder now reads *(optional)*. A check-in can be registered without it.
- Still validated *when supplied*: the box remains `type="email"`, so a malformed address is rejected rather than saved.
- Autofill, the `VisitorEmail` sheet column, the register column and the CSV export are unchanged — an empty email simply saves blank.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.8.

### Required fields after this change
Visitor full name · ID type · ID number · Visitor type · Purpose of visit · Host/escort · Escort badge.

---

## v1.7 — 2026-09-17

### Added — returning-visitor autofill
- Typing a **known visitor name** (type-ahead list on the name box) completes **ID type, ID number, email, mobile and visitor type** from that visitor's most recent visit.
- **Reverse lookup**: entering a known **ID number** fills the visitor's name and the rest of the identification block.
- The index is built from the records loaded out of **Google Sheets**, not from browser storage — a visitor registered on any console by any operator is recognised on every console.
- Autofilled boxes are tinted blue; a blue caption under the name states which visit the data came from. Editing a box clears its tint.
- Operator-entered values are **never overwritten** — autofill only completes untouched fields.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.7.

### Fixed
- A `<select>` always carries a value, so the initial "don't overwrite non-empty fields" rule silently skipped **ID type** and **Visitor type**. Both now use a touched-flag instead of an emptiness test and fill correctly.

---

## v1.6 — 2026-09-17

### Hidden
- The **status strip** (connection dot and text, clock, *Logged by* operator field) no longer shows during normal operation. It now appears **only when the backend is unreachable**, carrying the warning text — so operators see a clean page when all is well and a clear signal when it is not.

### Changed
- **Refresh** moved out of the hidden strip into the *Currently Inside* card header and the *Visitor Register* toolbar, so reloading from Google Sheets is still one click away.
- Operator name is kept as a hidden field: any value previously saved in this browser continues to be written to `LoggedBy`. New operators cannot set it from the UI — see note below.
- Version chip, footer, `APP_VERSION` and the `Code.gs` ping response bumped to 1.6.

### Fixed
- `[hidden]` had no effect on the status strip because `display:flex` outranks the browser default. Added explicit `.statusbar[hidden]{display:none}` and a global `[hidden]{display:none!important}` rule.

---

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
