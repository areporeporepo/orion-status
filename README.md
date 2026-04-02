# orion-status

Real-time Artemis II Orion spacecraft tracker for your terminal.

```
🚀 51,888km 2.43km/s MET 5h 50m transit ▸perigee raise burn in 7h 38m Horizons + DSN Madrid 🌍52k ───◆──────────────────── 355k🌕
```

## Install

```bash
npm install -g orion-status
```

Or run directly:

```bash
npx orion-status
```

## Usage

### Claude Code status line

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "echo '{\"unused\":true}' | npx orion-status"
  }
}
```

Or in a custom status line script:

```bash
node --experimental-strip-types /path/to/orion-status/src/index.ts <<< "$input"
```

### Standalone TUI

```bash
orion-status --tui
```

## Data sources

Live telemetry from two sources, merged on a Cloudflare Worker:

1. **NASA Deep Space Network** (5s) — ground station range from Goldstone/Madrid/Canberra
2. **JPL Horizons API** (1min) — full state vectors for Orion (`-1024`) and Moon (`301`)

Client interpolates between data points using velocity so the km counter ticks every render.

Fallback chain: CF Worker → direct Horizons → local cache → placeholder.

## Mission milestones

22 events from JPL trajectory data with countdown precision to seconds:

| Event | MET |
|---|---|
| TLI burn | T+25h 8m |
| Closest lunar approach | T+120h 31m |
| Manual piloting demo | T+172h 20m |
| Entry interface Mach 32 | T+217h 29m |
| Splashdown | T+217h 42m |

## Architecture

```
NASA DSN XML ──→ CF Durable Object (5s alarm) ──→ KV ──→ GET /position
JPL Horizons  ──→ CF Cron (5min)               ──→ KV ──↗
                                                         ↓
                                              Client (interpolation)
                                                         ↓
                                              Terminal status line
```

## Development

```bash
npm install
npm run build
npm test        # 18 tests
```

## License

MIT
