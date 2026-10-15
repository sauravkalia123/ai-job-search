# Search Queries for Job Scraper

<!-- Populated by /setup from Saurav Kalia's profile (~/code/data/cv.md) and extended with
the user's SOLUTIONS x KEYWORDS catalog (video comms, broadcast/OTT, display, surveillance,
audio, vertical products, ADAS, IVI, automotive platform). Worldwide scope: Germany, India,
EU/UK, Canada, Australia, New Zealand, Singapore, South Korea, Malaysia, UAE + remote. -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first.

- **linkedin-search** (enabled) - worldwide, one market per call:
  `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "<keyword>" -l "<market>" --jobage 7 --limit 10 --format json`
- **freehire-search** (enabled) - tech aggregator, MANY countries per call (preferred for worldwide sweeps):
  `bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "<keyword>" --country DE,IN,CA,AU,NZ,SG,KR,MY,AE,GB,NL,SE,JP,BE,FR --jobage 7 --limit 15 --format json`
  Regions: `--region eu,us,apac,global`. Remote: `--remote remote`.
- **cutshort-search** (enabled, added 2026-10-15) - India tech board (Bengaluru/Mumbai/Hyderabad/Pune + remote), single page per search:
  `bun run .agents/skills/cutshort-search/cli/src/cli.ts search -q "<keyword>" --jobage 7 --limit 15 --format json`
- **ashby-search** (enabled, added 2026-10-15; robots `/api/` caveat accepted by user) - Ashby ATS boards, PER-ORG ONLY (no global search):
  `bun run .agents/skills/ashby-search/cli/src/cli.ts search -b <org> --limit 15 --format json`
  Use it for org names discovered in `jobs.ashbyhq.com` URLs from other portals, or orgs the user names - not as a keyword sweep.
- **workday-search** (enabled, added 2026-10-15) - Workday tenant sites, PER-TENANT with SERVER-SIDE keyword search:
  `bun run .agents/skills/workday-search/cli/src/cli.ts search -b "<host>/<site>" -q "<keyword>" --limit 15 --format json`
  e.g. `-b cisco.wd5.myworkdayjobs.com/Cisco_Careers`. Use for tenants harvested from myworkdayjobs.com URLs (Cisco, Thales, Jabil, ...) or orgs the user names.
- **greenhouse-search** (enabled, added 2026-10-15) - Greenhouse boards, PER-ORG ONLY (no global search):
  `bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -o <org> --limit 15 --format json`
  Use for org tokens harvested from greenhouse.io URLs (Hudl, Geotab, SoundCloud, Alarm.com, ...).
- **lever-search** (enabled, added 2026-10-15) - Lever boards, PER-ORG ONLY (no global search; robots Crawl-delay 1):
  `bun run .agents/skills/lever-search/cli/src/cli.ts search -o <org> --limit 15 --format json`
  Use for org tokens harvested from jobs.lever.co URLs.
- **Danish demo portals** (jobindex, jobbank, jobdanmark, jobnet) ship **disabled** - not this candidate's market.

More portals via `/add-portal` (user will feed additional search providers).

The `site:` templates are the **WebSearch fallback** - for portals without a CLI, or when a CLI fails.

## Search Sites

User-named engines:
- **linkedin.com/jobs**, **instahyre.com**, **cutshort.io**, **naukri.com**, **hirist.tech** (India)
- **wellfound.com**, **workatastartup.com** (YC), **himalayas.app** (remote, global)

Per-country boards (WebSearch fallback):
- **Germany:** stepstone.de, arbeitsagentur.de, xing.com/jobs, indeed.com/de
- **Europe:** eures.europa.eu, welcometothejungle.com, berlinstartupjobs.com
- **UK:** uk.indeed.com, totaljobs.com
- **Canada:** jobbank.gc.ca, indeed.com/ca, eluta.ca
- **Australia:** seek.com.au, jora.com · **New Zealand:** seek.co.nz, trademe.co.nz/jobs
- **Singapore:** mycareersfuture.gov.sg, jobstreet.com.sg · **South Korea:** saramin.co.kr, jobkorea.co.kr
- **Malaysia:** jobstreet.com.my, hiredly.com.my · **UAE/Gulf:** bayt.com, gulftalent.com, naukrigulf.com
- **India (extra):** foundit.in, timesjobs.com · **Remote:** remoteok.com, weworkremotely.com, remotive.com

## Solution Catalog (search by product domain)

The candidate's skills map onto ~60 product solutions in 9 families. `/scrape` searches by the
family's keywords (postings rarely name the solution; they name its keywords). Every family is
searched in every market - there is no geography-based family filter.

**Family priorities (candidate mandate 2026-10-15):** default sweeps run the **full
Strong-tier keyword catalog + the full solution-name pass** — Families A-E keywords plus
the automotive solutions the candidate explicitly added to the standing catalog
(automotive infotainment, automotive BSP, automotive camera, driver monitoring,
in-vehicle video, rear-seat entertainment). The remaining Weak-tier keywords
(ADAS sensor-fusion taxonomy, AUTOSAR/ISO 26262, IFE, hospitality TV, cloud gaming,
telehealth, medical video, smart home, e-learning, ...) run only in `/scrape broad` or
when the user names them.

### Family A - Video communication
| Solution | Keywords |
|----------|----------|
| Video conferencing platform (Zoom/Teams/Jitsi-style) | WebRTC, video conferencing, SIP, audio mixing, A/V sync, H.264/H.265, media server |
| Meeting-room systems / room codecs (Poly, Cisco, Logitech) | GStreamer, WebRTC, SIP, PipeWire, audio streaming |
| Live interactive streaming (auctions, gaming, live commerce) | WebRTC, media server, HLS, live streaming |

### Family B - Broadcast and TV delivery
| Solution | Keywords |
|----------|----------|
| OTT platform (Netflix/Hotstar-style) | OTT, HLS, MPEG-DASH, DRM (Widevine/PlayReady), H.264/H.265, FFmpeg |
| IPTV headend / middleware | IPTV, multicast, MPEG-TS, H.264/H.265, video pipeline |
| Set-top box / Android TV / RDK | set-top box, STB, RDK, Android TV, GStreamer, DRM, HLS/DASH, A/V sync |
| Smart TV media player | smart TV, GStreamer, DRM, H.265, A/V sync |
| Live transcoding / ABR encoding farm | transcoder, FFmpeg, GStreamer, H.264/H.265, HLS/DASH, ABR |
| Broadcast contribution / remote production | SRT, RIST, NDI, SMPTE 2110, real-time media, video pipeline, A/V sync |
| Cloud playout / FAST channels | cloud playout, FAST channels, FFmpeg, HLS, video pipeline |
| CDN / origin / packager | packager, CDN, HLS, MPEG-DASH, DRM, LL-HLS, CMAF |

### Family C - Visual display
| Solution | Keywords |
|----------|----------|
| Digital signage platform | digital signage, GStreamer, video pipeline, H.264/H.265, scheduling |
| Video wall controller | video wall, multi-output sync, GStreamer, A/V sync |
| Retail / DOOH advertising screens | DOOH, digital out of home, signage, video streaming |
| Control room / command centre displays | control room, video wall, multi-stream decode, RTSP |
| Stadium / venue displays | venue display, video wall, real-time media, low-latency video |

### Family D - Surveillance and vision
| Solution | Keywords |
|----------|----------|
| VMS / NVR / IP-camera surveillance | VMS, NVR, IP camera, RTSP, H.264/H.265, GStreamer, media server, video surveillance |
| Fleet / dashcam telematics | dashcam, telematics, GStreamer, H.264, HLS, WebRTC live view, event data recorder (EDR) |
| Body-worn camera / evidence platform | body-worn camera, video pipeline, secure upload |
| Video analytics / edge AI | video analytics, edge AI, DeepStream, OpenVINO, TensorRT, GStreamer |

### Family E - Audio
| Solution | Keywords |
|----------|----------|
| Pro-audio / broadcast audio routing | JACK, PipeWire, audio mixing, A/V sync, pro audio |
| Linux desktop / automotive audio stack | PipeWire, ALSA, audio streaming, audio mixing |

### Family F - Vertical and embedded products
| Solution | Keywords |
|----------|----------|
| In-vehicle infotainment / rear-seat entertainment | IVI, GStreamer, PipeWire, A/V sync, H.264 |
| In-flight entertainment (IFE) | in-flight entertainment, IFE, DRM, HLS, video streaming |
| E-learning / lecture capture | lecture capture, HLS, video pipeline, A/V sync |
| Hospitality TV / hotel IPTV | hospitality TV, hotel IPTV, IPTV, STB, DRM |
| Cloud gaming / remote desktop streaming | cloud gaming, remote desktop, WebRTC, H.264/H.265, low-latency video |
| Medical imaging / surgical video | medical video, surgical video, video pipeline, low-latency video |
| Smart home video (doorbells, baby monitors) | smart home video, doorbell camera, WebRTC, H.264, media server |

### Family G - ADAS (driver assistance and safety)
| Solution | Keywords |
|----------|----------|
| Surround-view / 360-degree camera | surround view, 360 camera, multi-camera, V4L2, GPU stitching, low-latency video |
| Rear-view / reversing camera | V4L2, low-latency video, fast boot |
| Camera Monitor System / digital mirrors (UN R46) | camera monitor system, digital mirror, UN R46, glass-to-glass latency |
| Driver Monitoring System (DMS) | driver monitoring, DMS, drowsiness, distraction, IR camera, edge AI, DeepStream |
| Occupant Monitoring System (OMS) | occupant monitoring, OMS, multi-camera, edge AI |
| FCW / LDW / sign recognition / pedestrian detection | FCW, LDW, traffic sign recognition, pedestrian detection, video analytics, edge AI |
| Blind-spot detection / sensor fusion | blind-spot, sensor fusion, timestamp sync |
| Automated parking assist | automated parking, surround view, sensor fusion |
| ADAS data logger / recorder | data logger, multi-stream capture, H.265, high-bitrate recording, PTP |
| Event data recorder / video telematics | event data recorder, EDR, video telematics, H.264, GStreamer, cloud upload |
| ADAS HIL/SIL test benches | HIL, SIL, sensor replay, video injection, FFmpeg |
| ADAS compliance/safety context | ISO 26262, ASIL, AUTOSAR, Euro NCAP, ISP tuning |

### Family H - In-vehicle infotainment (IVI)
| Solution | Keywords |
|----------|----------|
| IVI head unit (Android Automotive, AGL, QNX) | Android Automotive, AAOS, AGL, QNX, head unit, GStreamer, PipeWire, A/V sync |
| Digital instrument cluster | instrument cluster, GPU compositing, low-latency video |
| Rear-seat entertainment (RSE) | rear-seat entertainment, RSE, DRM (Widevine/PlayReady), multi-zone audio |
| Smartphone projection | CarPlay, Android Auto, H.264 streaming, audio routing |
| Automotive audio stack | multi-zone audio, AVB/TSN, PipeWire, JACK, audio mixing, ducking |
| Hands-free / in-car voice | SIP/VoIP, echo cancellation (AEC), audio streaming |
| In-car video conferencing | WebRTC, audio mixing, camera pipeline |
| In-car OTT / streaming apps | HLS, MPEG-DASH, DRM, ExoPlayer, Shaka |
| Head-up display / AR navigation | HUD, head-up display, AR navigation, video overlay, GPU compositing |
| eCall / emergency video | eCall, SIP, cellular streaming |

### Family I - Automotive platform layer
| Solution | Keywords |
|----------|----------|
| Automotive Linux BSP / Yocto media stack | automotive BSP, Yocto, GStreamer, V4L2, VPU, i.MX, TI Jacinto, Qualcomm SA8xxx |
| Hypervisor-split cockpit | hypervisor, cockpit, QNX, safety isolation |
| Automotive Ethernet A/V | AVB/TSN, IEEE 1722, RTP, PTP/gPTP time sync |
| GMSL / FPD-Link camera bring-up | GMSL, FPD-Link, MIPI CSI-2, V4L2, serializer, deserializer |
| OTA update for media/ADAS software | OTA, A/B partitions, secure boot, Yocto |

## Master Keyword Inventory (tiered - candidate taxonomy, 2026-10-13)

Keywords are tiered exactly as in `04-job-evaluation.md`. **Strong and Moderate tiers are the
active search pool. Weak-tier keywords are NOT searched by default** (they would only surface
roles that score down); they run only on explicit user request or `/scrape broad`.

- **Titles (always):** staff software engineer, principal software engineer, staff engineer, senior software engineer, senior staff engineer, software architect, tech lead
- **Strong tier (active):** C, embedded C, C++14/17/20, concurrency, multithreading, Linux, embedded Linux, RTOS, GStreamer, FFmpeg, WebRTC, RTP/RTCP, RTSP, HLS, MPEG-DASH, MP4, H.264, H.265, video streaming, real-time media, low-latency video, video pipeline, camera pipeline, media server, multi-stream processing, multi-stream decoding, audio/video synchronization, digital signage, video wall, IPTV, OTT, set-top box, STB, smart TV, Tizen, video telematics, dashcam, live view, video recording, Widevine, PlayReady, DRM, performance optimization, memory optimization, multicast video, embedded multimedia, video playback, live transcoding
- **Moderate tier (active, partial credit):** SIP, VoIP, PipeWire, JACK, ALSA, audio mixing, audio routing, audio streaming, MPEG-TS, SRT, RIST, NDI, CMAF, LL-HLS, VP8, VP9, AV1, AAC, Opus, ABR, CDN, origin server, media packager, IPTV headend, broadcast video, cloud playout, video conferencing, remote production, VMS, NVR, IP camera, body-worn camera, video analytics, edge AI, V4L2, Yocto, Linux BSP, VPU, Android TV, RDK, ExoPlayer, Shaka Player, Wayland, Weston, QNX, AGL, Android Automotive (AAOS), video injection, timing-accurate playback, multi-camera capture, high-bitrate recording, cloud upload, secure upload, fast boot, OTA updates, secure boot, A/B partitions, PTP, gPTP, automotive Ethernet, shared camera buffers, GPU compositing, video overlay, multi-output synchronization, multi-zone audio, echo cancellation (AEC), MQTT, SQLite, OpenSSL
- **Weak tier (NOT searched by default):** ADAS, AUTOSAR, ISO 26262, ASIL, UN R46, Euro NCAP, driver monitoring, DMS, OMS, FCW, LDW, traffic sign recognition, pedestrian detection, blind-spot, sensor fusion, parking assist, surround view, digital mirror, CMS, IR camera, radar, GMSL, FPD-Link, MIPI CSI-2, ISP tuning, GPU stitching, DeepStream, OpenVINO, TensorRT, HIL/SIL, safety pipeline/partitioning/isolation, hypervisor cockpit, QNX guest, TI Jacinto, Qualcomm SA8xxx (automotive context), CarPlay, Android Auto, IEEE 1722, AVB/TSN, SMPTE 2110, medical video, surgical video, drone video, robotics video, smart home video, telehealth, in-flight entertainment, hospitality TV, e-learning video, contact centre, UCaaS, public address, intercom, paging, internet radio, podcast streaming, cloud gaming, remote desktop, stadium displays, DOOH, retail advertising screens, instrument cluster, HUD, AR navigation, eCall, serializer/deserializer, CAN, Rust, Kafka, AWS, Kubernetes, Docker, web frontends, data engineering, mobile

## How `/scrape` combines solution x keyword x market

For each enabled CLI, run solution keywords against every market. freehire covers **all
countries in one call** via `--country` (use for worldwide sweeps). LinkedIn needs one call
per market - prioritize markets in this order: Germany, India (work-ready), then Canada,
Australia, Singapore, UAE, South Korea, Malaysia, Japan, New Zealand, UK/EU, then Remote.

Markets table:

| Market | LinkedIn `-l` string | freehire `--country` |
|--------|---------------------|----------------------|
| Germany | "Germany" (also "Munich, Germany") | DE |
| India | "India" | IN |
| Canada | "Canada" | CA |
| Australia | "Australia" | AU |
| New Zealand | "New Zealand" | NZ |
| Singapore | "Singapore" | SG |
| South Korea | "South Korea" | KR |
| Malaysia | "Malaysia" | MY |
| UAE | "United Arab Emirates" | AE |
| UK / EU | "United Kingdom", "Netherlands", "Sweden", "Belgium", "France" | GB, NL, SE, BE, FR |
| Japan | "Japan" | JP |
| Remote | "Remote" | `--remote remote` |

High-yield single keywords for CLI sweeps (one at a time; LinkedIn matches loosely, so
prefer precise terms over OR-chains): `webrtc`, `gstreamer`, `rtsp`, `ffmpeg`, `hls`,
`dashcam`, `ott`, `iptv`, `video wall`, `digital signage`, `video surveillance`,
`set-top box`, `embedded linux`, `media server`, `yocto`.
Broad-only (Moderate tier, run on /scrape broad or named focus): `android automotive`,
`video conferencing`, `vms`, `a/b update`, `wayland`.

## Sponsorship keyword rule (candidate instruction, 2026-10-13)

For **every market EXCEPT India**, run each keyword query twice: the plain keyword, and the
keyword combined with sponsorship terms - postings that mention sponsorship are the ones that
can actually hire a non-citizen:

- LinkedIn: `-q "<keyword>"` and `-q "<keyword> visa sponsorship"` (also try `"visa sponsorship"` alone as a query per market)
- freehire: same `-q` variants
- WebSearch fallbacks: `site:<board> <keyword> "visa sponsorship"` (and `"work visa"` / `"sponsorship available"` as variants)

India is exempt - the candidate is a citizen, no sponsorship needed, so the variant is skipped there.
English-only postings: if a posting specifies no language, assume English (always passes the Language Gate).

## Solution-name search pass (candidate request, 2026-10-13)

Alongside the skill-keyword sweeps, run a dedicated pass of **solution/product-name queries** -
postings often name the product domain ("build our OTT platform", "video conferencing team",
"signage product") rather than the underlying skill. Every sweep runs these, one query per
phrase, scoped per market (LinkedIn) or multi-country (freehire), with the 7-day window and the
sponsorship variant rule (non-India) applied to each:

    "video conferencing" | "OTT platform" | "IPTV" | "set-top box" | "Android TV" |
    "smart TV" | "digital signage" | "video wall" | "video surveillance" | "VMS" |
    "dashcam" | "video telematics" | "media server" | "live streaming" |
    "cloud playout" | "broadcast video" | "webrtc media server" | "iptv middleware" |
    "video transcoding" | "control room" | "professional av" | "video management system" |
    "nvr" | "automotive infotainment" | "automotive bsp" | "automotive camera" |
    "driver monitoring" | "in-vehicle video" | "rear-seat entertainment"

Rules:
- Tier-pure: phrases are Strong or Moderate tier per `04-job-evaluation.md`, with one
  candidate-mandated exception (2026-10-15): the automotive phrases above (automotive
  infotainment/BSP/camera, driver monitoring, in-vehicle video, rear-seat entertainment)
  run on every sweep despite Weak-tier classification - they are standing catalog by
  explicit user instruction. Other Weak-tier solutions (telehealth, cloud gaming, IFE,
  UCaaS, DOOH, smart home, ...) are still never searched by default.
- LinkedIn: `<phrase> -l "<market>" --jobage 7`. freehire: `-q "<phrase>" --country ... --jobage 7`.
- Non-India markets: also run the `"visa sponsorship"`-combined variant per the rule above.
- India: plain phrase only.

## Location Filter

Open to relocation **worldwide** - no commute-based filter. Tiers:
- **Tier 1 (work-ready now):** Germany (Opportunity Card holder), India (citizen)
- **Tier 2 (priority relocation):** Canada, Europe/EU/UK, Australia, UAE, New Zealand, Singapore, South Korea, Malaysia
- **Tier 3:** any other country ("Sponsorship required" CV line applies)
- **Remote:** any reasonable timezone overlap

Never drop a job for location. Sponsorship wording -> Eligibility Gate (`04-job-evaluation.md`).

## Language Filter

Working languages: English (professional), Hindi (native), German (A1, learning). Apply the
Language Gate: a required undeclared language excludes the posting; German above A1 is flagged,
not dropped. Queries stay English worldwide; Korean variants for local boards only:
임베디드 리눅스 (embedded Linux), C++ 멀티미디어 (C++ multimedia), 펌웨어 (firmware).

## Date Filter

Only jobs posted within the last 7 days (or unexpired deadline). Undated: include, flag "date unknown".

## Adapting Queries

"/scrape <focus>" -> matching family/keyword + 2-3 custom queries. "/scrape germany" ->
all keywords scoped to DE. "/scrape india" -> Naukri/Instahyre/Cutshort/Hirist fallbacks.
"/scrape automotive" -> Families G/H/I keywords across all markets.
