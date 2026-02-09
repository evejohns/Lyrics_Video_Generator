import { pool } from '../config/database.js';

async function seed() {
  try {
    console.log('🌱 Seeding database...\n');

    // Add any additional seed data here
    // The default templates are already in schema.sql

    console.log('✅ Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
