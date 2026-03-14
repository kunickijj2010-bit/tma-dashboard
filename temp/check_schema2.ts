import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = await Deno.readTextFile("C:\\Users\\user\\.gemini\\antigravity\\scratch\\Telegram-Bot-Refinement\\.env");
const vars = Object.fromEntries(env.split("\n").filter(l => l && !l.startsWith("#")).map(l => l.split("=")));

const SUPABASE_URL = vars["PROJECT_URL"] || vars["SUPABASE_URL"];
const SUPABASE_KEY = vars["SERVICE_ROLE_KEY"] || vars["SUPABASE_SERVICE_ROLE_KEY"];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from("employees").select("*").limit(1);
    console.log("Employees schema:", data && data[0] ? Object.keys(data[0]) : error);
}
check();
