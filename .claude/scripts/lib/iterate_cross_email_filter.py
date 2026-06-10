#!/usr/bin/env python3
"""Email classification for /iterate --cross DB signup counts."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any


RFC_RESERVED_TLDS = {".test", ".example", ".invalid", ".localhost", ".local"}
PLACEHOLDER_DOMAINS = {"example.com", "example.org", "example.net", "test.com", "email.com", "verify.com"}

# Localpart values that are obviously form-placeholders, never real signups
# (e.g. you@company.com). Kept deliberately narrow — role addresses like
# admin@/info@/contact@ are NOT included because they can be real.
PLACEHOLDER_LOCALPARTS = {
    "you", "yourname", "your-name", "youremail", "your-email", "name",
    "firstname", "lastname", "fullname", "email", "example", "placeholder",
    "someone", "none",
}
# Delimited localpart tokens that mark an automated / manual test signup
# (e.g. perky-test-1444600@gmail.com, smoke-test@x, deploy@x). Matched as a
# whole token split on [._+-]; a real surname like "Testa" is NOT a token.
TEST_LOCALPART_TOKENS = {
    "test", "tests", "testing", "qa", "smoke", "smoketest", "staging",
    "sandbox", "demo", "dummy", "fake", "sample", "e2e", "mvptest",
    "healthcheck", "livecheck", "noreply", "no-reply",
}
# Domain label containing "test" as a delimited token (rubberduck-test.com,
# test-app.io) — but NOT substrings like "fastest.com"/"latest.io".
_DOMAIN_TEST_LABEL = re.compile(r"(?:^|[.-])test(?:[.-])")
# Soft markers that only count as test when paired with a 5+ digit run
# (synthetic timestamp ids: testingtest900033300, launch-check-1775801680).
_LOCAL_SOFT = re.compile(r"(?:test|qa|smoke|demo|staging|sandbox|e2e|check|signup|newuser|trial|verify)")
_DIGIT_RUN = re.compile(r"\d{5,}")


def _localpart_test_reason(raw_local: str, tokens: set[str], placeholders: set[str]) -> str | None:
    """Return a reason string if the localpart looks like a test/placeholder, else None.

    Never keys off all-digit localparts — those are valid (e.g. QQ numbers
    like 2524621338@qq.com are real users).
    """
    rl = (raw_local or "").lower()
    if not rl:
        return None
    if rl in placeholders:
        return "placeholder-localpart"
    parts = [t for t in re.split(r"[._+\-]", rl) if t]
    if any(t in tokens for t in parts):
        return "localpart-test-token"
    if _LOCAL_SOFT.search(rl) and _DIGIT_RUN.search(rl):
        return "localpart-synthetic"
    return None


def gmail_normalize(email: str) -> str:
    email = (email or "").strip().lower()
    if "@" not in email:
        return email
    local, domain = email.rsplit("@", 1)
    if domain in {"gmail.com", "googlemail.com"}:
        local = local.split("+", 1)[0].replace(".", "")
        domain = "gmail.com"
    return f"{local}@{domain}"


def redact_email(email: str) -> str:
    email = (email or "").strip()
    if "@" not in email:
        return "***"
    local, domain = email.rsplit("@", 1)
    keep = local[:3] if len(local) >= 3 else local
    return f"{keep}***@{domain}"


def _email_sets(config: dict[str, Any]) -> tuple[set[str], set[str], set[str]]:
    cfg = config.get("email_filter") or {}
    team = {gmail_normalize(e) for e in cfg.get("team_emails") or []}
    test = {gmail_normalize(e) for e in cfg.get("test_emails") or []}
    prefixes = {
        (p or "").strip().lower().replace(".", "")
        for p in cfg.get("plus_alias_team_prefixes") or []
    }
    return team, test, prefixes


def _rules(config: dict[str, Any]) -> dict[str, Any]:
    cfg = config.get("email_filter") or {}
    r = cfg.get("rules") or {}
    return {
        "test_tlds": set(r.get("test_tlds") or RFC_RESERVED_TLDS),
        "test_domains": set(r.get("test_domains") or PLACEHOLDER_DOMAINS),
        "test_suffixes": set(r.get("test_suffixes") or [".internal"]),
        "team_domains": set(r.get("team_domains") or []),
        "test_localpart_tokens": set(r.get("test_localpart_tokens") or TEST_LOCALPART_TOKENS),
        "placeholder_localparts": set(r.get("placeholder_localparts") or PLACEHOLDER_LOCALPARTS),
        "domain_test_label": bool(r.get("domain_test_label", True)),
    }


def classify_email(email: str, config: dict[str, Any]) -> tuple[str, str]:
    """Return (category, reason): category is real/team/test."""
    email_l = (email or "").strip().lower()
    norm = gmail_normalize(email_l)
    if "@" not in norm:
        return "test", "malformed-email"
    local, domain = norm.rsplit("@", 1)
    team_emails, test_emails, plus_prefixes = _email_sets(config)
    rules = _rules(config)

    raw_local = email_l.rsplit("@", 1)[0] if "@" in email_l else local
    if "+" in raw_local:
        base = gmail_normalize(f"{raw_local.split('+', 1)[0]}@{domain}").split("@", 1)[0]
        if base in plus_prefixes or f"{base}@{domain}" in team_emails:
            return "test", "team-plus-alias"

    if norm in team_emails:
        return "team", "operator-team-email"
    if norm in test_emails:
        return "test", "operator-test-email"

    for td in rules["team_domains"]:
        td = td.lower().lstrip(".")
        if domain == td or domain.endswith("." + td):
            return "team", "team-domain"

    for td in rules["test_domains"]:
        td = td.lower().lstrip(".")
        if domain == td or domain.endswith("." + td):
            return "test", "placeholder-domain"
    for suffix in rules["test_suffixes"]:
        if domain.endswith(suffix.lower()):
            return "test", "test-domain-suffix"
    for tld in rules["test_tlds"]:
        if domain.endswith(tld.lower()):
            return "test", "rfc-reserved-tld"
    if rules["domain_test_label"] and _DOMAIN_TEST_LABEL.search(domain):
        return "test", "test-labeled-domain"

    localpart_reason = _localpart_test_reason(
        raw_local, rules["test_localpart_tokens"], rules["placeholder_localparts"]
    )
    if localpart_reason:
        return "test", localpart_reason

    return "real", "singleton-real"


def filter_signups(rows: list[dict[str, Any]], config: dict[str, Any]) -> dict[str, Any]:
    """Classify rows and return counts plus a redacted audit trail."""
    audit = []
    counts: Counter[str] = Counter()
    real_times: list[str] = []
    for row in rows:
        email = row.get("email")
        if not email:
            counts["test"] += 1
            audit.append({"email_redacted": "***", "category": "test", "reason": "missing-email"})
            continue
        category, reason = classify_email(str(email), config)
        counts[category] += 1
        audit.append({
            "email_redacted": redact_email(str(email)),
            "category": category,
            "reason": reason,
        })
        if category == "real" and row.get("signup_at"):
            real_times.append(str(row["signup_at"]))

    return {
        "raw": len(rows),
        "real": counts["real"],
        "team": counts["team"],
        "test": counts["test"],
        "audit": audit,
        "first_real_signup_at": min(real_times) if real_times else None,
    }
