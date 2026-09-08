# Deployment Strategy — QUIETFLOW Platform

**Layer:** Analysis  
**Navigation:** L2 analysis file supporting 00-index.md

---

## Supported Platforms

| Platform | Build Target | Status |
|----------|--------------|--------|
| Web | Next.js static export | ✅ Production |
| Android | Capacitor APK | ✅ Production |
| Windows | Electron .exe | ✅ Production |

---

## Web Deployment (Cloudflare Pages)

### Build Process

```bash
# Build static assets
npm run build

# Output: .next/server and .next/static
# Deploy via:
npx @cloudflare/cli deploy
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: @cloudflare/cli-action@v1
        with:
          command: deploy
          cwd: .
```

### Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `NEXT_PUBLIC_API_BASE` | API endpoint | GitHub Secrets |
| `CF_API_TOKEN` | Deploy token | GitHub Secrets |

---

## Android Deployment

### Build Process

```bash
# Build release APK
cd android
./gradlew clean assembleRelease

# APK location
app/build/outputs/apk/quietflow/release/app-quietflow-release.apk
```

### Delivery Channel

- **Distribution**: GitHub Releases or Telegram bot
- **Automation**: GitHub Actions with upload-artifact
- **Signing**: Keystore in GitHub Secrets

### CI/CD Pipeline

```yaml
name: Build Android APK
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: apk
          path: android/app/build/outputs/apk/**/*.apk
```

---

## Windows Deployment

### Build Process

```bash
# Requires electron-builder or @electron-forge
npm run build:windows
```

### Current Status

- Electron packaging configured via package.json
- Windows build requires wine on Linux CI
- Output: `QuietFlow Setup x.x.x.exe`

---

## Container Requirements (Future)

For local development and future scaling:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html
```

---

## Release Versioning

Follow semantic versioning:

- **PATCH**: Bug fixes (e.g., v2.1.0 → v2.1.1)
- **MINOR**: Features (e.g., v2.1.1 → v2.2.0)
- **MAJOR**: Breaking changes (e.g., v2.2.0 → v3.0.0)

Release tags trigger both APK and web deployments.

---

## Rollback Strategy

1. **Web**: Cloudflare Pages deploy history, instant rollback
2. **Android**: Keep last 3 releases on GitHub
3. **Windows**: Reinstall previous version

---

## Monitoring Post-Deployment

| Metric | Tooling | Threshold |
|--------|---------|-----------|
| Build Success | GitHub Actions | 100% |
| Test Pass Rate | Jest | 95% |
| App Load Time | Lighthouse | < 3s |
| APK Size | Build output | < 10MB |

---

## Promotion Checklist

- [ ] All tests pass
- [ ] Build succeeds (web + mobile)
- [ ] Security audit passes
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] GitHub Release drafted

---

Sources: `platform/dossiers/deployment-status.txt`