import requests
import json

key = "sk_tes...k9l8"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# Try various webhook endpoints
endpoints = [
    "/webhooks",
    "/v1/webhooks",  
    "/v1/svix/apps",
    "/v1/svix/endpoints",
]

for ep in endpoints:
    url = f"https://api.clerk.com{ep}"
    resp = requests.get(url, headers=headers)
    print(f"GET {ep}: {resp.status_code} - {json.dumps(resp.json() if resp.text else {}, indent=2)[:200]}")
    print()
