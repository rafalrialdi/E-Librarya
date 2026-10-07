const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL atau SUPABASE_SERVICE_KEY tidak ditemukan di environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;