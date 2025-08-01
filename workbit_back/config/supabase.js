const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL) {
  console.warn('⚠️ SUPABASE_URL not found in environment variables');
}

if (!process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ SUPABASE_ANON_KEY not found in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized with anon key');
} else {
  console.error('❌ Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  console.log('✅ Supabase admin client initialized with service role key');
} else {
  console.warn('⚠️ Supabase admin client not available. Please set SUPABASE_SERVICE_ROLE_KEY for admin operations');
}

module.exports = { supabase, supabaseAdmin }; 