import os
import re

dist_dir = r"c:\Users\user\.gemini\antigravity\scratch\Telegram-Bot-Refinement\dashboard-tma\dist"
assets_dir = os.path.join(dist_dir, "assets")

html_path = os.path.join(dist_dir, "index.html")

# Find CSS and JS dynamically
try:
    css_file = next(f for f in os.listdir(assets_dir) if f.startswith("index-") and f.endswith(".css"))
    js_file = next(f for f in os.listdir(assets_dir) if f.startswith("index-") and f.endswith(".js"))
except StopIteration:
    print("❌ Failed to find compiled assets in dist/assets")
    exit(1)

css_path = os.path.join(assets_dir, css_file)
js_path = os.path.join(assets_dir, js_file)
output_path = os.path.join(dist_dir, "combined_dashboard.html")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Replace CSS link tags dynamically
css_match = re.search(r'<link[^>]*href="[^"]*assets/index-[^"]*\.css"[^>]*>', html)
if css_match:
    html = html.replace(css_match.group(0), f"<style>{css}</style>")

# Replace JS script tags dynamically
js_match = re.search(r'<script[^>]*src="[^"]*assets/index-[^"]*\.js"[^>]*><\/script>', html)
if js_match:
    html = html.replace(js_match.group(0), f'<script type="module">{js}</script>')

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"[OK] Created {output_path} ({len(html)} bytes)")
