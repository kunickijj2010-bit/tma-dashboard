import requests
from pathlib import Path

# Configuration
URL = "https://pkpvsdqvpqpqvlneevud.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcHZzZHF2cHFwcXZsbmVldnVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1NTQwOCwiZXhwIjoyMDg1ODMxNDA4fQ.caadz2tQLSTQjCt0z-cV0ea4yZfTT_5BGLBa_n5zgE8"
BUCKET = "tma-dashboard"
DIST_DIR = Path(r"c:\Users\user\.gemini\antigravity\scratch\Telegram-Bot-Refinement\dashboard-tma\dist")

MIME_MAP = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
}

def deploy():
    if not DIST_DIR.exists():
        print(f"❌ Error: {DIST_DIR} does not exist. Run 'npm run build' first.")
        return

    print(f"🚀 Starting forced MIME deployment to {BUCKET}...")

    for file_path in DIST_DIR.rglob("*"):
        if not file_path.is_file():
            continue

        relative_path = str(file_path.relative_to(DIST_DIR)).replace("\\", "/")
        ext = file_path.suffix.lower()
        content_type = MIME_MAP.get(ext, "application/octet-stream")
        
        upload_url = f"{URL}/storage/v1/object/{BUCKET}/{relative_path}"
        headers = {
            "Authorization": f"Bearer {KEY}",
            "Content-Type": content_type,
            "x-upsert": "true"
        }
        
        try:
            with open(file_path, "rb") as f:
                print(f"Uploading {relative_path} as {content_type}...", end=" ")
                response = requests.post(upload_url, data=f, headers=headers)
                
                # If POST fails with 400 (already exists) or similar, try DELETE then POST
                # though x-upsert should handle it.
                if response.status_code != 200:
                    requests.delete(upload_url, headers={"Authorization": f"Bearer {KEY}"})
                    response = requests.post(upload_url, data=f, headers=headers)

                if response.status_code == 200:
                    print("✅")
                else:
                    print(f"❌ ({response.status_code}) - {response.text}")
        except Exception as e:
            print(f"🔥 Error uploading {relative_path}: {e}")

    print(f"\n✨ Deployment complete!")
    print(f"🔗 Direct Link: {URL}/storage/v1/object/public/{BUCKET}/index.html")

if __name__ == "__main__":
    deploy()
