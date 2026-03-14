import fs from 'fs';

const envFile = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity\\scratch\\Telegram-Bot-Refinement\\.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    if (line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)) {
        const arr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        env[arr[1]] = arr[2];
    }
});

const SUPABASE_URL = env.PROJECT_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&limit=1`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const data = await res.json();
    console.log("EMPLOYEE SCHEMA:", data[0]);
}

run();
