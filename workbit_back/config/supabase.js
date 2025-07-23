const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL) {
  console.warn('⚠️ SUPABASE_URL not found in environment variables');
}

if (!process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ SUPABASE_ANON_KEY not found in environment variables');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

module.exports = supabase; 