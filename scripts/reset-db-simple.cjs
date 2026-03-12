const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Simple .env loader
const envPath = path.join(__dirname, '..', '.env');
console.log('Looking for .env file at:', envPath);

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
console.log('✓ .env file found');

// Parse DATABASE_URL
let databaseUrl = null;
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    databaseUrl = trimmed.substring('DATABASE_URL='.length);
  }
});

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('✓ DATABASE_URL found');

async function resetDatabase() {
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Connected to database');
    
    // Drop all tables
    console.log('🗑️  Dropping all existing tables...');
    
    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    console.log('✅ Database reset successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run db:push');
    console.log('   2. Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 PostgreSQL is not running. Please:');
      console.log('   - Start PostgreSQL service in Windows Services');
      console.log('   - Or start it from pgAdmin');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
