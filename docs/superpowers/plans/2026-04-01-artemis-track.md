# Artemis Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real-time Artemis II mission tracker as an npm package that renders a companion-style ASCII sprite in Claude Code's status line.

**Architecture:** Two components — (1) a Cloudflare Worker that fetches/parses NASA AROW ephemeris data and serves a JSON API, (2) an npm package `artemis-track` that fetches from the worker and renders companion-style output to Claude Code's status line. The npm package also supports a standalone `--tui` mode.

**Tech Stack:** TypeScript, Node.js 18+, Cloudflare Workers + KV, npm for distribution.

---

## File Map

```
artemis-track/
├── package.json              # npm package config, bin entry
├── tsconfig.json             # TypeScript config
├── src/
│   ├── index.ts              # Entry: detect stdin/tty, dispatch mode
│   ├── types.ts              # Shared types (API response, config)
│   ├── api.ts                # Fetch from CF worker + file cache
│   ├── sprites.ts            # Orion ASCII sprites (3 frames) + colors
│   ├── trajectory.ts         # Trajectory bar renderer (Earth·····•····Moon)
│   ├── statusline.ts         # Claude Code statusline output (companion style)
│   └── tui.ts                # Standalone TUI mode (--tui flag)
├── test/
│   ├── sprites.test.ts       # Sprite frame output tests
│   ├── trajectory.test.ts    # Trajectory bar position tests
│   ├── api.test.ts           # API fetch + cache tests
│   └── statusline.test.ts    # Full statusline render tests
├── worker/
│   ├── wrangler.toml         # CF Worker config
│   ├── src/
│   │   ├── index.ts          # Worker entry: /position endpoint
│   │   ├── parser.ts         # CCSDS OEM ephemeris parser
│   │   └── compute.ts        # Distance/velocity from state vectors
│   └── test/
│       ├── parser.test.ts    # OEM parsing tests
│       └── compute.test.ts   # Math tests
└── README.md                 # Install instructions
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/an/artemis-track
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "artemis-track",
  "version": "0.1.0",
  "description": "Real-time Artemis II mission tracker for your terminal and Claude Code status line",
  "type": "module",
  "bin": {
    "artemis-track": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "node --test --experimental-strip-types test/*.test.ts",
    "dev": "tsc --watch"
  },
  "files": [
    "dist/"
  ],
  "keywords": ["artemis", "nasa", "space", "tracker", "claude-code", "statusline", "cli"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "worker", "test"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
/tmp/
*.tgz
.wrangler/
```

- [ ] **Step 5: Create directory structure**

```bash
mkdir -p src test worker/src worker/test
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold project structure"
```

---

### Task 2: Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types.ts

export interface ArtemisPosition {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: MissionPhase;
  timestamp: string;
  crew: string[];
  stale?: boolean;
}

export type MissionPhase =
  | "earth_orbit"
  | "transit_to_moon"
  | "lunar_flyby"
  | "return_to_earth"
  | "reentry"
  | "complete";

export interface CachedData {
  data: ArtemisPosition;
  fetchedAt: number; // epoch ms
}

// ANSI color helpers
export const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  orange: "\x1b[38;5;208m",
  gold: "\x1b[38;5;178m",
  blue: "\x1b[38;5;75m",
  silver: "\x1b[38;5;245m",
} as const;

export const API_URL = "https://artemis.aircloudy.co/position";
export const CACHE_PATH = "/tmp/artemis-track-cache.json";
export const CACHE_TTL_MS = 30_000;

// Mission constants
export const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z"); // 6:35 PM EDT
export const EARTH_MOON_DISTANCE_KM = 384_400;
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types and constants"
```

---

### Task 3: Sprites

**Files:**
- Create: `src/sprites.ts`
- Create: `test/sprites.test.ts`

- [ ] **Step 1: Write sprite test**

```typescript
// test/sprites.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSpriteFrame, SPRITE_FRAMES } from "../src/sprites.ts";

describe("sprites", () => {
  it("has 3 frames", () => {
    assert.equal(SPRITE_FRAMES.length, 3);
  });

  it("each frame has 5 or 6 lines", () => {
    for (const frame of SPRITE_FRAMES) {
      assert.ok(frame.length >= 5 && frame.length <= 6);
    }
  });

  it("getSpriteFrame cycles through idle sequence", () => {
    const f0 = getSpriteFrame(0);
    const f1 = getSpriteFrame(4); // thrust frame in sequence
    assert.notEqual(f0, f1);
  });

  it("getSpriteFrame returns string with Orion label", () => {
    const frame = getSpriteFrame(0);
    assert.ok(frame.includes("Orion"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/an/artemis-track && npm test
```

Expected: FAIL — module not found

- [ ] **Step 3: Write sprites implementation**

```typescript
// src/sprites.ts
import { C } from "./types.ts";

// Each frame: array of raw lines (5-6 lines tall, ~12 chars wide)
// Colors applied via ANSI escape codes
export const SPRITE_FRAMES: string[][] = [
  // Frame 0: idle
  [
    "            ",
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.cyan}○○${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.orange}⊿⊿⊿⊿${C.reset}     `,
  ],
  // Frame 1: thrust (windows lit, exhaust right)
  [
    "            ",
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.gold}●●${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.orange}⊿⊿⊿⊿${C.dim}~${C.reset}    `,
  ],
  // Frame 2: boost (particles above and below)
  [
    `  ${C.dim}~ ~${C.reset}       `,
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.cyan}○○${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.dim}~${C.orange}⊿⊿⊿⊿${C.dim}~${C.reset}   `,
  ],
];

// Idle sequence: mostly frame 0, occasional thrust/boost
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0];

const NAME_LABEL = `  ${C.gold}Orion${C.reset}     `;

export function getSpriteFrame(tick: number): string {
  const frameIndex = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
  const lines = [...SPRITE_FRAMES[frameIndex]!, NAME_LABEL];
  return lines.join("\n");
}

export function getSpriteLines(tick: number): string[] {
  const frameIndex = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
  return [...SPRITE_FRAMES[frameIndex]!, NAME_LABEL];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sprites.ts test/sprites.test.ts
git commit -m "feat: add Orion companion sprites with 3 animation frames"
```

---

### Task 4: Trajectory Bar

**Files:**
- Create: `src/trajectory.ts`
- Create: `test/trajectory.test.ts`

- [ ] **Step 1: Write trajectory test**

```typescript
// test/trajectory.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderTrajectoryBar } from "../src/trajectory.ts";

describe("trajectory bar", () => {
  it("shows position marker near Earth when distance is small", () => {
    const bar = renderTrajectoryBar(1000, 383400);
    // The • should be very close to the left (Earth side)
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("•");
    const earthPos = stripped.indexOf("🌍");
    assert.ok(dotPos - earthPos < 8, `dot at ${dotPos}, earth at ${earthPos}`);
  });

  it("shows position marker near Moon during flyby", () => {
    const bar = renderTrajectoryBar(380000, 4400);
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("•");
    const moonPos = stripped.indexOf("🌑");
    assert.ok(moonPos - dotPos < 8, `dot at ${dotPos}, moon at ${moonPos}`);
  });

  it("shows position marker in middle during transit", () => {
    const bar = renderTrajectoryBar(192200, 192200);
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("•");
    assert.ok(dotPos > 5 && dotPos < 30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

- [ ] **Step 3: Write trajectory implementation**

```typescript
// src/trajectory.ts
import { C, EARTH_MOON_DISTANCE_KM } from "./types.ts";

const BAR_WIDTH = 24;

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
): string {
  const total = distanceEarthKm + distanceMoonKm;
  const progress = total > 0 ? distanceEarthKm / total : 0;
  const pos = Math.round(progress * (BAR_WIDTH - 1));

  let dots = "";
  for (let i = 0; i < BAR_WIDTH; i++) {
    if (i === pos) {
      dots += `${C.gold}${C.bold}•${C.reset}`;
    } else {
      dots += `${C.gray}·${C.reset}`;
    }
  }

  return `${C.blue}🌍${C.reset} ${dots} ${C.silver}🌑${C.reset}`;
}

export function renderCrewLine(crew: string[]): string {
  return `${C.gray}${crew.join(" · ")}${C.reset}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/trajectory.ts test/trajectory.test.ts
git commit -m "feat: add trajectory bar renderer"
```

---

### Task 5: API Client + Cache

**Files:**
- Create: `src/api.ts`
- Create: `test/api.test.ts`

- [ ] **Step 1: Write API test**

```typescript
// test/api.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMET, formatDistance } from "../src/api.ts";

describe("api utilities", () => {
  it("formatMET formats milliseconds to hours and minutes", () => {
    assert.equal(formatMET(8073000), "2h 14m");
  });

  it("formatMET handles zero", () => {
    assert.equal(formatMET(0), "0h 0m");
  });

  it("formatMET handles days", () => {
    assert.equal(formatMET(90_000_000), "1d 1h 0m");
  });

  it("formatDistance adds commas", () => {
    assert.equal(formatDistance(148302), "148,302");
  });

  it("formatDistance handles small numbers", () => {
    assert.equal(formatDistance(42), "42");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

- [ ] **Step 3: Write API implementation**

```typescript
// src/api.ts
import { readFileSync, writeFileSync } from "node:fs";
import {
  type ArtemisPosition,
  type CachedData,
  API_URL,
  CACHE_PATH,
  CACHE_TTL_MS,
  LAUNCH_TIME,
} from "./types.ts";

export function formatMET(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDistance(km: number): string {
  return km.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function readCache(): CachedData | null {
  try {
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached;
    }
    // Stale but still usable as fallback
    return { ...cached, data: { ...cached.data, stale: true } };
  } catch {
    return null;
  }
}

function writeCache(data: ArtemisPosition): void {
  try {
    const cached: CachedData = { data, fetchedAt: Date.now() };
    writeFileSync(CACHE_PATH, JSON.stringify(cached));
  } catch {
    // Non-critical — cache write failures are acceptable
  }
}

export async function fetchPosition(): Promise<ArtemisPosition> {
  // Check cache first
  const cached = readCache();
  if (cached && !cached.data.stale) {
    return cached.data;
  }

  try {
    const res = await fetch(API_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ArtemisPosition = await res.json();
    writeCache(data);
    return data;
  } catch {
    // Return stale cache if available
    if (cached) return cached.data;

    // Fallback: compute MET from launch time, show placeholder distances
    const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
    return {
      distanceEarthKm: 0,
      distanceMoonKm: 384_400,
      velocityKmS: 0,
      missionElapsedMs: met,
      phase: "earth_orbit",
      timestamp: new Date().toISOString(),
      crew: ["Wiseman", "Glover", "Koch", "Hansen"],
      stale: true,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/api.ts test/api.test.ts
git commit -m "feat: add API client with file cache and fallback"
```

---

### Task 6: Statusline Renderer (Companion Style)

**Files:**
- Create: `src/statusline.ts`
- Create: `test/statusline.test.ts`

- [ ] **Step 1: Write statusline test**

```typescript
// test/statusline.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderStatusline } from "../src/statusline.ts";
import type { ArtemisPosition } from "../src/types.ts";

const mockPosition: ArtemisPosition = {
  distanceEarthKm: 148302,
  distanceMoonKm: 236098,
  velocityKmS: 2.34,
  missionElapsedMs: 8073000,
  phase: "transit_to_moon",
  timestamp: "2026-04-02T00:49:00Z",
  crew: ["Wiseman", "Glover", "Koch", "Hansen"],
};

describe("statusline renderer", () => {
  it("renders multi-line output", () => {
    const output = renderStatusline(mockPosition, 0);
    const lines = output.split("\n");
    assert.ok(lines.length >= 6, `expected 6+ lines, got ${lines.length}`);
  });

  it("includes distance from Earth", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("148,302"));
  });

  it("includes crew names", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("Wiseman"));
    assert.ok(output.includes("Hansen"));
  });

  it("includes Orion label", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("Orion"));
  });

  it("includes mission elapsed time", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("2h 14m"));
  });

  it("shows stale indicator when data is stale", () => {
    const stale = { ...mockPosition, stale: true };
    const output = renderStatusline(stale, 0);
    // Stale data should have dim styling or indicator
    assert.ok(output.includes("~") || output.includes("stale") || output.includes("\x1b[2m"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

- [ ] **Step 3: Write statusline implementation**

```typescript
// src/statusline.ts
import { type ArtemisPosition, C } from "./types.ts";
import { formatDistance, formatMET } from "./api.ts";
import { getSpriteLines } from "./sprites.ts";
import { renderTrajectoryBar, renderCrewLine } from "./trajectory.ts";

const PHASE_LABELS: Record<string, string> = {
  earth_orbit: "earth orbit",
  transit_to_moon: "lunar transit",
  lunar_flyby: "lunar flyby",
  return_to_earth: "return",
  reentry: "reentry",
  complete: "splashdown",
};

function renderBubble(pos: ArtemisPosition): string[] {
  const dist = formatDistance(pos.distanceEarthKm);
  const vel = pos.velocityKmS.toFixed(1);
  const met = formatMET(pos.missionElapsedMs);
  const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
  const staleFlag = pos.stale ? ` ${C.dim}(stale)${C.reset}` : "";

  const line1 = `${C.gold}${dist} km${C.reset} ${C.cyan}${vel} km/s${C.reset} ${C.gray}MET ${met}${C.reset}${staleFlag}`;
  const line2 = `${C.green}▸ ${phase}${C.reset}`;

  return [
    `${C.cyan}╭──────────────────────────────────╮${C.reset}`,
    `${C.cyan}│${C.reset} ${line1} ${C.cyan}│${C.reset}`,
    `${C.cyan}│${C.reset} ${line2}                              ${C.cyan}│${C.reset}`,
    `${C.cyan}╰──────────────────────────────────╯${C.reset}`,
    `${C.cyan} ╲${C.reset}`,
  ];
}

export function renderStatusline(pos: ArtemisPosition, tick: number): string {
  const bubble = renderBubble(pos);
  const spriteLines = getSpriteLines(tick);
  const trajectory = renderTrajectoryBar(pos.distanceEarthKm, pos.distanceMoonKm);
  const crew = renderCrewLine(pos.crew);

  // Compose: bubble on top, then sprite left + trajectory right
  const lines: string[] = [
    ...bubble,
    `${spriteLines[0]}  ${trajectory}`,
    `${spriteLines[1]}`,
    `${spriteLines[2]}  ${crew}`,
    `${spriteLines[3]}`,
    `${spriteLines[4]}`,
    `${spriteLines[5] ?? ""}`,
  ];

  return lines.join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/statusline.ts test/statusline.test.ts
git commit -m "feat: add companion-style statusline renderer"
```

---

### Task 7: TUI Mode

**Files:**
- Create: `src/tui.ts`

- [ ] **Step 1: Write TUI implementation**

```typescript
// src/tui.ts
import { C } from "./types.ts";
import { fetchPosition } from "./api.ts";
import { formatDistance, formatMET } from "./api.ts";
import { renderTrajectoryBar } from "./trajectory.ts";
import { getSpriteFrame } from "./sprites.ts";

const PHASE_LABELS: Record<string, string> = {
  earth_orbit: "Earth Orbit",
  transit_to_moon: "Lunar Transit",
  lunar_flyby: "Lunar Flyby",
  return_to_earth: "Return to Earth",
  reentry: "Reentry",
  complete: "Splashdown",
};

function clear(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function render(tick: number): void {
  fetchPosition().then((pos) => {
    clear();

    const trajectory = renderTrajectoryBar(pos.distanceEarthKm, pos.distanceMoonKm);
    const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
    const stale = pos.stale ? ` ${C.dim}(stale data)${C.reset}` : "";
    const sprite = getSpriteFrame(tick);
    const ago = pos.stale ? "signal lost" : `Updated ${Math.floor((Date.now() - new Date(pos.timestamp).getTime()) / 1000)}s ago`;

    const output = `
  ${C.gold}╔═══════════════════════════════════════════════════════╗${C.reset}
  ${C.gold}║${C.reset}          ${C.white}A R T E M I S   I I   T R A C K E R${C.reset}          ${C.gold}║${C.reset}
  ${C.gold}╚═══════════════════════════════════════════════════════╝${C.reset}

   ${trajectory}
                      ${C.gold}↑${C.reset} ${C.gray}Orion${C.reset}

   ${C.gray}Distance from Earth:${C.reset}  ${C.gold}${formatDistance(pos.distanceEarthKm)} km${C.reset}${stale}
   ${C.gray}Distance from Moon:${C.reset}   ${C.cyan}${formatDistance(pos.distanceMoonKm)} km${C.reset}
   ${C.gray}Velocity:${C.reset}             ${C.green}${pos.velocityKmS.toFixed(2)} km/s${C.reset}
   ${C.gray}Mission Elapsed:${C.reset}      ${C.white}${formatMET(pos.missionElapsedMs)}${C.reset}
   ${C.gray}Phase:${C.reset}                ${C.green}${phase}${C.reset}

   ${C.gray}Crew:${C.reset} ${C.white}Reid Wiseman${C.reset} ${C.gray}(CDR)${C.reset} · ${C.white}Victor Glover${C.reset} ${C.gray}(PLT)${C.reset}
         ${C.white}Christina Koch${C.reset} ${C.gray}(MS)${C.reset} · ${C.white}Jeremy Hansen${C.reset} ${C.gray}(MS)${C.reset}

${sprite}
   ${C.gray}Data: NASA AROW · ${ago}${C.reset}
   ${C.gray}Press Ctrl+C to exit${C.reset}
`;
    process.stdout.write(output);
  });
}

export function startTUI(): void {
  let tick = 0;
  clear();
  render(tick);

  const interval = setInterval(() => {
    tick++;
    render(tick);
  }, 3000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    clear();
    process.exit(0);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tui.ts
git commit -m "feat: add standalone TUI mode"
```

---

### Task 8: Entry Point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Write entry point**

```typescript
#!/usr/bin/env node
// src/index.ts

import { fetchPosition } from "./api.ts";
import { renderStatusline } from "./statusline.ts";
import { startTUI } from "./tui.ts";

const args = process.argv.slice(2);

if (args.includes("--tui") || args.includes("-t")) {
  startTUI();
} else {
  // Statusline mode: read stdin (Claude Code JSON), fetch data, render
  // We don't actually need the Claude Code JSON — we just need to output
  // our companion rendering. The JSON is consumed from stdin so Claude Code
  // doesn't hang waiting for us to read it.
  let stdin = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk: string) => {
    stdin += chunk;
  });
  process.stdin.on("end", async () => {
    // Track animation frame via a simple file-based counter
    let tick = 0;
    try {
      const { readFileSync, writeFileSync } = await import("node:fs");
      const TICK_PATH = "/tmp/artemis-track-tick";
      try {
        tick = parseInt(readFileSync(TICK_PATH, "utf-8"), 10) || 0;
      } catch {}
      writeFileSync(TICK_PATH, String(tick + 1));
    } catch {}

    const pos = await fetchPosition();
    const output = renderStatusline(pos, tick);
    process.stdout.write(output + "\n");
  });
}
```

- [ ] **Step 2: Build and test manually**

```bash
npm run build
echo '{"model":{"display_name":"Opus"}}' | node dist/index.js
```

Expected: Multi-line companion-style output with Orion sprite, trajectory bar, and data (will show fallback/stale data since worker isn't deployed yet).

- [ ] **Step 3: Test TUI mode**

```bash
node dist/index.js --tui
```

Expected: Full-screen TUI with Artemis tracker. Ctrl+C to exit.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with statusline and TUI modes"
```

---

### Task 9: Cloudflare Worker

**Files:**
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.ts`
- Create: `worker/src/parser.ts`
- Create: `worker/src/compute.ts`
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`

- [ ] **Step 1: Create worker package.json**

```json
{
  "name": "artemis-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "node --test --experimental-strip-types test/*.test.ts"
  }
}
```

- [ ] **Step 2: Create wrangler.toml**

```toml
name = "artemis-api"
main = "src/index.ts"
compatibility_date = "2026-04-01"

[triggers]
crons = ["*/5 * * * *"]

[[kv_namespaces]]
binding = "ARTEMIS_KV"
id = "" # Will be filled after `wrangler kv namespace create ARTEMIS_KV`

[routes]
pattern = "artemis.aircloudy.co/*"
```

- [ ] **Step 3: Write OEM ephemeris parser**

```typescript
// worker/src/parser.ts

export interface StateVector {
  epoch: Date;
  x: number;  // km
  y: number;  // km
  z: number;  // km
  vx: number; // km/s
  vy: number; // km/s
  vz: number; // km/s
}

/**
 * Parse CCSDS OEM (Orbital Ephemeris Message) text format.
 * Format: after META_STOP, each line is:
 *   YYYY-MM-DDTHH:MM:SS.SSS  X  Y  Z  VX  VY  VZ
 */
export function parseOEM(text: string): StateVector[] {
  const vectors: StateVector[] = [];
  const lines = text.split("\n");
  let inData = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "META_STOP") {
      inData = true;
      continue;
    }
    if (trimmed === "META_START" || trimmed === "COVARIANCE_START") {
      inData = false;
      continue;
    }

    if (!inData || trimmed === "" || trimmed.startsWith("COMMENT")) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 7) continue;

    const epoch = new Date(parts[0]!);
    if (isNaN(epoch.getTime())) continue;

    vectors.push({
      epoch,
      x: parseFloat(parts[1]!),
      y: parseFloat(parts[2]!),
      z: parseFloat(parts[3]!),
      vx: parseFloat(parts[4]!),
      vy: parseFloat(parts[5]!),
      vz: parseFloat(parts[6]!),
    });
  }

  return vectors;
}

/** Get the state vector closest to a given time */
export function interpolateAt(vectors: StateVector[], at: Date): StateVector | null {
  if (vectors.length === 0) return null;

  const t = at.getTime();
  let closest = vectors[0]!;
  let minDelta = Math.abs(t - closest.epoch.getTime());

  for (const v of vectors) {
    const delta = Math.abs(t - v.epoch.getTime());
    if (delta < minDelta) {
      closest = v;
      minDelta = delta;
    }
  }

  return closest;
}
```

- [ ] **Step 4: Write distance/velocity compute**

```typescript
// worker/src/compute.ts
import type { StateVector } from "./parser.ts";

// Earth position in J2000 is origin (0, 0, 0)
// Moon position is approximate — we use a simplified model

const EARTH_MOON_DISTANCE_KM = 384_400;
const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");

export interface PositionData {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: string;
  timestamp: string;
}

export function computePosition(sv: StateVector): PositionData {
  // Distance from Earth (origin in J2000 Earth-centered frame)
  const distanceEarthKm = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2);

  // Velocity magnitude
  const velocityKmS = Math.sqrt(sv.vx ** 2 + sv.vy ** 2 + sv.vz ** 2);

  // Approximate distance from Moon (simplified: Moon at ~384,400 km along x-axis)
  // Real computation would need Moon ephemeris, but this is close enough for display
  const distanceMoonKm = Math.max(0, EARTH_MOON_DISTANCE_KM - distanceEarthKm);

  // Mission elapsed time
  const missionElapsedMs = Math.max(0, sv.epoch.getTime() - LAUNCH_TIME.getTime());

  // Determine phase
  let phase = "earth_orbit";
  if (distanceEarthKm < 2000) {
    phase = "earth_orbit";
  } else if (distanceMoonKm < 10000) {
    phase = "lunar_flyby";
  } else if (distanceEarthKm < distanceMoonKm) {
    phase = "transit_to_moon";
  } else {
    phase = "return_to_earth";
  }

  // Check if mission is over (after ~10 days)
  if (missionElapsedMs > 10 * 24 * 60 * 60 * 1000) {
    phase = "complete";
  }

  return {
    distanceEarthKm: Math.round(distanceEarthKm),
    distanceMoonKm: Math.round(distanceMoonKm),
    velocityKmS: Math.round(velocityKmS * 100) / 100,
    missionElapsedMs,
    phase,
    timestamp: sv.epoch.toISOString(),
  };
}
```

- [ ] **Step 5: Write worker entry point**

```typescript
// worker/src/index.ts
import { parseOEM, interpolateAt } from "./parser.ts";
import { computePosition, type PositionData } from "./compute.ts";

interface Env {
  ARTEMIS_KV: KVNamespace;
}

const EPHEMERIS_URL = "https://www.nasa.gov/wp-content/uploads/2026/04/artemis-ii-ephemeris.txt";
const CREW = ["Wiseman", "Glover", "Koch", "Hansen"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Content-Type": "application/json",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/position") {
      const cached = await env.ARTEMIS_KV.get("position", "json") as PositionData | null;
      if (cached) {
        return new Response(
          JSON.stringify({ ...cached, crew: CREW }),
          { headers: CORS_HEADERS },
        );
      }

      // No cached data yet — return a placeholder
      return new Response(
        JSON.stringify({
          distanceEarthKm: 0,
          distanceMoonKm: 384400,
          velocityKmS: 0,
          missionElapsedMs: Math.max(0, Date.now() - new Date("2026-04-01T22:35:00Z").getTime()),
          phase: "earth_orbit",
          timestamp: new Date().toISOString(),
          crew: CREW,
          stale: true,
        }),
        { headers: CORS_HEADERS },
      );
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      const res = await fetch(EPHEMERIS_URL);
      if (!res.ok) return;

      const text = await res.text();
      const vectors = parseOEM(text);
      if (vectors.length === 0) return;

      const now = new Date();
      const current = interpolateAt(vectors, now);
      if (!current) return;

      const position = computePosition(current);
      await env.ARTEMIS_KV.put("position", JSON.stringify(position), {
        expirationTtl: 600, // 10 minutes
      });
    } catch {
      // Cron failures are non-fatal — KV retains last good data
    }
  },
};
```

- [ ] **Step 6: Write worker parser test**

```typescript
// worker/test/parser.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseOEM, interpolateAt } from "../src/parser.ts";

const SAMPLE_OEM = `CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-04-01T23:00:00.000
ORIGINATOR = JSC

META_START
OBJECT_NAME = ORION
OBJECT_ID = 2026-001A
CENTER_NAME = EARTH
REF_FRAME = EME2000
TIME_SYSTEM = UTC
META_STOP

2026-04-01T23:00:00.000  6700.0  0.0  0.0  0.0  7.8  0.0
2026-04-01T23:04:00.000  6500.0  1800.0  0.0  -0.5  7.7  0.0
2026-04-01T23:08:00.000  6200.0  3500.0  0.0  -1.0  7.5  0.0
`;

describe("OEM parser", () => {
  it("parses state vectors from OEM text", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors.length, 3);
  });

  it("extracts correct position values", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors[0]!.x, 6700.0);
    assert.equal(vectors[0]!.vy, 7.8);
  });

  it("parses epoch as Date", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors[0]!.epoch.toISOString(), "2026-04-01T23:00:00.000Z");
  });

  it("interpolateAt finds closest vector", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    const target = new Date("2026-04-01T23:05:00.000Z");
    const closest = interpolateAt(vectors, target);
    assert.ok(closest);
    assert.equal(closest.x, 6500.0); // Second vector is closest
  });

  it("handles empty input", () => {
    const vectors = parseOEM("");
    assert.equal(vectors.length, 0);
  });
});
```

- [ ] **Step 7: Run worker tests**

```bash
cd /Users/an/artemis-track/worker && node --test --experimental-strip-types test/*.test.ts
```

- [ ] **Step 8: Commit**

```bash
cd /Users/an/artemis-track
git add worker/
git commit -m "feat: add Cloudflare Worker with OEM parser and position API"
```

---

### Task 10: Build, Test End-to-End, Publish

**Files:**
- Modify: `package.json` (ensure bin is correct)
- Create: `README.md`

- [ ] **Step 1: Build the package**

```bash
cd /Users/an/artemis-track && npm run build
```

Expected: `dist/` directory created with compiled JS files.

- [ ] **Step 2: Add shebang to built entry point**

The `#!/usr/bin/env node` should survive compilation. Verify:

```bash
head -1 dist/index.js
```

If shebang is missing, prepend it:

```bash
echo '#!/usr/bin/env node' | cat - dist/index.js > dist/index.tmp && mv dist/index.tmp dist/index.js
chmod +x dist/index.js
```

- [ ] **Step 3: Test statusline mode locally**

```bash
echo '{"model":{"display_name":"Opus 4.6"}}' | node dist/index.js
```

Expected: Companion-style output with Orion sprite, trajectory bar, crew names, and data (stale fallback since worker not deployed).

- [ ] **Step 4: Test TUI mode locally**

```bash
node dist/index.js --tui
```

Expected: Full-screen TUI. Ctrl+C to exit.

- [ ] **Step 5: Write README**

```markdown
# artemis-track 🚀

Real-time Artemis II mission tracker for your terminal and Claude Code status line.

Track the Orion spacecraft's journey to the Moon and back — right in your terminal.

## Quick Start

### Claude Code Status Line

Add to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y artemis-track@latest",
    "padding": 0
  }
}
```

### Standalone TUI

```bash
npx artemis-track --tui
```

## What You'll See

A companion-style Orion spacecraft sprite with live mission data:
- Distance from Earth and Moon
- Velocity
- Mission elapsed time
- Trajectory visualization
- Crew: Wiseman · Glover · Koch · Hansen

Data sourced from NASA's Artemis Real-time Orbit Website (AROW).

## Mission Timeline

- **Launch**: April 1, 2026 at 6:35 PM EDT
- **Lunar Flyby**: ~Day 4-5
- **Splashdown**: April 10, 2026

## License

MIT
```

- [ ] **Step 6: Run all tests**

```bash
cd /Users/an/artemis-track && npm test
```

- [ ] **Step 7: Create GitHub repo and push**

```bash
cd /Users/an/artemis-track
gh repo create areporeporepo/artemis-track --public --source=. --push
```

- [ ] **Step 8: Publish to npm**

```bash
npm publish
```

- [ ] **Step 9: Deploy Cloudflare Worker**

```bash
cd /Users/an/artemis-track/worker
wrangler kv namespace create ARTEMIS_KV
# Update wrangler.toml with the KV namespace ID from output
wrangler deploy
```

- [ ] **Step 10: Add DNS route**

```bash
# Add CNAME for artemis.aircloudy.co pointing to workers
```

- [ ] **Step 11: Test the full pipeline**

```bash
# Test worker
curl https://artemis.aircloudy.co/position

# Test npm package with real data
echo '{}' | npx artemis-track@latest

# Test TUI
npx artemis-track --tui
```

- [ ] **Step 12: Final commit**

```bash
git add -A
git commit -m "feat: ready for launch — artemis-track v0.1.0"
```

---

## Post-Launch

After publishing, install it yourself:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y artemis-track@latest",
    "padding": 0
  }
}
```

Share the one-liner. Artemis II splashes down April 10 — 9 days of tracking.
