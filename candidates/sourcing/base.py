"""
Sourcing provider framework.

A *provider* connects TalentBase to an external supply of candidates or jobs.
Given a structured query it returns a list of normalised ``dict`` results:

    {
      "external_id": "unique-within-provider",
      "title":       "Ali Rezaei"  |  "Senior Python Engineer",
      "subtitle":    "Backend Developer · Tehran"  |  "Acme Inc · Remote",
      "location":    "Tehran",
      "url":         "https://...",
      "score":       0-100,          # optional relevance hint
      "raw":         { ... }         # provider-specific payload, kept for import
    }

Real providers hit public APIs (no scraping of gated sites). Demo providers
generate realistic data so the feature is usable with zero configuration.
"""
from __future__ import annotations

import requests

USER_AGENT = "TalentBase-Sourcing/1.0 (+https://talentbase.local)"
TIMEOUT = 12


class SourcingError(Exception):
    pass


class Provider:
    slug: str = ""
    name: str = ""
    kind: str = ""  # "candidates" | "jobs"
    description: str = ""
    # each param: {"name","label","required":bool,"placeholder":str}
    params: list[dict] = []
    is_live: bool = True  # False for demo providers

    def search(self, query: dict) -> list[dict]:
        raise NotImplementedError

    # -- helpers ---------------------------------------------------------- #
    def _get(self, url, **kwargs):
        kwargs.setdefault("timeout", TIMEOUT)
        headers = kwargs.pop("headers", {})
        headers.setdefault("User-Agent", USER_AGENT)
        headers.setdefault("Accept", "application/json")
        try:
            resp = requests.get(url, headers=headers, **kwargs)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            raise SourcingError(
                f"ارتباط با «{self.name}» ناموفق بود: {exc}"
            ) from exc

    def as_meta(self) -> dict:
        return {
            "slug": self.slug,
            "name": self.name,
            "kind": self.kind,
            "description": self.description,
            "params": self.params,
            "is_live": self.is_live,
        }


def split_name(full_name: str) -> tuple[str, str]:
    parts = (full_name or "").strip().split()
    if not parts:
        return ("", "")
    if len(parts) == 1:
        return (parts[0], "")
    return (parts[0], " ".join(parts[1:]))
