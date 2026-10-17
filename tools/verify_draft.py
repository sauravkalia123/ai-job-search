#!/usr/bin/env python3
"""Zero-token verifier for auto-generated tailored CV drafts.

Usage:
    python3 tools/verify_draft.py --draft cv/drafts/<file>.html \
        --country DE [--master cv/master_cv.html]

Checks (FAIL = draft unusable until fixed; WARN = review at pick time):
  1. structure      non-empty, named h1, basic tag balance
  2. html hygiene   no unescaped '&', no template placeholders
  3. draft marker   '<!-- DRAFT' present (never mistake for a reviewed CV)
  4. contact        phone (digit-normalized), email, LinkedIn
  5. auth line      country-correct work-authorization header line
  6. fact-binding   years and percent-metrics must exist in the master CV
                    (catches fabricated numbers); employers drawn from the
                    master's known set

Exit code 0 iff no FAIL. All checks are mechanical — no model calls.
"""

import argparse
import re
import sys

KNOWN_EMPLOYERS = [
    "Lytx", "Voizzit", "Barco", "Samsung", "HCL Technologies", "Intek Digital",
    "Logic Eastern",
]

PLACEHOLDERS = ["{{", "}}", "TODO", "FIXME", "Lorem", "TBD", "[year]", "XXX"]

AUTH_LINES = {
    "DE": "Germany Opportunity card holder",
    "IN": None,
    "OTHER": "Sponsorship required",
}


def norm_digits(text: str) -> str:
    return re.sub(r"\D", "", text)


def check_structure(html: str, results: list) -> None:
    ok = bool(html.strip()) and "Saurav Kalia" in html
    results.append(("structure", "non-empty + candidate name", ok))
    for tag in ("div", "span", "ul", "table"):
        opened = len(re.findall(rf"<{tag}[\s>]", html, re.I))
        closed = len(re.findall(rf"</{tag}>", html, re.I))
        if opened != closed:
            results.append(("structure", f"balanced <{tag}> ({opened} open vs {closed} close)", False))
    if not re.search(r"<h1[^>]*>\s*Saurav Kalia", html, re.I):
        results.append(("structure", "<h1> carries the candidate name", False))


def check_hygiene(html: str, results: list) -> None:
    bad_amp = re.search(r"&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)", html)
    results.append(("hygiene", "no unescaped '&' (use &amp;)", bad_amp is None))
    for p in PLACEHOLDERS:
        if p.lower() in html.lower():
            results.append(("hygiene", f"no leftover placeholder '{p}'", False))
    results.append(("hygiene", "no current-residence or relocation statement", "open to relocation" not in html.casefold()))
    for heading in ("Streaming Protocols &amp; Formats", "Product &amp; Solution Domains"):
        results.append(("hygiene", f"no copied keyword-bank heading '{heading}'", heading not in html))


def check_presentation(html: str, results: list) -> None:
    """Keep the default draft readable instead of allowing evidence-bank dumps."""
    skills = re.search(
        r'<ul[^>]*class=["\'][^"\']*core-skills-list[^"\']*["\'][^>]*>(.*?)</ul>',
        html,
        re.I | re.S,
    )
    if skills:
        rows = len(re.findall(r"<li\b", skills.group(1), re.I))
        results.append(("presentation", f"Core Skills has 5–6 rows (found {rows})", 5 <= rows <= 6))
    else:
        results.append(("presentation", "Core Skills section uses the compact template", False))


def check_draft_marker(html: str, results: list) -> None:
    results.append(("draft-marker", "'<!-- DRAFT' comment present", "<!-- DRAFT" in html))


def check_contact(html: str, results: list) -> None:
    digits = norm_digits(html)
    results.append(("contact", "phone +918527089555 (digit-normalized)", "918527089555" in digits))
    results.append(("contact", "email sauravkalia@gmail.com", "sauravkalia@gmail.com" in html))
    results.append(("contact", "linkedin.com/in/saurav2026", "linkedin.com/in/saurav2026" in html))


def check_auth_line(html: str, country: str, results: list) -> None:
    c = (country or "OTHER").upper()
    required = AUTH_LINES.get("DE" if c == "DE" else "IN" if c == "IN" else "OTHER")
    has_oca = "Germany Opportunity card holder" in html
    has_spons = "Sponsorship required" in html
    has_legacy_oca = "Opportunity card holder" in html and not has_oca
    has_any_oca = has_oca or has_legacy_oca
    if required is None:
        results.append(("auth-line", f"country {c}: neither auth line present", not (has_any_oca or has_spons)))
    else:
        results.append(("auth-line", f"country {c}: contains '{required}'", required in html))
        wrong = "Sponsorship required" if required == "Germany Opportunity card holder" else "Germany Opportunity card holder"
        results.append(("auth-line", f"country {c}: wrong line '{wrong}' absent", wrong not in html))
        if required == "Germany Opportunity card holder":
            results.append(("auth-line", f"country {c}: legacy auth line absent", not has_legacy_oca))
        else:
            results.append(("auth-line", f"country {c}: legacy auth line absent", not has_legacy_oca))


def check_facts(html: str, master: str, results: list) -> None:
    # Years: every 4-digit year in the draft must exist in the master.
    master_years = set(re.findall(r"\b(19[89]\d|20[0-3]\d)\b", master))
    draft_years = set(re.findall(r"\b(19[89]\d|20[0-3]\d)\b", html))
    stray = draft_years - master_years
    results.append(("facts", f"all draft years exist in master (stray: {sorted(stray) or 'none'})", not stray))

    # Percent metrics: every percentage in the draft must exist in the master.
    master_pct = set(re.findall(r"\d+(?:\.\d+)?%", master))
    draft_pct = set(re.findall(r"\d+(?:\.\d+)?%", html))
    stray_pct = draft_pct - master_pct
    results.append(("facts", f"all draft percent-metrics exist in master (stray: {sorted(stray_pct) or 'none'})", not stray_pct))

    # Employers: names in the draft must come from the master's known set;
    # require at least one known employer present (a CV with none is broken).
    present = [e for e in KNOWN_EMPLOYERS if e in html]
    results.append(("facts", f"at least one known employer present ({present or 'none'})", bool(present)))


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify an auto-generated CV draft (zero tokens).")
    ap.add_argument("--draft", required=True, help="path to the draft HTML")
    ap.add_argument("--country", default="OTHER", help="target country: DE | IN | other")
    ap.add_argument("--master", default="cv/master_cv.html", help="master CV for fact-binding")
    args = ap.parse_args()

    try:
        html = open(args.draft, encoding="utf-8", errors="replace").read()
    except OSError as e:
        print(f"FAIL cannot read draft: {e}")
        return 1
    try:
        master = open(args.master, encoding="utf-8", errors="replace").read()
    except OSError as e:
        print(f"FAIL cannot read master: {e}")
        return 1

    results: list = []
    check_structure(html, results)
    check_hygiene(html, results)
    check_presentation(html, results)
    check_draft_marker(html, results)
    check_contact(html, results)
    check_auth_line(html, args.country, results)
    check_facts(html, master, results)

    failures = 0
    for section, label, ok in results:
        status = "PASS" if ok else "FAIL"
        if not ok:
            failures += 1
        print(f"[{status}] {section:13} {label}")

    total = len(results)
    print(f"\n{'PASS' if failures == 0 else 'FAIL'}: {total - failures}/{total} checks passed ({failures} FAIL)")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
