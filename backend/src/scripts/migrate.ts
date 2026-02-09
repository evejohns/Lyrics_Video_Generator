import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...\n');

    // Read the schema file
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute the schema
    await pool.query(schema);

    console.log('✅ Database migrations completed successfully!\n');
    console.log('Created tables:');
    console.log('  - users');
    console.log('  - projects');
    console.log('  - lyrics');
    console.log('  - exports');
    console.log('  - templates (with 2 default templates)');
    console.log('  - refresh_tokens');
    console.log('  - youtube_credentials\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
