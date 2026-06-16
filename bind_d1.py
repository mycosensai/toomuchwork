#!/usr/bin/env python3
import urllib.request, json, re

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT = "thevault"
DATABASE_ID = "375949ce-7c7d-4822-8235-461446769258"

with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    content = f.read()
m = re.search(r'oauth_token = "([^"]+)"', content)
if not m:
    print("Token not found")
    exit(1)

TOKEN=*** api(method, url, data=None):
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

base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"

# Try different endpoints for Pages function bindings
print("=== Trying to add D1 binding to Pages function ===")

endpoints = [
    # Pages function bindings
    f"{base}/pages/projects/{PROJECT}/function-bindings",
    # Workers script bindings for the Pages worker
    f"{base}/workers/scripts/pages-worker--14619644-production/bindings/DB",
    # Put binding
    f"{base}/workers/scripts/pages-worker--14619644-production/bindings",
]

payloads = [
    {"bindings": [{"type": "d1_database", "name": "DB", "target_id": DATABASE_ID}]},
    {"type": "d1_database", "target_id": DATABASE_ID},
    {"bindings": [{"type": "d1_database", "name": "DB", "id": DATABASE_ID}]},
]

methods = ["POST", "PUT", "POST"]

for i, (ep, pl, meth) in enumerate(zip(endpoints, payloads, methods)):
    print(f"\nTest {i+1}: {meth} {ep.split('accounts/')[-1]}")
    try:
        result = api(meth, ep, pl)
        success = result.get("success", False) if isinstance(result, dict) else False
        if success:
            print(f"  ✅ SUCCESS!")
            print(f"  Response: {json.dumps(result, indent=2)[:300]}")
            break
        else:
            err = result.get("errors", result.get("_http", "unknown"))
            print(f"  ❌ {err}")
    except Exception as e:
        print(f"  ❌ {e}")
else:
    print("\nAll methods failed. Adding D1 binding manually in dashboard required.")
