# Source Editing

NMPv3 can be edited and rebuilt. Keep the lightweight promises intact: one JavaScript file, zero runtime dependencies, and NetEase Cloud Music only.

## Commands

```bash
pnpm install
pnpm --filter @netease-mini-player/v3 typecheck
pnpm --filter @netease-mini-player/v3 test
pnpm --filter @netease-mini-player/v3 build
```

## Important files

| Target                   | File                                  |
| ------------------------ | ------------------------------------- |
| Custom element lifecycle | `nmpv3/src/element/NMPv3Element.ts`   |
| Main player logic        | `nmpv3/src/core/NMPv3Player.ts`       |
| Audio control            | `nmpv3/src/core/AudioController.ts`   |
| NetEase API client       | `nmpv3/src/api/NeteaseApiClient.ts`   |
| DOM rendering            | `nmpv3/src/ui/render.ts`              |
| Icons                    | `nmpv3/src/ui/icons.ts`               |
| Injected CSS             | `nmpv3/src/styles/nmpv3.css.ts`       |
| Default config           | `nmpv3/src/config/defaultConfig.ts`   |
| HTML config parsing      | `nmpv3/src/config/normalizeConfig.ts` |

## Style edits

Edit `nmpv3/src/styles/nmpv3.css.ts`.

Rules:

- Keep the `nmpv3-` class prefix
- Do not require a separate CSS file for normal users
- Keep mobile layout free of horizontal overflow
- Do not add a full skin loader to NMPv3

## Config edits

When adding a config field, update:

1. `nmpv3/src/types.ts`
2. `nmpv3/src/config/defaultConfig.ts`
3. `nmpv3/src/config/normalizeConfig.ts`
4. `nmpv3/src/index.ts`
5. Tests and public docs

Do not turn config fields into hidden plugin or source adapter entry points.

## API edits

Keep the API client focused on:

```txt
/song/detail
/playlist/track/all
/song/url/v1
/lyric
```

Use NMPv3+ for local JSON, local files, or third-party music platforms.
