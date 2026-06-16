#!/usr/bin/env python3
import urllib.request, json, re

ACCOUNT_ID = "2ad733f9d698170c202b12924868c60e"
PROJECT = "thevault"

with open(r"C:\Users\vdako\.wrangler\config\default.toml") as f:
    c = f.read()
m = re.search(r'oauth_token = "([^"]+)"', c)
TOKEN=*** api(method, url, data=None):
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    b = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=b, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return json.loads(e.read())
        except: return {"_err": str(e)}

base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}"

# Check current bindings
r = api("GET", base)
if r.get("success"):
    proj = r["result"]
    print("=== Current D1 Database Bindings ===")
    
    # Check deployment_configs
    prod = proj.get("deployment_configs", {}).get("production", {})
    print(f"Production deployment_configs d1: {prod.get('d1_databases', 'NOT SET')}")
    
    # Check the canonical deployment
    cd = proj.get("canonical_deployment", {})
    print(f"\nCanonical deployment: {cd.get('short_id')} ({cd.get('url')})")
    
    # Check the latest deployment
    ld = proj.get("latest_deployment", {})
    print(f"Latest deployment: {ld.get('short_id')} ({ld.get('url')})")
    
    # Try to get function bindings
    fb = api("GET", f"{base}/function-bindings")
    if fb.get("success"):
        print(f"\nFunction bindings: {json.dumps(fb['result'], indent=2)[:500]}")
    else:
        print(f"\nFunction bindings endpoint: {fb.get('errors', fb.get('_err', 'unknown'))}")
    
    # Try to get deployment details
    dep_id = cd.get("id")
    if dep_id:
        dep = api("GET", f"{base}/deployments/{dep_id}")
        if dep.get("success"):
            print(f"\nDeployment bindings: {json.dumps(dep['result'].get('bindings', 'NONE'), indent=2)[:500]}")
        else:
            print(f"\nDeployment detail: {dep.get('errors', dep.get('_err', 'unknown'))}")
else:
    print(f"Error: {r.get('errors')}")
