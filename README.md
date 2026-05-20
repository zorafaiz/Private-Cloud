# Private Cloud

Monorepo for the personal private cloud (Next.js + Supabase + Cloudflare Workers).

## Requirements

- **Node.js** 18+ (you have v22 — OK)
- **pnpm** 9.x (required — do **not** use `npm install` in the repo root)

## First-time setup (Windows)

### 1. Install pnpm globally

```powershell
npm install -g pnpm@9.1.0
```

Verify:

```powershell
pnpm -v
# should print 9.1.x
```

### 2. Clean up a failed `npm install` (if you ran it)

`npm install` in this repo can corrupt the pnpm-style `node_modules` layout. From the project root:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

Keep `pnpm-lock.yaml` — do not delete it.

### 3. Install dependencies

```powershell
pnpm install
```

### 4. Environment

```powershell
Copy-Item apps\web\.env.local.example apps\web\.env.local
# Edit apps\web\.env.local with your Supabase / R2 / Worker secrets
```

### 5. Run dev / build

```powershell
pnpm dev
# or
pnpm build
```

## Why not `npm install`?

- Root `package.json` declares `"packageManager": "pnpm@9.1.0"`.
- **Turbo** runs tasks via pnpm workspaces; without `pnpm` on PATH you get:  
  `Unable to find package manager binary: cannot find binary path`.
- Workspaces use `workspace:*` protocol (pnpm).

## Optional: Corepack (alternative to global pnpm)

If your Node install includes Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.1.0 --activate
pnpm install
```

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `pnpm dev`     | Start all dev servers    |
| `pnpm build`   | Production build         |
| `pnpm lint`    | Lint all packages        |
| `pnpm type-check` | TypeScript check     |

## Packages

- `apps/web` — Next.js dashboard
- `apps/workers/shortener` — URL shortener (D1)
- `apps/workers/telegraph-proxy` — Telegraph upload proxy
- `packages/shared` — shared types & validators
