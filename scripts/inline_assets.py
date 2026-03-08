import os

dist_dir = r"c:\Users\user\.gemini\antigravity\scratch\Telegram-Bot-Refinement\dashboard-tma\dist"
html_path = os.path.join(dist_dir, "index.html")
css_path = os.path.join(dist_dir, "assets", "index-CoAXW8xz.css")
js_path = os.path.join(dist_dir, "assets", "index-DSdxgmua.js")
output_path = os.path.join(dist_dir, "combined_dashboard.html")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Inline CSS
html = html.replace('<link rel="stylesheet" crossorigin href="./assets/index-CoAXW8xz.css">', f"<style>{css}</style>")

# Inline JS
html = html.replace('<script type="module" crossorigin src="./assets/index-DSdxgmua.js"></script>', f'<script type="module">{js}</script>')

# Remove unnecessary lines like preconnect to speed up (optional but good)
# Also ensure absolute fonts are working (fonts are external URLs, that's fine)

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ Created {output_path} ({len(html)} bytes)")
