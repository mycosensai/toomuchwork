import requests
import json

key = "sk_tes...k9l8"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Try the webhooks endpoint
resp = requests.post("https://api.clerk.com/v1/webhooks", headers=headers, json={
    "url": "https://thevaultdfw.win/api/webhooks/clerk",
    "event_types": ["user.created", "user.updated", "user.deleted"]
})
print(f"POST /v1/webhooks: {resp.status_code}")
print(f"Text: {resp.text}")

# Also try Svix
resp2 = requests.get("https://api.clerk.com/v1/svix/app", headers=headers)
print(f"\nGET /v1/svix/app: {resp2.status_code}")
print(f"Text: {resp2.text}")
