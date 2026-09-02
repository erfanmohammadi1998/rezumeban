"""
Candidate-facing email notifications.

Uses Django's email framework. In development the console backend prints
messages to stdout; set ``EMAIL_BACKEND`` / SMTP settings via environment
for real delivery. Disable entirely with ``CANDIDATE_EMAILS_ENABLED=0``.
"""
from django.conf import settings
from django.core.mail import send_mail


def _enabled():
    return getattr(settings, "CANDIDATE_EMAILS_ENABLED", True)


def notify_candidate(candidate, subject, body):
    if not _enabled() or not candidate.email:
        return False
    try:
        send_mail(
            subject,
            body,
            getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@rezumeban.local"),
            [candidate.email],
            fail_silently=True,
        )
        return True
    except Exception:  # noqa: BLE001 - never let email break a request
        return False


def stage_changed(application, new_stage):
    c = application.candidate
    notify_candidate(
        c,
        f"وضعیت درخواست شما برای «{application.job.title}»",
        (
            f"سلام {c.first_name}،\n\n"
            f"وضعیت درخواست شما برای موقعیت «{application.job.title}» به "
            f"«{new_stage.name}» تغییر کرد.\n\n"
            "با احترام،\nتیم استخدام"
        ),
    )


def application_rejected(application, reason=""):
    c = application.candidate
    extra = f"\n\nتوضیح: {reason}" if reason else ""
    notify_candidate(
        c,
        f"نتیجهٔ درخواست شما برای «{application.job.title}»",
        (
            f"سلام {c.first_name}،\n\n"
            f"از زمانی که برای موقعیت «{application.job.title}» گذاشتید سپاسگزاریم. "
            "در این مرحله با کاندیدای دیگری ادامه می‌دهیم." + extra + "\n\n"
            "موفق باشید."
        ),
    )


def offer_sent(offer):
    c = offer.application.candidate
    lines = [f"سلام {c.first_name}،", "", "پیشنهاد همکاری برای شما ارسال شد."]
    if offer.title:
        lines.append(f"عنوان: {offer.title}")
    if offer.salary:
        lines.append(f"حقوق پیشنهادی: {offer.salary:,} تومان")
    if offer.start_date:
        lines.append(f"تاریخ شروع: {offer.start_date}")
    if offer.expires_on:
        lines.append(f"مهلت پاسخ: {offer.expires_on}")
    if offer.body:
        lines += ["", offer.body]
    notify_candidate(
        c, f"پیشنهاد همکاری — {offer.application.job.title}", "\n".join(lines)
    )
