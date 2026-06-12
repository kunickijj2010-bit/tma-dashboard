import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://pkpvsdqvpqpqvlneevud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcHZzZHF2cHFwcXZsbmVldnVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1NTQwOCwiZXhwIjoyMDg1ODMxNDA4fQ.caadz2tQLSTQjCt0z-cV0ea4yZfTT_5BGLBa_n5zgE8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Inserting test pending reminder...");
    const { data, error } = await supabase.from("ticket_reminders").insert({
        ticket_number: "77777",
        chat_id: 1662876572,
        username: "v_kunitskii",
        reminder_text: "Тестовое напоминание в Rocket.Chat! Интеграция успешно работает 🎉",
        remind_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        is_sent: false
    }).select();

    if (error) {
        console.error("Insert error:", error);
        return;
    }
    console.log("Test reminder inserted:", data);

    console.log("Triggering send_reminders action...");
    const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-bot`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ action: "send_reminders" })
    });

    const respText = await res.text();
    console.log("Edge function response status:", res.status);
    console.log("Edge function response body:", respText);
}

run();
