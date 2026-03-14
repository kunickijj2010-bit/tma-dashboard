import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const SUPABASE_URL = ENV.match(/SUPABASE_URL=(.*)\r?\n/)[1].trim();
const SUPABASE_KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const dates = [
        "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12",
        "2026-03-13", "2026-03-14", "2026-03-15", "2026-03-16"
    ];
    let shifts: any[] = [];
    let pmHasMore = true;
    let pmOffset = 0;
    while (pmHasMore) {
        const { data: chunk } = await supabase.from('shifts').select('*').in('shift_date', dates).order('id').range(pmOffset, pmOffset + 1000 - 1);
        if (chunk && chunk.length > 0) { shifts.push(...chunk); pmOffset += 1000; if (chunk.length < 1000) pmHasMore = false; } else pmHasMore = false;
    }

    const { data: emps } = await supabase.from('employees').select('*').eq('department', 'VIP');

    // Simulate dayIndex = 5 (15.03)
    const targetDateStr = "2026-03-15";
    const yesterdayDateStr = "2026-03-14";
    const hourlyCounts = new Array(24).fill(0);

    for (const emp of emps) {
        if (!emp.name || emp.is_active === false) continue;
        const empShifts = shifts.filter(s => s.employee_id === emp.id);
        const yesterdayShift = empShifts.find(s => s.shift_date === yesterdayDateStr);
        const todayShift = empShifts.find(s => s.shift_date === targetDateStr);

        let intervals = [];
        if (yesterdayShift) {
            const wh = emp.work_hours || "09:00-18:00";
            const m = wh.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
            let sM = 540, eM = 1080;
            if (m) { sM = parseInt(m[1]) * 60 + parseInt(m[2] || "0"); eM = parseInt(m[3]) * 60 + parseInt(m[4] || "0"); }
            const yNote = yesterdayShift.shift_note || "";
            let yS = sM, yE = eM, yCustom = false;
            const yRM = yNote.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
            if (yRM) { yS = parseInt(yRM[1]) * 60 + parseInt(yRM[2] || "0"); yE = parseInt(yRM[3]) * 60 + parseInt(yRM[4] || "0"); yCustom = true; }
            let realYE = yE;
            if (realYE <= yS && !yCustom) realYE += 1440;
            if (yCustom && realYE <= yS) realYE += 1440;
            if (realYE > 1440) intervals.push({ s: 0, e: realYE - 1440 });
        }
        if (todayShift) {
            const wh = emp.work_hours || "09:00-18:00";
            const m = wh.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
            let sM = 540, eM = 1080;
            if (m) { sM = parseInt(m[1]) * 60 + parseInt(m[2] || "0"); eM = parseInt(m[3]) * 60 + parseInt(m[4] || "0"); }
            const note = todayShift.shift_note || "";
            let nS = 0, nE = 0, nC = false;
            const nRM = note.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
            if (nRM) { nS = parseInt(nRM[1]) * 60 + parseInt(nRM[2] || "0"); nE = parseInt(nRM[3]) * 60 + parseInt(nRM[4] || "0"); nC = true; }
            if (nC) {
                intervals.push({ s: nS, e: nE });
                let nD = nE - nS; if (nD < 0) nD += 1440;
                if (todayShift.hours_worked * 60 > nD + 120) {
                    let e = eM; if (e <= sM) e += 1440;
                    intervals.push({ s: sM, e: e });
                }
            } else {
                let e = eM;
                let isPartial = todayShift.hours_worked < 8 || note.toLowerCase().includes("доп");
                if (isPartial) {
                    e = sM + (todayShift.hours_worked * 60);
                } else if (e <= sM) {
                    e += 1440;
                }
                intervals.push({ s: sM, e: e });
            }
        }

        let localCounts = new Array(24).fill(0);
        for (const iv of intervals) {
            let s = iv.s, e = iv.e; if (e < s) e += 1440;
            let rs = s, re = e > 1440 ? 1440 : e;
            for (let h = 0; h < 24; h++) {
                const cm = h * 60 + 30;
                if (cm >= rs && cm < re) {
                    hourlyCounts[h]++;
                    localCounts[h]++;
                }
            }
        }
        if (localCounts[0] > 0) {
            console.log(`BINGO! ${emp.name} covers hour 0 on 15.03! Intervals: ${JSON.stringify(intervals)} yShift: ${!!yesterdayShift} tShift: ${!!todayShift}`);
        }
    }
    console.log("Final counts:", hourlyCounts);
}

main();
