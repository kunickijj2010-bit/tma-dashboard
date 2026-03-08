import os
import json

dist_dir = r"c:\Users\user\.gemini\antigravity\scratch\Telegram-Bot-Refinement\dashboard-tma\dist"
combined_html_path = os.path.join(dist_dir, "combined_dashboard.html")
output_ts_path = r"c:\Users\user\.gemini\antigravity\scratch\supabase\functions\telegram-bot\dashboard_html.ts"

with open(combined_html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Using JSON stringify approach to handle escaping
escaped_html = json.dumps(html)

with open(output_ts_path, "w", encoding="utf-8") as f:
    f.write(f"export const DASHBOARD_HTML = {escaped_html};\n")

print(f"✅ Generated {output_ts_path}")
