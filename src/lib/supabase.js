import { createClient } from '@supabase/supabase-js'

// Get config from Vite env at build-time, or from window.ENV at runtime (served by /env.js)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_SUPABASE_URL) ||
  ''
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_SUPABASE_ANON_KEY) ||
  ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:', {
    importMetaEnv: import.meta.env,
    supabaseUrl: supabaseUrl || 'MISSING',
    supabaseAnonKey: supabaseAnonKey ? 'EXISTS' : 'MISSING',
    windowENV: typeof window !== 'undefined' ? window.ENV : 'window undefined',
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage
  }
})
