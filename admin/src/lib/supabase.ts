import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xnlyxnffxmfsxlehsxps.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        "⚠️ Supabase URL or Anon Key is missing. Check your Vercel / .env environment variables."
    );
}

export const supabase = createClient(
    supabaseUrl,
    supabaseKey || "placeholder-key"
);
