// supabase/functions/tma-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Reuse data fetching logic from the main bot function
        // For now, we'll return structured data for the dashboard

        const now = new Date();
        const mskOffset = 3 * 60 * 60 * 1000;
        const mskDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + mskOffset);
        const todayStr = mskDate.toISOString().split("T")[0];
        const tDate = new Date(`${todayStr}T12:00:00Z`);
        tDate.setDate(tDate.getDate() - 1);
        const yesterdayStr = tDate.toISOString().split("T")[0];

        const { data: shifts } = await supabase
            .from("shifts")
            .select("employee_id, shift_date, hours_worked, shift_note")
            .in("shift_date", [yesterdayStr, todayStr])
            .gt("hours_worked", 0);

        if (!shifts) throw new Error("Shifts not found");

        const employeeIds = [...new Set(shifts.map((s: any) => s.employee_id))];
        const { data: employees } = await supabase
            .from("employees")
            .select("id, name, department, work_hours")
            .in("id", employeeIds);

        if (!employees) throw new Error("Employees not found");

        // Process logic similar to getOnlineEmployeeData in index.ts
        // (Simplified for brevity in the API, should be robust)

        const targetDepts = [
            "GDS", "NDC", "VIP", "отели", "работа с поставщиками",
            "МА Супервизия", "Jivo-chat", "Социальный",
            "Специалисты по распределению запросов", "МА АДМИНИСТРАЦИЯ"
        ];

        const mskHours = mskDate.getHours();
        const mskMins = mskDate.getMinutes();
        const currentMins = mskHours * 60 + mskMins;

        const shiftMap: Record<number, any[]> = {};
        shifts.forEach((s: any) => {
            if (!shiftMap[s.employee_id]) shiftMap[s.employee_id] = [];
            shiftMap[s.employee_id].push(s);
        });

        const processedDepts = targetDepts.map(deptName => {
            const deptEmployees = employees.filter(e => e.department === deptName);
            const onlineEmps = deptEmployees.filter(emp => {
                const empShifts = shiftMap[emp.id] || [];
                const todayShift = empShifts.find((s: any) => s.shift_date === todayStr);
                const yesterdayShift = empShifts.find((s: any) => s.shift_date === yesterdayStr);

                // Simple logic check (reusing from index.ts logic)
                const workHours = emp.work_hours || "09:00-18:00";
                const match = workHours.match(/(\d{1,2})[:\.]?(\d{2})?\s*-\s*(\d{1,2})[:\.]?(\d{2})?/);
                let startMins = 540, endMins = 1080;
                if (match) {
                    startMins = parseInt(match[1]) * 60 + parseInt(match[2] || "0");
                    endMins = parseInt(match[3]) * 60 + parseInt(match[4] || "0");
                }

                if (todayShift) {
                    const noteText = todayShift.shift_note || "";
                    const rangeMatch = noteText.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
                    let s = startMins, e = endMins;
                    if (rangeMatch) {
                        s = parseInt(rangeMatch[1]) * 60 + parseInt(rangeMatch[2] || "0");
                        e = parseInt(rangeMatch[3]) * 60 + parseInt(rangeMatch[4] || "0");
                    }
                    let realE = e; if (realE <= s) realE += 1440;
                    if (currentMins >= s && currentMins < realE) return true;
                }
                return false;
            }).map(emp => {
                // Get end time
                const empShifts = shiftMap[emp.id] || [];
                const ts = empShifts.find((s: any) => s.shift_date === todayStr);
                const noteText = ts?.shift_note || "";
                const rangeMatch = noteText.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:\.](\d{2}))?\b/);
                let e = 1080;
                if (rangeMatch) e = parseInt(rangeMatch[3]) * 60 + parseInt(rangeMatch[4] || "0");
                const endH = Math.floor(e / 60) % 24;
                const endM = e % 60;
                return {
                    name: emp.name,
                    endTime: `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`,
                    active: true
                };
            });

            return {
                id: deptName.toLowerCase().replace(/\s+/g, '-'),
                name: deptName,
                onlineCount: onlineEmps.length,
                totalCapacity: 10, // Mock total for visualization
                employees: onlineEmps
            };
        });

        return new Response(JSON.stringify(processedDepts), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
