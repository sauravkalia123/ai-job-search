#!/usr/bin/env python3
"""Read-only Gmail scanner for job-application signals.

Uses the OAuth token stored by the Gmail MCP server (~/.gmail-mcp/credentials.json).
STRICTLY read-only: only GET requests against the Gmail API (labels, messages).
Never sends, drafts, modifies, or deletes anything. Tokens are never printed.

Usage:
  python3 tools/gmail_scan.py --days 30            # scan and classify, print report
  python3 tools/gmail_scan.py --days 30 --json OUT # also dump classified messages to OUT
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

CREDS_PATH = os.path.expanduser("~/.gmail-mcp/credentials.json")
KEYS_PATH = os.path.expanduser("~/.gmail-mcp/gcp-oauth.keys.json")
API = "https://gmail.googleapis.com/gmail/v1/users/me"

ATS_DOMAINS = [
    "greenhouse.io", "lever.co", "myworkday.com", "workday.com", "ashbyhq.com",
    "smartrecruiters.com", "icims.com", "bamboohr.com", "jobvite.com",
    "talentio.co", "teamtailor.com", "recruitee.com", "workable.com",
    "breezy.hr", "successfactors.com", "eightfold.ai", "phenom.com",
    "jobright.ai", "gem.com",
]
NOISE_DOMAINS = [
    "linkedin.com", "naukri.com", "indeed.com", "glassdoor.com", "naukrigulf.com",
    "cutshort.io", "instahyre.com", "hirist.tech", "wellfound.com",
    "foundit.in", "timesjobs.com", "shine.com", "mailchimp", "substack",
]

REJECTION = [
    "unfortunately", "regret to inform", "not moving forward", "won't be moving forward",
    "will not be moving forward", "decided not to move forward", "decided to move forward with other",
    "pursued other candidates", "position has been filled", "not be progressing",
    "will not be progressing", "not selected", "unable to move forward", "unable to proceed",
    "chosen candidates whose", "after careful consideration", "we've decided to move forward",
    "not a match at this time", "decided to pause", "closing this position", "role has been filled",
]
INTERVIEW = [
    "interview", "schedule a call", "schedule a time to chat", "phone screen", "screening call",
    "next round", "would like to invite you", "excited to invite", "availability for a call",
    "next steps call", "hiring manager call", "technical round", "discussion about your application",
    "invitation to interview", "move you to the next stage",
]
ACK = [
    "received your application", "thank you for applying", "thanks for applying",
    "application has been received", "we've received your application", "application submitted",
    "your application to", "thanks for your interest",
]
OFFER = ["pleased to offer", "offer letter", "extend an offer", "offer of employment", "compensation package"]

SUBJECT_COMPANY_PATTERNS = []  # (patterns live in extract_company; kept for future extension)


def get_access_token(creds):
    """Return a valid access token; refresh via Google token endpoint if expired."""
    if creds.get("expiry_date") and creds["expiry_date"] / 1000 > time.time() + 60:
        return creds["access_token"]
    keys = json.load(open(KEYS_PATH))
    k = keys.get("installed") or keys.get("web")
    data = urllib.parse.urlencode({
        "client_id": k["client_id"], "client_secret": k["client_secret"],
        "refresh_token": creds["refresh_token"], "grant_type": "refresh_token",
    }).encode()
    with urllib.request.urlopen(urllib.request.Request(
            "https://oauth2.googleapis.com/token", data=data, method="POST"), timeout=30) as r:
        tok = json.load(r)
    return tok["access_token"]


def api_get(token, path, params=None):
    url = f"{API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError("unreachable")


def strip_html(html):
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&nbsp;|&#160;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    return re.sub(r"\s+", " ", text).strip()


def body_text(payload):
    """Extract readable text from a Gmail message payload (plain or html part)."""

    def walk(part):
        mime = part.get("mimeType", "")
        if mime in ("text/plain", "text/html") and part.get("body", {}).get("data"):
            import base64
            raw = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", "replace")
            return strip_html(raw) if mime == "text/html" else re.sub(r"\s+", " ", raw).strip()
        for sub in part.get("parts", []) or []:
            t = walk(sub)
            if t:
                return t
        return None

    return walk(payload) or ""


def header(msg, name):
    for h in msg.get("payload", {}).get("headers", []):
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def classify(subject, body):
    text = f"{subject}\n{body[:3000]}".lower()
    if any(p in text for p in OFFER):
        return "offer"
    if any(p in text for p in REJECTION):
        return "rejected"
    if any(p in text for p in INTERVIEW):
        return "interview"
    if any(p in text for p in ACK):
        return "applied"
    return "noise"


def extract_company(sender, subject):
    # Prefer the display name, skipping generic role addresses.
    m = re.match(r'"?([^"<]+)"?\s*<([^>]+)>', sender or "")
    display = (m.group(1) if m else sender or "").strip()
    domain = (m.group(2) if m else "").split("@")[-1].strip().lower()
    junk_names = {"noreply", "no-reply", "donotreply", "notifications", "careers", "hiring",
                  "talent", "recruitment", "people", "hr", "jobs", "team", "greenhouse",
                  "jobalert", "alerts", "updates", "mail", "info", "support", "newsletter"}
    if display and "@" not in display:
        name = display
        for sep in [" via ", " at ", " | ", " from "]:
            if sep in name:
                name = name.split(sep)[0]
        name = re.sub(r"\s*\(.*?\)\s*", " ", name).strip()
        if name.lower().replace("-", "").replace(" ", "") not in junk_names and len(name) > 2:
            return name.strip().strip('"'), domain
    # Fall back to subject patterns: "Your application to X", "X: next steps", "X - interview"
    for pat in [r"[Aa]pplication (?:to|with|for) ([A-Z][\w&.'\-]*(?:[ ][A-Z][\w&.'\-]*){0,3})",
                r"^([A-Z][\w&.'\-]*(?:[ ][A-Z][\w&.'\-]*){0,3}): ",
                r"^([A-Z][\w&.'\-]*(?:[ ][A-Z][\w&.'\-]*){0,3}) [-–] "]:
        m = re.search(pat, subject or "")
        if m:
            cand = m.group(1).strip()
            if cand.lower() not in ("your", "we", "interview", "application", "re:"):
                return cand, domain
    return None, domain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--json", help="write classified messages to this JSON file")
    ap.add_argument("--limit", type=int, default=400)
    args = ap.parse_args()

    creds = json.load(open(CREDS_PATH))
    token = get_access_token(creds)

    noise_excl = " ".join(f"-from:{d}" for d in NOISE_DOMAINS)
    ats = " ".join(f"from:{d}" for d in ATS_DOMAINS)
    queries = [
        f"newer_than:{args.days}d -in:sent -in:drafts {ats}",
        f"newer_than:{args.days}d -in:sent -in:drafts unfortunately",
        f'newer_than:{args.days}d -in:sent -in:drafts "regret to inform"',
        f'newer_than:{args.days}d -in:sent -in:drafts "not moving forward"',
        f'newer_than:{args.days}d -in:sent -in:drafts "decided not to"',
        f'newer_than:{args.days}d -in:sent -in:drafts "position has been filled"',
        f'newer_than:{args.days}d -in:sent -in:drafts "not selected"',
        f'newer_than:{args.days}d -in:sent -in:drafts interview -from:linkedin.com -from:naukri.com -from:indeed.com',
        f'newer_than:{args.days}d -in:sent -in:drafts "schedule a call"',
        f'newer_than:{args.days}d -in:sent -in:drafts "phone screen"',
        f'newer_than:{args.days}d -in:sent -in:drafts "your application" {noise_excl}',
        f'newer_than:{args.days}d -in:sent -in:drafts "thank you for applying"',
        f'newer_than:{args.days}d -in:sent -in:drafts "pleased to offer"',
    ]
    seen_ids, msgs = set(), []
    for q in queries:
        page = None
        while True:
            params = {"q": q, "maxResults": 100}
            if page:
                params["pageToken"] = page
            res = api_get(token, "/messages", params)
            for m in res.get("messages", []):
                if m["id"] not in seen_ids:
                    seen_ids.add(m["id"])
                    msgs.append(m)
            page = res.get("nextPageToken")
            if not page:
                break
    msgs = msgs[: args.limit]

    out = []
    for m in msgs:
        full = api_get(token, f"/messages/{m['id']}", {"format": "full"})
        sender = header(full, "From")
        subject = header(full, "Subject")
        date_hdr = header(full, "Date")
        body = body_text(full.get("payload", {}))
        signal = classify(subject, body)
        if signal == "noise":
            continue
        company, domain = extract_company(sender, subject)
        noisy_sender = any(d in domain for d in NOISE_DOMAINS)
        out.append({
            "id": m["id"], "threadId": full.get("threadId"),
            "date": date_hdr, "from": sender, "subject": subject,
            "signal": signal, "company": company, "domain": domain,
            "noisy_sender": noisy_sender, "snippet": full.get("snippet", "")[:200],
        })

    out.sort(key=lambda x: (x["signal"], x["date"]))
    if args.json:
        with open(args.json, "w") as f:
            json.dump(out, f, indent=1)
    counts = {}
    for o in out:
        counts[o["signal"]] = counts.get(o["signal"], 0) + 1
    print(f"scanned {len(msgs)} messages, classified {len(out)} job-signal messages: {counts}")
    for o in out:
        flag = " [platform-noise]" if o["noisy_sender"] else ""
        comp = o["company"] or "(company?)"
        print(f"- [{o['signal']:8}] {comp[:30]:30} | {o['subject'][:70]} | {o['from'][:40]} | {o['date'][:22]}{flag}")


if __name__ == "__main__":
    main()
