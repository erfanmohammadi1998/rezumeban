# رزومه‌بان

سامانهٔ دریافت و مدیریت رزومه برای شرکت‌ها — یک ATS کامل با پورتال عمومی مشاغل و منبع‌یابی کاندیدا.

Built with **Django 6 / DRF** + **React 19 / Vite / Tailwind v4**.

## امکانات

- **بانک رزومه:** ثبت/ویرایش کاندیدا با سوابق کاری، تحصیلات و مهارت‌ها، آپلود عکس و فایل رزومه (با پیش‌نمایش)، امتیازدهی، برچسب و یادداشت تیمی (با منشن `@`). جستجو و فیلتر پیشرفته، عملیات گروهی، ورود/خروج CSV، **تشخیص و ادغام رکوردهای تکراری**، مقایسهٔ کاندیدا، **استخر استعداد**.
- **درخواست جذب نیرو:** مدیران واحدها درخواست ثبت می‌کنند → مدیر سیستم تأیید/رد می‌کند → آگهی پیش‌نویس خودکار.
- **آگهی‌های شغلی:** ساخت/ویرایش (با قالب آماده)، تیم استخدام (مدیر + همکاران)، انتشار در پورتال عمومی.
- **پورتال عمومی (`/careers`):** فرصت‌های شغلی و فرم درخواست آنلاین با آپلود رزومه — بدون لاگین، با محدودیت نرخ و اعتبارسنجی فایل.
- **پایپ‌لاین استخدام:** برد کانبان کشیدنی، رد با دلیل، **پیشنهاد همکاری** از روی کارت، مراحل قابل تنظیم.
- **مصاحبه‌ها:** زمان‌بندی + **دعوت‌نامهٔ ایمیلی با فایل تقویم (.ics)**، نمای فهرست/روزشمار، **کارت امتیازدهی وزنی**.
- **پیشنهادها:** ارسال/پذیرش/رد؛ پذیرش → استخدام‌شده.
- **وظایف و یادآوری:** اختصاص به همکار، ویجت «کارهای من» در داشبورد.
- **منبع‌یابی کاندیدا:** از API عمومی GitHub، Stack Overflow، dev.to (+ نمونهٔ آفلاین)، با جستجوهای ذخیره‌شده.
- **گزارش‌ها:** قیف استخدام، میانگین زمان در هر مرحله، اثربخشی منابع، نرخ استخدام، نمودارها، خروجی CSV.
- جستجوی سریع (Ctrl/⌘+K)، اعلان‌ها، راهنمای درون‌برنامه‌ای، رابط واکنش‌گرا و راست‌به‌چپ.

## اجرای توسعه

### بک‌اند

```bash
python -m venv venv
venv\Scripts\activate                 # ویندوز
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8010
```

مستندات API: `http://127.0.0.1:8010/api/docs/` · سلامت: `/healthz/`

### فرانت‌اند

```bash
cd frontend
npm install
copy .env.example .env                # VITE_API_BASE و VITE_APP_MODE
npm run dev
```

### تست

```bash
python manage.py test candidates      # ۲۷ تست
cd frontend && npm run build && npx eslint src
```

## استقرار (Production)

همهٔ تنظیمات از متغیرهای محیطی خوانده می‌شوند — `.env.example` را ببینید.

### با Docker (پیشنهادی)

```bash
cp .env.example .env      # DJANGO_SECRET_KEY و دامنه‌ها را پر کنید
docker compose up -d --build
```

این‌کار PostgreSQL را بالا می‌آورد، مهاجرت‌ها را اجرا می‌کند، فرانت‌اند را build کرده و با WhiteNoise سرو می‌کند، و بک‌اند را با Gunicorn روی پورت ۸۰۰۰ اجرا می‌کند. یک reverse proxy (nginx/Caddy) برای TLS جلوی آن بگذارید.

### دستی

```bash
export DJANGO_DEBUG=0 DJANGO_SECRET_KEY=... DATABASE_URL=postgres://...
pip install -r requirements.txt
cd frontend && VITE_API_BASE=/api/ npm run build && cd ..
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

**نکات امنیتی:** با `DJANGO_DEBUG=0` هدرهای HSTS/SSL-redirect/secure-cookie فعال می‌شوند و کلید ضعیف رد می‌شود. محدودیت نرخ روی ورود (`10/min`) و فرم عمومی (`10/hour`) اعمال است. آپلود رزومه به `pdf/doc/docx/rtf/odt` و `MAX_UPLOAD_MB` محدود است.

## ساختار

```
backend/      تنظیمات، مسیرها، health، throttle
candidates/   models · serializers · views · sourcing/ · notifications.py · tests.py
frontend/src/features/   auth · candidates · jobs · requisitions · pipeline · offers ·
                          interviews · tasks · pools · sourcing · reports · portal · guide
Dockerfile · docker-compose.yml · .env.example
```

---

اپ سمت **کارجو** (متقاضیان کار) پروژهٔ جداگانه‌ای است.

## مجوز

نرم‌افزار اختصاصی — `LICENSE` را ببینید. © 2026 Erfan Mohammadi.
