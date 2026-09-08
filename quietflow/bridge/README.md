# QuietFlow Camera Bridge

Small local server that turns your RTSP security cameras into HLS streams the
app can play. The web app (and Android WebView / Electron) cannot open raw RTSP
sockets, so this bridge does the heavy lifting with ffmpeg and serves each
camera as an HTTP HLS playlist.

## Run it

```bash
node bridge/bridge-server.cjs
# → QuietFlow camera bridge listening on http://127.0.0.1:8790
```

Requires **ffmpeg on PATH** (Windows: `winget install Gyan.FFmpeg`).

Note: the LAN *security* bridge (`scripts/serve.js`, the admin/admin camera
scanner) already owns port 8788, so this RTSP camera bridge uses **8790**.

## How the app uses it

1. In **My Cameras**, add a camera (host, user, password, port, brand).
2. The app POSTs `{ id, name, rtspUrl, brand }` to `http://127.0.0.1:8790/register`.
   The `rtsp://user:pass@host/...` URL is sent in that one request and kept
   **in memory only** — it is never written to disk, and restarting the bridge
   forgets every camera.
3. The bridge spawns ffmpeg to transcode the stream and exposes:
   `http://127.0.0.1:8790/hls/<id>/index.m3u8`
4. The camera card plays that HLS URL in the app.

## Endpoints

| Method | Path                      | Purpose                                   |
|--------|---------------------------|-------------------------------------------|
| POST   | `/register`               | Register a camera, start transcoding      |
| GET    | `/hls/:id/index.m3u8`     | HLS playlist (plays in the app)           |
| GET    | `/hls/:id/segment-*.ts`   | Media segments (fetched by the player)    |
| GET    | `/health`                 | `{ok, cameras, streams}` status           |
| DELETE | `/:id`                    | Stop stream, forget camera                |

## Security

- Binds **only to 127.0.0.1** — never reachable from the LAN or internet.
- Credentials live in memory only; nothing is persisted.
- ffmpeg runs with `-rtsp_transport tcp`, drops audio, and caps output at 720p.
- Max 16 concurrent streams to protect the machine.

## Launching with the desktop app

- `electron/main.js` will start the bridge automatically alongside the desktop
  window (it spawns `bridge/bridge-server.cjs` if the port is free). For the
  Android APK the bridge runs on your machine and the phone must reach
  `127.0.0.1:8790` — use `adb reverse tcp:8790 tcp:8790` when testing on a USB
  device, or run the bridge on the LAN host and set
  `CAMERA_BRIDGE_BASE` in `src/lib/local-camera.ts`.
