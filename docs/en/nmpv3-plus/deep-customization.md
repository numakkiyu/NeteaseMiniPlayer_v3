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

## Delivery checklist

- NMPv3 still builds on its own
- Plus features are not written back into NMPv3
- Plugins clean up events and DOM side effects
- Skin CSS does not leak to the host page
- Local JSON and lyric URLs are reachable
- HostBridge writes only to explicit targets
- Deploy packages preserve runtime, extensions, skins, and manifests
