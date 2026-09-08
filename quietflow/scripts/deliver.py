#!/usr/bin/env python3
"""Zero-dependency deliver script for Netrunnerrbot — hardened."""
import os, sys, re, json, argparse, mimetypes
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

TOKEN = ""
env_path = os.path.join(os.path.expanduser("~"), ".hermes", ".env")
if os.path.isfile(env_path):
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^\s*TELEGRAM_BOT_TOKEN\s*=\s*(\S+)", line)
            if m:
                TOKEN = m.group(1).strip().strip('"').strip("'")
                break
if not TOKEN:
    sys.exit("ERROR: no TELEGRAM_BOT_TOKEN in ~/.hermes/.env")

CHAT_ID = "5688111406"
API = f"https://api.telegram.org/bot{TOKEN}"
TIMEOUT = 25

def api_call(method, data=None, multipart=None, content_type=None):
    url = f"{API}/{method}"
    try:
        if multipart:
            req = Request(url, data=multipart, headers={"Content-Type": content_type or "application/octet-stream"})
        elif data:
            req = Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
        else:
            req = Request(url)
        resp = urlopen(req, timeout=TIMEOUT)
        return json.loads(resp.read())
    except HTTPError as e:
        body = e.read().decode(errors="replace")
        return {"ok": False, "error": f"HTTP {e.code}", "body": body[:500]}
    except URLError as e:
        return {"ok": False, "error": f"Connection: {e.reason}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def verify_bot():
    result = api_call("getMe")
    if not result.get("ok"):
        sys.exit(f"ERROR: bot verify failed: {result.get('error', result)}")
    info = result.get("result", {})
    print(f"Bot OK: @{info.get('username','?')} ({info.get('first_name','?')})")
    return info

def send_text(text):
    if len(text) > 4000:
        chunks = [text[i:i+3800] for i in range(0, len(text), 3800)]
        for i, c in enumerate(chunks):
            r = api_call("sendMessage", {"chat_id": CHAT_ID, "text": c})
            if r.get("ok"):
                print(f"  chunk {i+1}/{len(chunks)} id={r['result']['message_id']}")
            else:
                print(f"  chunk {i+1} ERROR: {r.get('error', r)}")
                return False
        return True
    result = api_call("sendMessage", {"chat_id": CHAT_ID, "text": text})
    if result.get("ok"):
        print(f"MSG DELIVERED: id={result['result']['message_id']}")
        return True
    print(f"ERROR: {result.get('error', result)}")
    return False

def send_file(path, caption=""):
    p = os.path.abspath(path)
    if not os.path.isfile(p): print(f"ERROR: file not found: {p}"); return False
    sz = os.path.getsize(p)
    if sz == 0: print(f"ERROR: file empty: {p}"); return False
    if sz > 50_000_000: print(f"ERROR: file >50MB: {sz}"); return False
    mime, _ = mimetypes.guess_type(p)
    if not mime:
        mime = {'.apk': 'application/vnd.android.package-archive','.zip':'application/zip',
                '.txt':'text/plain','.png':'image/png','.jpg':'image/jpeg'}.get(os.path.splitext(p)[1].lower(),'application/octet-stream')
    boundary = "----D7x8x2A9z"
    fname = os.path.basename(p)
    parts = [f"--{boundary}\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n{CHAT_ID}\r\n".encode()]
    if caption:
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n{caption}\r\n".encode())
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"document\"; filename=\"{fname}\"\r\nContent-Type: {mime}\r\n\r\n".encode())
    with open(p, "rb") as fh: parts.append(fh.read())
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)
    result = api_call("sendDocument", multipart=body, content_type=f"multipart/form-data; boundary={boundary}")
    if result.get("ok"):
        doc = result.get("result", {}).get("document", {})
        print(f"FILE DELIVERED: {fname} ({sz}B) file_id={doc.get('file_id','N/A')}")
        return True
    print(f"ERROR: {result.get('error', result)}")
    return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--text"); parser.add_argument("--file"); parser.add_argument("--caption", default="")
    args = parser.parse_args()
    verify_bot()
    if args.text: send_text(args.text)
    elif args.file: send_file(args.file, args.caption)
    else: print("Usage: --text 'msg' | --file <path> [--caption '']"); sys.exit(1)
