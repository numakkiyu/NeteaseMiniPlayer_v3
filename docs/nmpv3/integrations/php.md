# PHP / WordPress Basic

PHP 场景下，NMPv3 通过服务器端渲染输出 HTML 标签，并在页面中注入浏览器脚本和全局配置。WordPress Basic 插件是该模式的具体实现。

## 前置环境依赖检查

- PHP 7.4 或更高版本（与示例插件声明一致）
- WordPress 6.0+ 或具备相同钩子的 CMS 环境
- 可访问的网易云 API 代理地址
- 已将 `nmpv3.min.js` 放入项目静态目录或插件 `assets/` 目录

## NMPv3 包安装与配置流程

### 独立 PHP 项目

将构建产物放入 `public/static/` 或 `assets/` 目录：

```html
<script src="/static/nmpv3.min.js" defer></script>
```

在页面头部注入全局配置：

```php
<?php
$api_base_url = 'https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php';
?>
<script>
  window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {
    apiBaseUrl: <?php echo json_encode($api_base_url); ?>
  });
</script>
```

### WordPress Basic 插件结构

```
wp-content/plugins/netease-mini-player-v3/
├── netease-mini-player-v3.php
└── assets/
    └── nmpv3.min.js
```

使用 `wp_enqueue_script` 注册脚本，并配合 `wp_add_inline_script` 注入 `window.NMPv3Config`：

```php
wp_enqueue_script(
    'nmpv3',
    plugins_url('assets/nmpv3.min.js', __FILE__),
    array(),
    '3.0.0-alpha.1',
    array(
        'strategy' => 'defer',
        'in_footer' => true,
    )
);

wp_add_inline_script(
    'nmpv3',
    'window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {"apiBaseUrl":' . wp_json_encode($api_base_url) . '});',
    'before'
);
```

## 核心功能接入代码示例

### 短代码

WordPress Basic 提供 `[nmpv3]` 短代码，属性包括：

- `song` — 单曲 ID
- `playlist` — 歌单 ID
- `theme` — 默认 `auto`，可选 `light`/`dark`
- `layout` — 默认 `compact`，可选 `mini`/`dock`
- `position` — 默认 `static`
- `lyric` — 默认 `true`
- `autoplay` — 默认 `false`
- `api_base_url` — 自定义 API 代理地址

```php
// 文章内容
[nmpv3 playlist="14273792576" theme="auto" layout="compact"]
```

### 渲染函数

```php
function nmpv3_render_player($args = array()): string
{
    $args = wp_parse_args(
        $args,
        array(
            'song' => '',
            'playlist' => '',
            'theme' => 'auto',
            'layout' => 'compact',
            'position' => 'static',
            'lyric' => 'true',
            'autoplay' => 'false',
            'api_base_url' => nmpv3_basic_default_api_base_url(),
        )
    );

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
    $attrs[] = 'lyric="' . esc_attr($args['lyric']) . '"';
    $attrs[] = 'autoplay="' . esc_attr($args['autoplay']) . '"';

    if (!empty($args['api_base_url'])) {
        $attrs[] = 'api-base-url="' . esc_url($args['api_base_url']) . '"';
    }

    return '<nmp-player ' . implode(' ', $attrs) . '></nmp-player>';
}
```

### 短代码注册

```php
add_shortcode('nmpv3', 'nmpv3_basic_shortcode');

function nmpv3_basic_shortcode($atts = array()): string
{
    return nmpv3_render_player(
        shortcode_atts(
            array(
                'song' => '',
                'playlist' => '',
                'theme' => 'auto',
                'layout' => 'compact',
                'position' => 'static',
                'lyric' => 'true',
                'autoplay' => 'false',
                'api_base_url' => nmpv3_basic_default_api_base_url(),
            ),
            $atts,
            'nmpv3'
        )
    );
}
```

## 常见问题排障指南

### 短代码输出为纯文本

- 确认插件已激活
- 检查短代码属性分隔符是否使用了英文逗号
- 确认 WordPress 的 `the_content` 过滤器已执行

### 播放器样式丢失

- 浏览器包已内联样式，无需额外 CSS 文件
- 检查 `nmpv3.min.js` 是否正确加载，浏览器控制台是否有 404

### API 地址未生效

- `api-base-url` 属性优先级高于 `window.NMPv3Config.apiBaseUrl`
- 检查 PHP 端注入的配置 JSON 是否被转义或包含多余字符

### 页面中多次注册播放器

每个短代码会生成一个独立 `<nmp-player>` 实例，这是被支持的多实例场景。若需要全局暂停，可调用 `window.NMPv3.pauseAll()`。

## 进阶扩展开发方案

### 自定义过滤器

WordPress 示例提供了 `nmpv3_basic_default_api_base_url` 过滤器，允许主题覆盖默认 API 地址：

```php
add_filter('nmpv3_basic_default_api_base_url', function () {
    return 'https://example.com/api/netease';
});
```

### 高级主题自定义

NMPv3 仅支持 `theme` 和 `layout` 配置。需要更深度 UI 自定义时，应迁移到 NMPv3+ 的皮肤系统或插件系统。

### 自定义字段集成

在文章编辑界面添加自定义字段，存储 `song_id` 或 `playlist_id`，然后在模板中调用 `nmpv3_render_player()`：

```php
$song_id = get_post_meta(get_the_ID(), 'nmpv3_song', true);
if (!empty($song_id)) {
    echo nmpv3_render_player(array('song' => $song_id));
}
```

### 多站点配置

通过 `wp_enqueue_scripts` 钩子在所有前台页面加载脚本，短代码按需渲染播放器标签，避免未使用页面加载冗余脚本。
