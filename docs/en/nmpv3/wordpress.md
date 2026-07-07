# WordPress Basic

NMPv3 WordPress support is intentionally basic. It loads one frontend script and renders `<nmp-player>`.

Advanced admin pages, Gutenberg blocks, skin management, and resource packaging belong to NMPv3+.

## Enqueue

```php
wp_enqueue_script(
    'nmpv3',
    plugins_url('assets/nmpv3.min.js', __FILE__),
    array(),
    '3.0.0',
    array(
        'strategy' => 'defer',
        'in_footer' => true,
    )
);
```

## Render a player

```php
echo '<nmp-player playlist-id="14273792576"></nmp-player>';
```

## Shortcodes

```txt
[nmpv3 playlist="14273792576"]
[nmpv3 song="1901371647" theme="dark" layout="mini"]
```

## API proxy

Inject global config before the script runs:

```php
wp_add_inline_script(
    'nmpv3',
    'window.NMPv3Config = { apiBaseUrl: "' . esc_js($api_base_url) . '" };',
    'before'
);
```

The repository contains a Basic example:

```txt
nmpv3/examples/wordpress-basic/netease-mini-player-v3.php
```
