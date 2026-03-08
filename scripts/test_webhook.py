import requests
import json
import os

def simulate_webhook(url, text="/online", chat_id=12345):
    payload = {
        "update_id": 10000,
        "message": {
            "message_id": 1,
            "from": {"id": 12345, "first_name": "TestUser"},
            "chat": {"id": chat_id, "type": "private"},
            "date": 1614552000,
            "text": text
        }
    }
    
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # URL локально запущенной функции Supabase
    local_url = "http://localhost:54321/functions/v1/telegram-bot"
    print(f"Simulating webhook to {local_url}...")
    simulate_webhook(local_url)
