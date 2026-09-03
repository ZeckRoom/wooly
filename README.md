# Wooly Launcher

Standalone **Minecraft Java Edition** launcher for Windows 10 and 11. It is not a fork of MultiMC, Prism, or the official launcher.

Wooly is a **Tauri 2** desktop app: a short branded splash, isolated instances, official Microsoft accounts (premium Java only), Mojang version downloads, managed Java, Play, and a live console.

## v1

- Tauri 2 + WebView2, React, TypeScript, [Tailwind CSS](https://tailwindcss.com), [Base UI](https://base-ui.com)
- Visual language: void black, emerald Play, version chips, Geist, one surface at a time
- English UI (Spanish and Polish later)
- Microsoft / Xbox / Minecraft login, multiple accounts, encrypted persistent sessions
- Isolated instances in **Vanilla** and **Modded** groups (loaders and mods come later)
- Releases and snapshots from Mojang metadata
- Shared libraries/assets cache, per-instance game folder
- Automatic Mojang Java runtime
- Play + install progress + console logs
- In-app updates from GitHub Releases (the repository must be **public**)

## Run on Windows

There is no store listing yet.

### Fastest: installer

1. Make [ZeckRoom/wooly](https://github.com/ZeckRoom/wooly) public so Releases are readable without a GitHub login.
2. Download `wooly-launcher-0.1.N-setup.exe` from [Releases](https://github.com/ZeckRoom/wooly/releases) or Actions → **Windows installer** → **wooly-launcher-windows**.
3. SmartScreen may warn because the build is unsigned; choose More info → Run anyway.
4. The first Tauri build does not replace an old Electron install automatically. Run the new setup once.

WebView2 is already on Windows 10/11. The installer can bootstrap it if needed.

### From source (development)

1. [Node.js 22 LTS](https://nodejs.org/)
2. [Rust](https://rustup.rs/) (stable) and the MSVC C++ build tools
3. Git

```powershell
git clone https://github.com/ZeckRoom/wooly.git
cd wooly
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` runs the Tauri shell. After the first install you can double-click `Wooly.bat`.

Chrome-only UI (no Microsoft login / Play):

```powershell
pnpm dev:web
```

Then open **http://127.0.0.1:5173/**

Windows installer from this machine:

```powershell
pnpm build:win
```

## Develop

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm exec cargo test --manifest-path src-tauri/Cargo.toml
pnpm dev:web
pnpm dev
```

## Microsoft login

Wooly already includes its Azure public-client app. Open **Accounts → Add Microsoft account**.

In Azure, register a **Mobile and desktop** redirect of `http://localhost` (any port). `http://127.0.0.1` without a port is not enough. Allow public client flows.

If the browser page errors, Wooly falls back to a device code.

Only premium Minecraft Java accounts work. A fork can override the ID with `WOOLY_MS_CLIENT_ID`.

## Data on Windows

`%APPDATA%\wooly-launcher\` (same folder as the previous Electron builds)

- `instances\<id>\game` — isolated world/options folder
- `meta` — shared versions, libraries, assets, Java runtimes
- `accounts.json` — public profiles; tokens encrypted with Windows DPAPI (`enc:`) or `plain:` on other OS

If you signed in with the Electron app, sign in once more. Chromium `safeStorage` blobs are not the same as Tauri DPAPI.

## Layout

- `src-tauri` — window, commands, auth, install, launch (Rust)
- `src/renderer` — splash, library, settings (React + Tailwind + Base UI)
- `src/shared` — types and pure helpers (tested)
