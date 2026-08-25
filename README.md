# Wooly Launcher

Standalone **Minecraft Java Edition** launcher for Windows 10 and 11. It is not a fork of MultiMC, Prism, or the official launcher.

Wooly focuses on a fast desktop shell: a short branded splash, isolated instances, official Microsoft accounts (premium Java only), Mojang version downloads, managed Java, Play, and a live console.

## v1

- Electron desktop app, React, TypeScript, [StyleX](https://stylexjs.com), [shadcn-cssinjs](https://shadcn-cssinjs.com/docs)
- Visual language: Open Design / OA plates and pills, warm wool palette
- English UI (Spanish and Polish later)
- Microsoft / Xbox / Minecraft login, multiple accounts, encrypted persistent sessions
- Isolated instances in **Vanilla** and **Modded** groups (loaders and mods come later)
- Releases and snapshots from Mojang metadata
- Shared libraries/assets cache, per-instance game folder
- Automatic Mojang Java runtime
- Play + install progress + console logs

## Develop

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm dev
```

On Linux (Cloud Agent / CI) Electron may need `--no-sandbox`:

```bash
pnpm exec electron-vite dev -- --no-sandbox
```

Windows installers:

```bash
pnpm build:win
```

## Microsoft login

Wooly talks to official Microsoft, Xbox Live, and Minecraft services. Create an Azure App Registration:

1. Azure Portal → App registrations → New
2. Accounts in any org directory and personal Microsoft accounts
3. Platform: Mobile and desktop / public client
4. Redirect URI: `http://127.0.0.1`
5. Allow public client flows: Yes
6. Copy the Application (client) ID

Paste it in **Settings → Microsoft application ID**, or set `WOOLY_MS_CLIENT_ID` in a local `.env` (see `.env.example`).

Wooly refuses accounts that do not own Minecraft Java Edition.

## Data on Windows

`%APPDATA%\wooly-launcher\`

- `instances\<id>\game` — isolated world/options folder
- `meta` — shared versions, libraries, assets, Java runtimes
- `accounts.json` — public profiles; tokens encrypted with Windows DPAPI via Electron `safeStorage`

## Layout

- `src/main` — window, IPC, auth, install, launch
- `src/renderer` — splash, library, settings (StyleX)
- `src/shared` — types and pure helpers (tested)

Add more shadcn-cssinjs components with:

```bash
npx shadcn@latest add https://shadcn-cssinjs.com/r/button.json
```
