# Data Center Visitor Log — SRU ICTD

**Version 1.5** · Sulaiman Al Rajhi University — Executive Directorate of Communication & Information Technology

Reception/NOC console for recording physical access to the university data center. Single HTML page, no build step, no server — data is stored in Google Sheets through a Google Apps Script Web App.

## Contents

| Path | Purpose |
|---|---|
| `index.html` | The console (GitHub Pages entry point). Version is shown in the header chip and footer. |
| `Code.gs` | Google Apps Script backend deployed as a Web App |
| `sru-header.html` | Reusable official SRU header band (logos embedded) — paste into any other SRU HTML page |
| `CHANGELOG.md` | Release record |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `.gitignore` | Standard exclusions |

## Publishing to GitHub Pages

```bash
git init
git add .
git commit -m "Data Center Visitor Log v1.5"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / root**. The console is served at `https://<org>.github.io/<repo>/`.

## Configuration

Everything is set in the first lines of the script block in `index.html`:

| Constant | Current value | Meaning |
|---|---|---|
| `APP_VERSION` | `1.5` | Shown in the header chip and footer |
| `SHEET_URL` | `https://script.google.com/macros/s/AKfycbyr…/exec` | Deployed Apps Script Web App |
| `OPEN_VISIT_HOURS` | `4` | Hours after which an open visit is flagged red |

There is no Setup tab — operators cannot change the backend. The only operator-facing setting is the **name field in the status bar**, remembered per browser and written to the `LoggedBy` column.

## Backend

Google Sheet: **SRU ICTD – Data Center Visitor Log**, tab `VisitorLog`.

Actions exposed by the Web App: `ping`, `list`, `checkin`, `checkout`.
Columns are matched **by header name**, so the sheet may be reordered or extended without code changes.

| Column group | Headers |
|---|---|
| Record | `RecordID`, `Status`, `LoggedBy`, `CreatedAt`, `UpdatedAt` |
| Timing | `VisitDate`, `TimeIn`, `TimeOut`, `DurationMin` |
| Visitor | `VisitorName`, `IDType`, `IDNumber`, `VisitorEmail`, `VisitorMobile`, `VisitorType`, `Organization`, `Department` |
| Visit | `Purpose`, `PurposeDetails`, `Notes` |
| Accountability | `EscortName`, `EscortBadge`, `ApprovedBy` |

### Redeploying the backend

After editing `Code.gs`, use **Deploy → Manage deployments → Edit → New version**. This keeps the same `/exec` URL, so `index.html` needs no change. Creating a *new deployment* instead issues a new URL and requires updating `SHEET_URL` and releasing a new version.

## Operational notes

- **Offline resilience** — if the Web App is unreachable, check-ins are held in browser storage and the status bar says so; nothing is lost.
- **Evidence** — the Register tab filters by date range and prints A4 landscape, suitable for ISO 27001 A.7 / NCAAA physical-access evidence.
- **Automation available** — add a daily time-driven trigger on `notifyOpenVisits()` in Apps Script to email any visit left without a check-out.

## Security

The Web App is deployed with *Execute as: Me*, so the underlying sheet stays private. Treat the `/exec` URL as internal — anyone holding it can append records. If the repository is public, consider restricting the deployment to **Anyone within Sulaiman Al Rajhi University** and hosting the page on the intranet instead of GitHub Pages.
