import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './storage';

let supabaseInstance = null;

export function getSupabase() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url || supabaseInstance.supabaseKey !== key) {
    supabaseInstance = createClient(url, key);
  }

  return supabaseInstance;
}
