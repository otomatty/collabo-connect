import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const railwayDir = path.join(__dirname, "../../railway");

const connectionString =
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_PUBLIC_URL or DATABASE_URL is not set. From local, use Railway Postgres public URL or run via railway run."
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(railwayDir, "seed.sql"), "utf8");
    await client.query(sql);
    console.log("Executed: seed.sql");
    console.log("Test seed data inserted successfully.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();