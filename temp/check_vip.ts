import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();

const supabase = createClient(URL, KEY);

async function main() {
    const { data: emps, error: err1 } = await supabase
        .from('employees')
        .select('id, name, sheet_row, department')
        .eq('department', 'VIP')
        .order('name');

    if (err1) { console.error(err1); return; }

    let out = "VIP Employees in Supabase:\n";
    emps.forEach(e => {
        out += `ID: ${e.id} | Row: ${e.sheet_row} | Name: ${e.name}\n`;
    });

    Deno.writeTextFileSync('vip_employees.txt', out);
}

main();
