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

The checked-in web asset uses the current local upload-key fingerprint so the
signed APK built from this repository can verify the TWA. After publishing on
Google Play, add the Play App Signing fingerprint to the same array as well.

## Play release checklist

- Set the Play target audience to older users (13+); PWAs on Android cannot target children.
- Upload the signed AAB, then use the Play App Signing certificate fingerprint in `assetlinks.json`.
- Keep the signing keystore and alias safe; future updates must use the same signing identity and a higher version code.
- Verify the asset-links URL returns JSON directly, without an HTML fallback or cross-origin redirect.

The manual GitHub Actions workflow uses the encrypted secrets
`ANDROID_KEYSTORE_BASE64`, `BUBBLEWRAP_KEYSTORE_PASSWORD`, and
`BUBBLEWRAP_KEY_PASSWORD` to produce signed APK and AAB artifacts. Keep an
offline backup of the keystore as well.
