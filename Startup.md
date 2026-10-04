# FOF Local Startup Guide

## Requirements

- Node.js 18+; current Node.js LTS is recommended.
- npm (included with Node.js).
- A modern desktop browser.

## Start locally

From this project directory:

```bash
npm install
npm run dev
```

Open the Vite address printed by the terminal. This project normally uses:

```text
http://localhost:3000
```

No Gemini API key is required for local gameplay.

## Verification

```bash
npm run lint
npm run build
npm run preview
```

## Port 3000 already in use

```bash
npm run dev -- --port 3001
```

Then open:

```text
http://localhost:3001
```

## Google Drive

Google Drive synchronization is optional. Local gameplay and browser-local progress do not depend on Drive. Drive sync requires internet access and Google authorization.

## Replacing this version

Use the `setup_fof_local.sh` script with the next `FOFv*.zip`. Do not copy `node_modules` between versions; run `npm install` for each downloaded version.
