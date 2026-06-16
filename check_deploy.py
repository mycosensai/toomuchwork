#!/usr/bin/env python3
import urllib.request, json, re

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT = "thevault"

with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    content = f.read()
match = re.search(r'oauth_token = "([^"]+)"', content)
if not match:
    print("Token not found")
    exit(1)

TOKEN = match.group(1)

def api(method, url, data=None):
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# Check deployments
print("=== Deployments ===")
base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}"
result = api("GET", f"{base}/deployments?environment=production&per_page=3")
if result.get("success"):
    for dep in result.get("result", []):
        s = dep.get("latest_stage", {})
        m = dep.get("deployment_trigger", {}).get("metadata", {}).get("commit_message", "")[:60]
        print(f"  {dep.get('short_id')}: stage={s.get('status','')}")
        print(f"    msg: {m}")
        print(f"    url: {dep.get('url')}")
        print()

# Test the latest prod URL
latest_url = None
for dep in result.get("result", []):
    if dep.get("environment") == "production":
        latest_url = dep.get("url")
        break

if latest_url:
    print(f"=== Testing {latest_url} ===")
    try:
        r = urllib.request.urlopen(f"{latest_url}/api/health", timeout=10)
        print(f"  Health: {json.loads(r.read())}")
    except Exception as e:
        print(f"  Health error: {e}")
    
    try:
        body = json.dumps({"name": "Test", "email": "test@vault.com", "password": "Password1!"}).encode()
        req = urllib.request.Request(
            f"{latest_url}/api/auth/register", data=body,
            headers={"Content-Type": "application/json"}, method="POST"
        )
        r = urllib.request.urlopen(req, timeout=10)
        print(f"  Register: {json.loads(r.read())}")
    except urllib.error.HTTPError as e:
        print(f"  Register: {json.loads(e.read())}")
    except Exception as e:
        print(f"  Register error: {e}")
else:
    print("No production deployment found")
