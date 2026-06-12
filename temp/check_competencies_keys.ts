import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://pkpvsdqvpqpqvlneevud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcHZzZHF2cHFwcXZsbmVldnVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1NTQwOCwiZXhwIjoyMDg1ODMxNDA4fQ.caadz2tQLSTQjCt0z-cV0ea4yZfTT_5BGLBa_n5zgE8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    // Query list of tables using RPC or select from postgrest if available.
    // Usually we can just query pg_catalog using an sql function if we have one,
    // or let's try querying /rest/v1/ with a schema request, or select a table we know.
    // Let's see if there are other tables like "grades", or if employees has other columns in other rows.
    // Wait, let's try to query database schema metadata if possible.
    // Alternatively, let's select * from employees where competencies has a key "grade" or "Grade".
    const { data: emps, error } = await supabase.from("employees").select("*");
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    // Check if any employee has "grade" or "грейд" in their properties
    console.log("Checking columns of first employee:", Object.keys(emps[0]));
    
    // Let's see if any employee has a field that could be grade or if any competency contains "grade"
    let keys = new Set();
    emps.forEach(e => {
        if (e.competencies) {
            Object.keys(e.competencies).forEach(k => keys.add(k));
        }
    });
    console.log("All competency keys found in DB:", Array.from(keys));
}
run();
