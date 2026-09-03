<div align="center">

# رزومه‌بان

### سامانهٔ دریافت و مدیریت رزومه برای شرکت‌ها

یک **ATS کامل** (Applicant Tracking System) با پورتال عمومی مشاغل، پایپ‌لاین کانبان، مصاحبه و منبع‌یابی کاندیدا — طراحی‌شده برای تیم‌های استخدام فارسی‌زبان.

Django 6 · DRF · React 19 · Vite · Tailwind v4 · RTL

![داشبورد](docs/screenshots/02-dashboard.png)

</div>

---

## فهرست

- [نمای کلی](#نمای-کلی)
- [امکانات با تصویر](#امکانات-با-تصویر)
- [معماری و پشتهٔ فنی](#معماری-و-پشتهٔ-فنی)
- [اجرای توسعه](#اجرای-توسعه)
- [استقرار (Production)](#استقرار-production)
- [پیکربندی](#پیکربندی-متغیرهای-محیطی)
- [API](#api)
- [تست](#تست)
- [ساختار پروژه](#ساختار-پروژه)
- [مجوز](#مجوز)

---

## نمای کلی

رزومه‌بان چهار کار اصلی را پوشش می‌دهد:

```
جمع‌آوری  →  سازمان‌دهی  →  ارزیابی  →  تصمیم
COLLECT      ORGANISE       ASSESS       DECIDE

پورتال عمومی    بانک رزومه      پایپ‌لاین      پیشنهاد همکاری
منبع‌یابی        برچسب/استخر     مصاحبه         استخدام / رد
ورود CSV        تشخیص تکراری    کارت امتیاز    گزارش و قیف
درخواست جذب     مقایسه          دعوت‌نامه ics
```

**نقطهٔ قوت:** همه‌چیز فارسی و راست‌به‌چپ، با یک راهنمای درون‌برنامه‌ای و جستجوی سریع `Ctrl/⌘+K` که کاربر را در هیچ صفحه‌ای گم نمی‌کند.

---

## امکانات با تصویر

### داشبورد و جستجوی سریع

نمای کلی استخدام: کارت‌های آمار، نمودار روند ۳۰ روزهٔ درخواست‌ها، وضعیت پایپ‌لاین، مصاحبه‌های پیش‌رو، و ویجت «کارهای من». پالت فرمان `Ctrl/⌘+K` برای پرش سریع و جستجوی زندهٔ کاندیدا/آگهی.

![جستجوی سریع](docs/screenshots/17-command-palette.png)

### بانک رزومه

فهرست کاندیداها با **فیلتر پیشرفته** (منبع، حداقل امتیاز، برچسب، نشان‌شده) که در نشانی صفحه ذخیره و قابل اشتراک‌گذاری است. عملیات گروهی: برچسب، افزودن به آگهی، افزودن به استخر استعداد، مقایسه، خروجی CSV، حذف.

![کاندیداها](docs/screenshots/03-candidates.png)

صفحهٔ کاندیدا: اطلاعات کامل، **پیش‌نمایش فایل رزومهٔ PDF**، سوابق کاری/تحصیلات/مهارت، امتیازدهی ستاره‌ای، نشان‌کردن، یادداشت تیمی با **منشن `@`**، و تاریخچهٔ درخواست‌ها و مصاحبه‌های هر آگهی.

![صفحهٔ کاندیدا](docs/screenshots/04-candidate-detail.png)

- **ورود گروهی از CSV** — ستون فارسی یا انگلیسی، با گزارش ساخته/تکراری/خطا.
- **تشخیص و ادغام رکوردهای تکراری** — بر اساس ایمیل یا تلفن؛ ادغام همهٔ داده‌های وابسته.
- **مقایسهٔ ۲ تا ۴ کاندیدا** کنار هم.

### درخواست جذب نیرو

مدیران واحدها درخواست جذب ثبت می‌کنند → مدیر سامانه تأیید / رد / در انتظار می‌گذارد → با تأیید، یک **آگهی پیش‌نویس خودکار** ساخته می‌شود. ایمیل به هر دو طرف.

![درخواست جذب نیرو](docs/screenshots/09-requisitions.png)

### آگهی‌های شغلی و پورتال عمومی

ساخت/ویرایش آگهی با **قالب آماده**، تیم استخدام (مدیر + همکاران)، و انتشار در پورتال عمومی.

![آگهی‌ها](docs/screenshots/05-jobs.png)

پورتال عمومی `/careers` — بدون نیاز به لاگین، با فرم درخواست آنلاین، آپلود رزومه (اعتبارسنجی نوع و حجم)، و محدودیت نرخ ضداسپم.

![پورتال عمومی](docs/screenshots/16-careers.png)

### پایپ‌لاین استخدام

برد **کانبان کشیدنی** برای هر آگهی. جابه‌جایی مرحله بلافاصله ثبت می‌شود، رد کردن با دلیل، و ساخت **پیشنهاد همکاری** مستقیم از روی کارت. مراحل از تنظیمات قابل تعریف‌اند.

![پایپ‌لاین](docs/screenshots/06-pipeline.png)

### مصاحبه‌ها

زمان‌بندی مصاحبه با **دعوت‌نامهٔ ایمیلی + فایل تقویم (.ics)** برای کاندیدا و مصاحبه‌گران. نمای فهرست یا روزشمار. در مودال بازخورد، **کارت امتیازدهی وزنی**: هر معیار ۱ تا ۵ امتیاز می‌گیرد و امتیاز کل به‌صورت وزنی محاسبه می‌شود.

![مصاحبه‌ها](docs/screenshots/07-interviews.png)

### پیشنهاد همکاری

مدیریت چرخهٔ پیشنهاد: پیش‌نویس → ارسال (ایمیل به کاندیدا) → پذیرش / رد. پذیرش، درخواست را به مرحلهٔ «استخدام» و وضعیت hired منتقل می‌کند.

![پیشنهادها](docs/screenshots/08-offers.png)

### وظایف و یادآوری

«۳ روز دیگر پیگیری کن» — اختصاص وظیفه به همکار (با ایمیل)، مهلت، و ویجت «کارهای من» در داشبورد.

![وظایف](docs/screenshots/12-tasks.png)

### استخر استعداد

دسته‌بندی کاندیداها برای موقعیت‌های آینده — از فهرست، چند کاندیدا را انتخاب و به یک استخر موجود یا جدید اضافه کنید.

![استخر استعداد](docs/screenshots/13-pools.png)

### منبع‌یابی کاندیدا

جست‌وجوی پروفایل واقعی از **API عمومی** GitHub، Stack Overflow و dev.to (به‌علاوهٔ ارائه‌دهندهٔ نمونهٔ آفلاین). جستجوهای ذخیره‌شده، نتایج ذخیره‌شده در سیستم، و ورود گروهی به بانک رزومه.

![منبع‌یابی](docs/screenshots/11-sourcing.png)

### گزارش‌ها

**قیف استخدام** (تعداد ورودی و فعلی هر مرحله)، **میانگین روز در هر مرحله**، **جدول اثربخشی منابع جذب** (نرخ استخدام هر منبع)، نرخ استخدام، میانگین زمان تا استخدام، توزیع امتیاز، و **خروجی CSV**.

![گزارش‌ها](docs/screenshots/10-reports.png)

### تنظیمات و راهنما

تب‌های تنظیمات: پروفایل، امنیت، برچسب‌ها، دپارتمان‌ها، **قالب آگهی**، مراحل پایپ‌لاین، **کارت امتیاز**، تیم.

![کارت امتیاز](docs/screenshots/14-settings-scorecards.png)

راهنمای کامل درون‌برنامه‌ای با گردش کار قدم‌به‌قدم و میان‌برهای کیبورد.

![راهنما](docs/screenshots/15-guide.png)

### ورود

![ورود](docs/screenshots/01-login.png)

---

## معماری و پشتهٔ فنی

| لایه | فناوری |
|---|---|
| بک‌اند | Django 6, Django REST Framework, SimpleJWT, django-filter, drf-spectacular |
| پایگاه‌داده | SQLite (توسعه) · PostgreSQL (استقرار، از طریق `DATABASE_URL`) |
| فرانت‌اند | React 19, React Router 7, Vite (rolldown), Tailwind CSS v4, Recharts, Framer Motion |
| سرو استاتیک | WhiteNoise (فایل‌های استاتیک + خود اپ React) |
| اجرا | Gunicorn، Docker + docker-compose |
| ایمیل | Django email framework (کنسول در توسعه، SMTP در استقرار) |

- **احراز هویت:** JWT با refresh؛ رفرش خودکار در اینترسپتور axios.
- **امنیت:** محدودیت نرخ (ورود `۱۰/دقیقه`، فرم عمومی `۱۰/ساعت`)، اعتبارسنجی نوع/حجم فایل، هدرهای HSTS/SSL/secure-cookie در حالت production، `X-Frame-Options: DENY`.
- **ثبت‌نام:** در production بسته است؛ اولین حساب به‌صورت خودکار مدیر کل می‌شود، بقیه با دعوت/ادمین.
- **ماژول‌ها:** با `TALENTBASE_MODULES` می‌توان نسخهٔ سبک «فقط بانک رزومه» (بدون آگهی/پایپ‌لاین/پورتال) ساخت.

---

## اجرای توسعه

### بک‌اند

```bash
python -m venv venv
venv\Scripts\activate                 # ویندوز؛ در لینوکس: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8010
```

- مستندات API: `http://127.0.0.1:8010/api/docs/`
- سلامت: `http://127.0.0.1:8010/healthz/`

### فرانت‌اند

```bash
cd frontend
npm install
copy .env.example .env                # VITE_API_BASE و VITE_APP_MODE
npm run dev
```

### دادهٔ نمونه

```bash
python manage.py seed_demo            # ۴۵ کاندیدا، آگهی، درخواست، مصاحبه — recruiter / demo12345
```

---

## استقرار (Production)

همهٔ تنظیمات از متغیر محیطی خوانده می‌شوند — `.env.example` را ببینید.

### با Docker (پیشنهادی)

```bash
cp .env.example .env                  # DJANGO_SECRET_KEY و دامنه‌ها را پر کنید
docker compose up -d --build
```

این‌کار PostgreSQL را بالا می‌آورد، مهاجرت‌ها را اجرا می‌کند، فرانت‌اند را build و با WhiteNoise سرو می‌کند، و بک‌اند را با Gunicorn روی پورت `8000` اجرا می‌کند. یک reverse proxy (nginx/Caddy) برای TLS جلوی آن بگذارید.

### دستی

```bash
export DJANGO_DEBUG=0 DJANGO_SECRET_KEY=... DATABASE_URL=postgres://...
pip install -r requirements.txt
cd frontend && VITE_API_BASE=/api/ npm run build && cd ..
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

با `DJANGO_DEBUG=0`، کلید ضعیف رد می‌شود و هدرهای امنیتی فعال می‌شوند.

---

## پیکربندی (متغیرهای محیطی)

| متغیر | پیش‌فرض | توضیح |
|---|---|---|
| `DJANGO_DEBUG` | `1` | در production حتماً `0` |
| `DJANGO_SECRET_KEY` | — | در production الزامی (کلید قوی) |
| `DJANGO_ALLOWED_HOSTS` | localhost… | دامنه‌ها با کاما |
| `CSRF_TRUSTED_ORIGINS` | — | `https://your-domain` |
| `DATABASE_URL` | SQLite | `postgres://user:pass@host:5432/db` |
| `CORS_ALLOWED_ORIGINS` | 5173 | origin فرانت‌اند |
| `TALENTBASE_MODULES` | `core,recruitment,sourcing` | `core` = فقط بانک رزومه |
| `EMAIL_BACKEND` / `EMAIL_HOST` / … | کنسول | SMTP برای ایمیل واقعی |
| `ALLOW_OPEN_REGISTRATION` | `= DEBUG` | ثبت‌نام باز |
| `MAX_UPLOAD_MB` | `8` | سقف حجم فایل رزومه |
| `THROTTLE_AUTH` / `THROTTLE_APPLY` | `10/min` / `10/hour` | محدودیت نرخ |
| `SENTRY_DSN` | — | مانیتورینگ خطا (اختیاری) |

---

## API

- `POST /api/auth/register/` · `POST /api/auth/token/` · `POST /api/auth/token/refresh/` · `GET /api/auth/me/`
- `candidates/` (+ `duplicates/`, `merge/`, `import_csv/`, `export/`, `bulk_tag/`, `bulk_delete/`)
- `jobs/` · `applications/` (+ `move/`, `reject/`) · `interviews/` (+ `invite/`, `ics/`) · `offers/` · `talent-pools/`
- `tasks/` · `requisitions/` (+ `submit/`, `approve/`, `reject/`) · `scorecards/` · `job-templates/`
- `sourcing/providers/` · `sourcing/search/` · `sourcing/saved-searches/`
- `stats/dashboard/` · `stats/reports/` (+ `export/`) · `stats/candidates/`
- `public/jobs/` · `public/apply/`  (بدون احراز هویت)
- مستندات کامل و تعاملی: `/api/docs/`

---

## تست

```bash
python manage.py test candidates          # ۳۱ تست
cd frontend && npm run build && npx eslint src
```

---

## ساختار پروژه

```
backend/        settings (env-driven) · urls · health · SPA fallback · throttle
candidates/
  models.py     Candidate, Job, Application, Interview, Offer, TalentPool,
                Task, JobRequisition, ScorecardTemplate, JobTemplate, ...
  serializers.py · views.py · sourcing/ · notifications.py · tests.py · pagination.py
frontend/src/
  features/     auth · candidates · jobs · requisitions · pipeline · offers ·
                interviews · tasks · pools · sourcing · reports · portal · guide · settings
  components/   ui/ (کیت طراحی) · layout/ · CommandPalette · ErrorBoundary · FilterBar
Dockerfile · docker-compose.yml · .env.example
docs/screenshots/
```

---

## مجوز

نرم‌افزار اختصاصی — `LICENSE` را ببینید. © 2026 Erfan Mohammadi.

اپ سمت **کارجو** (متقاضیان کار) پروژهٔ جداگانه‌ای است.
