import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const SUPABASE_URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const SUPABASE_KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const dates = ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15", "2026-03-16"];
    const { data: shifts, count } = await supabase.from('shifts')
        .select('*', { count: 'exact' })
        .in('shift_date', dates);

    console.log(`Returned rows: ${shifts?.length}, Total count in DB: ${count}`);
}

main();
