import { createClient } from '@supabase/supabase-js'

// Get config from environment or window.ENV (injected by server)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.ENV?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.ENV?.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})
