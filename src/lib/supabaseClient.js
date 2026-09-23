// GMR CRM - Reusable Supabase Client Integration
import { createClient } from '@supabase/supabase-js';

let rawUrl = '';
let supabaseAnonKey = '';

try {
  // Vite statically replaces import.meta.env.VITE_* during build and dev transformation
  rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
} catch (e) {
  // Fallback for non-Vite environments (e.g. Node CLI testing)
  if (typeof process !== 'undefined' && process?.env) {
    rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }
}

// Ensure Node test scripts that load process.env after module load also work
if (!rawUrl && typeof process !== 'undefined' && process?.env) {
  rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
}
if (!supabaseAnonKey && typeof process !== 'undefined' && process?.env) {
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');


/**
 * Checks whether Supabase environment variables are properly configured with active values.
 */
export const isSupabaseConfigured = () => {
  const isUrlValid = Boolean(supabaseUrl && !supabaseUrl.includes('your-project-id') && supabaseUrl.startsWith('http'));
  const isKeyValid = Boolean(supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here' && supabaseAnonKey.length > 20);
  return isUrlValid && isKeyValid;
};

// Create the client with fallback dummy values if not configured to prevent startup crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured() ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

export default supabase;
