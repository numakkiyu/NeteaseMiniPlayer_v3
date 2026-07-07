# Sources and Lyrics

NMPv3+ owns custom sources and custom lyrics. NMPv3 only supports NetEase Cloud Music.

## Source types

- `netease`
- `local-json`
- `static-playlist`
- `manual`
- custom API helper

## local-json

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyric="true"
></nmp-player>
```

```json
{
  "songs": [
    {
      "id": "local-001",
      "name": "Local Song",
      "artists": "Artist",
      "picUrl": "/music/cover.jpg",
      "url": "/music/song.mp3",
      "lyricUrl": "/music/song.lrc",
      "translationLyricUrl": "/music/song.zh.lrc"
    }
  ]
}
```

```ts
runtime.registerSource(createLocalJsonSourceAdapter());

await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

## Static lyrics

```ts
runtime.registerLyrics(
  createStaticLyricsAdapter({
    "local-001": "[00:01.00]Original line\n[00:05.00]Second line",
  }),
);
```

With translation:

```ts
runtime.registerLyrics(
  createStaticLyricsAdapter({
    "local-001": {
      lyric: "[00:01.00]Original line",
      translation: "[00:01.00]Translated line",
    },
  }),
);
```

## Lyric URLs

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyrics-url="/lyrics/song.lrc"
  translation-lyrics-url="/lyrics/song.zh.lrc"
  lyric="true"
></nmp-player>
```

## Source checklist

- Stable `id`, `name`, and `url`
- Reachable cover and lyric URLs
- Clear error handling
- No direct DOM mutation inside source adapters
