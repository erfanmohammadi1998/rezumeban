from .base import SourcingError
from .providers import (
    DemoCandidateProvider,
    DevToCandidateProvider,
    GitHubCandidateProvider,
    StackOverflowCandidateProvider,
)

_PROVIDERS = {
    p.slug: p
    for p in [
        GitHubCandidateProvider(),
        StackOverflowCandidateProvider(),
        DevToCandidateProvider(),
        DemoCandidateProvider(),
    ]
}


def list_providers(kind=None):
    # رزومه‌بان only sources candidates; ``kind`` is accepted for compatibility.
    return [
        p.as_meta()
        for p in _PROVIDERS.values()
        if kind in (None, "candidates", p.kind)
    ]


def get_provider(slug):
    provider = _PROVIDERS.get(slug)
    if provider is None:
        raise SourcingError("ارائه‌دهنده‌ی نامعتبر است.")
    return provider
