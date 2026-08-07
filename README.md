# tkkr.dev

Thaddeus Kuah's personal website and short URL service. The site is built with TanStack Start, React, Tailwind CSS, and Base UI, then deployed to Cloudflare Workers with D1 storage.

## Local development

Install dependencies and create a local environment file:

```bash
pnpm install
cp .env.example .env
```

Create the local D1 database schema, then start the development server:

```bash
pnpm db:migrate:local
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000).

## Short URLs

The Short URL command-line tool manages local or remote D1 records:

```bash
pnpm urls --help
pnpm urls:local list
```

Protected URLs require a `SHORT_URL_PEPPER` containing at least 32 bytes. Remote writes use the Cloudflare account and D1 database configured through Wrangler.

## Quality checks

Run the full formatter, TypeScript, ESLint, and production-build check before deploying:

```bash
pnpm validate
```

Individual commands are also available as `pnpm check`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

## Deployment

After configuring Wrangler and the required Worker secrets:

```bash
pnpm deploy
```
