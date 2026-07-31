# Matrix-IIIT

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
