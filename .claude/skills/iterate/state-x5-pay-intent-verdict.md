# STATE x5: PAY_INTENT_VERDICT

Self-contained Phase 2 cross-MVP verdict. This state does not run or reuse
state-x0/x0a/x0b/x1/x1a/x2/x3/x4. It owns
`.runs/iterate-cross-phase2-context.json` and writes its own Phase 2 artifacts.

**PRECONDITIONS:**
- `~/.posthog/personal-api-key` exists and has scope `query:read` and `project:read`
- `.runs/iterate-cross-ga-clicks.csv` exists, is fresh, and was exported from Google Ads
- Phase 2 campaign names / `utm_campaign` values contain the configured Phase 2 token

**ACTIONS:**

### Step 1: Resolve Phase 2 config and fail closed

Resolve `phase2.utm_campaign_like` from `experiment/iterate-cross-config.yaml`.
The default is `%phase2%`. An explicitly empty value is a STOP, and
`fallback_all_gclid` is forced false for this mode.

```bash
python3 - <<'PY'
import json
import os
import subprocess
import sys

try:
    import yaml
except ImportError:
    yaml = None

cfg_path = "experiment/iterate-cross-config.yaml"
cfg = {}
if yaml is not None and os.path.exists(cfg_path):
    cfg = yaml.safe_load(open(cfg_path)) or {}

phase2 = cfg.get("phase2") or {}
phase_filter = phase2.get("utm_campaign_like", "%phase2%")
if phase_filter is None or not str(phase_filter).strip():
    sys.exit(
        "STOP: /iterate --cross --phase2 requires phase2.utm_campaign_like. "
        "Set it to a non-empty LIKE pattern such as %phase2%."
    )
phase_filter = str(phase_filter).strip()

api_key_path = os.path.expanduser("~/.posthog/personal-api-key")
if not os.path.exists(api_key_path):
    sys.exit(
        "STOP: PostHog personal API key not found at ~/.posthog/personal-api-key. "
        "Create one with query:read and project:read, then re-run /iterate --cross --phase2."
    )
api_key = open(api_key_path).read().strip()

project_id = cfg.get("posthog_project_id")
if not project_id:
    r = subprocess.run(
        [
            "curl",
            "-s",
            "https://us.i.posthog.com/api/projects/",
            "-H",
            f"Authorization: Bearer {api_key}",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit("STOP: Could not discover PostHog project ID. Check API key scope/project access.")
    try:
        project_id = json.loads(r.stdout)["results"][0]["id"]
    except Exception as exc:
        sys.exit(f"STOP: Could not parse PostHog projects response: {exc}")

ctx_path = ".runs/iterate-cross-phase2-context.json"
ctx = json.load(open(ctx_path)) if os.path.exists(ctx_path) else {
    "skill": "iterate-cross-phase2",
    "completed_states": [],
}
ctx.update({
    "mode": "cross-phase2",
    "phase": 2,
    "window_days": int(cfg.get("window_days", 90)),
    "posthog_project_id": str(project_id),
    "phase2_utm_campaign_like": phase_filter,
    "fallback_all_gclid": False,
    "mvps": ctx.get("mvps", []),
})
json.dump(ctx, open(ctx_path, "w"), indent=2)
PY
```

### Step 2: Restate the blocking GA CSV gate

The CSV is the sole paid-click source. It must exist, be no more than 24 hours
old, and have a valid header. Validation uses the same Phase 2 campaign filter
as the numerator. A valid CSV with zero matching Phase 2 rows is accepted as a
phase-scoped zero-click input.

```bash
CSV=.runs/iterate-cross-ga-clicks.csv
MAX_AGE_HOURS=24
PHASE2_UTM_CAMPAIGN_LIKE=$(python3 -c "import json; print(json.load(open('.runs/iterate-cross-phase2-context.json'))['phase2_utm_campaign_like'])")
WINDOW_DAYS=$(python3 -c "import json; print(json.load(open('.runs/iterate-cross-phase2-context.json')).get('window_days', 90))")

print_export_instructions() {
  cat >&2 <<EOF

How to export (~30 seconds):

  1. Open the MCC parent campaigns view in Google Ads
  2. Set the date range to last ${WINDOW_DAYS} days
  3. Make sure the columns include at minimum: Campaign, Clicks
  4. Click Download icon -> CSV
  5. Save the file as: .runs/iterate-cross-ga-clicks.csv
  6. Re-run /iterate --cross --phase2

The skill cannot produce trustworthy Phase 2 verdicts without fresh paid-click data.
EOF
}

if [ ! -f "$CSV" ]; then
  echo "STOP: /iterate --cross --phase2 requires a Google Ads click CSV." >&2
  print_export_instructions
  exit 1
fi

AGE_HOURS=$(python3 -c "import os, time; print(int((time.time() - os.path.getmtime('$CSV')) / 3600))")
if [ "$AGE_HOURS" -gt "$MAX_AGE_HOURS" ]; then
  echo "STOP: GA CSV is ${AGE_HOURS}h old (max ${MAX_AGE_HOURS}h)." >&2
  echo "File: $CSV" >&2
  print_export_instructions
  exit 1
fi

python3 .claude/scripts/lib/iterate_cross_ga.py validate-csv \
  --ga-csv "$CSV" \
  --context .runs/iterate-cross-phase2-context.json \
  --phase-filter "$PHASE2_UTM_CAMPAIGN_LIKE" || exit 1
```

### Step 3: Discover Phase 2 MVPs and orphan tracking

Run a lean discovery query for paid-gclid traffic whose
`properties.utm_campaign` matches the Phase 2 filter. Also run a minimal
phase-scoped orphan query for events where `project_name` is NULL/empty; those
synthetic orphan rows are the source of `missing_project_name`.

```bash
python3 - <<'PY'
import json
import os
import sys

sys.path.insert(0, ".claude/scripts/lib")
from gclid_filter import PAID_GCLID_FILTER
from iterate_cross_posthog_batch import paginate_discovery_query

ctx_path = ".runs/iterate-cross-phase2-context.json"
ctx = json.load(open(ctx_path))
project_id = ctx["posthog_project_id"]
window_days = int(ctx.get("window_days", 90))
phase_filter = ctx["phase2_utm_campaign_like"]
api_key = open(os.path.expanduser("~/.posthog/personal-api-key")).read().strip()
values = {"empty": "", "phase_campaign": phase_filter}

phase_clause = (
    "AND properties.utm_campaign IS NOT NULL "
    "AND toString(properties.utm_campaign) LIKE {phase_campaign} "
)

sql = (
    "SELECT properties.project_name AS mvp_key, "
    "max(toString(properties.utm_campaign)) AS sample_utm_campaign, "
    "count(DISTINCT distinct_id) AS gclid_visitors_phase2, "
    "count() AS phase2_events, "
    "min(timestamp) AS first_seen, max(timestamp) AS last_seen "
    f"FROM events WHERE {PAID_GCLID_FILTER} "
    f"{phase_clause}"
    "AND properties.project_name IS NOT NULL "
    "AND properties.project_name != {empty} "
    f"AND timestamp >= now() - INTERVAL {window_days} DAY "
    "GROUP BY mvp_key HAVING gclid_visitors_phase2 > 0 "
    "ORDER BY gclid_visitors_phase2 DESC LIMIT 200"
)
rows, metadata = paginate_discovery_query(sql, values, project_id, api_key, page_size=200)
json.dump(
    {"results": rows, "_phase2_canonical_pagination_status": metadata},
    open(".runs/_iterate-cross-phase2-discover.json", "w"),
    indent=2,
)

orphan_sql = (
    "SELECT splitByChar('.', domain(coalesce(properties.$current_url, '')))[1] AS host_prefix, "
    "max(toString(properties.utm_campaign)) AS sample_utm_campaign, "
    "count(DISTINCT distinct_id) AS gclid_visitors_phase2, "
    "count() AS phase2_events, "
    "min(timestamp) AS first_seen, max(timestamp) AS last_seen "
    f"FROM events WHERE {PAID_GCLID_FILTER} "
    f"{phase_clause}"
    "AND (properties.project_name IS NULL OR properties.project_name = {empty}) "
    f"AND timestamp >= now() - INTERVAL {window_days} DAY "
    "GROUP BY host_prefix HAVING gclid_visitors_phase2 > 0 "
    "ORDER BY gclid_visitors_phase2 DESC LIMIT 50"
)
orphan_rows, orphan_metadata = paginate_discovery_query(
    orphan_sql,
    values,
    project_id,
    api_key,
    page_size=50,
)
json.dump(
    {"results": orphan_rows, "_phase2_orphan_pagination_status": orphan_metadata},
    open(".runs/_iterate-cross-phase2-orphan.json", "w"),
    indent=2,
)

cfg = {}
try:
    import yaml
    if os.path.exists("experiment/iterate-cross-config.yaml"):
        cfg = yaml.safe_load(open("experiment/iterate-cross-config.yaml")) or {}
except ImportError:
    pass
mappings = cfg.get("mvp_mappings") or {}

mvps = []
for row in rows:
    name = row[0]
    mapping = mappings.get(name) or {}
    visitors = int(row[2] or 0)
    mvps.append({
        "name": name,
        "owner": mapping.get("owner"),
        "deploy_domain": mapping.get("deploy_domain"),
        "sample_utm_campaign": row[1],
        "gclid_visitors": visitors,
        "gclid_visitors_phase2": visitors,
        "phase2_events": int(row[3] or 0),
        "first_seen": row[4],
        "last_seen": row[5],
        "phase_match": True,
        "orphan": False,
        "partial_tracking_pct": None,
        "ga_clicks": 0,
        "ga_conv": 0.0,
        "ga_campaigns": [],
        "pay_intents": 0,
    })

for row in orphan_rows:
    host = row[0] or "unknown"
    visitors = int(row[2] or 0)
    mvps.append({
        "name": f"__orphan_{host}__",
        "owner": None,
        "deploy_domain": None,
        "sample_utm_campaign": row[1],
        "gclid_visitors": visitors,
        "gclid_visitors_phase2": visitors,
        "phase2_events": int(row[3] or 0),
        "first_seen": row[4],
        "last_seen": row[5],
        "phase_match": True,
        "orphan": True,
        "partial_tracking_pct": None,
        "ga_clicks": 0,
        "ga_conv": 0.0,
        "ga_campaigns": [],
        "pay_intents": 0,
    })

ctx["mvps"] = mvps
ctx["_phase2_canonical_pagination_status"] = metadata
ctx["_phase2_orphan_pagination_status"] = orphan_metadata
json.dump(ctx, open(ctx_path, "w"), indent=2)
PY
```

### Step 4: Gather phase-scoped pay_intent numerator

Count distinct paid-gclid users firing `pay_intent`, filtered by the same
`properties.utm_campaign LIKE phase2.utm_campaign_like` value used in discovery
and GA merge.

```bash
python3 - <<'PY'
import json
import os
import sys

sys.path.insert(0, ".claude/scripts/lib")
from gclid_filter import PAID_GCLID_FILTER
from iterate_cross_posthog_batch import paginate_discovery_query

ctx_path = ".runs/iterate-cross-phase2-context.json"
ctx = json.load(open(ctx_path))
project_id = ctx["posthog_project_id"]
window_days = int(ctx.get("window_days", 90))
phase_filter = ctx["phase2_utm_campaign_like"]
api_key = open(os.path.expanduser("~/.posthog/personal-api-key")).read().strip()
values = {"empty": "", "phase_campaign": phase_filter, "pay_intent": "pay_intent"}

sql = (
    "SELECT properties.project_name AS mvp_key, "
    "count(DISTINCT distinct_id) AS pay_intents, "
    "min(timestamp) AS first_pay_intent_at, max(timestamp) AS last_pay_intent_at, "
    "max(toString(properties.price_cents)) AS pay_intent_price_cents, "
    "count(DISTINCT toString(properties.price_cents)) AS pay_intent_price_variants "
    "FROM events WHERE event = {pay_intent} "
    f"AND {PAID_GCLID_FILTER} "
    "AND properties.utm_campaign IS NOT NULL "
    "AND toString(properties.utm_campaign) LIKE {phase_campaign} "
    "AND properties.project_name IS NOT NULL "
    "AND properties.project_name != {empty} "
    f"AND timestamp >= now() - INTERVAL {window_days} DAY "
    "GROUP BY mvp_key ORDER BY pay_intents DESC LIMIT 200"
)
rows, metadata = paginate_discovery_query(sql, values, project_id, api_key, page_size=200)
json.dump(
    {"results": rows, "_phase2_pay_intent_pagination_status": metadata},
    open(".runs/_iterate-cross-phase2-pay-intents.json", "w"),
    indent=2,
)

by_name = {m["name"]: m for m in ctx.get("mvps", [])}
for row in rows:
    name = row[0]
    target = by_name.get(name)
    if target is None:
        target = {
            "name": name,
            "owner": None,
            "deploy_domain": None,
            "sample_utm_campaign": None,
            "gclid_visitors": 0,
            "gclid_visitors_phase2": 0,
            "phase2_events": 0,
            "first_seen": None,
            "last_seen": None,
            "phase_match": True,
            "orphan": False,
            "partial_tracking_pct": None,
            "ga_clicks": 0,
            "ga_conv": 0.0,
            "ga_campaigns": [],
            "pay_intent_price_cents": 0,
            "pay_intent_price_variants": 0,
        }
        ctx.setdefault("mvps", []).append(target)
        by_name[name] = target
    target["pay_intents"] = int(row[1] or 0)
    target["first_pay_intent_at"] = row[2]
    target["last_pay_intent_at"] = row[3]
    # No pay-intent row leaves price at 0. max(toString(...)) is lexicographic;
    # one fake-door price per MVP is the invariant, and variants >1 are flagged.
    target["pay_intent_price_cents"] = float(row[4] or 0)
    target["pay_intent_price_variants"] = int(row[5] or 0)

ctx["_phase2_pay_intent_pagination_status"] = metadata
json.dump(ctx, open(ctx_path, "w"), indent=2)
PY
```

### Step 5: Merge the phase-filtered GA denominator

Merge Google Ads clicks with the same resolved Phase 2 filter. The verdict uses
`ga_clicks` only as denominator; PostHog `gclid_visitors_phase2` is diagnostic.

```bash
PHASE2_UTM_CAMPAIGN_LIKE=$(python3 -c "import json; print(json.load(open('.runs/iterate-cross-phase2-context.json'))['phase2_utm_campaign_like'])")

python3 .claude/scripts/lib/iterate_cross_ga.py merge \
  --ga-csv .runs/iterate-cross-ga-clicks.csv \
  --context .runs/iterate-cross-phase2-context.json \
  --config experiment/iterate-cross-config.yaml \
  --unmatched-out .runs/_iterate-cross-phase2-ga-unmatched.json \
  --phase-filter "$PHASE2_UTM_CAMPAIGN_LIKE"

python3 - <<'PY'
import json

ctx_path = ".runs/iterate-cross-phase2-context.json"
ctx = json.load(open(ctx_path))
for m in ctx.get("mvps", []):
    m.setdefault("gclid_visitors_phase2", m.get("gclid_visitors", 0) or 0)
    m.setdefault("phase2_events", 0)
    m.setdefault("pay_intents", 0)
    m.setdefault("phase_match", True)
    m.setdefault("orphan", False)
json.dump(ctx, open(ctx_path, "w"), indent=2)
PY
```

### Step 6: Build phase-scoped integrity issues

Build the three issue flags locally because x5 skips x1a:
`missing_project_name`, `ga_clicks_without_ph_traffic`, and `no_event_data`.

```bash
ISSUES_PAYLOAD=$(python3 - <<'PY'
import json

ctx = json.load(open(".runs/iterate-cross-phase2-context.json"))
issues = []
for m in ctx.get("mvps", []):
    name = m.get("name")
    ga_clicks = int(m.get("ga_clicks", 0) or 0)
    phase_visitors = int(m.get("gclid_visitors_phase2", m.get("gclid_visitors", 0)) or 0)
    phase_events = int(m.get("phase2_events", 0) or 0)
    issues.append({
        "name": name,
        "missing_project_name": bool(m.get("orphan")),
        "ga_clicks_without_ph_traffic": ga_clicks > 0 and phase_visitors == 0,
        "no_event_data": phase_events == 0 and phase_visitors == 0,
    })
print(json.dumps({"mvps": issues}))
PY
)

bash .claude/scripts/lib/write-gate-artifact.sh \
  --path .runs/iterate-cross-phase2-issues.json \
  --payload "$ISSUES_PAYLOAD" \
  --skill iterate-cross-phase2
```

### Step 7: Compute pay-intent verdict and emit Phase 2 report

Use `compute_pay_intent_verdict(mvp, issues, thresholds)` and write Phase 2
artifacts only.

```bash
SCORES_PAYLOAD=$(python3 - <<'PY'
import json
import os
import sys

sys.path.insert(0, ".claude/scripts/lib")
from iterate_cross_verdicts import (
    VERDICT_GA_NO_PH_TRACKING,
    VERDICT_GO,
    VERDICT_INSUFFICIENT,
    VERDICT_MISSING_PROJECT_NAME,
    VERDICT_NO_DATA,
    VERDICT_NO_GO,
    compute_pay_intent_verdict,
    load_config,
    pay_intent_action_line,
    pay_intent_go_rank_key,
    pay_intent_revenue_cell,
    pay_intent_score_key,
)

ctx = json.load(open(".runs/iterate-cross-phase2-context.json"))
issues_data = json.load(open(".runs/iterate-cross-phase2-issues.json"))
issues_by_name = {m["name"]: m for m in issues_data.get("mvps", [])}
config = load_config("experiment/iterate-cross-config.yaml")
thresholds = config["thresholds"]

scores = [
    compute_pay_intent_verdict(m, issues_by_name.get(m.get("name"), {}), thresholds)
    for m in ctx.get("mvps", [])
]

scores = sorted(scores, key=pay_intent_score_key)
payload = {
    "phase": 2,
    "phase2_utm_campaign_like": ctx["phase2_utm_campaign_like"],
    "thresholds": thresholds,
    "window_days": ctx.get("window_days", 90),
    "mvps": scores,
}

theta = thresholds.get("pay_intent_rate_go", 0.02)
floor = thresholds["visitors_floor"]
report = [
    "# Phase 2 Pay-Intent Verdict",
    "",
    f"- Filter: `{ctx['phase2_utm_campaign_like']}`",
    f"- Window: {ctx.get('window_days', 90)} days",
    f"- Click floor: {floor}",
    f"- Pay-intent GO threshold: {theta:.2%}",
    "",
    "| MVP | Verdict | GA clicks | Pay intents | Pay-intent rate | Rev/click | Action |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
]
telegram = ["*Phase 2 pay-intent update*", ""]

if not scores:
    report.append("| No Phase 2 candidates matched the configured filter. | - | 0 | 0 | 0.00% | $0.00 | Check campaign naming and CSV export. |")
    telegram.append("No Phase 2 candidates matched the configured filter.")
else:
    for s in scores:
        metrics = s["metrics"]
        action = pay_intent_action_line(
            s["headline_verdict"],
            s.get("name") or "(unknown)",
            metrics["pay_intents"],
            s["visitors_needed"],
            floor,
            theta,
        )
        rev_cell = pay_intent_revenue_cell(metrics)
        report.append(
            f"| {s.get('name') or '(unknown)'} | {s['headline_verdict']} | "
            f"{metrics['ga_clicks']} | {metrics['pay_intents']} | "
            f"{metrics['pay_intent_rate']:.2%} | {rev_cell} | {action} |"
        )
        telegram.append(
            f"- {s.get('name') or '(unknown)'} "
            f"({metrics['ga_clicks']} GA-clicks / {metrics['pay_intents']} pay-intents / "
            f"{metrics['pay_intent_rate']:.2%} / {rev_cell}/click) -> {s['headline_verdict']}"
        )
        telegram.append(f"  Action: {action}")

go_ranked = [
    s for s in scores
    if s.get("headline_verdict") == VERDICT_GO
]
go_ranked = sorted(
    go_ranked,
    key=pay_intent_go_rank_key,
)
report.extend(["", "## GO Ranking", ""])
if go_ranked:
    for idx, s in enumerate(go_ranked[:10], 1):
        metrics = s["metrics"]
        rev_cell = pay_intent_revenue_cell(metrics)
        report.append(
            f"{idx}. {s.get('name')} - {rev_cell}/click "
            f"(rate {metrics['pay_intent_rate']:.2%}, "
            f"{metrics['pay_intents']}/{metrics['ga_clicks']})"
        )
else:
    report.append("No Phase 2 GO verdicts yet.")

open(".runs/iterate-cross-phase2-report.md", "w").write("\n".join(report) + "\n")
open(".runs/iterate-cross-phase2-telegram.txt", "w").write("\n".join(telegram) + "\n")
print(json.dumps(payload))
PY
)

bash .claude/scripts/lib/write-gate-artifact.sh \
  --path .runs/iterate-cross-phase2-scores.json \
  --payload "$SCORES_PAYLOAD" \
  --skill iterate-cross-phase2

echo "Wrote .runs/iterate-cross-phase2-scores.json"
```

**POSTCONDITIONS:**
- `.runs/iterate-cross-phase2-context.json` has `phase: 2`, non-empty `phase2_utm_campaign_like`, and `fallback_all_gclid: false`
- `.runs/iterate-cross-phase2-issues.json` exists with phase-scoped issue flags
- `.runs/iterate-cross-phase2-scores.json` exists with pay-intent verdict metrics
- `.runs/iterate-cross-phase2-report.md` and `.runs/iterate-cross-phase2-telegram.txt` are non-empty
- `.runs/_iterate-cross-phase2-ga-unmatched.json` exists for operator triage

**VERIFY:** see `state-registry.json` entry for `iterate-cross-phase2.x5`.

```bash
python3 -c "import json, os; ctx=json.load(open('.runs/iterate-cross-phase2-context.json')); assert ctx.get('phase') == 2, 'phase must be 2'; filt=ctx.get('phase2_utm_campaign_like'); assert isinstance(filt, str) and filt.strip(), 'phase2_utm_campaign_like empty'; assert ctx.get('fallback_all_gclid') is False, 'fallback_all_gclid must be false for phase2'; assert os.path.isfile('.runs/_iterate-cross-phase2-ga-unmatched.json'), 'phase2 GA unmatched triage file missing'; json.load(open('.runs/_iterate-cross-phase2-ga-unmatched.json')); issues=json.load(open('.runs/iterate-cross-phase2-issues.json')); assert isinstance(issues.get('mvps'), list), 'issues mvps not list'; scores=json.load(open('.runs/iterate-cross-phase2-scores.json')); ms=scores.get('mvps', []); assert isinstance(ms, list), 'scores mvps not list'; allowed={'GO','NO_GO','INSUFFICIENT_DATA','NO_DATA','MISSING_PROJECT_NAME','GA_NO_PH_TRACKING'}; bad=[m.get('name','?') for m in ms if m.get('headline_verdict') not in allowed]; assert not bad, 'invalid pay-intent verdicts: %s' % bad; missing=[m.get('name','?') for m in ms if any(k not in m.get('metrics', {}) for k in ('ga_clicks','pay_intents','pay_intent_rate','revenue_intent_per_click','denominator_source'))]; assert not missing, 'MVPs missing phase2 metrics: %s' % missing; denom=[m.get('name','?') for m in ms if m.get('metrics', {}).get('denominator_source') != 'ga']; assert not denom, 'phase2 denominator must be ga for all MVPs: %s' % denom; assert os.path.isfile('.runs/iterate-cross-phase2-report.md') and os.path.getsize('.runs/iterate-cross-phase2-report.md') > 0, 'phase2 report missing/empty'; assert os.path.isfile('.runs/iterate-cross-phase2-telegram.txt') and os.path.getsize('.runs/iterate-cross-phase2-telegram.txt') > 0, 'phase2 telegram missing/empty'"
```

**STATE TRACKING:** After postconditions pass, mark this state complete:
```bash
bash .claude/scripts/advance-state.sh iterate-cross-phase2 x5
```

**NEXT:** Read [.claude/patterns/state-99-epilogue.md](../../patterns/state-99-epilogue.md) to continue.
