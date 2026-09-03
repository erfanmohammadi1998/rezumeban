# ── stage 1: build the React frontend ──────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# API base is same-origin in the container image (served by Django/WhiteNoise)
ENV VITE_API_BASE=/api/ VITE_APP_MODE=full
RUN npm run build

# ── stage 2: Django app ────────────────────────────────────────────────────
FROM python:3.12-slim AS app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 DJANGO_SETTINGS_MODULE=backend.settings
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend /app/frontend/dist ./frontend/dist

RUN adduser --disabled-password --gecos "" app \
    && mkdir -p /data/media /app/staticfiles \
    && chown -R app:app /app /data
USER app

ENV DJANGO_DEBUG=0 DJANGO_SECRET_KEY=build-time-placeholder
RUN python manage.py collectstatic --noinput
ENV DJANGO_SECRET_KEY=

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fsS http://localhost:8000/healthz/ || exit 1

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers ${WEB_CONCURRENCY:-3} --timeout 60"]
