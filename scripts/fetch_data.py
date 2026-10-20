"""Fetch publications from ORCID and profile info from GitHub.

Runs daily in GitHub Actions (.github/workflows/update-data.yml).
Writes data/orcid.json and data/github.json. Uses only the standard library.
Web of Science papers arrive through ORCID (your WoS profile is synced to ORCID).
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

ORCID_ID = "0000-0002-8083-2653"
GITHUB_USER = os.environ.get("GITHUB_USER", "MoeMirzaei")
OUT = os.path.join(os.path.dirname(__file__), "..", "data")


def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "moemirzaei-site", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def val(d, *keys):
    """Safely walk nested dicts; ORCID uses {'value': ...} wrappers a lot."""
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def fmt_date(d):
    if not d:
        return ""
    y, m = val(d, "year", "value"), val(d, "month", "value")
    return f"{y}-{m}" if y and m else (y or "")


def orcid():
    base = f"https://pub.orcid.org/v3.0/{ORCID_ID}"
    rec = get_json(f"{base}/record")
    person = rec.get("person") or {}
    acts = rec.get("activities-summary") or {}

    works = []
    for group in val(acts, "works", "group") or []:
        s = (group.get("work-summary") or [{}])[0]  # first = preferred source
        ids = val(s, "external-ids", "external-id") or []
        doi = next((i.get("external-id-value") for i in ids if i.get("external-id-type") == "doi"), None)
        url = (f"https://doi.org/{doi}" if doi else None) or val(s, "url", "value")
        works.append({
            "title": val(s, "title", "title", "value") or "Untitled",
            "venue": val(s, "journal-title", "value") or "",
            "year": val(s, "publication-date", "year", "value") or "",
            "type": (s.get("type") or "").replace("-", " "),
            "doi": doi,
            "url": url,
        })
    works.sort(key=lambda w: w["year"] or "0", reverse=True)

    def affiliations(section):
        out = []
        for g in val(acts, section, "affiliation-group") or []:
            for item in g.get("summaries") or []:
                s = next(iter(item.values()))
                out.append({
                    "org": val(s, "organization", "name") or "",
                    "role": s.get("role-title") or "",
                    "dept": s.get("department-name") or "",
                    "start": fmt_date(s.get("start-date")),
                    "end": fmt_date(s.get("end-date")),
                })
        return out

    # Peer reviews (Web of Science reviews arrive here when WoS -> ORCID sync is on)
    reviews = []
    for g in val(acts, "peer-reviews", "group") or []:
        for pg in g.get("peer-review-group") or []:
            for r in pg.get("peer-review-summary") or []:
                reviews.append({
                    "year": val(r, "completion-date", "year", "value") or "",
                    "publisher": val(r, "convening-organization", "name") or "",
                    "type": r.get("review-type") or "",
                    "source": val(r, "source", "source-name", "value") or "",
                })
    by_year = {}
    for r in reviews:
        if r["year"]:
            by_year[r["year"]] = by_year.get(r["year"], 0) + 1

    return {
        "orcid": ORCID_ID,
        "peerReviews": {
            "total": len(reviews),
            "venues": len(val(acts, "peer-reviews", "group") or []),
            "byYear": dict(sorted(by_year.items(), reverse=True)),
            "publishers": sorted({r["publisher"] for r in reviews if r["publisher"]}),
        },
        "biography": val(person, "biography", "content") or "",
        "keywords": [k.get("content") for k in val(person, "keywords", "keyword") or [] if k.get("content")],
        "employments": affiliations("employments"),
        "educations": affiliations("educations"),
        "works": works,
    }


def github():
    h = {}
    if os.environ.get("GITHUB_TOKEN"):
        h["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    u = get_json(f"https://api.github.com/users/{GITHUB_USER}", h)
    return {k: u.get(k) for k in ("login", "name", "bio", "company", "avatar_url", "html_url", "public_repos", "followers")}


def save(name, data):
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = os.path.join(OUT, name)
    # Only rewrite when content changed (ignoring the date), so the Action makes no empty commits.
    try:
        with open(path) as f:
            old = json.load(f)
        old.pop("updated", None)
        if old == {k: v for k, v in data.items() if k != "updated"}:
            print(f"{name}: no change")
            return
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"{name}: updated")


if __name__ == "__main__":
    failed = False
    for name, fn in (("orcid.json", orcid), ("github.json", github)):
        try:
            save(name, fn())
        except Exception as e:  # keep the old file if a source is down
            print(f"{name}: FAILED ({e})", file=sys.stderr)
            failed = True
    sys.exit(1 if failed else 0)
