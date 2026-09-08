# Release Instructions

## Required Environment Variables:
```bash
export KEYSTORE_PASSWORD='your_password'
export KEY_ALIAS='your_alias'
export KEY_PASSWORD='your_key_password'
```

## Build Command:
```bash
./gradlew assembleRelease
```

## Signing:
APKs will auto-sign using the credentials above during build.