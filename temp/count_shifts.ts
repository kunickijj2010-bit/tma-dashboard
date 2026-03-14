import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();

const supabase = createClient(URL, KEY);

async function main() {
    const { count, error } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .gte('shift_date', '2026-03-01')
        .lte('shift_date', '2026-03-31');

    if (error) { console.error(error); return; }

    console.log(`Total shifts in March: ${count}`);
}

main();
