# Contributing

Thanks for helping improve NeteaseMiniPlayer.

## Product Boundaries

NMPv3 and NMPv3+ are separate product lines:

- NMPv3 must stay lightweight, single-JS by default, zero runtime dependency, and limited to NetEase Cloud Music.
- NMPv3+ may include plugins, skins, custom music sources, host-page integration, adapters, and optional third-party dependencies.

NMPv3 should preserve the v2.5 player UI and interaction model while standardizing the implementation as TypeScript/Vite modules.

Do not add NMPv3+ features to NMPv3.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## Pull Requests

Before opening a pull request:

- Keep changes scoped to one product line or one documented cross-cutting concern.
- Update public documentation in `docs/` for user-facing changes.
- Add tests for behavior changes once the test harness is available.

## Documentation Rules

- Use `docs/` for public developer and contributor documentation.
- Keep implementation details that affect users in public docs.
- Keep unpublished planning notes and local automation output out of pull requests.
