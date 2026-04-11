# Space Schedule — Artemis II Splashdown → Next Lunar Landing

**Window:** 2026-04-11 (Artemis II splashdown) → first crewed lunar surface landing (now Artemis IV, NET 2028)

> **⚠️ Schedule reality check (Feb–Mar 2026):** NASA's [Feb 27, 2026 architecture update](https://www.nasa.gov/news-release/nasa-adds-mission-to-artemis-lunar-program-updates-architecture) redesignated **Artemis III as a 2027 LEO rendezvous/docking demo** — *not* the first lunar landing. The first crewed lunar surface landing is now **Artemis IV (NET 2028)**. The [NASA OIG IG-26-004 audit (Mar 10, 2026)](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf) confirms the reshuffle is driven by HLS readiness, specifically Starship's propellant architecture.

---

## 🎯 The ONE thing that matters: Starship orbital refilling

**SpaceX Starship vehicle-to-vehicle cryogenic propellant transfer demo** is the single most consequential event in this window. Claude, Gemini 3.1 Pro, and Codex/GPT-5.4 converged on this independently.

### Why it's the linchpin

1. **Hardest unsolved capability in the entire Artemis stack.** NASA OIG calls it "one of the most significant technical challenges" facing the program. Vehicle-to-vehicle cryogenic transfer at 100+ ton scale **has never been done**. SLS and Orion are proven. Landing GNC has Apollo/Dragon heritage. Cryogenic Fluid Management (CFM) in microgravity is genuine novel physics.

2. **It resets the rocket equation.** Transitions deep space from the Apollo paradigm (carry all delta-v off the pad) to the maritime paradigm (launch dry, top up in LEO, depart with full tanks). Unlocks 100+ tons to the lunar surface. Failure forces a fundamental redesign of Artemis and collapses Starship's thesis for Mars, lunar cargo, and large observatory deployment.

3. **Technical problems that are genuinely unsolved at scale:**
   - **Microgravity fluid dynamics** — ullage thrust to settle sub-cooled LOX/CH4 during transfer
   - **Thermodynamics/boil-off** — depot must hold cryo for weeks across 10–15 tanker flights while managing solar/IR loading, venting, thermal gradients
   - **Massive cryogenic docking** — two 9m × 50m steel silos achieving pressure-tight cryo fluid coupling and clean separation
   - **Post-transfer engine relight** on a freshly-fueled depot ship for TLI

4. **Upstream of the uncrewed HLS lunar demo.** Per OIG, the uncrewed demo is *not fully* "test like you fly" — some crew systems omitted, full end-to-end tanker aggregation not flight-tested before first crewed landing. If refilling doesn't work, the lunar demo doesn't happen.

### Tracker fields

Rename the terminal status line to **`HLS Critical Path`** or **`Starship Refuel Watch`**. State machine:

| Field | Type |
|---|---|
| Demo status | scheduled / flown / partial / success / failure |
| Tanker flights completed | integer (toward target ~10–15) |
| Docking achieved | bool |
| Net propellant transferred | tons |
| Transfer duration | minutes |
| Boiloff rate | kg/hr or %/day |
| Ullage/settling performance | pass / marginal / fail |
| Post-transfer engine relight | bool |
| Starbase pad turnaround cadence | days between tanker launches |
| Downstream impact | uncrewed HLS demo date delta |
| Latest NASA OIG risk rating | quote |

---

## Timeline

### Critical path to a crewed lunar landing

| Date (NET) | Event | Significance |
|---|---|---|
| Q2 2026 | Artemis II post-flight review | NASA certifies Orion heat shield, life support, nav. Feeds forward into Artemis III (LEO demo) and IV (landing). |
| **Mid–Late 2026** | **🚨 Starship orbital propellant transfer demo** | **Highest-stakes pass/fail test of the decade.** Linchpin of all downstream Artemis + Mars architecture. |
| Q4 2026 – Q1 2027 | Uncrewed Starship HLS lunar demo landing | Contractually required before crew flies on HLS. Runner-up in consequence but downstream of refilling. |
| 2027 | **Artemis III** — LEO rendezvous/docking demo *(not a lunar landing)* | Re-scoped Feb 2026. Orion + crew exercise operations without committing to lunar descent. |
| Q2 2027 | AxEMU suit qualification complete | Needed for Artemis IV surface EVAs. |
| **NET 2028** | **🌕 Artemis IV** — first crewed lunar landing since Apollo 17 | First woman and first person of color on the Moon. Lunar south pole. |

### Science flagships with hard launch windows

| Date (NET) | Event | Notes |
|---|---|---|
| **Nov 2026** | [ESA Hera arrives at Didymos/Dimorphos](https://www.esa.int/Space_Safety/Hera/ESA_s_Hera_targets_early_arrival_at_Didymos_asteroids) | Post-DART binary asteroid characterization. First detailed look at a kinetically-deflected body. |
| FY2026 | [JAXA MMX launch](https://www.isas.jaxa.jp/en/topics/004224.html) | Sample return from Phobos. H3 launch. |
| **Fall 2026 – May 2027** | [Nancy Grace Roman Space Telescope launch](https://science.nasa.gov/missions/roman-space-telescope/building-roman/) | Hubble-FOV wide-field infrared. Dark energy + exoplanet microlensing. Falcon Heavy from KSC. Biggest pure-science launch in the window. |

### Lunar race (non-Artemis)

| Date (NET) | Event | Notes |
|---|---|---|
| **Aug 2026** | [Chang'e 7](https://www.cnsa.gov.cn/english/n6465652/n6465653/c10517200/content.html) (China) | Long March 5 from Wenchang. Orbiter + lander + mini-hopper + relay, south pole water ice hunt. Spacecraft arrived at launch site April 2026. Direct competitor to Artemis landing zones. |
| Early 2026 (window open) | [Intuitive Machines IM-3](https://science.nasa.gov/lunar-science/clps-deliveries/) | Nova-C lander → Reiner Gamma swirl. Magnetometer, 3 swarm rovers, ESA retroreflector. |
| Late 2026 | [Firefly Blue Ghost 2](https://fireflyspace.com/blue-ghost/) | Lunar far side delivery + lunar-orbit comms relay (S/UHF/X-band). |
| 2026 | [Team Draper / ispace APEX 1.0](https://www.nasa.gov/commercial-lunar-payload-services/clps-providers/) | Schrödinger Basin, lunar far side. Seismometers, heat-flow drill. |
| **NET 2026 (realistic 2027–28)** | [LUPEX / Chandrayaan-5](https://humans-in-space.jaxa.jp/en/biz-lab/tech/lupex/) (JAXA/ISRO) | H3 launch. Polar water ice prospecting rover. Landing targeted late 2028. |

### Cislunar / LEO human spaceflight

| Date (NET) | Event | Notes |
|---|---|---|
| **Apr 16, 2026** | [Blue Origin New Glenn NG-3](https://www.blueorigin.com/news/new-glenn-3-to-launch-ast-spacemobile-bluebird-satellite) | AST SpaceMobile BlueBird 7. First booster reuse (NG-2 booster flew Nov 13, 2025). LC-36 CCSFS. |
| **NET Apr 2026** | [Boeing Starliner-1](https://en.wikipedia.org/wiki/Boeing_Starliner-1) | **Uncrewed cargo**, not crewed. Return-to-flight after 2024 CFT anomalies. |
| Late 2026 | Boeing Starliner next crewed flight | If Starliner-1 succeeds, Boeing's second operational crewed flight. |
| Currently on ISS | SpaceX Crew-12 | Launched Feb 2026. |
| Late 2026 | SpaceX Crew-13 | Routine rotation. |
| **NET Jan 2027** | [Axiom Ax-5](https://www.nasa.gov/news-release/nasa-selects-axiom-space-for-fifth-private-mission-to-space-station/) | First private astronaut mission since 2025 — no Ax missions in 2026. KSC launch, up to 14 days docked. |
| TBD 2027 | Axiom Ax-6 | Mission order still being finalized by NASA. |

### Outside the window (for reference)

| Date | Event | Why it's out |
|---|---|---|
| [NET Jul 2028](https://science.nasa.gov/mission/dragonfly/) | Dragonfly launch (Titan rotorcraft) | Post-window. |
| [April 2030](https://science.nasa.gov/mission/europa-clipper/) | Europa Clipper Jupiter arrival | Post-window. |
| [~2028](https://english.www.gov.cn/news/202504/24/content_WS6809cfcbc6d0868f4e8f208e.html) | Tianwen-3 (China Mars sample return) | Post-window. |
| TBD | Mars Sample Return (NASA/ESA) | Still in architectural rework, no flight milestone. |

---

## Weekly watchlist

1. **Starship test cadence** — tanker pairs, ship-to-ship transfer, return-to-launch-site catches
2. **HLS milestones** — KDP-C, CDR, uncrewed demo readiness reviews
3. **NASA Artemis schedule updates** from HQ briefings (monthly)
4. **NASA OIG semiannual Artemis reports** — most honest public source on schedule reality
5. **SpaceX launch manifest** — Starbase ops cadence
6. **AxEMU suit test reports** from Axiom + JSC

---

## Sources

Converging on Starship refilling as the pivot was a 3-provider consensus (Claude Opus 4.6, Gemini 3.1 Pro, Codex/GPT-5.4, 2026-04-11).

Primary references:
- [NASA release — Feb 27, 2026 architecture update](https://www.nasa.gov/news-release/nasa-adds-mission-to-artemis-lunar-program-updates-architecture)
- [NASA OIG IG-26-004 — HLS contracts audit, Mar 10, 2026](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf)
- [NASA Artemis III mission page](https://www.nasa.gov/mission/artemis-iii/)
- [NASA HLS program overview](https://www.nasa.gov/reference/human-landing-systems-2/)

*Last updated: 2026-04-11. Dates reflect NET schedules at time of writing and will slip.*
