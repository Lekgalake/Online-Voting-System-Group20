import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://akbbucujvktlvahiyfho.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmJ1Y3Vqdmt0bHZhaGl5ZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDA3ODUsImV4cCI6MjA5MzMxNjc4NX0.K_PjmQ8ty4INN_sBYz5ff34W_-LXpj37wmP3nmZK3II';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
