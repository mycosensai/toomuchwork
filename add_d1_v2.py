#!/usr/bin/env python3
"""Add D1 binding using the correct API format"""
import urllib.request
import json
import re

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT_NAME = "thevault"
DATABASE_ID = "375949ce-7c7d-4822-8235-461446769258"

with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    content = f.read()
match = re.search(r'oauth_token = "([^"]+)"', content)
if not match:
    print("Could not find OAuth token")
    exit(1)
TOKEN = match.group(1)
print(f"Token: {TOKEN[:20]}...")

def api(method, path, data=None):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/{path}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"_http": e.code, "_body": e.read().decode()}

# Step 1: Get full project config to see exact format
print("\n=== Step 1: Get full project config ===")
result = api("GET", f"pages/projects/{PROJECT_NAME}")
if result.get("success"):
    proj = result["result"]
    prod = proj.get("deployment_configs", {}).get("production", {})
    preview = proj.get("deployment_configs", {}).get("preview", {})
    
    print(f"\nProduction D1 format: {json.dumps(prod.get('d1_databases', 'NOT SET'), indent=2)}")
    print(f"Preview D1 format: {json.dumps(preview.get('d1_databases', 'NOT SET'), indent=2)}")
    
    # The preview uses: {"BINDING_NAME": {"id": "DATABASE_ID"}}
    # Let me use the same format for production
    d1_binding = {
        "DB": {
            "id": DATABASE_ID
        }
    }
    
    # Build update payload preserving everything
    update = {
        "deployment_configs": {
            "production": {
                **prod,
                "d1_databases": d1_binding
            },
            "preview": {
                **preview,
                "d1_databases": d1_binding
            }
        }
    }
    
    # Remove empty secrets from env_vars (can't set them to "")
    if "env_vars" in update["deployment_configs"]["production"]:
        ev = dict(update["deployment_configs"]["production"]["env_vars"])
        to_remove = [k for k, v in ev.items() if isinstance(v, dict) and v.get("value") == ""]
        for k in to_remove:
            del ev[k]
        update["deployment_configs"]["production"]["env_vars"] = ev
    
    print(f"\n=== Step 2: Apply D1 binding ===")
    print(f"Payload d1_databases: {json.dumps(d1_binding, indent=2)}")
    
    result2 = api("PATCH", f"pages/projects/{PROJECT_NAME}", update)
    if result2.get("success"):
        print("\n✅ SUCCESS! D1 binding added to production!")
        new_prod = result2["result"].get("deployment_configs", {}).get("production", {})
        print(f"D1: {new_prod.get('d1_databases')}")
    else:
        errors = result2.get("errors", result2.get("_http"))
        print(f"\n❌ Failed: {errors}")
        if result2.get("_body"):
            print(f"Body: {result2['_body'][:500]}")
            
            # Try simpler - just set d1_databases directly
            print("\n=== Step 3: Minimal approach ===")
            minimal = {
                "deployment_configs": {
                    "production": {
                        "d1_databases": d1_binding
                    },
                    "preview": {
                        "d1_databases": d1_binding
                    }
                }
            }
            result3 = api("PATCH", f"pages/projects/{PROJECT_NAME}", minimal)
            if result3.get("success"):
                print("✅ Minimal approach worked!")
                print(f"D1: {result3['result'].get('deployment_configs',{}).get('production',{}).get('d1_databases')}")
            else:
                print(f"❌ Failed: {result3.get('errors', result3.get('_body', 'unknown'))[:300]}")

else:
    print(f"❌ Failed: {result.get('errors')}")

print("\n=== Done ===")
