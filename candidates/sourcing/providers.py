"""
Candidate sourcing providers for رزومه‌بان.

Each provider queries a **public API** of a developer / professional
community and returns normalised candidate rows. No scraping of gated
sites, no credentials required (optional API keys only raise rate limits).
"""
from __future__ import annotations

import hashlib
import os
import random

from .base import TIMEOUT, USER_AGENT, Provider, SourcingError, split_name


# --------------------------------------------------------------------------- #
#  GitHub
# --------------------------------------------------------------------------- #
class GitHubCandidateProvider(Provider):
    slug = "github"
    name = "GitHub"
    kind = "candidates"
    description = (
        "پروفایل واقعی توسعه‌دهندگان در GitHub بر اساس زبان برنامه‌نویسی، "
        "موقعیت مکانی و کلیدواژه. با تنظیم GITHUB_TOKEN سقف نرخ بالاتر می‌رود."
    )
    params = [
        {"name": "language", "label": "زبان برنامه‌نویسی", "required": False, "placeholder": "python"},
        {"name": "location", "label": "موقعیت مکانی", "required": False, "placeholder": "Tehran"},
        {"name": "q", "label": "کلیدواژه", "required": False, "placeholder": "django"},
        {"name": "min_followers", "label": "حداقل دنبال‌کننده", "required": False, "placeholder": "5"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False, "placeholder": "20"},
    ]

    def _headers(self):
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
        if len(terms) == 1:
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
                    "source": self.slug,
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
                        "html_url": item.get("html_url"),
                        "language_hint": query.get("language", ""),
                    },
                }
            )
        return results


# --------------------------------------------------------------------------- #
#  Stack Overflow (Stack Exchange API)
# --------------------------------------------------------------------------- #
class StackOverflowCandidateProvider(Provider):
    slug = "stackoverflow"
    name = "Stack Overflow"
    kind = "candidates"
    description = (
        "کاربران فعال Stack Overflow بر اساس نام یا برترین پاسخ‌دهندگان یک "
        "برچسب فنی. با STACKEXCHANGE_KEY سقف نرخ بالاتر می‌رود."
    )
    params = [
        {"name": "q", "label": "نام کاربر", "required": False, "placeholder": "alireza"},
        {"name": "skill", "label": "برچسب فنی", "required": False, "placeholder": "django"},
        {"name": "location", "label": "فیلتر موقعیت مکانی", "required": False, "placeholder": "Tehran"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False, "placeholder": "20"},
    ]

    API = "https://api.stackexchange.com/2.3"

    def _key(self):
        k = os.environ.get("STACKEXCHANGE_KEY")
        return {"key": k} if k else {}

    def search(self, query):
        q = (query.get("q") or "").strip()
        skill = (query.get("skill") or "").strip().lower().replace(" ", "-")
        loc = (query.get("location") or "").strip().lower()
        limit = min(int(query.get("limit") or 20), 30)
        if not q and not skill:
            raise SourcingError("نام کاربر یا برچسب فنی را وارد کنید.")

        common = {"site": "stackoverflow", "filter": "default", **self._key()}
        users = []
        if skill:
            data = self._get(
                f"{self.API}/tags/{skill}/top-answerers/all_time",
                params={**common, "pagesize": limit},
            )
            users = [row["user"] for row in data.get("items", [])]
        else:
            data = self._get(
                f"{self.API}/users",
                params={
                    **common,
                    "inname": q,
                    "sort": "reputation",
                    "order": "desc",
                    "pagesize": limit,
                },
            )
            users = data.get("items", [])

        results = []
        for u in users[:limit]:
            location = u.get("location") or ""
            if loc and loc not in location.lower():
                continue
            name = u.get("display_name") or "کاربر"
            rep = u.get("reputation", 0)
            results.append(
                {
                    "source": self.slug,
                    "external_id": f"so-{u.get('user_id') or u.get('account_id')}",
                    "title": name,
                    "subtitle": " · ".join(
                        filter(
                            None,
                            [
                                f"شهرت {rep:,}" if rep else "",
                                skill.replace("-", " ") if skill else "",
                                location,
                            ],
                        )
                    ),
                    "location": location,
                    "url": u.get("link", ""),
                    "score": min(99, 40 + (rep // 2000)),
                    "raw": {
                        "name": name,
                        "location": location,
                        "bio": f"کاربر Stack Overflow با شهرت {rep:,}"
                        + (f" — برترین پاسخ‌دهندهٔ «{skill}»" if skill else ""),
                        "blog": u.get("website_url") or "",
                        "reputation": rep,
                        "html_url": u.get("link"),
                        "language_hint": skill.replace("-", " ") if skill else "",
                    },
                }
            )
        return results


# --------------------------------------------------------------------------- #
#  dev.to (Forem API)
# --------------------------------------------------------------------------- #
class DevToCandidateProvider(Provider):
    slug = "devto"
    name = "dev.to"
    kind = "candidates"
    description = (
        "نویسندگان مقالات فنی در dev.to بر اساس یک برچسب — توسعه‌دهندگانی که "
        "دربارهٔ یک تکنولوژی محتوا تولید می‌کنند."
    )
    params = [
        {"name": "skill", "label": "برچسب / تکنولوژی", "required": True, "placeholder": "python"},
        {"name": "location", "label": "فیلتر موقعیت مکانی", "required": False, "placeholder": "Tehran"},
        {"name": "limit", "label": "حداکثر نتایج", "required": False, "placeholder": "20"},
    ]

    def search(self, query):
        skill = (query.get("skill") or "").strip().lower()
        loc = (query.get("location") or "").strip().lower()
        limit = min(int(query.get("limit") or 20), 30)
        if not skill:
            raise SourcingError("برچسب تکنولوژی را وارد کنید.")

        articles = self._get(
            "https://dev.to/api/articles",
            params={"tag": skill, "per_page": 60, "top": 30},
            headers={"User-Agent": USER_AGENT},
        )
        seen = {}
        for art in articles:
            u = art.get("user") or {}
            username = u.get("username")
            if not username or username in seen:
                continue
            seen[username] = {"user": u, "sample": art.get("title", "")}
            if len(seen) >= limit * 2:
                break

        results = []
        for username, info in seen.items():
            try:
                prof = self._get(
                    "https://dev.to/api/users/by_username",
                    params={"url": username},
                    headers={"User-Agent": USER_AGENT},
                )
            except SourcingError:
                prof = info["user"]
            location = prof.get("location") or ""
            if loc and loc not in location.lower():
                continue
            name = prof.get("name") or username
            results.append(
                {
                    "source": self.slug,
                    "external_id": f"devto-{username}",
                    "title": name,
                    "subtitle": " · ".join(
                        filter(None, [prof.get("summary", "")[:60], f"@{username}", location])
                    ),
                    "location": location,
                    "url": f"https://dev.to/{username}",
                    "score": 55,
                    "raw": {
                        "name": name,
                        "bio": prof.get("summary") or "",
                        "location": location,
                        "blog": prof.get("website_url") or "",
                        "login": prof.get("github_username") or "",
                        "html_url": f"https://github.com/{prof['github_username']}"
                        if prof.get("github_username")
                        else f"https://dev.to/{username}",
                        "language_hint": skill,
                        "sample_post": info["sample"],
                    },
                }
            )
            if len(results) >= limit:
                break
        return results


# --------------------------------------------------------------------------- #
#  Demo (offline)
# --------------------------------------------------------------------------- #
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
                    "source": self.slug,
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
        email = f"sourced-{digest}@rezumeban.local"

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
    if raw.get("reputation"):
        extras.append(f"شهرت {raw['reputation']:,} در Stack Overflow")
    if raw.get("sample_post"):
        extras.append(f"نمونه مقاله: «{raw['sample_post']}»")
    if extras:
        summary = (summary + "\n" + " · ".join(extras)).strip()

    gh = raw.get("html_url") or ""
    return {
        "candidate": {
            "first_name": first or name or "نامشخص",
            "last_name": last or "-",
            "email": email,
            "headline": (raw.get("headline") or raw.get("bio") or "")[:200],
            "location": raw.get("location") or result.location or "",
            "summary": summary,
            "github_url": gh if "github.com" in gh else "",
            "portfolio_url": portfolio or (result.url or ""),
            "source": "other",
        },
        "skills": [
            {"name": s, "level": "Intermediate"} for s in dict.fromkeys(skills)
        ][:12],
    }
