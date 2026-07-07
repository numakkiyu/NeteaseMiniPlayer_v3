# 音乐源与歌词

NMPv3+ 负责自定义音乐源和自定义歌词。NMPv3 轻量版只保留网易云音乐。

## 支持的来源类型

NMPv3+ 已覆盖这些来源类型：

- `netease`
- `local-json`
- `static-playlist`
- `manual`
- custom API helper

## local-json

播放器 HTML：

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyric="true"
></nmp-player>
```

JSON 文件：

```json
{
  "songs": [
    {
      "id": "local-001",
      "name": "Local Song",
      "artists": "Artist",
      "album": "Album",
      "picUrl": "/music/cover.jpg",
      "url": "/music/song.mp3",
      "lyricUrl": "/music/song.lrc",
      "translationLyricUrl": "/music/song.zh.lrc"
    }
  ]
}
```

注册 adapter：

```ts
runtime.registerSource(createLocalJsonSourceAdapter());

await runtime.loadPlaylist({
  source: "local-json",
  url: "/music/playlist.json",
});
```

## static-playlist

静态列表适合构建时已经知道歌曲地址的站点：

```ts
runtime.registerSource(
  createStaticPlaylistSourceAdapter({
    songs: [
      {
        id: "local-001",
        name: "Local Song",
        artists: "Artist",
        url: "/music/song.mp3",
      },
    ],
  }),
);
```

## manual

manual 适合完全由业务代码控制加载：

```ts
runtime.registerSource(createManualSourceAdapter());
```

业务逻辑中可以手动传入歌曲和歌词数据。

## 自定义 API 来源

自定义来源应把业务 API 返回值转换成播放器能理解的歌单：

```ts
const customSource = {
  name: "studio-api",
  async getPlaylist(id) {
    const response = await fetch(`/api/music/playlists/${id}`);
    const data = await response.json();

    return {
      id,
      name: data.name,
      songs: data.tracks.map((track) => ({
        id: track.id,
        name: track.title,
        artists: track.artistName,
        album: track.albumName,
        picUrl: track.coverUrl,
        url: track.audioUrl,
        duration: track.duration,
      })),
    };
  },
};

runtime.registerSource(customSource);
```

## 静态歌词

静态歌词可以是 LRC 字符串：

```ts
runtime.registerLyrics(
  createStaticLyricsAdapter({
    "local-001": "[00:01.00]Original line\n[00:05.00]Second line",
  }),
);
```

也可以带翻译：

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

## 歌词 URL

HTML 可以传入歌词文件：

```html
<nmp-player
  source-type="local-json"
  source="/music/playlist.json"
  lyrics-url="/lyrics/song.lrc"
  translation-lyrics-url="/lyrics/song.zh.lrc"
  lyric="true"
></nmp-player>
```

当 local JSON 歌曲包含 `lyricUrl` 和 `translationLyricUrl` 时，浏览器和 WordPress bootstrap 会在加载歌单后读取并合并歌词。

## PWA 缓存

`pwa-cache` 是可选插件。只有显式安装后才使用浏览器 Cache API：

```ts
await runtime.installPlugin(createPwaCachePlugin());
```

它不进入 NMPv3 默认运行时。

## 来源开发检查

实现自定义来源后检查：

- `id`、`name`、`url` 是稳定字段
- 封面 URL 可以被浏览器访问
- 歌词 URL 和翻译歌词 URL 支持跨域策略
- 出错时返回清晰错误，不要让播放器卡在 loading
- 不要在 source adapter 中直接操作 DOM
