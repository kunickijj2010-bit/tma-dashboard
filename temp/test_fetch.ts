const ENV = Deno.readTextFileSync('C:/Users/user/.gemini/antigravity/scratch/Telegram-Bot-Refinement/.env');
const KEY = ENV.match(/SUPABASE_KEY=(.*)(\r?\n|$)/)[1].trim();

async function main() {
    const res = await fetch("https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/check-shifts?manual=true&days=7", {
        headers: { "Authorization": `Bearer ${KEY}` }
    });
    const json = await res.json();
    console.log(json.text);
}

main();
