"""
Candidate- and team-facing email notifications.

Uses Django's email framework. In development the console backend prints
messages to stdout; set ``EMAIL_BACKEND`` / SMTP settings via environment
for real delivery. Disable entirely with ``CANDIDATE_EMAILS_ENABLED=0``.
"""
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.utils import timezone


def _enabled():
    return getattr(settings, "CANDIDATE_EMAILS_ENABLED", True)


def _from():
    return getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@rezumeban.local")


def _ics_dt(dt):
    return timezone.localtime(dt).strftime("%Y%m%dT%H%M%S")


def build_interview_ics(interview):
    """A minimal single-event VCALENDAR for an interview."""
    start = interview.scheduled_at
    end = start + timedelta(minutes=interview.duration_minutes or 60)
    cand = interview.application.candidate
    job = interview.application.job
    uid = f"interview-{interview.id}@rezumeban"
    summary = f"{interview.title} — {cand.full_name} ({job.title})"
    desc = (
        f"مصاحبه با {cand.full_name} برای موقعیت «{job.title}».\\n"
        f"نوع: {interview.get_interview_type_display()}"
    )
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Rezumeban//Interview//FA",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{_ics_dt(timezone.now())}",
        f"DTSTART:{_ics_dt(start)}",
        f"DTEND:{_ics_dt(end)}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{desc}",
    ]
    if interview.location:
        lines.append(f"LOCATION:{interview.location}")
    lines += ["STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(lines)


def _email_with_ics(to_list, subject, body, ics_text):
    if not _enabled() or not to_list:
        return False
    try:
        msg = EmailMessage(subject, body, _from(), to_list)
        msg.attach("interview.ics", ics_text, "text/calendar; method=REQUEST")
        msg.send(fail_silently=True)
        return True
    except Exception:  # noqa: BLE001
        return False


def interview_invite(interview):
    cand = interview.application.candidate
    job = interview.application.job
    when = timezone.localtime(interview.scheduled_at).strftime("%Y-%m-%d %H:%M")
    ics = build_interview_ics(interview)

    # candidate
    if cand.email:
        _email_with_ics(
            [cand.email],
            f"دعوت به مصاحبه — {job.title}",
            (
                f"سلام {cand.first_name}،\n\n"
                f"برای موقعیت «{job.title}» به مصاحبه‌ای در تاریخ {when} دعوت شده‌اید"
                + (f" (مکان/لینک: {interview.location})" if interview.location else "")
                + ".\n\nفایل تقویم پیوست است.\n\nبا احترام،\nتیم استخدام"
            ),
            ics,
        )
    # interviewers
    emails = [u.email for u in interview.interviewers.all() if u.email]
    if emails:
        _email_with_ics(
            emails,
            f"مصاحبه: {cand.full_name} — {job.title}",
            (
                f"مصاحبه با {cand.full_name} برای «{job.title}» در {when}.\n"
                f"نوع: {interview.get_interview_type_display()}\n"
                + (f"مکان/لینک: {interview.location}\n" if interview.location else "")
                + "\nفایل تقویم پیوست است."
            ),
            ics,
        )
    return True


def team_email(users, subject, body):
    emails = [u.email for u in users if getattr(u, "email", "")]
    if not _enabled() or not emails:
        return False
    try:
        send_mail(subject, body, _from(), emails, fail_silently=True)
        return True
    except Exception:  # noqa: BLE001
        return False


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
