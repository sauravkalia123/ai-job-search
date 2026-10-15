# Saurav Kalia

+91 8527089555 | sauravkalia@gmail.com | linkedin.com/in/saurav2026 | Munich, Germany — Open to Relocation | Germany Work Authorization (Chancenkarte)

---

## Professional Summary

**Principal Embedded C++ Engineer** with **19+ years** architecting **real-time video streaming systems** at scale. At **Lytx**, sustaining **100+ concurrent streams per node** across **700k+ dashcam devices** with **98.6% WebRTC session success** and **84% memory reduction**. At **Barco Control Rooms**, delivered **GPU-accelerated video walls (16x HD / 8x FHD / 4x 4K simultaneous streams)** with **frame-accurate multi-display synchronization** and **N+1 failover** for mission-critical deployments. Deep expertise: **GStreamer, WebRTC, embedded Linux, device drivers, bootloaders**. Led teams of **4-30 engineers**. Recognized with **Samsung's Best Team Manager & Best Code Reviewer** awards, appreciated by **Sony Japan**.

---

## Core Skills

- **Programming & Systems:** C, C++14/17/20, Rust, Embedded C, Python, Bash
- **Concurrency & Performance:** Multithreading, atomics and memory ordering, mutex/shared_mutex, Intel TBB, thread pools, epoll/non-blocking I/O, GLib/GObject main loops
- **Operating Systems:** Linux, Embedded Linux (Yocto/BitBake), Tizen, Unix, RTOS, ARM Toolchain, systemd
- **Multimedia & Streaming:** GStreamer, Pipewire, JackD, SDL2, FFmpeg, Janus, WebRTC (ICE, STUN/TURN, DTLS-SRTP, libnice), RTP/RTCP, HLS, MPEG-DASH, MP4/fMP4, DRM (Widevine, PlayReady), Video Wall, Layout Management, Audio mixing, H264, H265, hardware codecs (NXP VPU), clock and frame synchronization (PTP/IEEE 1588, framelock/genlock), AV streaming and decoding, echo cancellation (AEC), ALSA, Wayland/Weston
- **Streaming Protocols & Formats:** RTSP, SRT, MPEG-TS, multicast, LL-HLS, CMAF, VP8/VP9, AV1, AAC, Opus
- **Product & Solution Domains:** Video conferencing, OTT, IPTV, set-top box, smart TV, digital signage, video walls, control rooms, video surveillance (VMS/NVR, multi-stream decode), fleet dashcam telematics, event data recorder (EDR), in-vehicle multimedia, live streaming, embedded multimedia
- **Embedded Systems & Drivers:** I2C, SPI, UART, RS232, NAND/NOR Flash, Bootloaders, Device Drivers, Firmware Auto-Update, NXP i.MX8, camera subsystem (multi-camera capture, V4L2)
- **Networking & Protocols:** TCP/UDP sockets, Kafka, MQTT, DBus, REST APIs, WebSockets, SNMP
- **Security:** OpenSSL (TLS, AES-GCM), certificate chains, secure coding, GitHub Advanced Security (CodeQL)
- **Cloud & Observability:** AWS (EKS, NLB, EC2), Docker, Kubernetes, New Relic, structured logging
- **Debugging & Quality:** gdb, Valgrind, ASAN/TSAN/UBSan, core-dump analysis, Wireshark/tcpdump, load and soak testing, GoogleTest
- **Tools & Frameworks:** CMake, UML, OpenGL, SonarQube, JIRA, Agile, CI/CD, Jenkins, Git, SVN, Perforce, AI-assisted development (Claude Code)
- **Databases & Config:** SQLite, Redis, Consul, FreeTDS, ODBC

---

## Work Experience

### Lytx Inc — *Dec 2025 – Present*
***Staff Software Engineer | Bengaluru, India***

- Lead **Mediacore** — streaming engine capturing dashcam video and outputting WebRTC, HLS, or recordings
- Optimized pipelines to sustain **100+ concurrent live streams per node** across **700k+ deployed devices**
- Achieved **98.6% session success rate (592/600 WebRTC sessions)** through targeted optimizations
- Eliminated **84% of memory growth** in GStreamer processes using Valgrind and custom instrumentation for multi-day stability
- Integrated **AI/ML driver monitoring** (fatigue, drowsiness, seatbelt, unsafe driving) into real-time pipeline
- Resolved high-concurrency bottlenecks via buffer flow control, thread tuning, and back pressure handling

*Cloud media server — C++17, GStreamer, WebRTC, HLS, epoll, TBB, AWS EKS*

- Load-tested up to **600 concurrent WebRTC sessions** and **3,000-session runs**; verified **zero session leaks across 4,286 sessions** and **99.3% session-start success**
- Root-caused a production server hang: a socket **fd double-close** was recycled into a GStreamer bus poll pipe, spinning one thread at **100% CPU** and stalling the whole **350-worker pool**; fixed with an atomic single-owner fd lifecycle
- Fixed worker-pool exhaustion (**2,000-thread pool** drained by half-open TCP connections) with TCP keepalive and idle timeouts; fixed dropped connections during **250-device reconnect storms** (undersized listen backlog)
- Root-caused the residual **1.5% ICE failure rate** to ICE timer and STUN/TURN topology, using statistical analysis across concurrency levels
- Found and fixed a **critical unauthenticated remote-code-execution** vulnerability (shell injection) with a 3-layer defense; resolved GitHub Advanced Security (CodeQL) findings
- Added a native C++ **health endpoint**, crash/core-dump handling, no-media watchdogs and structured telemetry for New Relic

*Dashcam device (multi-camera, NXP i.MX8, Yocto Linux) — recorder, storage, playback UI*

- Raised main-camera recording duty cycle from **49% to ~100%** by finding a boot-script stall of **12.6 hours/day** (one process fork per line over a **5.4M-line** log)
- Fixed a cross-thread race in the recording index that permanently lost aux-camera footage: **recording gaps cut from 171 to 2**, **25+ hours** of video recovered, passed a **21-hour soak**
- Fixed a GStreamer hang that pinned hardware-codec memory (CMA free **491 MB → 8 MB**) and drove a camera restart loop
- Fixed green-screen playback (VFR → CFR encoding) and cut on-device playback load: AES-GCM decrypt to RAM, H.264 level rewrite to fit the hardware decoder's memory, decoder lifecycle and watchdog
- Diagnosed recording-index outages (SQLite disk-full from an unrotated **450 MB/day** log); migrated components to **Yocto Scarthgap** and modern C++17
- Built AI-assisted engineering tooling (Claude Code): a log profiler that summarises a **292 MB / 2.5M-line** log in ~25 lines, and a code index across 9 repos, cutting triage from hours to minutes

*Tech: C++17/20, Embedded Linux (Yocto/BitBake), ARM (NXP i.MX8), GStreamer, WebRTC, HLS, MP4, H.264, OpenSSL (AES-GCM, TLS), SQLite, MQTT, systemd, AWS EKS, Docker, Kubernetes, New Relic, Jenkins, Valgrind, ASAN/TSAN, gdb, Wireshark, Python*

### Voizzit Information Technology — *Jan 2025 – Nov 2025*
***Computer Engineer | Dubai, UAE***

- Architected real-time streaming platform from scratch: GStreamer/Janus media plane, C++17 + Rust middleware, Kafka event bus
- Built Kafka-based distributed messaging backbone for high-throughput, low-latency inter-service communication
- Improved system responsiveness through architecture and pipeline tuning
- Supervised team of **4 engineers** — owned architecture, code quality, and delivery

*Tech: C++17/20, Rust, GStreamer, Kafka, Janus, Python*

### Barco Electronics Systems — *Jan 2019 – Jan 2025*
***Technical Specialist — Control Rooms | Noida, India***

- **End-to-end owner of the media pipeline and the layout manager** for control-room video walls playing **16x HD, 8x FHD or 4x 4K simultaneous video streams** with ultra-low latency
- **Desktop-as-video streaming:** captured X.Org and Wayland desktops with GPU-accelerated GStreamer screen-scraping plugins, encoded and decoded them with Barco's proprietary codec, and streamed them out as live video; audio routed through JACK and PipeWire
- **Remote interaction:** mouse and keyboard control of remote sources through GStreamer navigation events, plus VNC (SDL2) and WebRTC for low-latency interactive video
- **Multi-display synchronization at two levels:**
  - **Clock sync**, so every display starts rendering at the same instant: hardware sync with **NVIDIA Quadro Sync II** cards (framelock/genlock), software sync with PTP (IEEE 1588) clocks
  - **Frame sync**, so every display renders the same frame at the same time, for seamless content across the whole wall
- Built the layout manager for multi-screen composition, scaling and window placement across the wall
- Architected microservices with DBus, WebSockets and REST APIs; built secure remote-management interfaces; deployed CI/CD and automated testing
- Implemented device discovery (Avahi/DHCP) and N+1 failover for vertical scalability

*Tech: C++17/20, GStreamer (incl. navigation events), PipeWire, JACK, X.Org, Wayland, OpenGL, SDL2, VNC, WebRTC, PTP (IEEE 1588), NVIDIA Quadro Sync II (framelock/genlock), Barco proprietary codec, Debian, Meson, Debian packaging, CI/CD, CoCo Framework*

### Samsung R&D India — *Dec 2011 – Jan 2019*
***Chief Engineer | Noida, India***

- Developed SoC-based Signage solution with simultaneous audio, dual video, PDF, and text playback
- Implemented video wall extension with frame-accurate synchronization across multiple TVs
- Integrated OTT apps (Netflix, Amazon Prime) with DRM-secure streaming (Widevine/PlayReady)
- Developed Hotel TV features as IoT gateway and centralized control interface
- Implemented SNMP-based remote monitoring and control for multiple TVs
- Built multi-threaded content manager parsing XML metadata for playback scheduling
- Managed **30 engineers** across architecture, development, and code quality — delivered MagicInfo, a production-grade Signage and Video Wall Solution

*Tech: C/C++, Linux, Tizen OS, ARM Toolchain, GStreamer, OTT, DRM (Widevine, PlayReady)*

### HCL Technologies India — *Sep 2010 – Oct 2011*
***Lead Engineer | Bengaluru, India***

- Designed storage middleware features: Audio Description (AD) and Retention Limit policies
- Created HDD content management layer for SoC-based platforms handling media storage lifecycle
- Supervised team of **4 engineers** — oversaw design (HLD/DLD), development, and code quality

*Tech: C++, ARM Toolchain*

### Intek Digital Inc — *Sep 2009 – Sep 2010*
***Senior Software Engineer | South Korea***

- Designed and deployed STB middleware on ST5105/ST5107 chipsets
- Implemented Transport Stream parsing, channel data storage (transponder, PMT, A/V PID), and NIT parsing for auto updates
- Built Auto/Manual search features with reliable tuner locking

*Tech: C/C++, RTOS (ST-OS20), ST Toolchain*

### Logic Eastern India Pvt Ltd — *Jun 2007 – Aug 2009*
***Senior Software Engineer | Noida, India***

- Developed STB firmware and interactive UI for STMicroelectronics chipsets
- Built transport stream parser, tuner drivers, channel search, and UI components
- Implemented bare-metal bootloader with A/B OTA update logic and NAND/NOR flash device drivers for embedded Linux BSP — zero-brick guarantee via A/B fallback

*Tech: C/C++, RTOS (ST-OS20), ST Toolchain*

---

## Education

- **Master of Computer Applications (MCA)** — Punjab Technical University, India — *2007*
- **Bachelor of Computer Applications (BCA)** — Punjab Technical University, India — *2004*

---

## Languages

- **English:** Professional working proficiency
- **Hindi:** Native
- **German:** Beginner (A1) — actively learning

---

## Technical Focus Areas

- Real-time video streaming systems (low latency, high throughput)
- GStreamer pipeline design, optimization, and debugging
- Embedded Linux systems (ARM, constrained environments)
- Multi-stream video processing and synchronization
- Performance engineering (CPU, memory, threading, I/O)

---

## Key Achievements

- Delivered video wall and streaming systems deployed in **global control rooms** and large-scale environments
- Recognized with multiple awards at Samsung: **Best Team Manager, Best Team Player, Best Code Reviewer**
- Successfully led architecture and delivery of **multiple production-grade multimedia platforms**
- Received appreciation from **Sony Japan** for high-quality implementation
