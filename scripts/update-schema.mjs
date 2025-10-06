// Script to update videos table schema
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmJmYWxqbXl6YmplaHZianhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczOTI1MiwiZXhwIjoyMDc1MzE1MjUyfQ.Tqt3ygBmILp_gAi2y-0o4wFp8gYfPYIwrfE5yPe3BVk' // service_role key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateSchema() {
  try {
    console.log('Adding status column...')
    
    // Add status column
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        do $$ 
        begin
          if not exists (select 1 from information_schema.columns where table_name = 'videos' and column_name = 'status') then
            alter table public.videos add column status text default 'loading' check (status in ('loading', 'completed', 'failed'));
          end if;
        end $$;
      `
    })
    
    if (error1) {
      console.error('Error adding status:', error1)
      // Try direct SQL instead
      const { error: altError1 } = await supabase.from('videos').select('status').limit(1)
      if (altError1) {
        console.log('Status column does not exist, using raw SQL...')
      }
    }
    
    console.log('Making video_url nullable...')
    
    // Make video_url nullable
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'alter table public.videos alter column video_url drop not null;'
    })
    
    if (error2) {
      console.error('Error making video_url nullable:', error2)
    }
    
    console.log('Adding update policy...')
    
    // Add update policy
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        do $$
        begin
          if not exists (select 1 from pg_policies where policyname = 'Users can update own videos' and tablename = 'videos') then
            execute 'create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
          end if;
        end $$;
      `
    })
    
    if (error3) {
      console.error('Error adding update policy:', error3)
    }
    
    console.log('Schema update complete!')
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

updateSchema()
