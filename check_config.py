#!/usr/bin/env python3
import urllib.request, json

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT = "thevault"

with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    content = f.read()
import re
m = re.search(r'oauth_token = "([^"]+)"', content)
if not m:
    print("Token not found")
    exit(1)

TOKEN = m.group(1)

def api(method, url, data=None):
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        b = e.read().decode()
        try: return json.loads(b)
        except: return {"_http": e.code, "_body": b[:500]}

base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}"

print("=== Full Project Config ===")
result = api("GET", base)
if result.get("success"):
    r = result["result"]
    prod = r.get("deployment_configs", {}).get("production", {})
    print(f"D1 in config: {json.dumps(prod.get('d1_databases', 'NOT SET'), indent=2)}")
    print(f"Env vars: {list(prod.get('env_vars', {}).keys())}")
    
    canonical = r.get("canonical_deployment", {})
    print(f"\nCanonical (production) deployment: {canonical.get('short_id')}")
    print(f"Stage: {canonical.get('latest_stage', {}).get('status')}")
    print(f"URL: {canonical.get('url')}")
else:
    print(f"Error: {result.get('errors', 'unknown')}")
