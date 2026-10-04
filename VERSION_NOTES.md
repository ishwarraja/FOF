# FOF Local Version Notes

This folder was prepared for local desktop execution.

## Changes applied automatically

- Removed the unused `@google/genai` dependency from `package.json`.
- Removed Gemini capability metadata when present.
- Replaced `.env.example` so local startup does not request `GEMINI_API_KEY`.
- Removed the stale `bun.lock` because this workflow uses npm and npm will generate its own lock file.
- Added `Startup.md`.
- The script checks source files before removing Gemini configuration. If real Gemini source usage is detected, it stops instead of breaking the application.

## Local gameplay

The project remains a Vite/React application. Browser-local storage is used by the application for local state. Google Drive features remain optional.

## Standard commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```
