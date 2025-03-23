import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Client-side Supabase instance (for browser use)
export const getSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

// Singleton instance for client-side use
export const supabase = getSupabaseClient();

// Server-side Supabase instance (with service role key)
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient<Database>(supabaseUrl, supabaseKey);
} 