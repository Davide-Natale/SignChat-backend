'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//  Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;


