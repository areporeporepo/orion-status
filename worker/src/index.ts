import { parseOEM, interpolateAt } from "./parser.ts";
import { computePosition, type PositionData } from "./compute.ts";

interface Env { ARTEMIS_KV: KVNamespace; }

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
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

    if (url.pathname === "/position") {
      const cached = await env.ARTEMIS_KV.get("position", "json") as PositionData | null;
      if (cached) {
        return new Response(JSON.stringify({ ...cached, crew: CREW }), { headers: CORS_HEADERS });
      }
      return new Response(JSON.stringify({
        distanceEarthKm: 0, distanceMoonKm: 384400, velocityKmS: 0,
        missionElapsedMs: Math.max(0, Date.now() - new Date("2026-04-01T22:35:00Z").getTime()),
        phase: "earth_orbit", timestamp: new Date().toISOString(), crew: CREW, stale: true,
      }), { headers: CORS_HEADERS });
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
      const current = interpolateAt(vectors, new Date());
      if (!current) return;
      const position = computePosition(current);
      await env.ARTEMIS_KV.put("position", JSON.stringify(position), { expirationTtl: 600 });
    } catch {}
  },
};
