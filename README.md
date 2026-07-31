# Matrix-IIIT

## Web Push deployment

Set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in Vercel. Generate the VAPID pair with
`npx web-push generate-vapid-keys`, set `PUSH_ENABLED=true`, and optionally set
`PUSH_ALLOWED_ORIGINS` to a comma-separated list of additional application origins.

The live kill switch is the Redis key `push:enabled`: set it to `0` to disable new
subscriptions and delivery immediately, or delete it to fall back to `PUSH_ENABLED`.

Matrix-IIIT is a simple, elegant, and secure web client for Matrix communities, with end-to-end encryption support.

## Development

Use Node.js 24 LTS or a compatible version listed in `.node-version`.

```sh
npm ci
npm start
```

The Vite development server runs on port `8080`. Build the production bundle with:

```sh
npm run build
npm run preview
```

Run validation before merging:

```sh
npm run typecheck
npm run lint
```

## Deployment

The `dev` branch is used for active development and Vercel Preview deployments. Merge to `main` only when a change is ready for production; Vercel serves `main` as the production deployment.

## Self-hosting

The production bundle is written to `dist/` and can be served by any static web server. The default homeservers and featured Matrix communities are configured in [`config.json`](config.json). For reverse-proxy examples, see [`contrib/nginx/matrix-iiit.domain.tld.conf`](contrib/nginx/matrix-iiit.domain.tld.conf) and [`contrib/caddy/caddyfile`](contrib/caddy/caddyfile).

To run the Docker image locally after building it:

```sh
docker build -t matrix-iiit:latest .
docker run -p 8080:80 matrix-iiit:latest
```

The project is licensed under AGPL-3.0; see [`LICENSE`](LICENSE).
