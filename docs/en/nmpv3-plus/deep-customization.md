# Deep Customization

NMPv3+ customization is divided by responsibility. Sources load songs, lyrics adapters load text, skins handle visuals, plugins add behavior, HostBridge syncs the host page, and custom build tooling prepares deployable files.

## Recommended process

1. Make the base NMPv3 player work
2. Choose the music source
3. Choose the lyrics source
4. Choose official or user plugins
5. Choose official or user skins
6. Decide whether the host page needs sync
7. Compose everything through the app entry
8. Run build and smoke tests
9. Package the deploy output

## App composition

```ts
const app = createNMPv3PlusApp()
  .source(createLocalJsonSourceAdapter())
  .lyrics(createStaticLyricsAdapter({}))
  .skin(...officialNMPv3PlusSkins)
  .skin("default")
  .use(createHostSyncPlugin());

const runtime = await app.mount({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
});
```

## Direct runtime use

```ts
const runtime = createNMPv3PlusRuntime({
  root: document.querySelector("nmp-player"),
  player: window.NMPv3?.getPlayers()[0],
});

runtime.registerSource(createLocalJsonSourceAdapter());
runtime.registerLyrics(createStaticLyricsAdapter({}));
runtime.registerSkin(defaultSkin);

await runtime.installPlugin(createHostSyncPlugin());
```

## Feature ownership

| Need                                             | Extension point   |
| ------------------------------------------------ | ----------------- |
| Change colors, radius, background, or typography | Skin              |
| Add a visual layer or behavior                   | Plugin            |
| Load songs from local JSON or business APIs      | SourceAdapter     |
| Load LRC, JSON lyrics, or static text            | LyricsAdapter     |
| Sync player state to the host page               | HostBridge        |
| Produce selected deployment files                | CLI custom build  |
| Map framework props to custom-element attrs      | Framework adapter |

## Developing a plugin

Plugins own behavior. They do not patch NMPv3, and they do not assume the host page has a fixed shape.

### What the context gives you

Beyond the player and store, three channels were added in 3.0.2:

| Channel        | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `ctx.config`   | `get()` a snapshot, `patch()` a change, `subscribe()` to updates |
| `ctx.slot`     | Mount UI into `toolbar`, `overlay`, `panel` or a custom position |
| `ctx.command`  | Register commands other code can call by id                      |
| `ctx.shortcut` | Bind key combinations; editable fields are skipped by default    |

Older plugins that ignore these keep working.

### Config channel

```ts
setup(ctx) {
  // Empty object when the player cannot report config — no need to null-check
  const config = ctx.config.get();

  // Returns false instead of throwing when the player rejects the patch
  await ctx.config.patch({ palette: "jade", paletteFollowHost: false });

  const stop = ctx.config.subscribe((next, previous) => {
    ctx.logger.info("palette", previous.palette, "→", next.palette);
  });

  return () => stop();
}
```

Light/dark resolution is fixed: an explicit `theme` wins, then the sampled host background,
then the system preference. `paletteFollowHost` only affects hue and never changes that order.

### Slots

`ctx.slot.register(name, renderer)` mounts DOM into the player. Three positions are built in:

| Slot      | Position                                    |
| --------- | ------------------------------------------- |
| `toolbar` | Before the bottom tool row                  |
| `overlay` | Above the whole player                      |
| `panel`   | Below the bottom row, for expandable panels |

Any other name appends to the player root. Multiple renderers can share a slot; `order`
decides which comes first.

```ts
setup(ctx) {
  return ctx.slot.register("toolbar", ({ container, onCleanup }) => {
    const button = document.createElement("button");
    button.textContent = "Palette";
    button.addEventListener("click", () => {
      void ctx.config.patch({ palette: "iris" });
    });

    container.append(button);
    onCleanup(() => button.remove());
  });
}
```

Slots only position content — styling belongs to the plugin, so official skins and third-party
plugins never fight over the same rules. A renderer that throws only marks its own node.

### Commands and shortcuts

Commands give the host page and other plugins one callable entry point without importing each other:

```ts
setup(ctx) {
  const disposeCommand = ctx.command.register({
    id: "myplugin.setPalette",
    title: "Set palette",
    handler: (palette) => ctx.config.patch({ palette: String(palette) }),
  });

  const disposeShortcut = ctx.shortcut.register({
    keys: "ctrl+shift+p",
    handler: () => void ctx.command.execute("myplugin.setPalette", "jade"),
  });

  return () => {
    disposeCommand();
    disposeShortcut();
  };
}
```

Registering a duplicate command id throws, and executing an unknown command throws too.
Use `executeSafe` when you want failures logged instead. Shortcuts skip input fields by
default; pass `allowInEditable: true` if the binding really belongs there.

### Lifecycle

The function returned by `setup` runs on uninstall. Clean up event listeners, timers and any
DOM you attached outside the player.

`setup` has a 5-second timeout by default (`pluginTimeout`) so one hung plugin cannot block
startup. Dependencies are installed in order, and cycles or version mismatches fail fast:

```ts
export default {
  name: "my-plugin",
  version: "1.0.0",
  dependencies: { "official-toolbar-actions": "^3.0.0" },
  setup(ctx) {
    /* ... */
  },
};
```

To scope a plugin to a contract version, use `isApiVersionCompatible`.

The template at `nmpv3-plus/templates/minimal-plugin` is a copy-and-rename starting point.
For a plugin that uses all four channels, see `extensions/official/toolbar-actions`.

## Delivery checklist

- NMPv3 still builds on its own
- Plus features are not written back into NMPv3
- Plugins clean up events and DOM side effects
- Skin CSS does not leak to the host page
- Local JSON and lyric URLs are reachable
- HostBridge writes only to explicit targets
- Deploy packages preserve runtime, extensions, skins, and manifests
