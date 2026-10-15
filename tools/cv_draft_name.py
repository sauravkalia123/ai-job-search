#!/usr/bin/env python3
"""Deterministic filename for auto-generated CV drafts.

Usage:
    python3 tools/cv_draft_name.py --company "<company>" --role "<role>" --country DE

Prints one line: cv_saurav_<company>_<role>_<country>.html, capped at 40
characters (stem). Long names truncate deterministically with a 3-char hash
suffix so two different long names never collide and the same inputs always
produce the same filename (same invariant as tools/job_key.py).
"""

import argparse
import hashlib
import re

MAX_STEM = 40


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "na"


def draft_name(company: str, role: str, country: str) -> str:
    country = slug(country)
    stem = f"cv_saurav_{slug(company)}_{slug(role)}_{country}"
    if len(stem) <= MAX_STEM:
        return f"{stem}.html"
    digest = hashlib.md5(stem.encode()).hexdigest()[:3]
    return f"{stem[:MAX_STEM - 4]}-{digest}.html"


def main() -> int:
    ap = argparse.ArgumentParser(description="Deterministic CV draft filename (<= 40 chars).")
    ap.add_argument("--company", required=True)
    ap.add_argument("--role", required=True)
    ap.add_argument("--country", required=True)
    args = ap.parse_args()
    name = draft_name(args.company, args.role, args.country)
    assert len(name) - len(".html") <= MAX_STEM
    print(name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
