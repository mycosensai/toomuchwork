#!/usr/bin/env python3
"""Add D1 binding to Cloudflare Pages project using stored wrangler OAuth token"""
import urllib.request
import json

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT_NAME = "thevault"
DATABASE_ID = "375949ce-7c7d-4822-8235-461446769258"
CLERK_KEY = "pk_test_ZXhvdGljLWFyYWNobmlkLTQ1LmNsZXJrLmFjY291bnRzLmRldiQ"

# Use the stored wrangler OAuth token
with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    content = f.read()
# Extract token
import re
match = re.search(r'oauth_token = "([^"]+)"', content)
if not match:
    print("Could not find OAuth token in wrangler config")
    exit(1)
TOKEN = match.group(1)
print(f"Using token: {TOKEN[:20]}...")

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

# Step 1: Get current project config
print("\n=== Step 1: Get current project config ===")
result = api("GET", f"pages/projects/{PROJECT_NAME}")
if result.get("success"):
    print("✅ Got project")
    proj = result["result"]
    prod = proj.get("deployment_configs", {}).get("production", {})
    preview = proj.get("deployment_configs", {}).get("preview", {})
    print(f"D1 databases (prod): {prod.get('d1_databases', 'NOT SET')}")
    print(f"D1 databases (preview): {preview.get('d1_databases', 'NOT SET')}")
    
    # Step 2: Build the update payload preserving all existing config
    update_data = {
        "deployment_configs": {
            "production": {
                **prod,
                "d1_databases": [
                    {
                        "binding": "DB",
                        "database_name": "thevault-db",
                        "database_id": DATABASE_ID
                    }
                ]
            },
            "preview": {
                **preview,
                "d1_databases": [
                    {
                        "binding": "DB",
                        "database_name": "thevault-db",
                        "database_id": DATABASE_ID
                    }
                ]
            }
        }
    }
    
    # Also add VITE_CLERK_PUBLISHABLE_KEY env var if not present
    env_vars = prod.get("env_vars", {})
    if "VITE_CLERK_PUBLISHABLE_KEY" not in env_vars:
        update_data["deployment_configs"]["production"]["env_vars"] = {
            **env_vars,
            "VITE_CLERK_PUBLISHABLE_KEY": {
                "type": "plain_text",
                "value": CLERK_KEY
            }
        }
        preview_vars = preview.get("env_vars", {})
        update_data["deployment_configs"]["preview"]["env_vars"] = {
            **preview_vars,
            "VITE_CLERK_PUBLISHABLE_KEY": {
                "type": "plain_text",
                "value": CLERK_KEY
            }
        }
    
    print("\n=== Step 2: Apply update ===")
    # Remove env_vars that have empty string values (secrets not set)
    update_data["deployment_configs"]["production"].pop("env_vars", None)
    update_data["deployment_configs"]["preview"].pop("env_vars", None)
    
    print("Payload (summary):")
    print(f"  Production D1 databases: {update_data['deployment_configs']['production'].get('d1_databases')}")
    print(f"  Preview D1 databases: {update_data['deployment_configs']['preview'].get('d1_databases')}")
    
    result2 = api("PATCH", f"pages/projects/{PROJECT_NAME}", update_data)
    if result2.get("success"):
        print("\n✅ D1 binding ADDED SUCCESSFULLY!")
        new_prod = result2["result"].get("deployment_configs", {}).get("production", {})
        print(f"Confirmed: D1 databases = {new_prod.get('d1_databases')}")
    else:
        print(f"\n❌ Failed: {result2.get('errors', result2.get('_http'))}")
        if result2.get("_body"):
            print(f"Response: {result2['_body'][:500]}")
            
            # Try a simpler payload
            print("\n=== Step 3: Retry with minimal payload ===")
            simple_payload = {
                "deployment_configs": {
                    "production": {
                        "d1_databases": [
                            {
                                "binding": "DB",
                                "database_name": "thevault-db",
                                "database_id": DATABASE_ID
                            }
                        ]
                    }
                }
            }
            result3 = api("PATCH", f"pages/projects/{PROJECT_NAME}", simple_payload)
            if result3.get("success"):
                print("✅ Minimal payload worked!")
                print(f"D1: {result3['result'].get('deployment_configs',{}).get('production',{}).get('d1_databases')}")
            else:
                print(f"❌ Still failed: {result3.get('errors', result3.get('_http'))}")
else:
    print(f"❌ Failed: {result.get('errors', result.get('_http'))}")

print("\n=== Done ===")
