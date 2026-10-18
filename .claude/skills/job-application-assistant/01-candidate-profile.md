---
framework_version: 1.1.1
---

# Candidate Profile

<!-- Populated by /setup from ~/code/data/cv.md and cv.html (Path B, single CV import) -->

## Identity
- **Name:** Saurav Kalia
- **Location:** Munich, Germany
- **Phone:** +918527089555 (India number - use this everywhere, on every document and form)
- **Email:** sauravkalia@gmail.com
- **LinkedIn:** https://linkedin.com/in/saurav2026
- **GitHub:** (not on CV - do not invent)
- **Status:** Employed - Staff Engineer (official designation) at Lytx Inc (since Dec 2025)
- **Constraints:** Open to relocation worldwide. Currently in Munich on a Germany Opportunity Card (Chancenkarte). See "Work Authorization" below for the per-country CV header line rules.

### Work Authorization
<!-- Drives the Eligibility Gate in 04-job-evaluation.md and the CV header line in 05-cv-templates.md -->
- **Citizenship:** India
- **Germany:** Opportunity Card (Chancenkarte) holder - permitted to seek and take up qualified employment in Germany; no employer sponsorship needed for the permit itself.
- **Everywhere else:** Requires employer sponsorship / work visa (no existing right to work outside Germany and India).
- **CV header line rule (applies to every tailored CV):**
  - Germany applications: include the line "Germany Opportunity card holder" in the header.
  - India applications: include **no** work-authorization line.
  - Rest of world (Europe, Canada, Australia, UAE, New Zealand, Singapore, South Korea, Malaysia, and any other market): include the line "Sponsorship required".

### Languages
<!-- Every language you can work in professionally, with your honest level. Used by the
Language Gate in 04-job-evaluation.md and by job-scraper/search-queries.md's query-language
generation. The current candidate rule is binary: unspecified language and English pass; an
explicitly required non-English language fails. -->

| Language | Level | Notes |
|----------|-------|-------|
| English | Professional working proficiency | Primary working language, 19+ years. Any English requirement (including "fluent") = PASS; unspecified language = assume English. An explicit requirement for any other language = FAIL under the candidate's binary Language Gate rule. |
| Hindi | Native | |
| German | A1 (beginner) | Actively learning; not yet a working language |

**CV language:** English

### Keyword Policy (solution/keyword catalog; tiers updated 2026-10-13)
The candidate profile carries an optional "Product & Solution Domains" and "Streaming Protocols & Formats" keyword bank. It is a tailoring lookup source, **not default CV content**. Tailoring may use individual terms where the posting names them, **within the tier split below** (which now mirrors the candidate's own Strong/Moderate/Weak tier list in `04-job-evaluation.md`):

**Important separation:** the 48 Strong-tier search entries and the solution-name search phrases in
`.claude/skills/job-scraper/search-queries.md` are primarily **search-discovery inputs**. They are
not the candidate's CV skill list and must not be pasted into a CV as an inventory. For CV
tailoring, start from the evidence-backed Technical Skills and Professional Experience sections
below plus `cv/master_cv.html` / `cv/master_cv.md`; select only the technologies and domains that
are both relevant to the posting and honestly supported by that evidence. A search hit is not
proof of expertise.

- **Strong tier (= fully claimable, already in the CV bank):** C/C++ concurrency, GStreamer, WebRTC, RTSP, HLS, MPEG-DASH, MP4, H.264/H.265, DRM (Widevine/PlayReady), embedded Linux/ARM **in user-space/media-platform contexts**, video walls, digital signage, OTT, IPTV, STB, smart TV, Tizen, dashcam/video telematics, live view/recording, multicast, transcoding, A/V sync, media server, multi-stream decode.
- **Adjacent/moderate tier (partial credit only; never a strong-fit signal by itself):** SIP/VoIP, PipeWire/JACK/ALSA, MPEG-TS, SRT, RIST, NDI, CMAF, LL-HLS, VP8/VP9/AV1, AAC/Opus, ABR/CDN/packager, VMS/NVR/IP cameras, video analytics/edge AI, V4L2, Yocto/BitBake, BSP/platform integration, VPU, Android TV, RDK, ExoPlayer/Shaka, Wayland/Weston, QNX, AGL, AAOS, AEC, OTA/secure boot/A-B partitions, PTP/gPTP, multi-camera capture, echo cancellation, firmware/bootloader and limited device/board interaction.
- **Not a strong area (treat as a gap when it is central to the role):** generic “low-level” software, Linux kernel development/internals/modules/upstreaming, kernel bring-up, and device-driver development as the primary job. The candidate has some historical firmware/driver and Yocto exposure, but these are supporting/adjacent evidence, not deep specialization. Do not award full technical-match credit or a Strong Fit verdict because a posting contains these keywords.
- **Weak tier (never put on the CV, never credited in scoring):** the full ADAS/IVI-safety list (AUTOSAR, ISO 26262, ASIL, DMS/OMS, GMSL/FPD-Link/MIPI CSI-2, DeepStream/OpenVINO/TensorRT, sensor fusion, HIL/SIL, cluster/HUD/eCall/hypervisor, CarPlay/Android Auto, AVB/TSN/SMPTE 2110), the non-target verticals (telehealth, IFE, hospitality TV, cloud gaming, smart home, medical, e-learning, UCaaS/contact centre, DOOH), plus Rust, Kafka, AWS/K8s, web frontends, data engineering, mobile. **Nuance:** the candidate is not an ADAS engineer, but ADAS-domain roles whose substance is camera-feed/video processing are scored on his Strong-tier camera-pipeline skills (see "ADAS nuance" in 04-job-evaluation.md) - only ADAS-algorithm/safety/compliance work scores Weak.
- If Saurav confirms real work exposure to any moderate-tier keyword, it may move to the CV bank; weak-tier stays out regardless.
- **Confirmed exclusions (candidate instruction):** do not claim or list REST, WebSockets, TLS, AES-GCM, DTLS-SRTP, OpenSSL, or CodeQL. These are not part of the candidate's CV skill set unless the candidate explicitly reconfirms them.

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| Master of Computer Applications (MCA) | 2007 | Punjab Technical University, India | Computer applications |
| Bachelor of Computer Applications (BCA) | 2004 | Punjab Technical University, India | Computer applications |

## Professional Experience

### Staff Engineer (official designation; may be moulded per role) - Lytx Inc (Dec 2025 - Present)
Bengaluru, India (remote from Munich, Germany)
<!-- Official title is "Staff Engineer". Per the candidate, it may be presented as
"Staff Software Engineer", "Staff Engineer", or framed as principal-level embedded
multimedia work, as the target role requires - scope and employer stay fixed. -->
- Lead Mediacore, the streaming engine capturing dashcam video and outputting WebRTC, HLS, or recordings; sustains **100+ concurrent live streams per node** across **700k+ deployed devices**
- Achieved **98.6% WebRTC session success** (592/600) through targeted pipeline optimizations; load-tested to 600 concurrent sessions and 3,000-session runs with zero session leaks across 4,286 sessions
- Eliminated **84% of memory growth** in GStreamer processes (Valgrind + custom instrumentation) for multi-day stability
- Root-caused and fixed high-concurrency production failures: socket fd double-close stalling a 350-worker pool, 2,000-thread pool exhaustion from half-open TCP connections, dropped connections in 250-device reconnect storms, residual 1.5% ICE failure rate (ICE timer / STUN-TURN topology)
- Found and fixed a critical unauthenticated RCE (shell injection) with a 3-layer defense
- Dashcam device (NXP i.MX8, Yocto Linux): raised main-camera recording duty cycle from 49% to ~100% (12.6 h/day boot-script stall), cut recording gaps from 171 to 2 (25+ hours of footage recovered, 21-hour soak passed), fixed CMA memory issues and VFR->CFR green-screen playback; migrated components to Yocto Scarthgap and C++17
- Integrated AI/ML driver monitoring (fatigue, drowsiness, seatbelt, unsafe driving) into the real-time pipeline
- Built AI-assisted engineering tooling (Claude Code): log profiler (292 MB / 2.5M-line log summarized in ~25 lines) and a 9-repo code index, cutting triage from hours to minutes
- Tech: C++17/20, Embedded Linux (Yocto/BitBake), ARM (NXP i.MX8), GStreamer, WebRTC, HLS, MP4, H.264, hardware media codecs (NXP VPU), systemd, New Relic, Jenkins, Valgrind, ASAN/TSAN, gdb, Wireshark, Python

### Computer Engineer - Voizzit Information Technology (Jan 2025 - Nov 2025)
Dubai, UAE
- Architected a real-time streaming platform from scratch: GStreamer/Janus media plane, C++17 + Rust middleware, Kafka event bus
- Built the Kafka-based distributed messaging backbone for high-throughput, low-latency inter-service communication
- Supervised 4 engineers - owned architecture, code quality, and delivery
- Tech: C++17/20, Rust, GStreamer, Kafka, Janus, Python

### Technical Specialist, Control Rooms - Barco Electronics Systems (Jan 2019 - Jan 2025)
Noida, India
- End-to-end owner of the media pipeline and layout manager for control-room video walls playing **16x HD / 8x FHD / 4x 4K simultaneous streams** with ultra-low latency and N+1 failover
- Desktop-as-video streaming: GPU-accelerated GStreamer screen-capture plugins for X.Org and Wayland, Barco proprietary codec, audio via JACK and PipeWire
- Remote interaction: GStreamer navigation events, VNC (SDL2), WebRTC for low-latency interactive video
- Multi-display synchronization at two levels: clock sync (NVIDIA Quadro Sync II framelock/genlock, PTP IEEE 1588) and frame sync for seamless wall-wide content
- Architected service interfaces with DBus; device discovery (Avahi/DHCP); CI/CD and automated testing
- Tech: C++17/20, GStreamer, PipeWire, JACK, X.Org, Wayland, OpenGL, SDL2, VNC, WebRTC, Intel VA-API, PTP, NVIDIA Quadro Sync II, Debian, Meson, CI/CD

### Chief Engineer - Samsung R&D India (Dec 2011 - Jan 2019)
Noida, India
- Developed SoC-based Signage solution (simultaneous audio, dual video, PDF, text playback) and video-wall extension with frame-accurate synchronization; delivered MagicInfo, a production-grade Signage and Video Wall solution
- Integrated OTT apps (Netflix, Amazon Prime) with DRM-secure streaming (Widevine/PlayReady)
- Developed Hotel TV as IoT gateway with SNMP-based remote monitoring and control
- Built multi-threaded content manager parsing XML metadata for playback scheduling
- Managed 30 engineers across architecture, development, and code quality
- Tech: C/C++, Linux, Tizen OS, ARM Toolchain, GStreamer, OTT, DRM (Widevine, PlayReady)

### Lead Engineer - HCL Technologies India (Sep 2010 - Oct 2011)
Bengaluru, India
- Designed storage middleware features: Audio Description (AD) and Retention Limit policies
- Created HDD content management layer for SoC-based platforms
- Supervised 4 engineers (HLD/DLD design, development, code quality)
- Tech: C++, ARM Toolchain

### Senior Software Engineer - Intek Digital Inc (Sep 2009 - Sep 2010)
South Korea
- Designed and deployed STB middleware on ST5105/ST5107 chipsets
- Implemented Transport Stream parsing, channel data storage (transponder, PMT, A/V PID), NIT parsing for auto updates, tuner locking
- Tech: C/C++, RTOS (ST-OS20), ST Toolchain

### Senior Software Engineer - Logic Eastern India Pvt Ltd (Jun 2007 - Aug 2009)
Noida, India
- Developed STB firmware and interactive UI for STMicroelectronics chipsets; transport stream parser, tuner drivers, channel search
- Implemented bare-metal bootloader with A/B OTA update logic and NAND/NOR flash drivers (zero-brick guarantee via A/B fallback)
- Tech: C/C++, RTOS (ST-OS20), ST Toolchain

## Independent Projects
<!-- Projects outside of employment: freelance, open source, personal -->
- (none recorded - AI-assisted tooling built at Lytx is listed under that role)

## Technical Skills

### Programming & Systems
- **C++14/17/20** (expert, 19+ years): multithreading, atomics and memory ordering, mutex/shared_mutex, Intel TBB, thread pools, epoll/non-blocking I/O, GLib/GObject main loops
- **C** (expert): embedded C, with historical bare-metal firmware, bootloader and device-driver exposure; this is not a kernel/device-driver specialization
- **Rust** (working): middleware services (Voizzit)
- **Python, Bash** (working): tooling, load tests, log analysis

### Multimedia & Streaming (core domain)
- GStreamer (pipeline design, custom plugins, optimization, debugging), PipeWire, JACK, SDL2, FFmpeg, Janus
- WebRTC (ICE, STUN/TURN, libnice), RTP/RTCP, HLS, MPEG-DASH, MP4/fMP4
- DRM (Widevine, PlayReady), H.264/H.265, hardware codecs (NXP VPU), audio mixing
- Clock and frame synchronization: PTP (IEEE 1588), framelock/genlock (NVIDIA Quadro Sync II), video walls, layout management

### Embedded Systems
- Embedded Linux user-space/media platforms (with Yocto/BitBake, ARM toolchain and NXP i.MX8 exposure), Tizen, RTOS (ST-OS20), systemd
- Supporting firmware/device interaction: I2C, SPI, UART, RS232, NAND/NOR flash, bootloaders and firmware A/B OTA auto-update; not primary kernel or device-driver expertise

### Networking, Cloud & Security
- TCP/UDP sockets, Kafka, DBus, SNMP
- AWS (EKS, NLB, EC2), Docker, Kubernetes, New Relic, structured logging
- Secure coding and production hardening

### Debugging & Quality
- gdb, Valgrind, ASAN/TSAN/UBSan, core-dump analysis, Wireshark/tcpdump, load and soak testing, GoogleTest, SonarQube

### Software & Tools
- CMake, Meson, OpenGL, UML, JIRA, Agile, CI/CD (Jenkins), Git, SVN, Perforce, Debian packaging
- Redis, Consul, FreeTDS, ODBC
- AI-assisted development (Claude Code)

## Publications
<!-- List peer-reviewed publications, if any -->
- (none)

## Awards
- Best Team Manager - Samsung R&D India
- Best Team Player - Samsung R&D India
- Best Code Reviewer - Samsung R&D India
- Appreciation from Sony Japan for high-quality implementation

## References
- Available upon request.
