#!/usr/bin/env python3
"""
Add D1 database binding to Cloudflare Pages project.
Uses the PATCH /pages/projects/:name endpoint to set d1_databases in deployment config.
"""
import urllib.request
import json
import os
import sys

# Read token from secret file
try:
    with open(r"C:\Users\vdako\thevault-final\.cf_token") as f:
        API_TOKEN = f.read().strip()
except Exception as e:
    print(f"Error reading token: {e}")
    sys.exit(1)

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT_NAME = "thevault"
DATABASE_ID = "375949ce-7c7d-4822-8235-461446769258"
CLERK_KEY = "pk_test_ZXhvdGljLWFyYWNobmlkLTQ1LmNsZXJrLmFjY291bnRzLmRldiQ"

def make_request(method, path, data=None):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/{path}"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"_http_error": e.code, "_body": e.read().decode()}
    except Exception as e:
        return {"_error": str(e)}

# Step 1: Try updating the project's deployment configs with D1 binding
print("=== Attempting to add D1 binding to Pages project ===")
print(f"Project: {PROJECT_NAME}")
print(f"Database ID: {DATABASE_ID}")
print()

# Method 1: PATCH the project with deployment_configs
print("Method 1: PATCH project with deployment configs...")
payload = {
    "deployment_configs": {
        "production": {
            "compatibility_date": "2026-05-22",
            "compatibility_flags": ["nodejs_compat"],
            "fail_open": True,
            "usage_model": "standard",
            "env_vars": {
                "VITE_CLERK_PUBLISHABLE_KEY": {
                    "type": "plain_text",
                    "value": CLERK_KEY
                }
            },
            "d1_databases": [
                {
                    "binding": "DB",
                    "database_name": "thevault-db",
                    "database_id": DATABASE_ID
                }
            ]
        },
        "preview": {
            "compatibility_date": "2026-05-22",
            "compatibility_flags": ["nodejs_compat"],
            "fail_open": True,
            "usage_model": "standard",
            "env_vars": {
                "VITE_CLERK_PUBLISHABLE_KEY": {
                    "type": "plain_text",
                    "value": CLERK_KEY
                }
            },
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

result = make_request("PATCH", f"pages/projects/{PROJECT_NAME}", payload)
success = result.get("success", False)
if success:
    print("✅ Method 1 SUCCEEDED!")
    dbs = result.get("result", {}).get("deployment_configs", {}).get("production", {}).get("d1_databases", [])
    print(f"   D1 bindings in production: {dbs}")
else:
    errors = result.get("errors", result.get("_http_error", "unknown"))
    body = result.get("_body", "")
    print(f"❌ Method 1 failed: {errors}")
    if body:
        print(f"   Body: {body}")
    
    # Method 2: Try to get the current project to check if token works at all
    print()
    print("Method 2: Testing token with GET project...")
    result2 = make_request("GET", f"pages/projects/{PROJECT_NAME}")
    if result2.get("success"):
        print("✅ Token works! Got project info.")
        proj = result2.get("result", {})
        print(f"   Project: {proj.get('name')}")
        print(f"   Domains: {proj.get('domains')}")
        
        # Check existing bindings
        prod_config = proj.get("deployment_configs", {}).get("production", {})
        print(f"   Existing D1 databases: {prod_config.get('d1_databases', 'not set')}")
        print(f"   Existing env vars: {list(prod_config.get('env_vars', {}).keys())}")
    else:
        print(f"❌ Token doesn't work for GET either: {result2.get('errors', result2.get('_http_error'))}")
        print()
        print("The cfat_ tokens (OAuth tokens from wrangler) do NOT have")
        print("API access. They only work through the wrangler CLI.")
        print()
        print("Alternative: Using wrangler CLI instead...")
        
        # Method 3: Try using wrangler CLI
        print()
        print("Method 3: Using wrangler CLI...")
        import subprocess
        try:
            # Try to set the D1 binding using wrangler
            # Wrangler doesn't have a command for this, but let's try
            # setting the secret and see if the binding auto-applies from wrangler.toml
            wrangler_result = subprocess.run(
                ["npx", "wrangler", "pages", "secret", "put", "VITE_CLERK_PUBLISHABLE_KEY", "--project-name", "thevault"],
                input=f"{CLERK_KEY}\n",
                capture_output=True,
                text=True,
                cwd=r"C:\Users\vdako\thevault-final",
                timeout=30
            )
            print(f"   wrangler stdout: {wrangler_result.stdout}")
            print(f"   wrangler stderr: {wrangler_result.stderr}")
            if wrangler_result.returncode == 0:
                print("✅ Secret set successfully!")
            else:
                print(f"❌ wrangler failed: {wrangler_result.stderr}")
                
            # Try triggering a deploy
            print()
            print("Triggering new deployment...")
            deploy_result = subprocess.run(
                ["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "thevault", "--commit-dirty=true", "--branch=master"],
                capture_output=True,
                text=True,
                cwd=r"C:\Users\vdako\thevault-final",
                timeout=60
            )
            print(f"   Deploy stdout: {deploy_result.stdout[-500:]}")
            if deploy_result.returncode == 0:
                print("✅ Deploy triggered!")
            else:
                print(f"❌ Deploy failed: {deploy_result.stderr[-500:]}")
        except Exception as e:
            print(f"   wrangler error: {e}")

print()
print("=== Summary ===")
print("The D1 database binding needs to be added in Cloudflare Dashboard:")
print("  https://dash.cloudflare.com -> Pages -> thevault -> Settings -> Functions")
print("  -> D1 database bindings -> Add: binding=DB, database=thevault-db")
print()
print("After that, trigger a deploy and user registration will work.")
