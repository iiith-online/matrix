# IIIT matrix Android wrapper

This is a Trusted Web Activity for the deployed IIIT matrix PWA at
`https://matrix.iiith.online/`.

## Build

Install JDK 17, the Android command-line SDK, and Bubblewrap, then run from
this directory:

```bash
npm install --global @bubblewrap/cli
bubblewrap doctor
bubblewrap build
```

Use `bubblewrap build --skipSigning` only for local smoke builds. Release
builds must use the Play App Signing key or the upload key selected for this
application.

## Digital Asset Links

Publish `assetlinks.json` at
`https://matrix.iiith.online/.well-known/assetlinks.json` with package ID
`online.iiith.matrix` and the SHA-256 fingerprint of the certificate used by
the installed release. For a Play Store release, use the Play App Signing
certificate fingerprint.
