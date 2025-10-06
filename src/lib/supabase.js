import { createClient } from '@supabase/supabase-js'

// Get config from environment or window.ENV (injected by server)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_URL) || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_ANON_KEY) || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:', { 
    supabaseUrl: supabaseUrl || 'MISSING', 
    supabaseAnonKey: supabaseAnonKey ? 'EXISTS' : 'MISSING',
    windowENV: typeof window !== 'undefined' ? window.ENV : 'window undefined',
    importMetaEnv: import.meta.env
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})
