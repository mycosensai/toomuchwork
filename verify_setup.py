import requests, json

KEY = "sk_test_oTtFXnlmKynXXTbUNZHZAa0YY6DjVUF4vwx7G5k9l8"
headers = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

# Verify key works
r = requests.get("https://api.clerk.com/v1/users?limit=1", headers=headers)
print(f"Users API: {r.status_code} - {r.text[:100]}")

# Create webhook  
r = requests.post("https://api.clerk.com/v1/webhooks", headers=headers, json={
    "url": "https://thevaultdfw.win/api/webhooks/clerk",
    "event_types": ["user.created", "user.updated", "user.deleted"]
})
print(f"Webhook POST: {r.status_code} - {r.text[:200]}")

# Also check Cloudflare
CF_TOKEN = "cfat...RKKkUHmBzbst0KjCVpkUlXeqDRHlwFgPA4XseYjf79371044"
cf_headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}
r = requests.get("https://api.cloudflare.com/client/v4/accounts/2ad733f9d698170c202b12924868c60e/pages/projects/thevault", headers=cf_headers)
if r.json().get('success'):
    deploy = r.json()['result'].get('deployment_configs', {}).get('production', {})
    env_vars = deploy.get('env_vars', {})
    secrets = deploy.get('secrets', {})
    for k in ['VITE_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']:
        if k in env_vars:
            print(f"CF {k}: set")
        elif k in secrets:
            print(f"CF {k}: set as secret")
        else:
            print(f"CF {k}: NOT SET")
else:
    print(f"CF API: {r.json()}")
