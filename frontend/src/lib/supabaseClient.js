// GMR CRM - Reusable Supabase Client Integration
import { createClient } from '@supabase/supabase-js';

export const getSupabaseUrl = () => {
  let url = '';
  try {
    url = import.meta.env.VITE_SUPABASE_URL || '';
  } catch (e) {
    if (typeof process !== 'undefined' && process?.env) {
      url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    }
  }
  if (!url && typeof process !== 'undefined' && process?.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  }
  return (url || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

export const getSupabaseAnonKey = () => {
  let key = '';
  try {
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {
    if (typeof process !== 'undefined' && process?.env) {
      key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    }
  }
  if (!key && typeof process !== 'undefined' && process?.env) {
    key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }
  return key || '';
};

/**
 * Checks whether Supabase environment variables are properly configured with active values.
 */
export const isSupabaseConfigured = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isUrlValid = Boolean(url && !url.includes('your-project-id') && url.startsWith('http'));
  const isKeyValid = Boolean(key && key !== 'your-anon-key-here' && key.length > 20);
  return isUrlValid && isKeyValid;
};

// Create the client with fallback dummy values if not configured to prevent startup crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const resolvedUrl = isSupabaseConfigured() ? getSupabaseUrl() : fallbackUrl;
const resolvedKey = isSupabaseConfigured() ? getSupabaseAnonKey() : fallbackKey;

export const supabase = createClient(
  resolvedUrl,
  resolvedKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

export default supabase;
