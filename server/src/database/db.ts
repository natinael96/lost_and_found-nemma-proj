import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standardize database path at project root unless explicitly set
function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  
  // If running from server directory, place at parent or current
  const rootLostAndFound = path.resolve(process.cwd(), "lost_and_found.db");
  const parentLostAndFound = path.resolve(process.cwd(), "..", "lost_and_found.db");
  
  if (path.basename(process.cwd()) === "server") {
    return parentLostAndFound;
  }
  return rootLostAndFound;
}

const dbPath = resolveDbPath();
export const db: Database.Database = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance and reliability
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

export function initDatabase(): void {
  // Look for schema.sql in current directory or src/database
  let schemaPath = path.resolve(__dirname, "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), "src", "database", "schema.sql");
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), "server", "src", "database", "schema.sql");
  }
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
}

// Automatically initialize schema when module is loaded
initDatabase();

