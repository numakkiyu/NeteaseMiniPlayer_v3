# Source Editing

NMPv3+ source changes should follow the framework boundaries. Do not move advanced features into NMPv3.

## Commands

```bash
pnpm install
pnpm --filter @netease-mini-player/v3 build
pnpm --filter @netease-mini-player/v3-plus typecheck
pnpm --filter @netease-mini-player/v3-plus test
pnpm --filter @netease-mini-player/v3-plus build
```

For UI, browser bootstrap, layouts, skins, sources, or host sync:

```bash
pnpm --filter @netease-mini-player/v3-plus ui:smoke
```

## Important paths

| Target              | Path                                    |
| ------------------- | --------------------------------------- |
| App entry           | `nmpv3-plus/packages/core/src/app/`     |
| Runtime             | `nmpv3-plus/packages/core/src/runtime/` |
| Plugins             | `nmpv3-plus/packages/core/src/plugin/`  |
| Skins               | `nmpv3-plus/packages/core/src/skin/`    |
| Sources             | `nmpv3-plus/packages/core/src/source/`  |
| Lyrics              | `nmpv3-plus/packages/core/src/lyric/`   |
| HostBridge          | `nmpv3-plus/packages/core/src/bridge/`  |
| Adapters            | `nmpv3-plus/packages/adapters/src/`     |
| CLI                 | `nmpv3-plus/packages/cli/src/`          |
| WordPress           | `nmpv3-plus/packages/wordpress/src/`    |
| PHP helper          | `nmpv3-plus/packages/php/`              |
| Official extensions | `nmpv3-plus/extensions/official/`       |
| Official skins      | `nmpv3-plus/skins/official/`            |

## Adding an official plugin

1. Create `nmpv3-plus/extensions/official/<name>/`
2. Add `manifest.json`
3. Add `index.ts`
4. Add CSS and style text when needed
5. Export it from the official extension entry
6. Add tests for manifest, install, dependencies, and cleanup
7. Update public docs

Plugins must clean up their own events, timers, styles, and DOM side effects.

## Adapter changes

When adding adapter fields, update:

1. `nmpv3-plus/packages/adapters/src/elementProps.ts`
2. Framework entries
3. Type declarations
4. Adapter tests
5. Documentation examples

Adapters should output custom-element attributes and should not add framework runtimes as hard package dependencies.
