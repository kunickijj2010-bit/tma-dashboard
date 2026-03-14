import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// MANUALLY PARSE ENV FOR DENO
const envText = await Deno.readTextFile("C:\\Users\\user\\.gemini\\antigravity\\scratch\\Telegram-Bot-Refinement\\.env");
const env: Record<string, string> = {};
envText.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].trim();
});

const SUPABASE_URL = env.PROJECT_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

const DEPARTMENTS_TO_CHECK = [
    "отели",
    "работа с поставщиками",
    "Jivo-chat",
    "NDC",
    "GDS",
    "VIP"
];

async function run() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Calculate Today, Tomorrow, Day After Tomorrow in MSK
    const mskOffset = 3 * 60 * 60 * 1000;
    const nowLocal = new Date();
    const now = new Date(nowLocal.getTime() + nowLocal.getTimezoneOffset() * 60000 + mskOffset);

    const datesToCheck: string[] = [];
    for (let i = 0; i < 4; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
        datesToCheck.push(`${y}-${m}-${day}`);
    }

    const yDate = new Date(now);
    yDate.setDate(now.getDate() - 1);
    const yY = yDate.getFullYear(); const yM = String(yDate.getMonth() + 1).padStart(2, '0'); const yDay = String(yDate.getDate()).padStart(2, '0');
    const yesterdayStr = `${yY}-${yM}-${yDay}`;

    const allDates = [yesterdayStr, ...datesToCheck];

    const { data: employees, error: empError } = await supabase.from("employees").select("*");
    if (empError) throw empError;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const currentMonthStartStr = `${year}-${month}-01`;
    const currentMonthEndStr = `${year}-${month}-${lastDay}`;

    let allMonthShifts: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000;

    while (hasMore) {
        const { data: chunk, error: chunkErr } = await supabase
            .from("shifts")
            .select("employee_id, hours_worked")
            .gte("shift_date", currentMonthStartStr)
            .lte("shift_date", currentMonthEndStr)
            .gt("hours_worked", 0)
            .order("id")
            .range(offset, offset + limit - 1);

        if (chunkErr) {
            console.error("Chunk error:", chunkErr);
            break;
        }

        if (chunk && chunk.length > 0) {
            allMonthShifts = allMonthShifts.concat(chunk);
            offset += limit;
            if (chunk.length < limit) hasMore = false;
        } else {
            hasMore = false;
        }
    }

    const monthlyHoursMap: Record<number, number> = {};
    for (const ms of allMonthShifts) {
        monthlyHoursMap[ms.employee_id] = (monthlyHoursMap[ms.employee_id] || 0) + ms.hours_worked;
    }

    const { data: shifts, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .in("shift_date", allDates)
        .gt("hours_worked", 0);

    if (shiftError) throw shiftError;

    let alertMessage = "🚨 <b>ВНИМАНИЕ: Обнаружено нулевое покрытие!</b>\n\n";
    let foundAnomalies = false;

    for (let dayIndex = 0; dayIndex < 4; dayIndex++) {
        const targetDateStr = datesToCheck[dayIndex];
        const prevDateStr = allDates[dayIndex];

        let dayHeaderAdded = false;

        for (const dept of DEPARTMENTS_TO_CHECK) {
            const hourlyCounts: number[] = new Array(24).fill(0);

            for (const emp of employees) {
                if (!emp.name || emp.name.trim() === "" || emp.is_active === false) continue;
                const empDeptRaw = emp.department || "Без отдела";
                if (!empDeptRaw.toUpperCase().includes(dept.toUpperCase())) continue;

                if (dept === "VIP" && targetDateStr === "2026-03-10") {
                    console.log(`[DEBUG] Found VIP employee: ${emp.name} (active: ${emp.is_active}) | hours: ${emp.work_hours}`);
                }

                const empShifts = shifts.filter((s: any) => s.employee_id === emp.id);
                const todayShift = empShifts.find((s: any) => s.shift_date === targetDateStr);
                const yesterdayShift = empShifts.find((s: any) => s.shift_date === prevDateStr);

                if (todayShift && todayShift.hours_worked > 24) continue;
                if (yesterdayShift && yesterdayShift.hours_worked > 24) continue;

                let intervals: { s: number, e: number, type: string }[] = [];

                if (yesterdayShift) {
                    const workHours = emp.work_hours || "09:00-18:00";
                    const match = workHours.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
                    let startMins = 540, endMins = 1080;
                    if (match) {
                        startMins = parseInt(match[1]) * 60 + parseInt(match[2] || "0");
                        endMins = parseInt(match[3]) * 60 + parseInt(match[4] || "0");
                    }
                    const yNote = yesterdayShift.shift_note || "";
                    let yStart = startMins, yEnd = endMins, yCustomTime = false;
                    const yRangeMatch = yNote.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
                    const yRuMatch = yNote.match(/\b(?:с|c)\s*(\d{1,2})(?:[:\.](\d{2}))?\s*(?:до|по)\s*(\d{1,2})(?:[:\.](\d{2}))?\b/i);

                    if (yRangeMatch) {
                        const h1 = parseInt(yRangeMatch[1]); const m1 = parseInt(yRangeMatch[2] || "0");
                        const h2 = parseInt(yRangeMatch[3]); const m2 = parseInt(yRangeMatch[4] || "0");
                        if (h1 <= 24 && h2 <= 24) { yStart = h1 * 60 + m1; yEnd = h2 * 60 + m2; yCustomTime = true; }
                    } else if (yRuMatch) {
                        const h1 = parseInt(yRuMatch[1]); const m1 = parseInt(yRuMatch[2] || "0");
                        const h2 = parseInt(yRuMatch[3]); const m2 = parseInt(yRuMatch[4] || "0");
                        if (h1 <= 24 && h2 <= 24) { yStart = h1 * 60 + m1; yEnd = h2 * 60 + m2; yCustomTime = true; }
                    } else {
                        const yMatches = [...yNote.matchAll(/(\d{1,2})[:\.](\d{2})/g)];
                        if (yMatches.length >= 2) {
                            yStart = parseInt(yMatches[0][1]) * 60 + parseInt(yMatches[0][2]);
                            yEnd = parseInt(yMatches[1][1]) * 60 + parseInt(yMatches[1][2]);
                            yCustomTime = true;
                        }
                    }

                    if (!yCustomTime && yesterdayShift.hours_worked >= 18) yEnd = yStart + 1440;
                    if (!yCustomTime && yEnd === yStart && yesterdayShift.hours_worked >= 12) yEnd = yStart + 1440;

                    let realYEnd = yEnd;
                    if (realYEnd < yStart) realYEnd += 1440;
                    if (realYEnd === yStart) realYEnd += 1440;

                    if (realYEnd > 1440) {
                        intervals.push({ s: 0, e: realYEnd - 1440, type: 'tail' });
                    }
                }

                if (todayShift) {
                    const workHours = emp.work_hours || "09:00-18:00";
                    const match = workHours.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
                    let startMins = 540, endMins = 1080;
                    if (match) {
                        startMins = parseInt(match[1]) * 60 + parseInt(match[2] || "0");
                        endMins = parseInt(match[3]) * 60 + parseInt(match[4] || "0");
                    }
                    const noteText = todayShift.shift_note || "";
                    let customTimeFound = false, noteStart = 0, noteEnd = 0;
                    const rangeMatch = noteText.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
                    const ruMatch = noteText.match(/\b(?:с|c)\s*(\d{1,2})(?:[:\.](\d{2}))?\s*(?:до|по)\s*(\d{1,2})(?:[:\.](\d{2}))?\b/i);

                    if (rangeMatch) {
                        const h1 = parseInt(rangeMatch[1]); const m1 = parseInt(rangeMatch[2] || "0");
                        const h2 = parseInt(rangeMatch[3]); const m2 = parseInt(rangeMatch[4] || "0");
                        if (h1 <= 24 && h2 <= 24) { noteStart = h1 * 60 + m1; noteEnd = h2 * 60 + m2; customTimeFound = true; }
                    } else if (ruMatch) {
                        const h1 = parseInt(ruMatch[1]); const m1 = parseInt(ruMatch[2] || "0");
                        const h2 = parseInt(ruMatch[3]); const m2 = parseInt(ruMatch[4] || "0");
                        if (h1 <= 24 && h2 <= 24) { noteStart = h1 * 60 + m1; noteEnd = h2 * 60 + m2; customTimeFound = true; }
                    } else {
                        const tMatches = [...noteText.matchAll(/(\d{1,2})[:\.](\d{2})/g)];
                        if (tMatches.length >= 2) {
                            noteStart = parseInt(tMatches[0][1]) * 60 + parseInt(tMatches[0][2]);
                            noteEnd = parseInt(tMatches[1][1]) * 60 + parseInt(tMatches[1][2]);
                            customTimeFound = true;
                        }
                    }

                    let hoursWorked = todayShift.hours_worked;
                    let isPartial = hoursWorked < 8 || (noteText && noteText.toLowerCase().includes("доп"));
                    let isSplit = false;

                    if (customTimeFound) {
                        let noteDuration = noteEnd - noteStart;
                        if (noteDuration < 0) noteDuration += 1440;
                        if (hoursWorked * 60 > (noteDuration + 120)) isSplit = true;
                    }

                    if (customTimeFound) {
                        intervals.push({ s: noteStart, e: noteEnd, type: 'note' });
                    } else {
                        let e = endMins;
                        if (e <= startMins && hoursWorked >= 12) e = startMins + (hoursWorked * 60);
                        else if (isPartial) e = startMins + (hoursWorked * 60);
                        else if (hoursWorked >= 18) e = startMins + 1440;
                        intervals.push({ s: startMins, e: e, type: 'default' });
                    }

                    if (isSplit) {
                        let e = endMins;
                        if (e <= startMins) e += 1440;
                        intervals.push({ s: startMins, e: e, type: 'main' });
                    }
                }

                for (const iv of intervals) {
                    let sM = iv.s, eM = iv.e;
                    if (eM < sM) eM += 1440;
                    let reportStart = sM, reportEnd = eM > 1440 ? 1440 : eM;
                    for (let h = 0; h < 24; h++) {
                        const checkMins = h * 60 + 30;
                        if (checkMins >= reportStart && checkMins < reportEnd) hourlyCounts[h]++;
                    }
                }
            } // employee loop

            let zeroPeriods: { start: number, end: number }[] = [];
            let currentZStart = -1;

            for (let h = 0; h < 24; h++) {
                if (dayIndex === 0 && h < now.getHours()) continue;

                const deptUpper = dept.toUpperCase();
                if (deptUpper.includes("ОТЕЛИ")) {
                    if (h < 9 || h >= 21) continue;
                }

                if (hourlyCounts[h] === 0) {
                    if (currentZStart === -1) currentZStart = h;
                } else {
                    if (currentZStart !== -1) {
                        zeroPeriods.push({ start: currentZStart, end: h });
                        currentZStart = -1;
                    }
                }
            }
            if (currentZStart !== -1) {
                zeroPeriods.push({ start: currentZStart, end: 24 });
            }

            if (zeroPeriods.length > 0) {
                if (!dayHeaderAdded) {
                    alertMessage += `\n📅 <b>${targetDateStr}</b>\n`;
                    dayHeaderAdded = true;
                }
                foundAnomalies = true;

                for (const p of zeroPeriods) {
                    const sStr = p.start.toString().padStart(2, '0') + ':00';
                    const eStr = p.end.toString().padStart(2, '0') + ':00';
                    alertMessage += `• ${dept}: с ${sStr} до ${eStr}\n`;

                    const holeStartMins = p.start * 60;
                    const holeEndMins = p.end * 60;
                    let candidates: any[] = [];

                    for (const cEmp of employees) {
                        if (!cEmp.name || cEmp.is_active === false) continue;
                        const cDept = cEmp.department || "Без отдела";
                        if (!cDept.toUpperCase().includes(dept.toUpperCase())) continue;

                        const cShifts = shifts.filter((s: any) => s.employee_id === cEmp.id);

                        const todayS = cShifts.find((s: any) => s.shift_date === targetDateStr);
                        if (todayS) {
                            const note = (todayS.shift_note || "").toUpperCase();
                            const type = (todayS.shift_type || "").toUpperCase();
                            if (note.includes("БС") || note.includes("БЛ") || type === "БС" || type === "БЛ") continue;
                        }

                        let allIntervals: any[] = [];

                        for (let i = 0; i < allDates.length; i++) {
                            const relDay = i - (dayIndex + 1);
                            const dayShift = cShifts.find((s: any) => s.shift_date === allDates[i]);
                            if (!dayShift || dayShift.hours_worked === 0) continue;

                            const workHours = cEmp.work_hours || "09:00-18:00";
                            const match = workHours.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
                            let startMins = 540, endMins = 1080;
                            if (match) {
                                startMins = parseInt(match[1]) * 60 + parseInt(match[2] || "0");
                                endMins = parseInt(match[3]) * 60 + parseInt(match[4] || "0");
                            }

                            const noteText = dayShift.shift_note || "";
                            let cStart = startMins, cEnd = endMins, custom = false;

                            const rangeMatch = noteText.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
                            const ruMatch = noteText.match(/\b(?:с|c)\s*(\d{1,2})(?:[:\.](\d{2}))?\s*(?:до|по)\s*(\d{1,2})(?:[:\.](\d{2}))?\b/i);

                            if (rangeMatch) {
                                cStart = parseInt(rangeMatch[1]) * 60 + parseInt(rangeMatch[2] || "0");
                                cEnd = parseInt(rangeMatch[3]) * 60 + parseInt(rangeMatch[4] || "0");
                                custom = true;
                            } else if (ruMatch) {
                                cStart = parseInt(ruMatch[1]) * 60 + parseInt(ruMatch[2] || "0");
                                cEnd = parseInt(ruMatch[3]) * 60 + parseInt(ruMatch[4] || "0");
                                custom = true;
                            } else {
                                const tMatches = [...noteText.matchAll(/(\d{1,2})[:\.](\d{2})/g)];
                                if (tMatches.length >= 2) {
                                    cStart = parseInt(tMatches[0][1]) * 60 + parseInt(tMatches[0][2]);
                                    cEnd = parseInt(tMatches[1][1]) * 60 + parseInt(tMatches[1][2]);
                                    custom = true;
                                }
                            }

                            if (!custom && dayShift.hours_worked >= 18) cEnd = cStart + 1440;
                            if (!custom && cEnd <= cStart && dayShift.hours_worked >= 12) cEnd = cStart + (dayShift.hours_worked * 60);

                            let realEnd = cEnd;
                            if (realEnd < cStart) realEnd += 1440;
                            if (realEnd === cStart && cEnd !== 0) realEnd += 1440;
                            if (!custom && dayShift.hours_worked < 8) realEnd = cStart + (dayShift.hours_worked * 60);

                            const absoluteStart = (relDay * 1440) + cStart;
                            const absoluteEnd = (relDay * 1440) + realEnd;

                            allIntervals.push({ s: absoluteStart, e: absoluteEnd, realDate: allDates[i], realStart: cStart });

                            if (custom) {
                                let noteDur = cEnd - cStart;
                                if (noteDur < 0) noteDur += 1440;
                                if (dayShift.hours_worked * 60 > (noteDur + 120)) {
                                    let s = startMins, e = endMins;
                                    if (e <= s) e += 1440;
                                    allIntervals.push({ s: (relDay * 1440) + s, e: (relDay * 1440) + e, realDate: allDates[i], realStart: s });
                                }
                            }
                        }

                        let prevEnd = -999999;
                        let nextStart = 999999;
                        let nextShiftLabel = "Нет смен";
                        let conflict = false;

                        for (const iv of allIntervals) {
                            if (iv.s < holeEndMins && iv.e > holeStartMins) { conflict = true; break; }
                            if (iv.e <= holeStartMins && iv.e > prevEnd) prevEnd = iv.e;
                            if (iv.s >= holeEndMins && iv.s < nextStart) {
                                nextStart = iv.s;
                                const sh = Math.floor(iv.realStart / 60) % 24;
                                const sm = iv.realStart % 60;
                                const nextDayStr = iv.realDate === targetDateStr ? "сегодня" : (iv.realDate === datesToCheck[dayIndex + 1] ? "завтра" : iv.realDate);
                                nextShiftLabel = `${nextDayStr} в ${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
                            }
                        }

                        if (conflict) continue;

                        const gapBefore = holeStartMins - prevEnd;
                        const gapAfter = nextStart - holeEndMins;

                        // DEBUG LOG
                        if (targetDateStr === "2026-03-10" && dept === "VIP") {
                            console.log(`[DEBUG] Emp ${cEmp.name} | holeStart:${holeStartMins} holeEnd:${holeEndMins} | prevEnd:${prevEnd} nextStart:${nextStart} | gapB:${gapBefore} gapA:${gapAfter} | conflict:${conflict}`);
                        }

                        if (gapBefore >= 540 && gapAfter >= 540) {
                            candidates.push({
                                name: cEmp.name,
                                nextShiftLabel,
                                minRest: Math.min(gapBefore, gapAfter),
                                totalHours: monthlyHoursMap[cEmp.id] || 0
                            });
                        }
                    }

                    if (candidates.length > 0) {
                        candidates.sort((a, b) => {
                            if (b.minRest !== a.minRest) return b.minRest - a.minRest;
                            return a.totalHours - b.totalHours; // Ascending hours
                        });
                        const topCandidates = candidates.slice(0, 3);
                        alertMessage += `  <i>💡 Кандидаты на доп:</i>\n`;
                        topCandidates.forEach((c, idx) => {
                            alertMessage += `  ${idx + 1}) ${c.name} (след. смена ${c.nextShiftLabel}, за мес. ${c.totalHours}ч)\n`;
                        });
                    }
                }
            }
        } // dept loop
    }

    console.log(alertMessage);
}

run();
