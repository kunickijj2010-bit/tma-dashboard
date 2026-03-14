import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from("employees").select("*").limit(1);
    console.log("Employees schema:", data && data[0] ? Object.keys(data[0]) : error);

    const { data: d2, error: e2 } = await supabase.from("employees").select("*").not("total_hours", "is", null).limit(1);
    console.log("Any employee with total_hours?", d2 && d2[0] ? d2[0] : false);
}
check();
