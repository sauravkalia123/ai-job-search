---
framework_version: 1.0.0
---

# Behavioral Profile

<!-- SETUP: No formal assessment (PI/DISC/MBTI) on file. Profile below is *inferred from CV
evidence* by /setup Path B (single CV import from ~/code/data/cv.md). Every entry cites its
source. Review before relying on it; replace with a formal assessment when available. -->

## Overview
Saurav Kalia's behavioral profile identifies them as a **hands-on technical leader** pattern: a principal-level engineer who stays deep in the code (root-cause debugging, performance engineering) while leading teams of 4-30, and who earns peer-recognition awards for both management and code quality. *[Inferred from CV work history and awards]*

## Core Behavioral Drives

| Drive | Level | Meaning |
|-------|-------|---------|
| Technical depth | Very high | Chooses hands-on root-cause work even in lead roles: production forensics, memory/concurrency debugging. *[Inferred from CV]* |
| Ownership | Very high | Repeatedly takes end-to-end ownership of pipelines and platforms (Barco media pipeline, Voizzit platform-from-scratch, Lytx Mediacore). *[Inferred from CV]* |
| Leadership | High | Led teams of 4-30 across seven organizations; "Best Team Manager" and "Best Code Reviewer" awards at Samsung. *[Inferred from CV]* |
| Adaptability | High | Works across countries and cultures (India, South Korea, UAE, Germany) and across product domains (STB, signage, control rooms, dashcams). *[Inferred from CV work history]* |

## Strongest Behaviors
- **Evidence-driven debugging:** Tracks failures to their physical cause with numbers, not guesses - fd double-close in a 350-worker pool, CMA leak 491 MB -> 8 MB, 12.6 h/day boot-script stall found in a 5.4M-line log. *[Inferred from CV - Lytx bullets]*
- **Quality culture:** Best Code Reviewer award; enforced architecture and code quality as a manager; resolved CodeQL findings; three-layer defense on a critical RCE. *[Inferred from CV]*
- **Delivery under constraints:** Fixed hardware/OS-level failures (codec memory, VFR->CFR, SQLite disk-full) within product schedules; 21-hour soaks passed. *[Inferred from CV]*
- **Tooling initiative:** Built AI-assisted engineering tooling (Claude Code) that cut triage from hours to minutes. *[Inferred from CV]*

## How You Work Best
- Small senior teams with end-to-end ownership of a product-critical component. *[Inferred - team sizes of 4 recur most positively]*
- Environments where production impact is measurable (streams, sessions, latency, memory). *[Inferred from CV metrics]*
- Boring technology discipline: deep debugging, soak tests, watchdogs, observability. *[Inferred from CV]*

## Growth Areas (frame positively in applications)
- **German language (A1, actively learning):** Frame as an active commitment - relocated to Munich and enrolled in learning; English is the working language today. *[Inferred from CV Languages section]*
- **Formal people-management at scale:** The 30-engineer role was architecture-and-quality leadership; frame recent roles as senior IC / tech-lead track, which matches the target roles. *[Inferred from CV]*

## Mapping to Job Posting Language

When a job posting mentions these keywords, it's a **strong behavioral fit**:
- "end-to-end ownership", "own the component/pipeline"
- "deep debugging", "root cause analysis", "production-critical"
- "performance optimization", "low latency", "high throughput"
- "mentor engineers", "raise code quality", "tech lead"
- "build from scratch", "greenfield"

When a job posting mentions these, flag as **potential friction** (not deal-breaker):
- "purely people management" (no hands-on coding expected)
- "process-heavy", "document-driven" cultures over build-and-debug cultures
- Roles requiring fluent German for daily collaboration (language is A1 today)

## Management Style Preferences
- *(not yet stated by the user)* - Leads by example: reviews code directly, sets architecture, then delegates. *[Inferred from "Best Code Reviewer" + managed 30 engineers across architecture/quality]*
- *(not yet stated by the user)* - Update this section after a conversation about what management style works for them.

## Using This in Applications
- **Cover letters:** Lead with ownership + measurable production impact; mention team leadership only when the posting asks for it.
- **CV:** Emphasize quantified outcomes (session success %, memory reduction, streams per node, recording duty cycle).
- **Interviews:** Use the STAR examples in 07-interview-prep.md; the debugging war stories double as behavioral answers.
- **Don't overstate:** Do not claim fluent German; do not claim pure-people-management experience beyond the Samsung 30-engineer scope.
