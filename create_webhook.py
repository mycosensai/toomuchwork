import requests
import json

key = "sk_tes...k9l8"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
data = {
    "url": "https://thevaultdfw.win/api/webhooks/clerk",
    "event_types": ["user.created", "user.updated", "user.deleted"]
}

print("Creating webhook...")
resp = requests.post("https://api.clerk.com/v1/webhooks", headers=headers, json=data)
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), indent=2)}")
