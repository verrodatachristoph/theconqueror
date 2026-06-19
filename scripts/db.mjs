// Tiny Postgres helper: applies a .sql file or runs a query against the
// Supabase project using the direct connection + SUPABASE_DB_PASSWORD.
// Usage:
//   node scripts/db.mjs apply supabase/_apply_all.sql
//   node scripts/db.mjs query "select code, name from persons order by code"
import { readFileSync } from "node:fs";
import pg from "pg";

// Load .env.local without a dependency
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
// Default to the direct DB host. If that's IPv6-only / unreachable on your
// network, set SUPABASE_DB_HOST to your project's session pooler host
// (Supabase dashboard → Project Settings → Database), e.g.
// aws-0-<region>.pooler.supabase.com — then the user becomes postgres.<ref>.
const poolerHost = process.env.SUPABASE_DB_HOST;
const client = new pg.Client({
  host: poolerHost || `db.${ref}.supabase.co`,
  port: 5432,
  user: poolerHost ? `postgres.${ref}` : "postgres",
  database: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const [, , cmd, arg] = process.argv;

const run = async () => {
  await client.connect();
  if (cmd === "apply") {
    const sql = readFileSync(arg, "utf8");
    await client.query(sql);
    console.log(`✓ applied ${arg}`);
  } else if (cmd === "query") {
    const res = await client.query(arg);
    console.table(res.rows);
  } else {
    throw new Error(`unknown cmd: ${cmd}`);
  }
};

run()
  .catch((e) => {
    console.error("✗", e.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
