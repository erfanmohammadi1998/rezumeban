import random
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from candidates.models import (
    Activity,
    Application,
    ApplicationStageHistory,
    Candidate,
    Department,
    Education,
    Interview,
    Job,
    Note,
    PipelineStage,
    Skill,
    Tag,
    WorkExperience,
)

FIRST_NAMES = [
    "علی", "سارا", "محمد", "زهرا", "رضا", "نگار", "حسین", "مریم", "امیر", "فاطمه",
    "پویا", "شیما", "کاوه", "الهام", "بهنام", "نازنین", "آرش", "رها", "سینا", "پریسا",
    "میلاد", "دنیا", "کیان", "یاسمن", "فرهاد", "مینا", "بابک", "لیلا", "احسان", "تارا",
]
LAST_NAMES = [
    "محمدی", "رضایی", "حسینی", "کریمی", "موسوی", "احمدی", "اکبری", "قاسمی", "صادقی",
    "نوری", "رحیمی", "جعفری", "کاظمی", "یوسفی", "شریفی", "عباسی", "بهرامی", "فتحی",
]
HEADLINES = [
    "توسعه‌دهنده بک‌اند", "توسعه‌دهنده فرانت‌اند", "مهندس DevOps", "طراح محصول",
    "دانشمند داده", "مدیر محصول", "مهندس QA", "توسعه‌دهنده موبایل", "مهندس فول‌استک",
    "کارشناس منابع انسانی", "بازاریاب دیجیتال", "مدیر فنی",
]
SKILLS = [
    "Python", "Django", "React", "JavaScript", "TypeScript", "PostgreSQL", "Docker",
    "Kubernetes", "AWS", "Redis", "GraphQL", "Node.js", "Vue", "Figma", "SQL",
    "Machine Learning", "Pandas", "Git", "CI/CD", "REST API",
]
COMPANIES = ["دیجی‌کالا", "اسنپ", "کافه‌بازار", "تپسی", "علی‌بابا", "فیلیمو", "بلد", "ازکی", "یکتانت"]
UNIS = ["دانشگاه تهران", "دانشگاه شریف", "دانشگاه امیرکبیر", "دانشگاه علم و صنعت", "دانشگاه شهید بهشتی"]
CITIES = ["تهران", "اصفهان", "مشهد", "شیراز", "تبریز", "کرج", "دورکاری"]
DEGREES = ["کارشناسی", "کارشناسی ارشد", "دکترا"]
FIELDS = ["مهندسی کامپیوتر", "مهندسی نرم‌افزار", "علوم کامپیوتر", "هوش مصنوعی", "مدیریت"]

JOBS = [
    ("توسعه‌دهنده ارشد بک‌اند (Python/Django)", "مهندسی", "full_time", False),
    ("توسعه‌دهنده فرانت‌اند React", "مهندسی", "full_time", True),
    ("مهندس DevOps", "مهندسی", "full_time", True),
    ("طراح محصول (Product Designer)", "محصول", "full_time", False),
    ("دانشمند داده", "داده", "contract", True),
    ("کارآموز توسعه نرم‌افزار", "مهندسی", "internship", False),
    ("مدیر محصول", "محصول", "full_time", False),
    ("کارشناس منابع انسانی", "منابع انسانی", "part_time", False),
]

STAGES = [
    ("درخواست جدید", 1, "active"),
    ("بررسی رزومه", 2, "active"),
    ("مصاحبه تلفنی", 3, "active"),
    ("مصاحبه فنی", 4, "active"),
    ("مصاحبه نهایی", 5, "active"),
    ("پیشنهاد کاری", 6, "active"),
    ("استخدام‌شده", 7, "won"),
    ("رد شده", 8, "lost"),
]

TAGS = [
    ("ارجاع داخلی", "green"), ("اولویت بالا", "red"), ("سینیور", "purple"),
    ("جونیور", "blue"), ("دورکار", "amber"), ("بازگشتی", "pink"),
]


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for رزومه‌بان."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Delete existing data first")
        parser.add_argument("--candidates", type=int, default=45)

    def handle(self, *args, **opts):
        random.seed(42)

        if opts["flush"]:
            self.stdout.write("Flushing existing recruitment data...")
            for model in (
                Activity, Interview, ApplicationStageHistory, Application, Note,
                Skill, Education, WorkExperience, Candidate, Job, Tag, PipelineStage,
                Department,
            ):
                model.objects.all().delete()

        recruiter, created = User.objects.get_or_create(
            username="recruiter",
            defaults={"email": "recruiter@talentbase.dev", "first_name": "مدیر", "last_name": "استخدام"},
        )
        if created:
            recruiter.set_password("demo12345")
            recruiter.save()
            self.stdout.write(self.style.SUCCESS("Created user  recruiter / demo12345"))

        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser("admin", "admin@talentbase.dev", "admin12345")
            self.stdout.write(self.style.SUCCESS("Created superuser  admin / admin12345"))

        interviewers = [recruiter]
        for uname, fn, ln in [("s.karimi", "سمیرا", "کریمی"), ("h.rad", "هومن", "راد")]:
            u, c = User.objects.get_or_create(
                username=uname, defaults={"first_name": fn, "last_name": ln}
            )
            if c:
                u.set_password("demo12345")
                u.save()
            interviewers.append(u)

        stages = []
        for name, order, kind in STAGES:
            s, _ = PipelineStage.objects.get_or_create(
                name=name, defaults={"order": order, "kind": kind}
            )
            stages.append(s)
        active_stages = [s for s in stages if s.kind == "active"]
        won_stage = next(s for s in stages if s.kind == "won")
        lost_stage = next(s for s in stages if s.kind == "lost")

        tags = [
            Tag.objects.get_or_create(name=n, defaults={"color": c})[0] for n, c in TAGS
        ]

        departments = {}
        for _, dept_name, _, _ in JOBS:
            if dept_name not in departments:
                departments[dept_name] = Department.objects.get_or_create(name=dept_name)[0]

        jobs = []
        for title, dept_name, etype, remote in JOBS:
            job, _ = Job.objects.get_or_create(
                title=title,
                defaults={
                    "department": departments[dept_name],
                    "employment_type": etype,
                    "is_remote": remote,
                    "location": "دورکاری" if remote else random.choice(CITIES[:-1]),
                    "description": (
                        "ما به دنبال فردی با انگیزه و علاقه‌مند به یادگیری هستیم که در تیمی "
                        "پویا و چابک فعالیت کند. در این نقش با چالش‌های فنی جذابی روبه‌رو خواهید شد."
                    ),
                    "requirements": (
                        "- حداقل ۲ سال تجربه مرتبط\n- تسلط بر مبانی مهندسی نرم‌افزار\n"
                        "- روحیه کار تیمی\n- آشنایی با کنترل نسخه Git"
                    ),
                    "salary_min": random.choice([25, 35, 45]) * 1_000_000,
                    "salary_max": random.choice([60, 75, 90]) * 1_000_000,
                    "openings": random.randint(1, 3),
                    "status": "open" if title != "مدیر محصول" else "on_hold",
                    "hiring_manager": recruiter,
                },
            )
            jobs.append(job)

        open_jobs = [j for j in jobs if j.status == "open"]

        created_candidates = 0
        for i in range(opts["candidates"]):
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            email = f"candidate{i+1}@example.com"
            if Candidate.objects.filter(email=email).exists():
                continue

            cand = Candidate.objects.create(
                first_name=fn,
                last_name=ln,
                email=email,
                phone=f"0912{random.randint(1000000, 9999999)}",
                headline=random.choice(HEADLINES),
                location=random.choice(CITIES),
                summary=(
                    f"{random.choice(HEADLINES)} با {random.randint(1, 12)} سال سابقه کار. "
                    "علاقه‌مند به ساخت محصولات با کیفیت و کار در محیط‌های چالش‌برانگیز."
                ),
                source=random.choice([s[0] for s in Candidate.SOURCES]),
                expected_salary=random.choice([40, 55, 70, 85]) * 1_000_000,
                rating=random.choices([0, 3, 4, 5], weights=[3, 3, 3, 1])[0],
                is_favorite=random.random() < 0.15,
                owner=recruiter,
                created_at=timezone.now() - timedelta(days=random.randint(0, 40)),
            )
            cand.tags.set(random.sample(tags, random.randint(0, 2)))

            for _ in range(random.randint(1, 3)):
                start = date.today() - timedelta(days=random.randint(400, 3000))
                ongoing = random.random() < 0.3
                WorkExperience.objects.create(
                    candidate=cand,
                    company_name=random.choice(COMPANIES),
                    position=random.choice(HEADLINES),
                    start_date=start,
                    end_date=None if ongoing else start + timedelta(days=random.randint(300, 1200)),
                    is_current=ongoing,
                    description="مسئولیت طراحی، توسعه و نگهداری بخش‌های کلیدی محصول.",
                )

            grad = random.randint(2010, 2023)
            Education.objects.create(
                candidate=cand,
                degree=random.choice(DEGREES),
                field_of_study=random.choice(FIELDS),
                university=random.choice(UNIS),
                start_year=grad - 4,
                graduation_year=grad,
            )

            for skill_name in random.sample(SKILLS, random.randint(3, 7)):
                Skill.objects.create(
                    candidate=cand,
                    name=skill_name,
                    level=random.choice([lv[0] for lv in Skill.LEVELS]),
                )

            Activity.objects.create(verb=f"کاندیدای «{cand.full_name}» اضافه شد", candidate=cand)
            created_candidates += 1

            # apply to 1-2 open jobs
            for job in random.sample(open_jobs, random.randint(1, min(2, len(open_jobs)))):
                if Application.objects.filter(candidate=cand, job=job).exists():
                    continue
                roll = random.random()
                if roll < 0.12:
                    stage, appstatus = won_stage, Application.STATUS_HIRED
                elif roll < 0.35:
                    stage, appstatus = lost_stage, Application.STATUS_REJECTED
                else:
                    stage, appstatus = random.choice(active_stages), Application.STATUS_ACTIVE

                app = Application.objects.create(
                    candidate=cand,
                    job=job,
                    stage=stage,
                    status=appstatus,
                    source=cand.source,
                    applied_at=timezone.now() - timedelta(days=random.randint(0, 30)),
                )
                ApplicationStageHistory.objects.create(
                    application=app, to_stage=stage, changed_by=recruiter, note="ثبت اولیه"
                )
                Activity.objects.create(
                    verb=f"«{cand.full_name}» برای «{job.title}» درخواست داد",
                    candidate=cand, job=job, application=app,
                )

                # interviews for mid/late stage applications
                if stage in active_stages and stage.order >= 3:
                    for k in range(random.randint(1, 2)):
                        past = random.random() < 0.5
                        iv = Interview.objects.create(
                            application=app,
                            title=random.choice(["مصاحبه تلفنی", "مصاحبه فنی", "مصاحبه نهایی"]),
                            interview_type=random.choice(["phone", "video", "technical", "final"]),
                            scheduled_at=timezone.now()
                            + timedelta(days=random.randint(-15, 12), hours=random.randint(9, 17)),
                            duration_minutes=random.choice([30, 45, 60]),
                            location=random.choice(["Google Meet", "دفتر مرکزی — طبقه ۳", "تماس تلفنی"]),
                            status="completed" if past else "scheduled",
                            score=random.randint(2, 5) if past else None,
                            recommendation=random.choice(["yes", "strong_yes", "no"]) if past else "",
                            feedback="عملکرد کلی مناسب بود؛ تسلط فنی قابل قبول." if past else "",
                        )
                        iv.interviewers.set(random.sample(interviewers, random.randint(1, 2)))

            if random.random() < 0.4:
                Note.objects.create(
                    candidate=cand,
                    author=recruiter,
                    body=random.choice([
                        "تماس اولیه برقرار شد؛ به همکاری علاقه‌مند است.",
                        "سابقه پروژه‌های متن‌باز خوبی دارد.",
                        "انتظار حقوقی کمی بالاتر از بازه ماست — نیاز به بررسی.",
                        "برای نقش سینیور مناسب‌تر است.",
                    ]),
                )

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. {created_candidates} candidates, {len(jobs)} jobs, "
            f"{Application.objects.count()} applications, {Interview.objects.count()} interviews."
        ))
        self.stdout.write(self.style.WARNING("Login:  recruiter / demo12345    (admin / admin12345 for /admin)"))
