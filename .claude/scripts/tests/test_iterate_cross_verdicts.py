#!/usr/bin/env python3
"""Tests for .claude/scripts/lib/iterate_cross_verdicts.py (PostHog-only).

Run:
  python3 -m pytest .claude/scripts/tests/test_iterate_cross_verdicts.py -v
  # OR (no pytest dependency):
  python3 .claude/scripts/tests/test_iterate_cross_verdicts.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))

from iterate_cross_verdicts import (  # noqa: E402
    DEFAULT_CONFIG,
    VERDICT_ENUM,
    VERDICT_GA_NO_PH_TRACKING,
    VERDICT_GO,
    VERDICT_INSUFFICIENT,
    VERDICT_MISSING_PROJECT_NAME,
    VERDICT_NO_DATA,
    VERDICT_NO_GO,
    VERDICT_WEAK,
    action_line,
    compute_headline_verdict,
    compute_pay_intent_verdict,
    emit_telegram,
    is_trusted_db_real,
    main,
    pay_intent_action_line,
    pay_intent_go_rank_key,
    pay_intent_revenue_cell,
    parse_debug_prompts,
    sort_scores_by_owner,
    sort_scores_global,
)
from iterate_cross_ga import campaign_matches_phase_filter  # noqa: E402


THRESHOLDS = DEFAULT_CONFIG["thresholds"]


def mvp(name="m", owner="alice", visitors=0, signups=0, signup_events=None,
        ga_clicks=0, ga_only=False):
    """Build a PostHog MVP record matching state-x2's data.json schema.

    Set `ga_clicks` to simulate state-x0a having merged Google Ads data.
    Set `ga_only=True` for a synthetic record (campaign exists in GA but PH has nothing).
    """
    return {
        "name": name,
        "owner": owner,
        "gclid_visitors": visitors,
        "signups": signups,
        "signup_events": signup_events or ["signup_complete"],
        "total_events_count": 100,
        "event_catalog": [],
        "ga_clicks": ga_clicks,
        "ga_only": ga_only,
    }


def pay_mvp(name="m", owner="alice", ga_clicks=0, pay_intents=0,
            gclid_visitors_phase2=0, ga_only=False,
            pay_intent_price_cents=0, pay_intent_price_variants=0):
    return {
        "name": name,
        "owner": owner,
        "gclid_visitors": gclid_visitors_phase2,
        "gclid_visitors_phase2": gclid_visitors_phase2,
        "ga_clicks": ga_clicks,
        "pay_intents": pay_intents,
        "ga_only": ga_only,
        "phase_match": True,
        "orphan": False,
        "pay_intent_price_cents": pay_intent_price_cents,
        "pay_intent_price_variants": pay_intent_price_variants,
    }


# ---------- Verdict precedence (rule v2: vis<100 → INSUF; vis≥100 & conv≥6% → GO; else NO_GO) ----------

def test_go_at_floor_with_6pct_conv():
    """visitors=100 & signups=6 → conv=6.0% (exactly at threshold) → GO."""
    score = compute_headline_verdict(mvp(visitors=100, signups=6), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_GO
    assert score["visitors_needed"] == 0


def test_go_with_high_conv():
    """visitors=200 & signups=20 → conv=10% → GO."""
    score = compute_headline_verdict(mvp(visitors=200, signups=20), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_GO


def test_no_go_at_floor_with_zero_signups():
    """visitors=100 & signups=0 → conv=0% < 6% → NO_GO."""
    score = compute_headline_verdict(mvp(visitors=100, signups=0), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_no_go_above_floor_with_some_signups_below_6pct():
    """≥100 visitors with conv < 6% → NO_GO (WEAK no longer emitted)."""
    score = compute_headline_verdict(mvp(visitors=107, signups=1), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_no_go_with_2_signups_at_high_volume():
    """200 visitors / 2 signups = 1% conv → NO_GO."""
    score = compute_headline_verdict(mvp(visitors=200, signups=2), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_no_go_just_below_6pct_threshold():
    """100 visitors / 5 signups = 5.0% conv → NO_GO (just under 6%)."""
    score = compute_headline_verdict(mvp(visitors=100, signups=5), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_insufficient_data_below_floor():
    """visitors=20 < 100 floor → INSUF regardless of signups."""
    score = compute_headline_verdict(mvp(visitors=20, signups=1), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_INSUFFICIENT
    assert score["visitors_needed"] == 80


def test_insufficient_with_great_conv_but_low_traffic():
    """8 visitors / 6 signups = 75% conv, but vis<100 → INSUF.

    dead-link real case: tiny sample with extreme conversion is exactly
    the case the visitors_floor protects against (likely attribution issue,
    not real conversion rate)."""
    score = compute_headline_verdict(mvp(visitors=8, signups=6), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_INSUFFICIENT
    assert score["visitors_needed"] == 92


def test_insufficient_zero_visitors():
    score = compute_headline_verdict(mvp(visitors=0, signups=0), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_INSUFFICIENT
    assert score["visitors_needed"] == 100


def test_no_data_takes_precedence_over_go():
    """no_event_data flag wins even with conv-passing scenario."""
    score = compute_headline_verdict(
        mvp(visitors=100, signups=10),  # 10% conv would be GO
        {"no_event_data": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_NO_DATA


def test_no_data_takes_precedence_over_no_go():
    score = compute_headline_verdict(
        mvp(visitors=154, signups=0),
        {"no_event_data": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_NO_DATA


def test_no_data_takes_precedence_over_insufficient():
    """no_event_data wins even when visitors are below floor."""
    score = compute_headline_verdict(
        mvp(visitors=20, signups=0),
        {"no_event_data": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_NO_DATA


def test_missing_project_name_takes_precedence_over_no_data():
    """missing_project_name is precedence rule 0 — wins over every other flag.

    Orphan MVPs (events with NULL project_name) have empty event_catalog by
    definition (catalog query filters by project_name), so no_event_data is
    also true. The verdict must surface the ROOT cause (tracking gap) not
    the SYMPTOM (no catalog).
    """
    score = compute_headline_verdict(
        mvp(visitors=20, signups=0),
        {"missing_project_name": True, "no_event_data": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_MISSING_PROJECT_NAME


def test_missing_project_name_takes_precedence_over_go():
    """Even with a high signup count, MISSING_PROJECT_NAME wins — the data is
    suspect when identity is missing (signups attributed to wrong MVP, etc.).
    """
    score = compute_headline_verdict(
        mvp(visitors=200, signups=20),
        {"missing_project_name": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_MISSING_PROJECT_NAME


def test_missing_project_name_falsy_falls_through_to_normal_precedence():
    """When missing_project_name is False/absent, normal verdict logic runs."""
    score = compute_headline_verdict(
        mvp(visitors=100, signups=8),  # 8% conv → GO
        {"missing_project_name": False},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_GO


def test_missing_project_name_in_verdict_enum():
    """Defense-in-depth: the new verdict must be in the enum so x3 VERIFY
    accepts it as a legal output and downstream consumers don't choke."""
    assert VERDICT_MISSING_PROJECT_NAME in VERDICT_ENUM


# ---------- GA_NO_PH_TRACKING precedence ----------

def test_ga_no_ph_tracking_fires_when_flag_set():
    """ga_clicks_without_ph_traffic flag → GA_NO_PH_TRACKING verdict."""
    score = compute_headline_verdict(
        mvp(visitors=0, signups=0, ga_clicks=58, ga_only=True),
        {"ga_clicks_without_ph_traffic": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_GA_NO_PH_TRACKING


def test_ga_no_ph_tracking_yields_to_missing_project_name():
    """MISSING_PROJECT_NAME (rank 0) outranks GA_NO_PH_TRACKING (rank 1)."""
    score = compute_headline_verdict(
        mvp(visitors=0, signups=0, ga_clicks=58),
        {"missing_project_name": True, "ga_clicks_without_ph_traffic": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_MISSING_PROJECT_NAME


def test_ga_no_ph_tracking_outranks_no_data():
    """GA_NO_PH_TRACKING (rank 1) outranks NO_DATA (rank 2). Both can be true
    for the same ga_only MVP (no PH events → no_event_data) but the stricter
    diagnosis (GA spend without PH tracking) is the actionable one."""
    score = compute_headline_verdict(
        mvp(visitors=0, signups=0, ga_clicks=58),
        {"ga_clicks_without_ph_traffic": True, "no_event_data": True},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_GA_NO_PH_TRACKING


def test_ga_no_ph_tracking_in_verdict_enum():
    assert VERDICT_GA_NO_PH_TRACKING in VERDICT_ENUM


# ---------- Phase 2 pay-intent verdict ----------

def test_pay_intent_go_at_threshold():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    score = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=2, gclid_visitors_phase2=50),
        {},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_GO
    assert score["metrics"]["denominator_source"] == "ga"
    assert score["metrics"]["pay_intent_rate"] == 0.02


def test_pay_intent_revenue_metrics_use_event_price():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    score = compute_pay_intent_verdict(
        pay_mvp(
            ga_clicks=100,
            pay_intents=5,
            gclid_visitors_phase2=50,
            pay_intent_price_cents=1900,
            pay_intent_price_variants=1,
        ),
        {},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_GO
    assert score["metrics"]["pay_intent_rate"] == 0.05
    assert score["metrics"]["pay_intent_price_cents"] == 1900.0
    assert score["metrics"]["revenue_intent_per_click"] == 95.0
    assert score["metrics"]["pay_intent_price_variants"] == 1


def test_pay_intent_no_go_just_below_threshold():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    score = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=1, gclid_visitors_phase2=80),
        {},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["metrics"]["pay_intent_rate"] == 0.01


def test_pay_intent_zero_price_or_clicks_has_zero_revenue():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    zero_price = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=3, pay_intent_price_cents=0),
        {},
        thresholds,
    )
    assert zero_price["metrics"]["revenue_intent_per_click"] == 0.0

    zero_clicks = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=0, pay_intents=3, pay_intent_price_cents=1900),
        {},
        thresholds,
    )
    assert zero_clicks["headline_verdict"] == VERDICT_INSUFFICIENT
    assert zero_clicks["metrics"]["revenue_intent_per_click"] == 0.0


def test_pay_intent_revenue_rank_beats_higher_raw_rate():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    cheap_high_rate = compute_pay_intent_verdict(
        pay_mvp(name="a", ga_clicks=100, pay_intents=8, pay_intent_price_cents=500),
        {},
        thresholds,
    )
    expensive_lower_rate = compute_pay_intent_verdict(
        pay_mvp(name="b", ga_clicks=100, pay_intents=3, pay_intent_price_cents=5000),
        {},
        thresholds,
    )
    assert cheap_high_rate["headline_verdict"] == VERDICT_GO
    assert expensive_lower_rate["headline_verdict"] == VERDICT_GO
    ranked = sorted([cheap_high_rate, expensive_lower_rate], key=pay_intent_go_rank_key)
    assert [score["name"] for score in ranked] == ["b", "a"]


def test_pay_intent_revenue_cell_flags_mixed_price():
    assert pay_intent_revenue_cell(
        {"revenue_intent_per_click": 95.0, "pay_intent_price_variants": 1}
    ) == "$0.95"
    assert "mixed-price" in pay_intent_revenue_cell(
        {"revenue_intent_per_click": 95.0, "pay_intent_price_variants": 2}
    )


def test_pay_intent_zero_at_click_floor_is_no_go():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    score = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=0, gclid_visitors_phase2=40),
        {},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["visitors_needed"] == 0


def test_pay_intent_mixed_phase1_phase2_events_only_counts_phase2_campaign():
    """Non-Phase-2 pay_intent events must not contribute to the numerator."""
    events = [
        {"event": "pay_intent", "distinct_id": "phase1-a", "properties": {"utm_campaign": "mvp-search-v1"}},
        {"event": "pay_intent", "distinct_id": "phase1-b", "properties": {"utm_campaign": "mvp-search-v1"}},
        {"event": "pay_intent", "distinct_id": "phase1-c", "properties": {"utm_campaign": "mvp-search-v1"}},
        {"event": "pay_intent", "distinct_id": "phase1-d", "properties": {"utm_campaign": "mvp-search-v1"}},
        {"event": "pay_intent", "distinct_id": "phase1-e", "properties": {"utm_campaign": "mvp-search-v1"}},
        {"event": "pay_intent", "distinct_id": "phase2-a", "properties": {"utm_campaign": "mvp-search-phase2-v1"}},
        {"event": "pay_intent", "distinct_id": "phase2-a", "properties": {"utm_campaign": "mvp-search-phase2-v1"}},
    ]
    phase2_users = {
        e["distinct_id"]
        for e in events
        if e["event"] == "pay_intent"
        and campaign_matches_phase_filter(e["properties"].get("utm_campaign", ""), "%phase2%")
    }
    all_users = {e["distinct_id"] for e in events if e["event"] == "pay_intent"}
    assert len(phase2_users) == 1
    assert len(all_users) == 6

    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.05)
    score = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=len(phase2_users), gclid_visitors_phase2=20),
        {},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["metrics"]["pay_intents"] == 1
    assert compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=len(all_users), gclid_visitors_phase2=20),
        {},
        thresholds,
    )["headline_verdict"] == VERDICT_GO


def test_pay_intent_integrity_precedence():
    thresholds = dict(THRESHOLDS, pay_intent_rate_go=0.02)
    score = compute_pay_intent_verdict(
        pay_mvp(ga_clicks=100, pay_intents=10),
        {"missing_project_name": True, "ga_clicks_without_ph_traffic": True},
        thresholds,
    )
    assert score["headline_verdict"] == VERDICT_MISSING_PROJECT_NAME


def test_pay_intent_action_line_go_is_phase3_eligible():
    action = pay_intent_action_line(VERDICT_GO, "mvp", 3, 0, 100, 0.02)
    assert "Phase 3 eligibility" in action


# ---------- GA-as-denominator ----------

def test_ga_clicks_used_as_denominator_when_present():
    """When mvp.ga_clicks > 0, verdict uses GA-clicks not PH visitors.

    stylica-ai real case: GA 575 / PH 201 / 33 signups. With GA denominator
    conv = 33/575 = 5.7% → below 6% threshold → NO_GO. This is exactly the
    over-counting trap the GA-first rule catches.
    """
    score = compute_headline_verdict(
        mvp(visitors=201, signups=33, ga_clicks=575),
        {},
        THRESHOLDS,
    )
    # 33/575 = 5.74% < 6% threshold → NO_GO (not GO as PH/201=16.4% would suggest).
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["metrics"]["denominator_source"] == "ga"
    assert score["metrics"]["ga_clicks"] == 575
    assert score["metrics"]["gclid_visitors"] == 201
    assert abs(score["metrics"]["true_conv_rate"] - 33 / 575) < 1e-4
    assert abs(score["metrics"]["capture_rate"] - 201 / 575) < 1e-4


def test_ga_clicks_promotes_insuf_to_no_go_at_floor():
    """mosai real case: PH 44 visitors (below floor) but GA 100 clicks (at floor,
    0 signups → NO_GO). Workaround surfaces the deserved NO_GO."""
    score = compute_headline_verdict(
        mvp(visitors=44, signups=0, ga_clicks=100),
        {},
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_falls_back_to_gclid_visitors_when_no_ga_data():
    """No ga_clicks → denominator_source = 'ph' and capture_rate = None."""
    score = compute_headline_verdict(
        mvp(visitors=80, signups=4),
        {},
        THRESHOLDS,
    )
    assert score["metrics"]["denominator_source"] == "ph"
    assert score["metrics"]["ga_clicks"] == 0
    assert score["metrics"]["capture_rate"] is None
    # When no GA, true_conv_rate falls back to PH-conv_rate.
    assert score["metrics"]["true_conv_rate"] == 0.05


def test_ga_clicks_zero_explicitly_uses_gclid_visitors_for_boundary():
    """ga_clicks=0 is not a real GA denominator; fall back to PH visitors."""
    score = compute_headline_verdict(
        mvp(visitors=100, signups=6, ga_clicks=0),
        {},
        THRESHOLDS,
    )
    assert score["metrics"]["denominator_source"] == "ph"
    assert score["headline_verdict"] == VERDICT_GO
    assert score["metrics"]["true_conv_rate"] == 0.06


def test_ph_overcount_capture_rate_above_100():
    """x-predict real case: GA 2055, PH 2545. capture_rate = 124% (PH over-counts)."""
    score = compute_headline_verdict(
        mvp(visitors=2545, signups=0, ga_clicks=2055),
        {},
        THRESHOLDS,
    )
    assert score["metrics"]["capture_rate"] > 1.0
    # NO_GO fires (visitors=2055 >= floor, conv=0%).
    assert score["headline_verdict"] == VERDICT_NO_GO


def test_ga_only_mvp_with_zero_ph_visitors_no_signups():
    """ga_only synthetic record below floor → INSUFFICIENT_DATA when no
    ga_clicks_without_ph_traffic flag set."""
    score = compute_headline_verdict(
        mvp(visitors=0, signups=0, ga_clicks=27, ga_only=True),
        {},  # no flag set
        THRESHOLDS,
    )
    assert score["headline_verdict"] == VERDICT_INSUFFICIENT
    assert score["ga_only"] is True


def test_visitors_needed_zero_for_go():
    score = compute_headline_verdict(mvp(visitors=100, signups=10), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_GO
    assert score["visitors_needed"] == 0


def test_visitors_needed_zero_for_no_go():
    score = compute_headline_verdict(mvp(visitors=100, signups=0), {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["visitors_needed"] == 0


def test_metrics_conv_rate_when_visitors_present():
    score = compute_headline_verdict(mvp(visitors=80, signups=4), {}, THRESHOLDS)
    assert score["metrics"]["conv_rate"] == 0.05


def test_metrics_conv_rate_zero_when_zero_visitors():
    score = compute_headline_verdict(mvp(visitors=0, signups=0), {}, THRESHOLDS)
    assert score["metrics"]["conv_rate"] == 0.0


def test_signup_events_carried_through():
    score = compute_headline_verdict(
        mvp(visitors=40, signups=3, signup_events=["signup_complete", "waitlist_signup"]),
        {},
        THRESHOLDS,
    )
    assert score["signup_events"] == ["signup_complete", "waitlist_signup"]


def test_verdict_enum_consistency():
    """Each verdict path returns a value in the registry-asserted enum."""
    cases = [
        (mvp(visitors=100, signups=10), {}, VERDICT_GO),       # 10% conv
        (mvp(visitors=100, signups=0), {}, VERDICT_NO_GO),     # 0% conv
        (mvp(visitors=200, signups=2), {}, VERDICT_NO_GO),     # 1% conv
        (mvp(visitors=20, signups=0), {}, VERDICT_INSUFFICIENT),
        (mvp(visitors=10, signups=0), {"no_event_data": True}, VERDICT_NO_DATA),
    ]
    for m, issues, expected in cases:
        score = compute_headline_verdict(m, issues, THRESHOLDS)
        assert score["headline_verdict"] == expected
        assert score["headline_verdict"] in VERDICT_ENUM


def test_signup_source_db_real_zero_suppresses_ph_go():
    record = mvp(visitors=100, signups=5, ga_clicks=100)
    record.update({
        "db_signups_real": 0,
        "db_signups_real_windowed": True,
        "db_source": "supabase",
        "db_unmapped_reason": None,
        "ph_signups": 5,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert score["metrics"]["signup_source"] == "db_real_zero"
    assert score["metrics"]["effective_signups"] == 0
    assert any(f["flag"] == "db_zero_with_ph_signups" for f in score["tracking_sanity_flags"])


def test_signup_source_db_real_for_low_real_counts_with_ph_zero():
    """DB-first: when trusted DB is available, use it regardless of PH. Verdict
    follows conv >= 6%."""
    for n, expected in [(1, VERDICT_NO_GO), (5, VERDICT_NO_GO), (6, VERDICT_GO), (10, VERDICT_GO)]:
        record = mvp(visitors=100, signups=0, ga_clicks=100)
        record.update({
            "db_signups_real": n,
            "db_signups_real_windowed": True,
            "db_source": "railway",
            "db_unmapped_reason": None,
            "ph_signups": 0,
            "ph_signups_available": True,
        })
        score = compute_headline_verdict(record, {}, THRESHOLDS)
        assert score["headline_verdict"] == expected, f"n={n}: got {score['headline_verdict']}, expected {expected}"
        assert score["metrics"]["signup_source"] == "db_real"
        assert score["metrics"]["effective_signups"] == n


def test_signup_source_db_real_preferred_over_ph_when_both_positive():
    """Key DB-first behavior: when DB AND PH both have signal, use DB."""
    record = mvp(visitors=100, signups=14, ga_clicks=100)
    record.update({
        "db_signups_real": 17,             # DB has more (truth)
        "db_signups_real_windowed": True,
        "db_source": "supabase",
        "db_unmapped_reason": None,
        "ph_signups": 14,                  # PH undercounts
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "db_real"
    assert score["metrics"]["effective_signups"] == 17
    # conv = 17/100 = 17% → GO
    assert score["headline_verdict"] == VERDICT_GO


def test_db_first_sanity_flags_compare_raw_ph_to_db_for_overcount():
    """DB-first verdicts still need PH-vs-DB sanity flags for bad signup_events."""
    record = mvp(visitors=100, signups=3, ga_clicks=100)
    record.update({
        "db_signups_real": 1,
        "db_signups_real_windowed": True,
        "db_source": "supabase",
        "db_unmapped_reason": None,
        "ph_signups": 3,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "db_real"
    assert score["metrics"]["effective_signups"] == 1
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert any(f["flag"] == "ph_overcount" for f in score["tracking_sanity_flags"])


def test_db_first_sanity_flags_compare_raw_ph_to_db_for_attribution_gap():
    """DB-first must not mask PH paid=0 when DB proves real paid signups exist."""
    record = mvp(visitors=100, signups=0, ga_clicks=100)
    record.update({
        "db_signups_real": 6,
        "db_signups_real_windowed": True,
        "db_source": "railway",
        "db_unmapped_reason": None,
        "ph_signups": 0,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "db_real"
    assert score["metrics"]["effective_signups"] == 6
    assert score["headline_verdict"] == VERDICT_GO
    assert any(f["flag"] == "ph_attribution_broken" for f in score["tracking_sanity_flags"])


def test_db_first_sanity_flags_compare_raw_ph_to_db_for_undercount():
    """DB-first must still flag DB counts that are much higher than PH paid."""
    record = mvp(visitors=200, signups=2, ga_clicks=200)
    record.update({
        "db_signups_real": 10,
        "db_signups_real_windowed": True,
        "db_source": "supabase",
        "db_unmapped_reason": None,
        "ph_signups": 2,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "db_real"
    assert score["metrics"]["effective_signups"] == 10
    assert score["headline_verdict"] == VERDICT_NO_GO
    assert any(f["flag"] == "ph_undercount" for f in score["tracking_sanity_flags"])


def test_signup_source_ph_fallback_when_db_unmapped():
    """When db_unmapped_reason is set, DB is untrusted → fall back to PH."""
    record = mvp(visitors=100, signups=8, ga_clicks=100)
    record.update({
        "db_signups_real": None,
        "db_signups_real_windowed": False,
        "db_source": None,
        "db_unmapped_reason": "no_match",
        "ph_signups": 8,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "ph"
    assert score["metrics"]["effective_signups"] == 8
    assert score["headline_verdict"] == VERDICT_GO


def test_signup_source_ph_fallback_when_db_unmapped_even_with_count():
    """An unmapped DB count is not trusted; PH remains the fallback source."""
    record = mvp(visitors=100, signups=8, ga_clicks=100)
    record.update({
        "db_signups_real": 17,
        "db_signups_real_windowed": True,
        "db_source": "supabase",
        "db_unmapped_reason": "no_match",
        "ph_signups": 8,
        "ph_signups_available": True,
    })
    score = compute_headline_verdict(record, {}, THRESHOLDS)
    assert score["metrics"]["signup_source"] == "ph"
    assert score["metrics"]["effective_signups"] == 8
    assert score["headline_verdict"] == VERDICT_GO


def test_is_trusted_db_real_rejects_untrusted_sources():
    base = {"db_signups_real": 1, "db_signups_real_windowed": True, "db_source": "supabase", "db_unmapped_reason": None}
    assert is_trusted_db_real(base)
    for patch in [
        {"db_source": None},
        {"db_source": "unknown"},
        {"db_unmapped_reason": "query_error"},
        {"db_signups_real_windowed": False},
    ]:
        candidate = dict(base, **patch)
        assert not is_trusted_db_real(candidate)


def test_sort_scores_global_verdict_precedence_before_owner():
    scores = [
        {"name": "weak-b", "owner": "a", "headline_verdict": VERDICT_WEAK, "metrics": {"gclid_visitors": 200}},
        {"name": "go", "owner": "z", "headline_verdict": VERDICT_GO, "metrics": {"gclid_visitors": 1}},
        {"name": "missing", "owner": "a", "headline_verdict": VERDICT_MISSING_PROJECT_NAME, "metrics": {"gclid_visitors": 1}},
    ]
    assert [s["name"] for s in sort_scores_global(scores)] == ["missing", "go", "weak-b"]


def test_sort_scores_global_uses_traffic_then_name_within_verdict():
    scores = [
        {"name": "b", "owner": "a", "headline_verdict": VERDICT_WEAK, "metrics": {"gclid_visitors": 5}},
        {"name": "a", "owner": "z", "headline_verdict": VERDICT_WEAK, "metrics": {"gclid_visitors": 5}},
        {"name": "c", "owner": "a", "headline_verdict": VERDICT_WEAK, "metrics": {"ga_clicks": 10, "gclid_visitors": 1}},
    ]
    assert [s["name"] for s in sort_scores_global(scores)] == ["c", "a", "b"]


def test_sort_scores_by_owner_groups_owner_before_global_ordering():
    scores = [
        {"name": "missing-z", "owner": "z", "headline_verdict": VERDICT_MISSING_PROJECT_NAME, "metrics": {"gclid_visitors": 100}},
        {"name": "weak-a", "owner": "a", "headline_verdict": VERDICT_WEAK, "metrics": {"gclid_visitors": 1}},
        {"name": "go-a", "owner": "a", "headline_verdict": VERDICT_GO, "metrics": {"gclid_visitors": 1}},
    ]
    assert [s["name"] for s in sort_scores_by_owner(scores)] == ["go-a", "weak-a", "missing-z"]


# ---------- Telegram emission ----------

def test_telegram_block_per_owner():
    scores = [
        compute_headline_verdict(mvp(name="a", owner="alice", visitors=80, signups=5), {}, THRESHOLDS),
        compute_headline_verdict(mvp(name="b", owner="bob", visitors=20, signups=0), {}, THRESHOLDS),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    assert "alice" in text
    assert "bob" in text
    # Two blocks separated by ---
    assert text.count("---") >= 1


def test_telegram_unassigned_when_no_owner():
    scores = [
        compute_headline_verdict(mvp(name="a", owner=None, visitors=80, signups=5), {}, THRESHOLDS),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    assert "unassigned" in text


def test_telegram_block_under_4096():
    scores = [
        compute_headline_verdict(mvp(name=f"mvp_{i}", owner="alice", visitors=10, signups=0), {}, THRESHOLDS)
        for i in range(50)
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    # Single block (all alice's), must be ≤ 4096 (we cap at 3990 + truncation note).
    assert len(text) <= 4096


def test_telegram_includes_debug_prompt_when_no_data():
    scores = [
        compute_headline_verdict(
            mvp(name="x", owner="alice", visitors=100, signups=0),
            {"no_event_data": True},
            THRESHOLDS,
        )
    ]
    debug_prompts = {"NO_DATA": "Run this prompt to fix tracking..."}
    text = emit_telegram(scores, debug_prompts, visitors_floor=50)
    assert "Run this prompt to fix tracking" in text


def test_telegram_shows_ga_clicks_when_denominator_is_ga():
    """When ga_clicks > 0 the visitor line shows GA-clicks AND PH-visit."""
    scores = [
        compute_headline_verdict(
            mvp(name="stylica-ai", visitors=201, signups=33, ga_clicks=575),
            {},
            THRESHOLDS,
        ),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    assert "575 GA-clicks" in text
    assert "201 PH-visit" in text


def test_telegram_emits_capture_warning_when_under_50_percent():
    """report-pilot real case: GA 49, PH 6 → 12% capture, ⚠ warning."""
    scores = [
        compute_headline_verdict(
            mvp(name="report-pilot", visitors=6, signups=1, ga_clicks=49),
            {},
            THRESHOLDS,
        ),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    assert "PH capturing only" in text


def test_telegram_emits_overcount_warning_when_ph_exceeds_ga():
    """x-predict real case: GA 2055, PH 2545 = 124% → ⚠ overcount."""
    scores = [
        compute_headline_verdict(
            mvp(name="x-predict", visitors=2545, signups=0, ga_clicks=2055),
            {},
            THRESHOLDS,
        ),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    assert "PH-overcount" in text


def test_telegram_universal_rule_uses_visitors_floor():
    scores = [
        compute_headline_verdict(mvp(name="a", visitors=10, signups=0), {}, THRESHOLDS),
    ]
    text = emit_telegram(scores, {}, visitors_floor=50)
    # Should reference the actual threshold, not "50 visitors" by accident
    assert "<50 visitors" in text or "≥50 visitors" in text


def test_telegram_universal_rule_uses_conv_rate_threshold():
    scores = [
        compute_headline_verdict(mvp(name="a", visitors=100, signups=7), {}, THRESHOLDS),
    ]
    text = emit_telegram(scores, {}, visitors_floor=100, conv_rate_go=0.08)
    assert "conv ≥8%" in text
    assert "conv <8%" in text


def test_action_line_formats_visitors_needed():
    line = action_line(VERDICT_INSUFFICIENT, "smelt", signups=0, visitors_needed=9, visitors_floor=50)
    assert "9 more visitors" in line
    assert "50" in line


def test_action_line_weak_mentions_signups():
    line = action_line(VERDICT_WEAK, "statistica", signups=2, visitors_needed=0, visitors_floor=50)
    assert "2 signups" in line


def test_parse_debug_prompts_extracts_sections():
    md = """# Header

Some intro text.

## NO_DATA

Body of no_data prompt.
Multi-line OK.

## WEAK

Body of weak prompt.
"""
    parsed = parse_debug_prompts(md)
    assert "NO_DATA" in parsed
    assert "WEAK" in parsed
    assert "no_data prompt" in parsed["NO_DATA"]


# ---------- main() integration ----------

def test_main_requires_output_or_emit_telegram():
    """main() should error if neither --output nor --emit-telegram is given."""
    import io
    from contextlib import redirect_stderr

    err = io.StringIO()
    with redirect_stderr(err):
        rc = main(["--data", "/dev/null", "--issues", "/dev/null"])
    assert rc == 2
    assert "must specify at least one" in err.getvalue()


def test_main_writes_output_from_data_and_issues():
    """main() reads data + issues, applies verdict, writes scores.json."""
    import json as _json
    import tempfile

    data = {
        "mvps": [
            {
                "name": "diarly",
                "owner": "lego",
                "gclid_visitors": 100,
                "signups": 8,
                "signup_events": ["signup_complete"],
                "total_events_count": 745,
                "event_catalog": [],
            }
        ]
    }
    issues = {"mvps": [{"name": "diarly", "no_event_data": False}]}

    with tempfile.TemporaryDirectory() as td:
        data_path = os.path.join(td, "data.json")
        issues_path = os.path.join(td, "issues.json")
        out_path = os.path.join(td, "scores.json")
        _json.dump(data, open(data_path, "w"))
        _json.dump(issues, open(issues_path, "w"))

        rc = main([
            "--data", data_path,
            "--issues", issues_path,
            "--config", "/nonexistent.yaml",
            "--output", out_path,
        ])
        assert rc == 0
        result = _json.load(open(out_path))
        assert result["mvps"][0]["headline_verdict"] == VERDICT_GO
        assert result["mvps"][0]["metrics"]["conv_rate"] == 0.08


def test_main_scores_input_skips_recomputation():
    """When --scores is provided, the script reads it and skips data/issues recomputation."""
    import json as _json
    import tempfile

    pre_scores = {
        "thresholds": {"signups_go": 3, "visitors_floor": 50},
        "window_days": 90,
        "mvps": [
            {
                "name": "m",
                "owner": "alice",
                "headline_verdict": "GO",
                "visitors_needed": 0,
                "metrics": {"gclid_visitors": 80, "signups": 5, "conv_rate": 0.0625},
                "signup_events": ["signup_complete"],
            }
        ],
    }
    with tempfile.TemporaryDirectory() as td:
        scores_path = os.path.join(td, "scores.json")
        telegram_path = os.path.join(td, "telegram.txt")
        _json.dump(pre_scores, open(scores_path, "w"))

        # Pass non-existent data/issues paths — the script must NOT touch them.
        rc = main([
            "--data", "/nonexistent-data.json",
            "--issues", "/nonexistent-issues.json",
            "--scores", scores_path,
            "--config", "/nonexistent.yaml",
            "--debug-prompts", "/nonexistent-prompts.md",
            "--emit-telegram", telegram_path,
        ])
        assert rc == 0
        text = open(telegram_path).read()
        assert "alice" in text
        assert "GO" in text


def test_main_emits_visitors_floor_in_universal_rule():
    """Telegram artifact's universal rule references the configured visitors_floor."""
    import json as _json
    import tempfile

    data = {"mvps": [{"name": "m", "owner": "alice", "gclid_visitors": 10, "signups": 0, "signup_events": []}]}
    issues = {"mvps": [{"name": "m"}]}
    config_yaml = "thresholds:\n  signups_go: 3\n  visitors_floor: 100\n"

    with tempfile.TemporaryDirectory() as td:
        data_path = os.path.join(td, "data.json")
        issues_path = os.path.join(td, "issues.json")
        cfg_path = os.path.join(td, "config.yaml")
        tg_path = os.path.join(td, "telegram.txt")

        _json.dump(data, open(data_path, "w"))
        _json.dump(issues, open(issues_path, "w"))
        open(cfg_path, "w").write(config_yaml)

        rc = main([
            "--data", data_path,
            "--issues", issues_path,
            "--config", cfg_path,
            "--output", os.path.join(td, "scores.json"),
            "--emit-telegram", tg_path,
        ])
        assert rc == 0
        text = open(tg_path).read()
        assert "100" in text  # The custom visitors_floor


# Self-runner so this file works without pytest installed.
if __name__ == "__main__":
    import inspect

    failed = 0
    passed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn) and inspect.signature(fn).parameters == {}:
            try:
                fn()
                print(f"PASS  {name}")
                passed += 1
            except Exception as e:
                print(f"FAIL  {name}: {e!r}")
                failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)
