import { Pool } from "pg";

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables");
    console.log(
      "Please create a .env file with DATABASE_URL=postgresql://postgres:1011@localhost:5432/trading_db"
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔄 Connecting to database...");

    // Drop all tables in the public schema
    console.log("🗑️  Dropping all existing tables...");

    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          RAISE NOTICE 'Dropped table: %', r.tablename;
        END LOOP;
        
        -- Drop all sequences
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
          RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
        END LOOP;
      END $$;
    `);

    console.log("✅ Database reset successfully!");
    console.log("📝 Now run: npm run db:push");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
