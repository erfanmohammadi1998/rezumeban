<div align="center">

# 📄 Rezumeban

### Applicant Tracking System & careers portal for Persian-speaking hiring teams

**A complete ATS: résumé database, public job portal, drag-and-drop pipeline, interviews with weighted scorecards, offers, candidate sourcing and hiring analytics, in a fully RTL Persian interface.**

![Django](https://img.shields.io/badge/Django-6-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-JWT-A30000)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![RTL](https://img.shields.io/badge/UI-RTL_Persian-8b5cf6)

<br>

<img src="docs/screenshots/02-dashboard.png" alt="Rezumeban dashboard" width="100%">

</div>

---

## 📌 Overview

Rezumeban covers the whole hiring cycle in four stages:

```text
COLLECT            ORGANISE            ASSESS               DECIDE
──────────         ──────────          ──────────           ──────────
Public portal      Résumé database     Kanban pipeline      Job offers
Candidate sourcing Tags & talent pools Interviews (.ics)    Hire / reject
CSV import         Duplicate merge     Weighted scorecards  Funnel reports
Job requisitions   Side-by-side compare
```

Everything is Persian and right-to-left, with an in-app guide and a `Ctrl/⌘ + K` command palette so users never get lost.

## ✨ Features

| | |
|---|---|
| 🗂️ **Résumé database** | Advanced filters saved in the URL, bulk actions (tag, add to job/pool, compare, CSV export, delete) |
| 👤 **Candidate profile** | Inline PDF résumé preview, experience/education/skills, star rating, team notes with `@mentions` |
| 🔁 **Duplicates & import** | Detect and merge duplicates by email/phone; CSV import with Persian or English columns |
| 📝 **Job requisitions** | Managers request headcount → approve/reject → a draft job is created automatically |
| 📢 **Jobs & careers portal** | Job templates, hiring team, public `/careers` page with online application and anti-spam limits |
| 🧲 **Kanban pipeline** | Drag-and-drop stages, rejection with reason, create an offer straight from the card |
| 📅 **Interviews** | Email invitations with `.ics` calendar files, list/agenda views, weighted 1–5 scorecards |
| 🤝 **Offers** | Draft → sent (emailed) → accepted/declined; acceptance marks the application as hired |
| ✅ **Tasks & reminders** | Assign follow-ups to teammates with due dates and a "My tasks" dashboard widget |
| 🔎 **Candidate sourcing** | Search real profiles via GitHub, Stack Overflow and dev.to APIs; saved searches; bulk import |
| 📊 **Reports** | Hiring funnel, average days per stage, source effectiveness, time-to-hire, CSV export |
| 🔐 **Security** | JWT with auto-refresh, rate limiting, upload validation, HSTS/secure cookies in production |

## 📸 Product tour

### 1. Dashboard & navigation

<table>
  <tr>
    <td width="50%"><b>Dashboard</b>: stats, 30-day application trend, pipeline status, upcoming interviews<br><img src="docs/screenshots/02-dashboard.png" alt="Dashboard"></td>
    <td width="50%"><b>Command palette (Ctrl/⌘ + K)</b>: jump anywhere, live candidate/job search<br><img src="docs/screenshots/17-command-palette.png" alt="Command palette"></td>
  </tr>
</table>

### 2. Candidates

<table>
  <tr>
    <td width="50%"><b>Résumé database</b>: advanced filters and bulk actions<br><img src="docs/screenshots/03-candidates.png" alt="Candidates"></td>
    <td width="50%"><b>Candidate profile</b>: résumé preview, rating, team notes, application history<br><img src="docs/screenshots/04-candidate-detail.png" alt="Candidate detail"></td>
  </tr>
  <tr>
    <td><b>Talent pools</b>: group candidates for future roles<br><img src="docs/screenshots/13-pools.png" alt="Talent pools"></td>
    <td><b>Candidate sourcing</b>: GitHub, Stack Overflow, dev.to<br><img src="docs/screenshots/11-sourcing.png" alt="Sourcing"></td>
  </tr>
</table>

### 3. Jobs & careers portal

<table>
  <tr>
    <td width="50%"><b>Job requisitions</b>: request → approve → auto-created draft job<br><img src="docs/screenshots/09-requisitions.png" alt="Requisitions"></td>
    <td width="50%"><b>Job postings</b>: templates, hiring team, publish to the portal<br><img src="docs/screenshots/05-jobs.png" alt="Jobs"></td>
  </tr>
  <tr>
    <td colspan="2"><b>Public careers portal</b> (<code>/careers</code>): no login, online application with résumé upload<br><img src="docs/screenshots/16-careers.png" alt="Careers portal"></td>
  </tr>
</table>

### 4. Hiring pipeline

<table>
  <tr>
    <td width="50%"><b>Kanban pipeline</b>: drag between stages, reject with reason, create offers<br><img src="docs/screenshots/06-pipeline.png" alt="Pipeline"></td>
    <td width="50%"><b>Interviews</b>: invitations with .ics files, weighted scorecards<br><img src="docs/screenshots/07-interviews.png" alt="Interviews"></td>
  </tr>
  <tr>
    <td><b>Offers</b>: draft → sent → accepted / declined<br><img src="docs/screenshots/08-offers.png" alt="Offers"></td>
    <td><b>Tasks & reminders</b>: assign follow-ups with due dates<br><img src="docs/screenshots/12-tasks.png" alt="Tasks"></td>
  </tr>
</table>

### 5. Insights, settings & guide

<table>
  <tr>
    <td width="33%"><b>Reports</b>: funnel, days per stage, source effectiveness<br><img src="docs/screenshots/10-reports.png" alt="Reports"></td>
    <td width="33%"><b>Settings › Scorecards</b>: weighted interview criteria<br><img src="docs/screenshots/14-settings-scorecards.png" alt="Scorecard settings"></td>
    <td width="33%"><b>In-app guide</b>: step-by-step workflow and shortcuts<br><img src="docs/screenshots/15-guide.png" alt="Guide"></td>
  </tr>
</table>

### 6. Sign in

<p align="center"><img src="docs/screenshots/01-login.png" alt="Login" width="70%"></p>

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| **Backend** | Django 6, Django REST Framework, SimpleJWT, django-filter, drf-spectacular |
| **Database** | SQLite (development) · PostgreSQL (production, via `DATABASE_URL`) |
| **Frontend** | React 19, React Router 7, Vite, Tailwind CSS v4, Recharts, Framer Motion |
| **Static files** | WhiteNoise (static files + the React app) |
| **Runtime** | Gunicorn, Docker + docker-compose |
| **Email** | Django email framework (console in dev, SMTP in production) |

- **Auth:** JWT with refresh tokens, refreshed automatically in an axios interceptor.
- **Security:** rate limits (login 10/min, public form 10/hour), file type/size validation, HSTS/SSL/secure cookies in production, `X-Frame-Options: DENY`.
- **Registration:** closed in production; the first account becomes the super-admin, others join by invitation.
- **Modules:** `TALENTBASE_MODULES` can build a lightweight "résumé database only" edition.

## 🚀 Getting started

### Backend

```bash
python -m venv venv
venv\Scripts\activate                 # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8010
```

API docs: `http://127.0.0.1:8010/api/docs/` · Health: `http://127.0.0.1:8010/healthz/`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env                # VITE_API_BASE and VITE_APP_MODE
npm run dev
```

### Demo data

```bash
python manage.py seed_demo            # 45 candidates, jobs, applications, interviews — recruiter / demo12345
```

## 🐳 Production

All settings come from environment variables; see `.env.example`.

```bash
cp .env.example .env                  # set DJANGO_SECRET_KEY and your domains
docker compose up -d --build
```

This starts PostgreSQL, runs migrations, builds the frontend, serves it with WhiteNoise and runs the backend with Gunicorn on port `8000`. Put a reverse proxy (nginx/Caddy) in front for TLS. With `DJANGO_DEBUG=0`, weak secret keys are rejected and security headers are enabled.

<details>
<summary><b>Environment variables</b></summary>

| Variable | Default | Description |
|---|---|---|
| `DJANGO_DEBUG` | `1` | Must be `0` in production |
| `DJANGO_SECRET_KEY` | — | Required in production (strong key) |
| `DJANGO_ALLOWED_HOSTS` | localhost… | Comma-separated hosts |
| `CSRF_TRUSTED_ORIGINS` | — | e.g. `https://your-domain` |
| `DATABASE_URL` | SQLite | `postgres://user:pass@host:5432/db` |
| `CORS_ALLOWED_ORIGINS` | 5173 | Frontend origin |
| `TALENTBASE_MODULES` | `core,recruitment,sourcing` | `core` = résumé database only |
| `EMAIL_BACKEND` / `EMAIL_HOST` / … | console | SMTP for real email |
| `ALLOW_OPEN_REGISTRATION` | `= DEBUG` | Open sign-up |
| `MAX_UPLOAD_MB` | `8` | Max résumé file size |
| `THROTTLE_AUTH` / `THROTTLE_APPLY` | `10/min` / `10/hour` | Rate limits |
| `SENTRY_DSN` | — | Error monitoring (optional) |

</details>

## 🔌 API

- `POST /api/auth/register/` · `POST /api/auth/token/` · `POST /api/auth/token/refresh/` · `GET /api/auth/me/`
- `candidates/` (+ `duplicates/`, `merge/`, `import_csv/`, `export/`, `bulk_tag/`, `bulk_delete/`)
- `jobs/` · `applications/` (+ `move/`, `reject/`) · `interviews/` (+ `invite/`, `ics/`) · `offers/` · `talent-pools/`
- `tasks/` · `requisitions/` (+ `submit/`, `approve/`, `reject/`) · `scorecards/` · `job-templates/`
- `sourcing/providers/` · `sourcing/search/` · `sourcing/saved-searches/`
- `stats/dashboard/` · `stats/reports/` (+ `export/`) · `stats/candidates/`
- `public/jobs/` · `public/apply/` (no authentication)
- Full interactive docs at `/api/docs/`

## 🧪 Tests

```bash
python manage.py test candidates          # 31 tests
cd frontend && npm run build && npx eslint src
```

## 📁 Project structure

```text
backend/        settings (env-driven) · urls · health · SPA fallback · throttling
candidates/
  models.py     Candidate, Job, Application, Interview, Offer, TalentPool,
                Task, JobRequisition, ScorecardTemplate, JobTemplate, ...
  serializers.py · views.py · sourcing/ · notifications.py · tests.py
frontend/src/
  features/     auth · candidates · jobs · requisitions · pipeline · offers ·
                interviews · tasks · pools · sourcing · reports · portal · guide · settings
  components/   ui/ (design kit) · layout/ · CommandPalette · ErrorBoundary · FilterBar
Dockerfile · docker-compose.yml · .env.example · docs/screenshots/
```

## 📄 License

Proprietary software; see [`LICENSE`](LICENSE). © 2026 Erfan Mohammadi.

## 👨‍💻 Author

**Erfan Mohammadi**

[![Website](https://img.shields.io/badge/Website-erfanmohammadi.ir-2563eb)](https://erfanmohammadi.ir/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-erfan--mohammadi77-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/erfan-mohammadi77/)
[![GitHub](https://img.shields.io/badge/GitHub-erfanmohammadi1998-181717?logo=github)](https://github.com/erfanmohammadi1998)

---

<div dir="rtl">

## 🇮🇷 خلاصه فارسی

**رزومه‌بان: سامانهٔ دریافت و مدیریت رزومه برای شرکت‌ها.** یک ATS کامل با پورتال عمومی مشاغل، بانک رزومه با فیلتر پیشرفته، پایپ‌لاین کانبان، مصاحبه با کارت امتیاز وزنی و دعوت‌نامهٔ تقویمی، پیشنهاد همکاری، منبع‌یابی کاندیدا از GitHub و Stack Overflow، و گزارش قیف استخدام؛ همه فارسی و راست‌به‌چپ.

</div>
