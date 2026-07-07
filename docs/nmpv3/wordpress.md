# WordPress Basic

NMPv3 的 WordPress 方向是 Basic。它只负责在前台输出一个轻量播放器，不提供复杂后台、插件市场、皮肤包或本地音乐管理。

高级 WordPress 后台、Gutenberg 区块和资源管理属于 [NMPv3+ WordPress 与 PHP](../nmpv3-plus/wordpress-php)。

## 基本思路

前台只加载一个脚本：

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

页面输出播放器：

```php
echo '<nmp-player playlist-id="14273792576"></nmp-player>';
```

## 短代码

轻量短代码可以设计成：

```txt
[nmpv3 playlist="14273792576"]
[nmpv3 song="1901371647" theme="dark" layout="mini"]
```

渲染 HTML：

```php
function nmpv3_render_player($args = array()) {
    $defaults = array(
        'song' => '',
        'playlist' => '',
        'theme' => 'auto',
        'layout' => 'compact',
        'position' => 'static',
    );

    $args = wp_parse_args($args, $defaults);
    $attrs = array();

    if (!empty($args['song'])) {
        $attrs[] = 'song-id="' . esc_attr($args['song']) . '"';
    }

    if (!empty($args['playlist'])) {
        $attrs[] = 'playlist-id="' . esc_attr($args['playlist']) . '"';
    }

    $attrs[] = 'theme="' . esc_attr($args['theme']) . '"';
    $attrs[] = 'layout="' . esc_attr($args['layout']) . '"';
    $attrs[] = 'position="' . esc_attr($args['position']) . '"';

    return '<nmp-player ' . implode(' ', $attrs) . '></nmp-player>';
}
```

仓库中已有基础示例：

```txt
nmpv3/examples/wordpress-basic/netease-mini-player-v3.php
```

## 设置 API 代理

WordPress 可以在脚本加载前注入全局配置：

```php
wp_add_inline_script(
    'nmpv3',
    'window.NMPv3Config = { apiBaseUrl: "' . esc_js($api_base_url) . '" };',
    'before'
);
```

示例插件提供过滤器：

```php
add_filter('nmpv3_basic_default_api_base_url', function () {
    return 'https://example.com/NeteaseMiniPlayer/nmp.php';
});
```

## Basic 版边界

WordPress Basic 可以做：

- 加载 `nmpv3.min.js`
- 输出 `<nmp-player>`
- 提供 `[nmpv3]` 短代码
- 设置默认 API 代理
- 允许主题模板调用渲染函数

WordPress Basic 不做：

- 后台插件开关
- 皮肤包管理
- 本地音乐库管理
- Gutenberg 高级区块
- HostBridge 页面联动配置
- 多文件 Plus 部署包管理
