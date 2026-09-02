"""Concrete sourcing providers."""
from __future__ import annotations

import hashlib
import random

from .base import TIMEOUT, USER_AGENT, Provider, SourcingError, split_name

# --------------------------------------------------------------------------- #
#  JOB PROVIDERS
# --------------------------------------------------------------------------- #
class RemotiveJobProvider(Provider):
    slug = "remotive"
    name = "Remotive (مشاغل دورکاری)"
    kind = "jobs"
    description = "آگهی‌های واقعی مشاغل دورکاری از API عمومی Remotive."
    params = [
        {"name": "q", "label": "عنوان شغلی / کلیدواژه", "required": True,
         "placeholder": "python developer"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False,
         "placeholder": "20"},
    ]

    def search(self, query):
        q = (query.get("q") or "").strip()
        limit = int(query.get("limit") or 20)
        data = self._get(
            "https://remotive.com/api/remote-jobs",
            params={"search": q, "limit": limit},
        )
        results = []
        for job in data.get("jobs", [])[:limit]:
            results.append(
                {
                    "external_id": f"remotive-{job['id']}",
                    "title": job.get("title", ""),
                    "subtitle": f"{job.get('company_name', '')} · {job.get('candidate_required_location') or 'Remote'}",
                    "location": job.get("candidate_required_location") or "Remote",
                    "url": job.get("url", ""),
                    "score": None,
                    "raw": {
                        "company_name": job.get("company_name", ""),
                        "description": job.get("description", ""),
                        "job_type": job.get("job_type", ""),
                        "salary": job.get("salary", ""),
                        "category": job.get("category", ""),
                        "publication_date": job.get("publication_date", ""),
                        "tags": job.get("tags", []),
                        "is_remote": True,
                    },
                }
            )
        return results


class GreenhouseJobProvider(Provider):
    slug = "greenhouse"
    name = "Greenhouse (صفحه مشاغل شرکت‌ها)"
    kind = "jobs"
    description = (
        "آگهی‌های واقعی از برد استخدام Greenhouse یک شرکت مشخص. "
        "نام شناسه‌ی شرکت را وارد کنید (مثلاً: stripe, gitlab, figma)."
    )
    params = [
        {"name": "company", "label": "شناسه شرکت در Greenhouse", "required": True,
         "placeholder": "stripe"},
        {"name": "q", "label": "فیلتر عنوان (اختیاری)", "required": False,
         "placeholder": "engineer"},
    ]

    def search(self, query):
        company = (query.get("company") or "").strip().lower()
        if not company:
            raise SourcingError("شناسه شرکت الزامی است.")
        q = (query.get("q") or "").strip().lower()
        data = self._get(
            f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs",
            params={"content": "true"},
        )
        results = []
        for job in data.get("jobs", []):
            title = job.get("title", "")
            if q and q not in title.lower():
                continue
            loc = (job.get("location") or {}).get("name", "")
            results.append(
                {
                    "external_id": f"greenhouse-{company}-{job['id']}",
                    "title": title,
                    "subtitle": f"{company.title()} · {loc}",
                    "location": loc,
                    "url": job.get("absolute_url", ""),
                    "score": None,
                    "raw": {
                        "company_name": company.title(),
                        "description": job.get("content", ""),
                        "location": loc,
                        "updated_at": job.get("updated_at", ""),
                        "is_remote": "remote" in loc.lower(),
                    },
                }
            )
        return results


class JobVisionJobProvider(Provider):
    slug = "jobvision"
    name = "جاب‌ویژن (Jobvision.ir)"
    kind = "jobs"
    description = (
        "آگهی‌های واقعی استخدام از جاب‌ویژن بر اساس کلیدواژه. "
        "بزرگ‌ترین بازار کار ایران — مناسب موقعیت‌های داخل کشور."
    )
    params = [
        {"name": "q", "label": "عنوان شغلی / کلیدواژه", "required": True,
         "placeholder": "توسعه‌دهنده بک‌اند"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False,
         "placeholder": "20"},
    ]

    API = "https://candidateapi.jobvision.ir/api/v1/JobPost/List"

    def _post(self, url, payload):
        import requests

        try:
            resp = requests.post(
                url,
                json=payload,
                timeout=TIMEOUT,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Origin": "https://jobvision.ir",
                    "Referer": "https://jobvision.ir/",
                },
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            raise SourcingError(
                f"ارتباط با «{self.name}» ناموفق بود: {exc}"
            ) from exc

    def search(self, query):
        q = (query.get("q") or "").strip()
        if not q:
            raise SourcingError("کلیدواژه‌ی جست‌وجو الزامی است.")
        limit = min(int(query.get("limit") or 20), 50)

        body = self._post(
            self.API,
            {"pageSize": limit, "page": 1, "sortBy": 1, "keyword": q},
        )
        posts = (body.get("data") or {}).get("jobPosts") or []

        results = []
        for jp in posts[:limit]:
            company = jp.get("company") or {}
            loc = jp.get("location") or {}
            city = (loc.get("city") or {}).get("titleFa") or ""
            province = (loc.get("province") or {}).get("titleFa") or ""
            city_label = city or province or "ایران"
            props = jp.get("properties") or {}
            work_type = (jp.get("workType") or {}).get("titleFa") or ""
            seniority = (jp.get("seniorityLevel") or {}).get("titleFa") or ""
            salary = jp.get("salary") or {}
            categories = [
                c.get("titleFa") for c in jp.get("jobCategories") or [] if c.get("titleFa")
            ]
            benefits = [
                b.get("titleFa") for b in jp.get("benefits") or [] if b.get("titleFa")
            ]
            company_name = company.get("nameFa") or company.get("nameEn") or ""
            is_remote = bool(props.get("isRemote"))
            job_id = jp["id"]

            desc_lines = [
                f"موقعیت شغلی «{jp.get('title', '')}» در {company_name or 'یک شرکت'}.",
            ]
            if seniority:
                desc_lines.append(f"سطح ارشدیت: {seniority}")
            if work_type:
                desc_lines.append(f"نوع همکاری: {work_type}")
            if props.get("requiredRelatedExperienceYears"):
                desc_lines.append(
                    f"سابقه‌ی مرتبط موردنیاز: حدود {props['requiredRelatedExperienceYears']} سال"
                )
            if categories:
                desc_lines.append("دسته‌بندی شغلی: " + "، ".join(categories))
            if benefits:
                desc_lines.append("مزایا: " + "، ".join(benefits))

            results.append(
                {
                    "external_id": f"jobvision-{job_id}",
                    "title": jp.get("title", ""),
                    "subtitle": " · ".join(
                        filter(None, [company_name, city_label, salary.get("titleFa")])
                    ),
                    "location": "دورکاری" if is_remote else city_label,
                    "url": f"https://jobvision.ir/jobs/{job_id}",
                    "score": None,
                    "raw": {
                        "company_name": company_name,
                        "description": "\n".join(desc_lines),
                        "location": city_label,
                        "is_remote": is_remote,
                        "job_type": (
                            "internship" if props.get("isInternship") else "full_time"
                        ),
                        "salary": salary.get("titleFa") or "",
                        "salary_min_m": salary.get("min"),
                        "salary_max_m": salary.get("max"),
                        "seniority": seniority,
                        "categories": categories,
                        "benefits": benefits,
                        "company_page": (
                            f"https://jobvision.ir{company.get('pageUrl')}"
                            if company.get("pageUrl")
                            else ""
                        ),
                    },
                }
            )
        return results


class EEstekhdamJobProvider(Provider):
    slug = "e-estekhdam"
    name = "ای‌استخدام (e-estekhdam.com)"
    kind = "jobs"
    description = (
        "تازه‌ترین آگهی‌های استخدام از فید عمومی RSS سایت ای‌استخدام. "
        "کلیدواژه در عنوان و متن آگهی‌های اخیر فیلتر می‌شود (بدون کلیدواژه، همه‌ی آگهی‌های اخیر)."
    )
    params = [
        {"name": "q", "label": "کلیدواژه (اختیاری)", "required": False,
         "placeholder": "حسابدار"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False,
         "placeholder": "20"},
    ]

    FEED = "https://www.e-estekhdam.com/feed/"

    def _fetch_xml(self, params):
        import requests

        try:
            resp = requests.get(
                self.FEED,
                params=params,
                timeout=TIMEOUT,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            return resp.content
        except requests.RequestException as exc:
            raise SourcingError(
                f"ارتباط با «{self.name}» ناموفق بود: {exc}"
            ) from exc

    def search(self, query):
        import re
        import xml.etree.ElementTree as ET

        q = (query.get("q") or "").strip()
        limit = min(int(query.get("limit") or 20), 40)

        raw_xml = self._fetch_xml({})
        try:
            channel = ET.fromstring(raw_xml).find("channel")
        except ET.ParseError as exc:
            raise SourcingError("پاسخ نامعتبر از ای‌استخدام.") from exc

        all_items = channel.findall("item") if channel is not None else []
        if q:
            filtered = [
                it
                for it in all_items
                if q in (it.findtext("title") or "")
                or q in (it.findtext("description") or "")
            ]
            all_items = filtered or all_items

        results = []
        for item in all_items[:limit]:
            link = (item.findtext("link") or "").strip()
            title = (item.findtext("title") or "").strip()
            desc = re.sub(r"<[^>]+>", "", item.findtext("description") or "").strip()
            pub = (item.findtext("pubDate") or "").strip()
            guid = link.rstrip("/").rsplit("/", 1)[-1] or title

            clean_title = re.sub(r"^استخدام\s+", "", title)
            # title shape: "<role> در <company> در <city>"
            city = ""
            parts = clean_title.split(" در ")
            if len(parts) >= 3:
                city = parts[-1].strip()
                clean_title = " در ".join(parts[:-1]).strip()

            results.append(
                {
                    "external_id": f"e-estekhdam-{guid}",
                    "title": clean_title or title,
                    "subtitle": " · ".join(filter(None, [desc[:90], city])),
                    "location": city,
                    "url": link,
                    "score": None,
                    "raw": {
                        "company_name": "",
                        "description": f"{desc}\n\nمنبع: {link}\nتاریخ انتشار: {pub}".strip(),
                        "location": city,
                        "is_remote": "دورکاری" in title or "دورکار" in desc,
                        "job_type": "full_time",
                    },
                }
            )
        return results


class DemoJobProvider(Provider):
    slug = "demo-jobs"
    name = "نمونه (بدون اتصال به اینترنت)"
    kind = "jobs"
    is_live = False
    description = "تولید آگهی‌های نمونه برای آزمایش گردش کار — بدون تماس با سرویس خارجی."
    params = [
        {"name": "q", "label": "عنوان شغلی", "required": True, "placeholder": "توسعه‌دهنده بک‌اند"},
        {"name": "count", "label": "تعداد", "required": False, "placeholder": "12"},
    ]

    _COMPANIES = ["نکست‌تک", "داده‌پرداز", "ابرآروان", "هوشینو", "کدفارم", "پیکسل‌لب"]
    _CITIES = ["تهران", "دورکاری", "اصفهان", "مشهد", "شیراز"]
    _TYPES = ["full_time", "part_time", "contract", "internship"]

    def search(self, query):
        q = (query.get("q") or "شغل").strip()
        count = min(int(query.get("count") or 12), 40)
        rng = random.Random(q)
        out = []
        for i in range(count):
            company = rng.choice(self._COMPANIES)
            city = rng.choice(self._CITIES)
            seniority = rng.choice(["", "ارشد ", "جونیور ", "لید "])
            out.append(
                {
                    "external_id": f"demo-{hashlib.md5(f'{q}{i}'.encode()).hexdigest()[:10]}",
                    "title": f"{seniority}{q}",
                    "subtitle": f"{company} · {city}",
                    "location": city,
                    "url": "https://example.com/jobs/demo",
                    "score": rng.randint(60, 99),
                    "raw": {
                        "company_name": company,
                        "description": (
                            f"موقعیت شغلی «{seniority}{q}» در شرکت {company}. "
                            "این یک آگهی نمونه است که توسط ارائه‌دهنده‌ی دموی TalentBase ساخته شده."
                        ),
                        "job_type": rng.choice(self._TYPES),
                        "is_remote": city == "دورکاری",
                        "tags": q.split(),
                    },
                }
            )
        return out


# --------------------------------------------------------------------------- #
#  CANDIDATE PROVIDERS
# --------------------------------------------------------------------------- #
class GitHubCandidateProvider(Provider):
    slug = "github"
    name = "GitHub (توسعه‌دهندگان)"
    kind = "candidates"
    description = (
        "جست‌وجوی پروفایل واقعی توسعه‌دهندگان در GitHub بر اساس زبان برنامه‌نویسی، "
        "موقعیت مکانی و کلیدواژه. برای سقف نرخ بالاتر می‌توانید GITHUB_TOKEN تنظیم کنید."
    )
    params = [
        {"name": "language", "label": "زبان برنامه‌نویسی", "required": False, "placeholder": "python"},
        {"name": "location", "label": "موقعیت مکانی", "required": False, "placeholder": "Tehran"},
        {"name": "q", "label": "کلیدواژه (اختیاری)", "required": False, "placeholder": "django"},
        {"name": "min_followers", "label": "حداقل دنبال‌کننده", "required": False, "placeholder": "5"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False, "placeholder": "20"},
    ]

    def _headers(self):
        import os

        headers = {"Accept": "application/vnd.github+json"}
        token = os.environ.get("GITHUB_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def search(self, query):
        terms = []
        if query.get("q"):
            terms.append(query["q"].strip())
        if query.get("language"):
            terms.append(f'language:{query["language"].strip()}')
        if query.get("location"):
            terms.append(f'location:{query["location"].strip()}')
        if query.get("min_followers"):
            terms.append(f'followers:>={int(query["min_followers"])}')
        terms.append("type:user")
        if not terms:
            raise SourcingError("حداقل یک معیار جست‌وجو وارد کنید.")

        limit = min(int(query.get("limit") or 20), 30)
        data = self._get(
            "https://api.github.com/search/users",
            params={"q": " ".join(terms), "per_page": limit},
            headers=self._headers(),
        )
        results = []
        for item in data.get("items", [])[:limit]:
            login = item["login"]
            profile = {}
            try:
                profile = self._get(
                    f"https://api.github.com/users/{login}", headers=self._headers()
                )
            except SourcingError:
                profile = {}

            name = profile.get("name") or login
            headline = profile.get("bio") or ""
            location = profile.get("location") or query.get("location") or ""
            results.append(
                {
                    "external_id": f"github-{item['id']}",
                    "title": name,
                    "subtitle": " · ".join(
                        filter(None, [headline[:60], f"@{login}", location])
                    ),
                    "location": location,
                    "url": item.get("html_url", ""),
                    "score": min(99, 40 + int(profile.get("followers", 0))),
                    "raw": {
                        "login": login,
                        "name": name,
                        "email": profile.get("email"),
                        "bio": headline,
                        "company": profile.get("company"),
                        "blog": profile.get("blog"),
                        "location": location,
                        "public_repos": profile.get("public_repos", 0),
                        "followers": profile.get("followers", 0),
                        "avatar_url": item.get("avatar_url"),
                        "html_url": item.get("html_url"),
                        "language_hint": query.get("language", ""),
                    },
                }
            )
        return results


class DemoCandidateProvider(Provider):
    slug = "demo-candidates"
    name = "نمونه (بدون اتصال به اینترنت)"
    kind = "candidates"
    is_live = False
    description = "تولید رزومه‌های نمونه برای آزمایش گردش کار — بدون تماس با سرویس خارجی."
    params = [
        {"name": "role", "label": "نقش / تخصص", "required": True, "placeholder": "مهندس داده"},
        {"name": "location", "label": "موقعیت مکانی", "required": False, "placeholder": "تهران"},
        {"name": "count", "label": "تعداد", "required": False, "placeholder": "12"},
    ]

    _FIRST = ["علی", "سارا", "محمد", "نگار", "رضا", "مریم", "امیر", "شیما", "کاوه", "الهام"]
    _LAST = ["محمدی", "رضایی", "حسینی", "کریمی", "موسوی", "احمدی", "نوری", "جعفری"]
    _SKILLS = ["Python", "SQL", "Spark", "Airflow", "React", "Go", "Kubernetes", "AWS", "Pandas"]

    def search(self, query):
        role = (query.get("role") or "متخصص").strip()
        location = (query.get("location") or "تهران").strip()
        count = min(int(query.get("count") or 12), 40)
        rng = random.Random(role + location)
        out = []
        for i in range(count):
            fn = rng.choice(self._FIRST)
            ln = rng.choice(self._LAST)
            years = rng.randint(1, 12)
            skills = rng.sample(self._SKILLS, rng.randint(3, 6))
            out.append(
                {
                    "external_id": f"demo-{hashlib.md5(f'{role}{location}{i}'.encode()).hexdigest()[:10]}",
                    "title": f"{fn} {ln}",
                    "subtitle": f"{role} · {years} سال سابقه · {location}",
                    "location": location,
                    "url": "https://example.com/candidates/demo",
                    "score": rng.randint(55, 98),
                    "raw": {
                        "name": f"{fn} {ln}",
                        "headline": role,
                        "location": location,
                        "years_experience": years,
                        "skills": skills,
                        "summary": (
                            f"{role} با {years} سال تجربه و تسلط بر {', '.join(skills)}. "
                            "این یک رزومه‌ی نمونه است."
                        ),
                    },
                }
            )
        return out


# --------------------------------------------------------------------------- #
def normalise_job_import(raw: dict, result) -> dict:
    """Map a stored SourcingResult (kind=jobs) to Job.create kwargs."""
    type_map = {
        "full_time": "full_time",
        "part_time": "part_time",
        "contract": "contract",
        "internship": "internship",
        "full-time": "full_time",
        "part-time": "part_time",
    }
    jt = (raw.get("job_type") or "").lower().replace("_", "-")
    desc = raw.get("description", "") or result.subtitle
    if raw.get("salary"):
        desc = f"{desc}\n\nحقوق اعلامی: {raw['salary']}"
    if result.url:
        desc = f"{desc}\n\nمنبع: {result.url}"

    # JobVision reports salary bounds in millions of Tomans.
    def _to_toman(v):
        try:
            return int(float(v) * 1_000_000) if v else None
        except (TypeError, ValueError):
            return None

    return {
        "title": result.title or "موقعیت شغلی",
        "location": raw.get("location") or result.location or "",
        "employment_type": type_map.get(jt, "full_time"),
        "is_remote": bool(raw.get("is_remote")),
        "description": desc.strip(),
        "requirements": "\n".join(raw.get("categories") or []),
        "salary_min": _to_toman(raw.get("salary_min_m")),
        "salary_max": _to_toman(raw.get("salary_max_m")),
        "status": "draft",
    }


def normalise_candidate_import(raw: dict, result) -> dict:
    """Map a stored SourcingResult (kind=candidates) to candidate build kwargs."""
    name = raw.get("name") or result.title or ""
    first, last = split_name(name)
    login = raw.get("login")
    email = raw.get("email")
    if not email and login:
        email = f"{login}@users.noreply.github.com"
    if not email:
        digest = hashlib.md5(result.external_id.encode()).hexdigest()[:12]
        email = f"sourced-{digest}@talentbase.local"

    blog = raw.get("blog") or ""
    portfolio = blog if blog.startswith("http") else (f"https://{blog}" if blog else "")

    skills = raw.get("skills") or []
    if raw.get("language_hint"):
        skills = [raw["language_hint"], *skills]

    summary = raw.get("summary") or raw.get("bio") or ""
    extras = []
    if raw.get("public_repos"):
        extras.append(f"{raw['public_repos']} مخزن عمومی")
    if raw.get("followers"):
        extras.append(f"{raw['followers']} دنبال‌کننده در GitHub")
    if extras:
        summary = (summary + "\n" + " · ".join(extras)).strip()

    return {
        "candidate": {
            "first_name": first or name or "نامشخص",
            "last_name": last or "-",
            "email": email,
            "headline": (raw.get("headline") or raw.get("bio") or "")[:200],
            "location": raw.get("location") or result.location or "",
            "summary": summary,
            "github_url": raw.get("html_url") or (result.url if login else ""),
            "portfolio_url": portfolio,
            "source": "other",
        },
        "skills": [{"name": s, "level": "Intermediate"} for s in dict.fromkeys(skills)][:12],
    }
