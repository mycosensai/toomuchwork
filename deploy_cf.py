#!/usr/bin/env python3
"""Update Cloudflare Pages project config - add D1 binding and env vars"""
import urllib.request, urllib.error, json, os

TOKEN_FILE = r"C:\Users\vdako\thevault-final\.cf_token"
ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT_NAME = "thevault"
DATABASE_ID = "375949ce-7c7d-4822-8235-461446769258"
CLERK_KEY = "pk_test_ZXhvdGljLWFyYWNobmlkLTQ1LmNsZXJrLmFjY291bnRzLmRldiQ"

try:
    with open(TOKEN_FILE) as f:
        API_TOKEN = f.read().strip()
    assert len(API_TOKEN) > 10, "Token too short"
except Exception as e:
    print(f"Error reading token: {e}")
    exit(1)

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
                },
                "CLERK_SECRET_KEY": {
                    "type": "secret_text",
                    "value": ""
                },
                "CLERK_WEBHOOK_SIGNING_SECRET": {
                    "type": "secret_text",
                    "value": ""
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

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}"
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="PATCH")

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    print(f"Success: {result.get('success')}")
    if result.get('success'):
        proj = result.get('result', {})
        cfgs = proj.get('deployment_configs', {})
        prod = cfgs.get('production', {})
        dbs = prod.get('d1_databases', [])
        print(f"D1 bindings: {dbs}")
        keys = list(prod.get('env_vars', {}).keys())
        print(f"Env vars: {keys}")
    else:
        print(f"Errors: {result.get('errors')}")
        if result.get('errors'):
            for e in result['errors']:
                print(f"  - {e.get('message', e)}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
