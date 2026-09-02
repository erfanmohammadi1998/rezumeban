from .base import SourcingError
from .providers import (
    DemoCandidateProvider,
    DemoJobProvider,
    EEstekhdamJobProvider,
    GitHubCandidateProvider,
    GreenhouseJobProvider,
    JobVisionJobProvider,
    RemotiveJobProvider,
)

_PROVIDERS = {
    p.slug: p
    for p in [
        # jobs
        JobVisionJobProvider(),
        EEstekhdamJobProvider(),
        RemotiveJobProvider(),
        GreenhouseJobProvider(),
        DemoJobProvider(),
        # candidates
        GitHubCandidateProvider(),
        DemoCandidateProvider(),
    ]
}


def list_providers(kind=None):
    return [
        p.as_meta()
        for p in _PROVIDERS.values()
        if kind is None or p.kind == kind
    ]


def get_provider(slug):
    provider = _PROVIDERS.get(slug)
    if provider is None:
        raise SourcingError("ارائه‌دهنده‌ی نامعتبر است.")
    return provider
