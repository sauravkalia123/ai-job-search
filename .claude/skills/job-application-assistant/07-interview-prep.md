---
framework_version: 1.0.0
---

# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- Populated by /setup from the candidate's CV (~/code/data/cv.md). All numbers below
are quoted verbatim from the CV - do not inflate them. -->

### 1. Scaling Lytx Mediacore to 100+ concurrent streams (Performance engineering, ownership)
**S:** Lytx's Mediacore streaming engine captures dashcam video across a 700k+-device fleet and must deliver WebRTC, HLS, and recordings live; the pipeline had to sustain high concurrency per node without session failures.
**T:** As the engineer leading Mediacore, lift concurrent-stream capacity and session success to production-grade numbers.
**A:** Optimized GStreamer/C++17 pipelines; resolved high-concurrency bottlenecks via buffer flow control, thread tuning, and back-pressure handling; load-tested to 600 concurrent WebRTC sessions and 3,000-session runs.
**R:** 100+ concurrent live streams per node sustained; 98.6% session success (592/600); zero session leaks across 4,286 sessions; 99.3% session-start success; 84% of GStreamer memory growth eliminated (Valgrind + custom instrumentation).
**Use for:** "Tell me about a system you scaled", "How do you approach performance work?", "Tell me about owning a critical service"

### 2. Root-causing a production server hang: the fd double-close (Debugging forensics)
**S:** A production media server hung: one thread spun at 100% CPU and the whole 350-worker pool stalled.
**T:** Find and fix the root cause, not a symptom.
**A:** Traced it to a socket file-descriptor double-close: the recycled fd landed in a GStreamer bus poll pipe and poisoned the poll loop. Fixed with an atomic single-owner fd lifecycle. Related: a 2,000-thread pool drained by half-open TCP connections (fixed with TCP keepalive + idle timeouts) and dropped connections in 250-device reconnect storms (undersized listen backlog).
**R:** Hang eliminated; pool exhaustion and reconnect-storm drops fixed; the residual 1.5% ICE failure rate was root-caused statistically to ICE timer and STUN/TURN topology.
**Use for:** "Describe the hardest bug you've fixed", "How do you debug production issues?", "Tell me about a time you found what others couldn't"

### 3. Dashcam recording-index race (Quality under hardware constraints)
**S:** On the NXP i.MX8 dashcam (Yocto Linux), a cross-thread race in the recording index permanently lost auxiliary-camera footage; separately, a boot-script stall idled the recorder 12.6 hours/day, and a GStreamer hang pinned hardware-codec memory (CMA free fell 491 MB -> 8 MB).
**T:** Make multi-camera recording reliable on constrained hardware without a recall.
**A:** Fixed the race, found the boot-script stall (one process fork per line over a 5.4M-line log), fixed the codec-memory hang, fixed green-screen playback (VFR -> CFR), moved AES-GCM decrypt to RAM, rewrote H.264 levels to fit the hardware decoder, and migrated components to Yocto Scarthgap + C++17.
**R:** Recording duty cycle raised from 49% to ~100%; recording gaps cut from 171 to 2; 25+ hours of footage recovered; 21-hour soak passed.
**Use for:** "Tell me about working close to hardware", "How do you test embedded systems?", "A time you fixed something everyone thought was impossible"

### 4. Barco control-room video walls: frame-accurate synchronization (Deep domain architecture)
**S:** Barco control-room video walls render up to 16x HD / 8x FHD / 4x 4K simultaneous streams for mission-critical deployments; any inter-display drift is visible and unacceptable.
**T:** Own the media pipeline and layout manager end to end, with seamless content across the whole wall.
**A:** Built two-level synchronization: clock sync via NVIDIA Quadro Sync II (framelock/genlock) and PTP (IEEE 1588), and frame sync for wall-wide same-frame rendering. Built GPU-accelerated GStreamer screen capture for X.Org/Wayland, remote interaction (navigation events, VNC/SDL2, WebRTC), and N+1 failover.
**R:** Deployed in global control rooms; ultra-low-latency multi-display playback with N+1 failover.
**Use for:** "What's the most technically complex thing you've built?", "Explain a hard synchronization problem", "Tell me about end-to-end ownership"

### 5. Finding a critical unauthenticated RCE (Security responsibility)
**S:** During work on the cloud media server, an unauthenticated remote-code-execution path (shell injection) existed in the service.
**T:** Eliminate the vulnerability and harden the codebase.
**A:** Fixed it with a 3-layer defense and resolved the GitHub Advanced Security (CodeQL) findings; added a native C++ health endpoint, crash/core-dump handling, no-media watchdogs, and structured New Relic telemetry.
**R:** RCE closed with layered mitigation; observability and crash-handling improvements landed in the same push.
**Use for:** "Tell me about a security issue you handled", "How do you balance speed and safety?"

### 6. Leading MagicInfo delivery at Samsung (Leadership at scale)
**S:** Samsung R&D India's signage/video-wall product line (MagicInfo) needed coordinated delivery across architecture, development, and quality; OTT integrations (Netflix, Amazon Prime) required DRM-secure streaming (Widevine/PlayReady).
**T:** As Chief Engineer, manage 30 engineers while staying technically accountable.
**A:** Managed architecture, development, and code quality across the team; delivered SoC-based signage with simultaneous audio/dual-video/PDF/text playback, frame-accurate video-wall sync, Hotel TV IoT gateway, SNMP monitoring, and a multi-threaded XML-driven content manager.
**R:** MagicInfo shipped as a production-grade signage and video-wall solution; recognized with Samsung's Best Team Manager, Best Team Player, and Best Code Reviewer awards; Sony Japan appreciated implementation quality.
**Use for:** "Tell me about leading a team", "How do you balance coding and managing?", "How do you raise code quality across a team?"

## Common Tough Questions

### "Why did you leave [previous company]?"
> Drafts to review and personalize (grounded in the CV, no negativity):
> - **Voizzit (11 months):** "It was a focused engagement to architect a streaming platform from scratch - media plane, middleware, Kafka backbone. That was delivered, and Lytx offered the chance to apply the same architecture at 700k-device scale, which is where I want to work."
> - **Barco (6 years):** "Six years owning the control-room media pipeline was a deep run. I wanted greenfield platform work again, which Voizzit offered."
> Keep answers short, forward-looking, and factually safe - confirm with the candidate before using specifics about why engagements ended.

### "You're not a German citizen / you need sponsorship."
> "I hold Germany's Opportunity Card (Chancenkarte), which lets me seek and take up qualified employment in Germany - for German roles no sponsorship is needed. For other countries I'd need sponsorship, and my track record relocating across India, South Korea, the UAE, and now Germany shows I make moves quickly and stay productive." For India roles: no line needed, citizenship is a non-issue.

### "You don't have [specific skill/experience]."
> Bridge pattern: name the adjacent depth, then the transfer. E.g. for Rust: "I've shipped Rust middleware in production at Voizzit alongside 19 years of C++ systems work - the concurrency and ownership thinking carries directly." For ML: "I integrated AI/ML driver-monitoring into Lytx's real-time pipeline and build AI-assisted tooling with Claude Code - I consume and productionize models rather than train them."

### "Where do you see yourself in 5 years?"
> "Deep technical leadership in streaming/multimedia: a staff/principal IC owning the media pipeline of a product at scale, setting architecture and raising the team's code quality - the direction I've already been on at Lytx, Barco, and Samsung."

### "What's your biggest weakness?"
> "German is still at A1 - I moved to Munich recently and I'm actively learning. My working language is English, and I'm transparent about it rather than optimistic." (Second option: "I go very deep on root causes - I've learned to timebox investigation and communicate interim findings so stakeholders aren't left waiting.")

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
