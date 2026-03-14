import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();

const supabase = createClient(URL, KEY);

async function main() {
    const { data: emps, error: err1 } = await supabase
        .from('employees')
        .select('id, name')
        .ilike('name', '%Травникова%');

    if (err1) { console.error(err1); return; }

    console.log("Found:", emps[0].name, "ID:", emps[0].id);

    // Fetch all shifts for March
    const { data: shifts, error: err2 } = await supabase
        .from('shifts')
        .select('shift_date, hours_worked, shift_type, shift_note')
        .eq('employee_id', emps[0].id)
        .gte('shift_date', '2026-03-01')
        .lte('shift_date', '2026-03-31');

    if (err2) { console.error(err2); return; }

    console.log(`Total shifts in March: ${shifts.length}`);
    const sum = shifts.reduce((acc, obj) => acc + (obj.hours_worked || 0), 0);
    console.log(`Total hours_worked: ${sum}`);

    console.log(shifts);
}

main();
