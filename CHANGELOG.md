# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- No unreleased changes

## 3.0.1 - 2026-07-11

- Made direct ESM imports safe in Node, Astro, Next.js, and other SSR build environments
- Added race protection for rapid song and playlist source changes
- Added resilient and throttled localStorage persistence
- Continued playback with the next track after audio errors
- Routed Media Session actions to the active player without stale multi-instance handlers
- Added public control methods to the `<nmp-player>` element and removed Plus private-state bridging
- Prevented CrossTab play and pause commands from rebroadcasting indefinitely
- Bound React adapter callbacks to real NMPv3 custom events
- Fixed pointer cancellation, pointer capture cleanup, touch dragging, and mobile viewport snapping
- Added regression coverage and responsive Playwright drag smoke tests

## 3.0.0-alpha.1 - 2026-07-07

- Created the v2.5-to-v3 engineering standardization repository scaffold.
- Added root-level `nmpv3/` and `nmpv3-plus/` product directories.
- Reduced public GitHub documentation to the core repository and product guides.
- Documented npm and pnpm package install usage.
- Added Apache-2.0 licensing, NMPv3 runtime implementation, browser examples, and WordPress Basic example.
- Clarified that NMPv3 preserves the v2.5 UI and interaction model while moving the implementation to TypeScript/Vite modules.
