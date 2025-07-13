import { supabase } from '../lib/supabase';

export async function runDatabaseMigration() {
  console.log('Starting database migration...');
  
  try {
    // Step 1: Check if columns already exist
    const { data: existingColumns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'goals');
    
    if (columnError) {
      console.error('Error checking existing columns:', columnError);
    } else {
      console.log('Existing columns:', existingColumns?.map(c => c.column_name));
    }

    // Step 2: Add missing columns to goals table
    const migrations = [
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS frequency VARCHAR(10) DEFAULT 'weekly'`,
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS metric VARCHAR(10) DEFAULT 'clients'`,
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false`,
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    ];

    for (const migration of migrations) {
      const { error } = await supabase.rpc('exec_sql', { sql: migration });
      if (error) {
        console.error('Migration error:', error);
      } else {
        console.log('Migration successful:', migration);
      }
    }

    // Step 3: Add constraints
    const constraints = [
      `ALTER TABLE goals ADD CONSTRAINT IF NOT EXISTS frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly'))`,
      `ALTER TABLE goals ADD CONSTRAINT IF NOT EXISTS metric_check CHECK (metric IN ('clients', 'revenue'))`,
    ];

    for (const constraint of constraints) {
      const { error } = await supabase.rpc('exec_sql', { sql: constraint });
      if (error) {
        console.error('Constraint error:', error);
      } else {
        console.log('Constraint added:', constraint);
      }
    }

    // Step 4: Update existing records
    const { error: updateError } = await supabase
      .from('goals')
      .update({
        frequency: 'weekly',
        metric: 'clients',
        is_global: false,
        updated_at: new Date().toISOString()
      })
      .is('frequency', null);

    if (updateError) {
      console.error('Error updating existing records:', updateError);
    } else {
      console.log('Updated existing records with default values');
    }

    console.log('Database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Manual migration function that can be called from the app
export async function manualMigration() {
  try {
    // Simple approach: just update the goals table with RPC calls
    console.log('Running manual migration...');
    
    // Use direct SQL execution if available
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE goals 
        ADD COLUMN IF NOT EXISTS frequency VARCHAR(10) DEFAULT 'weekly',
        ADD COLUMN IF NOT EXISTS metric VARCHAR(10) DEFAULT 'clients',
        ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
      `
    });

    if (error) {
      console.error('Manual migration error:', error);
      return false;
    }

    console.log('Manual migration completed:', data);
    return true;
  } catch (error) {
    console.error('Manual migration failed:', error);
    return false;
  }
}