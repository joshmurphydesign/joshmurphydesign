import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations need a plain, unpooled (session-mode) connection — Prisma holds
// an advisory lock while running them, which a transaction-mode connection
// pooler (e.g. Supabase's default pooled DATABASE_URL) breaks, causing
// `prisma migrate deploy` to hang indefinitely instead of failing cleanly.
// DIRECT_URL is that unpooled connection, used only here, only for
// migrations. The app itself (src/lib/db.ts) still uses the pooled
// DATABASE_URL at runtime, which is what you want for serverless traffic.
// Falls back to DATABASE_URL when DIRECT_URL isn't set, so local/single-
// instance Postgres (no pooler in front of it) still works with one var.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!migrationUrl) throw new Error("Set DATABASE_URL (and DIRECT_URL for pooled hosts like Supabase).");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
