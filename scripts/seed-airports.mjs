// Seed the airports table from the OpenFlights open dataset (every airport with
// a valid IATA code). Run once: `node scripts/seed-airports.mjs`.
// Idempotent — upserts on iata. Keeps the small hand-seeded hubs intact.
import { readFileSync } from "node:fs";
import pg from "pg";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SRC =
  "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const poolerHost = process.env.SUPABASE_DB_HOST;
const client = new pg.Client({
  host: poolerHost || `db.${ref}.supabase.co`,
  port: 5432,
  user: poolerHost ? `postgres.${ref}` : "postgres",
  database: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  console.log("Downloading OpenFlights airports…");
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const text = await res.text();

  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const f = parseCsvLine(line);
    // 0 id,1 name,2 city,3 country,4 IATA,5 ICAO,6 lat,7 lon,...
    const iata = (f[4] || "").replace(/"/g, "").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(iata)) continue;
    const name = (f[1] || "").trim();
    const city = (f[2] || "").trim();
    const lat = parseFloat(f[6]);
    const lon = parseFloat(f[7]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    rows.push({ iata, name, city, lat, lon });
  }
  console.log(`Parsed ${rows.length} airports with IATA codes. Upserting…`);

  await client.connect();
  // Insert in chunks via a single parameterized statement per chunk.
  const CHUNK = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const values = [];
    const params = [];
    chunk.forEach((r, j) => {
      const b = j * 5;
      values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5})`);
      params.push(r.iata, r.name, r.city, r.lat, r.lon);
    });
    await client.query(
      `insert into airports (iata, name, city, lat, lon) values ${values.join(",")}
       on conflict (iata) do update set
         name = excluded.name, city = excluded.city, lat = excluded.lat, lon = excluded.lon`,
      params,
    );
    done += chunk.length;
  }
  console.log(`✓ Seeded ${done} airports.`);
};

run()
  .catch((e) => { console.error("✗", e.message); process.exitCode = 1; })
  .finally(() => client.end());
