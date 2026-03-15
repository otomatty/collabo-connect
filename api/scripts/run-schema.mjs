import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const railwayDir = path.join(__dirname, "../../railway");

// Prefer PUBLIC URL when running from local (Railway's DATABASE_URL uses internal host)
const connectionString =
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_PUBLIC_URL or DATABASE_URL is not set. From local, use Postgres → Connect → Public URL in Railway dashboard."
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    const files = ["schema.sql", "better-auth-schema.sql"];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(railwayDir, file), "utf8");
      await client.query(sql);
      console.log("Executed:", file);
    }
    console.log("Database initialization complete.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
