const SUPABASE_URL = "https://tnywarkzzfzilveaubiq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YSsiFElk3nZXhIQF3mlclQ_7BuW2usz";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


console.log("Supabase client:", supabaseClient);