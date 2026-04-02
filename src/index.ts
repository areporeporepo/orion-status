#!/usr/bin/env node
// src/index.ts

import { fetchPosition } from "./api.ts";
import { renderStatusline } from "./statusline.ts";
import { startTUI } from "./tui.ts";

const args = process.argv.slice(2);

if (args.includes("--tui") || args.includes("-t")) {
  startTUI();
} else {
  // Statusline mode: consume stdin (Claude Code JSON), fetch data, render
  let stdin = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk: string) => {
    stdin += chunk;
  });
  process.stdin.on("end", async () => {
    // Track animation frame via file-based counter
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
