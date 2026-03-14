import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const SUPABASE_URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const SUPABASE_KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const { data: emps } = await supabase.from('employees').select('*').eq('department', 'работа с поставщиками');
    if (!emps) return;

    const empIds = emps.map(e => e.id);
    const { data: shifts } = await supabase.from('shifts')
        .select('*')
        .in('employee_id', empIds)
        .eq('shift_date', '2026-03-16')
        .gt('hours_worked', 0);

    console.log("Employees expected on 16.03 (from spreadsheet): Синицина, Пронских, Жемчугова, Пульная (Дарина), Филатова, etc");
    console.log("Shifts found in DB for 16.03 (работа с поставщиками):");
    if (!shifts || shifts.length === 0) {
        console.log("WARNING: NO SHIFTS FOUND!");
    } else {
        shifts.forEach(s => {
            const empName = emps.find(e => e.id === s.employee_id)?.name || "Unknown";
            console.log(`- ${empName}: ${s.hours_worked} hours (Note: ${s.shift_note})`);
        });
    }

    const { data: vips } = await supabase.from('employees').select('name, work_hours').eq('department', 'VIP');
    console.log("\nVIP Work Hours Config:");
    vips?.forEach(v => console.log(`- ${v.name}: ${v.work_hours}`));
}

main();
