/**
 * Apply the migration to create the course files table and storage bucket
 * 
 * Run this script with:
 * node apply_migration.js
 */
 
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20240625_create_course_files.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Starting migration...');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '') // Remove comments
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);
      
      const { error } = await supabaseAdmin.rpc('pgmigrate', { query: statement + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration(); 