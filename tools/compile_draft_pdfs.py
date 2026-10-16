#!/usr/bin/env python3
"""Compile strong+good-fit draft CVs to PDF and run mechanical PDF checks.

Collects every candidate with verdict strong/good across all batch files
(2026-10-15 resolver-based + 2026-10-16 draft_file-based), compiles each
draft HTML to PDF via WeasyPrint, then checks: exactly 2 pages, text
layer contains name/email/phone, no (cid:) glyphs. Writes a report.

Zero model tokens — fully mechanical.
"""

import glob
import json
import logging
import os
import re
import subprocess
import sys

try:
    from weasyprint import CSS, HTML
except ImportError:
    sys.exit("weasyprint is required to compile draft PDFs: pip install weasyprint")

# WeasyPrint logs unsupported-CSS warnings at WARNING level; surface only
# errors so the progress output stays readable.
logging.getLogger("weasyprint").setLevel(logging.ERROR)

PDF_DIR = "cv/drafts/pdf"
REPORT = "cv/drafts/pdf/compile_report.md"

# Match the print geometry the drafts were built against (previously the
# headless-Chrome default): US Letter with 0.4in page margins. WeasyPrint's
# own default is A4 with ~2cm margins, which would change pagination, so the
# rule is injected at compile time for every draft (existing files do not all
# carry it in their own CSS).
PRINT_CSS = CSS(string="@page { size: letter; margin: 0.4in; }")


def norm_url(u):
    return (u or "").split("?")[0].rstrip("/")


def toks(s):
    return [t for t in re.findall(r"[a-z0-9]+", s.lower()) if len(t) > 2]


def collect():
    """url -> (verdict, draft_file, title, company). Later files never override."""
    pool = {}
    # 2026-10-16 files: draft_file is authoritative
    for f in sorted(glob.glob("job_scraper/runs/2026-10-16/scored-b*.json")):
        d = json.load(open(f))
        for s in d.get("scores", []):
            verdict = (s.get("rank_verdict") or s.get("fit") or "").lower()
            draft = s.get("draft_file") or s.get("draft")
            url = s.get("url") or ""
            key = norm_url(url) or f"{s.get('company')}|{s.get('title')}"
            if verdict in ("strong fit", "good fit") and draft and key not in pool:
                pool[key] = (verdict, draft, s.get("title") or "", s.get("company") or "")
    # 2026-10-15 files: resolve the draft name
    draft_files = os.listdir("cv/drafts")
    for f in ("job_scraper/runs/2026-10-15/li-b1-germany-poland-austria.json",
              "job_scraper/runs/2026-10-15/li-b2-india-ireland-switzerland.json",
              "job_scraper/runs/2026-10-15/fh-all-countries.json"):
        b = json.load(open(f))
        for c in b.get("candidates", []):
            verdict = (c.get("rank_verdict") or "").lower()
            url = c.get("url") or ""
            key = norm_url(url) or f"{c.get('company')}|{c.get('title')}"
            if verdict not in ("strong fit", "good fit") or key in pool:
                continue
            draft = c.get("draft")
            if isinstance(draft, str) and draft.startswith("cv/drafts/") and os.path.exists(draft):
                pool[key] = (verdict, draft, c.get("title") or "", c.get("company") or "")
                continue
            # resolver: exact deterministic name, then token-scored match
            cc = "EU"
            m = re.match(r"https?://([a-z]{2})\.linkedin\.com", url)
            if c.get("country"):
                cc = str(c["country"])[:2].upper()
            elif m:
                cc = m.group(1).upper()
            r = subprocess.run([sys.executable, "tools/cv_draft_name.py",
                                "--company", c.get("company") or "",
                                "--role", c.get("title") or "", "--country", cc],
                               capture_output=True, text=True)
            name = r.stdout.strip()
            if name and name in draft_files:
                pool[key] = (verdict, f"cv/drafts/{name}", c.get("title") or "", c.get("company") or "")
                continue
            ct = toks((c.get("company") or "") + " " + (c.get("company") or "") + " " + (c.get("title") or ""))
            best, score = None, 0.0
            for df in draft_files:
                ft = set(toks(df))
                ov = sum(1 for t in ct if t in ft) / max(len(set(ct)), 1)
                if ov > score:
                    best, score = df, ov
            if best and score >= 0.3:
                pool[key] = (verdict, f"cv/drafts/{best}", c.get("title") or "", c.get("company") or "")
    return pool


def compile_pdf(html_path, pdf_path):
    # Resume: a PDF compiled in an earlier pass is left in place (WeasyPrint
    # takes ~10s per draft, so re-runs stay cheap).
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
        return True
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    try:
        HTML(filename=os.path.abspath(html_path)).write_pdf(
            pdf_path, stylesheets=[PRINT_CSS])
    except Exception as exc:  # WeasyPrint raises on bad CSS/HTML/font issues
        print(f"  compile error: {html_path}: {exc}", file=sys.stderr)
        return False
    return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000


def pdf_pages(pdf_path):
    r = subprocess.run(["pdfinfo", pdf_path], capture_output=True, text=True)
    m = re.search(r"Pages:\s+(\d+)", r.stdout)
    return int(m.group(1)) if m else None


def pdf_text(pdf_path):
    r = subprocess.run(["pdftotext", pdf_path, "-"], capture_output=True, text=True)
    return r.stdout


def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    pool = collect()
    targets = [(v, d, t, c) for (v, d, t, c) in pool.values() if os.path.exists(d)]
    print(f"strong+good candidates with drafts: {len(targets)} of {len(pool)}")

    rows, n_pass = [], 0
    for i, (verdict, draft, title, company) in enumerate(targets, 1):
        stem = os.path.splitext(os.path.basename(draft))[0]
        pdf_path = os.path.join(PDF_DIR, stem + ".pdf")
        print(f"  [{i}/{len(targets)}] {stem}.pdf", flush=True)
        ok = compile_pdf(draft, pdf_path)
        if not ok:
            rows.append((verdict, company, title, draft, pdf_path, "COMPILE FAILED", []))
            continue
        pages = pdf_pages(pdf_path)
        text = pdf_text(pdf_path)
        digits = re.sub(r"\D", "", text)
        checks = {
            "2 pages": pages == 2,
            "name": "Saurav Kalia" in text,
            "email": "sauravkalia@gmail.com" in text,
            "phone": "918527089555" in digits,
            "no cid glyphs": "(cid:" not in text,
        }
        failed = [k for k, v in checks.items() if not v]
        status = "PASS" if not failed else "FAIL: " + ", ".join(failed)
        if not failed:
            n_pass += 1
        rows.append((verdict, company, title, draft, pdf_path,
                     f"{pages} pages — {status}", [k for k, v in checks.items() if not v]))

    rows.sort(key=lambda r: (r[5].startswith("FAIL") or r[5].startswith("COMPILE"), r[0] != "strong fit", r[1]))
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("# Draft PDF compile report — strong + good fit\n\n")
        f.write(f"{len(rows)} PDFs compiled · {n_pass} PASS · {len(rows) - n_pass} need attention\n\n")
        f.write("| Verdict | Company | Title | Pages/Status | PDF |\n|---|---|---|---|---|\n")
        for verdict, company, title, draft, pdf_path, status, _ in rows:
            f.write(f"| {verdict} | {company} | {title[:60]} | {status} | {pdf_path} |\n")
    print(f"\n{n_pass}/{len(rows)} PASS — report: {REPORT}")
    for r in rows:
        if not r[5].startswith("2 pages"):
            print("  ATTENTION:", r[1][:28], "|", r[4].split("/")[-1], "|", r[5])


if __name__ == "__main__":
    main()
