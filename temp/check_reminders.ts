import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://pkpvsdqvpqpqvlneevud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcHZzZHF2cHFwcXZsbmVldnVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1NTQwOCwiZXhwIjoyMDg1ODMxNDA4fQ.caadz2tQLSTQjCt0z-cV0ea4yZfTT_5BGLBa_n5zgE8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data: reminders, error } = await supabase.from("ticket_reminders").select("*").limit(10);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Reminders list:", reminders);
    }
}
run();
