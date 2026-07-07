# Choose a Version

NeteaseMiniPlayer v3 maintains two product lines in the same open-source repository. NMPv3 handles lightweight embedding. NMPv3+ handles advanced extension scenarios.

## Recommendation

| Scenario                                                           | Version | Notes                                           |
| ------------------------------------------------------------------ | ------- | ----------------------------------------------- |
| Embed a NetEase player in a public page, blog, CMS, or static site | NMPv3   | One JavaScript file is enough                   |
| Render the base player in React, Vue3, Nuxt, Astro, or Svelte      | NMPv3   | Use the native `<nmp-player>` element           |
| Use local JSON, lyric files, plugins, skins, or host sync          | NMPv3+  | These features belong to the advanced framework |
| Add a basic WordPress shortcode                                    | NMPv3   | Frontend only loads `nmpv3.min.js`              |
| Build a WordPress admin, Gutenberg block, or resource package      | NMPv3+  | This is advanced integration                    |

## NMPv3 boundary

NMPv3 is designed to stay embeddable, publishable, and easy to migrate:

- Browser usage only needs `nmpv3.min.js`
- No required CSS file
- No runtime dependency on React, Vue, Lit, or jQuery
- NetEase Cloud Music and compatible API proxies only
- v2.5-style base UI, shortcodes, and legacy DOM migration

NMPv3 supports attributes, global config, and CSS variables. It does not include plugins, full skin packages, custom music sources, or HostBridge.

## NMPv3+ boundary

NMPv3+ is for integrations that need extension points:

- Plugins
- Skins
- Custom music sources
- Custom lyrics
- Host page integration
- Framework adapters
- Advanced WordPress and PHP integration
- CLI custom builds

NMPv3+ starts from the base NMPv3 player surface. Its value is a clear extension framework, not a heavier default UI.
