<?php
/**
 * Plugin Name: NeteaseMiniPlayer v3 Plus
 * Description: Advanced NMPv3+ integration with settings, skins, extensions, Gutenberg block, custom sources, custom lyrics, and host-page sync.
 * Version: 3.0.0-alpha.1
 * Author: NeteaseMiniPlayer
 * License: Apache-2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

final class NMPv3Plus_WordPress_Plugin
{
    public const VERSION = '3.0.0-alpha.1';
    public const OPTION = 'nmpv3plus_settings';
    public const PAGE_SLUG = 'nmpv3plus';
    public const SHORTCODE = 'nmpv3plus';
    public const BLOCK_NAME = 'netease-mini-player/nmpv3-plus';
    public const DEFAULT_API_BASE_URL = 'https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php';

    private const EXTENSIONS = array(
        'advanced-layouts' => 'Advanced layouts',
        'visualizer' => 'Visualizer',
        'host-sync' => 'Host sync',
        'cover-color' => 'Cover color',
        'cross-tab-sync' => 'Cross-tab sync',
        'media-session' => 'Media Session',
        'custom-source' => 'Custom source',
        'local-lyrics' => 'Local lyrics',
        'pwa-cache' => 'PWA cache',
    );

    private const SKINS = array(
        'default' => 'Default',
        'glass' => 'Glass',
        'minimal' => 'Minimal',
        'anime' => 'Anime',
        'cyber' => 'Cyber',
        'vinyl' => 'Vinyl',
    );

    public static function init(): void
    {
        add_action('init', array(__CLASS__, 'register_block'));
        add_action('admin_menu', array(__CLASS__, 'register_settings_page'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_frontend_assets'));
        add_action('enqueue_block_editor_assets', array(__CLASS__, 'enqueue_block_editor_assets'));
        add_shortcode(self::SHORTCODE, array(__CLASS__, 'render_shortcode'));
    }

    public static function defaults(): array
    {
        return array(
            'apiBaseUrl' => self::DEFAULT_API_BASE_URL,
            'defaultSkin' => 'default',
            'enabledExtensions' => array(),
            'enabledSkins' => array('default'),
            'localMusicJsonUrl' => '',
            'customLyricsUrl' => '',
            'customTranslationLyricsUrl' => '',
            'hostSyncEnabled' => false,
            'pageLinkingEnabled' => false,
        );
    }

    public static function get_settings(): array
    {
        $settings = get_option(self::OPTION, array());

        if (!is_array($settings)) {
            $settings = array();
        }

        return array_merge(self::defaults(), self::sanitize_settings($settings));
    }

    public static function register_settings_page(): void
    {
        add_options_page(
            'NMPv3+',
            'NMPv3+',
            'manage_options',
            self::PAGE_SLUG,
            array(__CLASS__, 'render_settings_page')
        );
    }

    public static function register_settings(): void
    {
        register_setting(
            'nmpv3plus',
            self::OPTION,
            array(
                'type' => 'array',
                'sanitize_callback' => array(__CLASS__, 'sanitize_settings'),
                'default' => self::defaults(),
            )
        );

        add_settings_section(
            'nmpv3plus_main',
            'NMPv3+ Advanced Settings',
            '__return_false',
            self::PAGE_SLUG
        );

        self::add_field('apiBaseUrl', 'Custom API', 'render_url_field');
        self::add_field('defaultSkin', 'Default skin', 'render_skin_select');
        self::add_field('enabledSkins', 'Skin selection', 'render_skin_checkboxes');
        self::add_field('enabledExtensions', 'Plugin switches', 'render_extension_checkboxes');
        self::add_field('localMusicJsonUrl', 'Local music JSON', 'render_url_field');
        self::add_field('customLyricsUrl', 'Custom lyrics', 'render_url_field');
        self::add_field('customTranslationLyricsUrl', 'Custom translation lyrics', 'render_url_field');
        self::add_field('hostSyncEnabled', 'Host page sync', 'render_toggle_field');
        self::add_field('pageLinkingEnabled', 'Page linking', 'render_toggle_field');
    }

    public static function render_settings_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        echo '<div class="wrap">';
        echo '<h1>NMPv3+ Advanced</h1>';
        echo '<form method="post" action="options.php">';
        settings_fields('nmpv3plus');
        do_settings_sections(self::PAGE_SLUG);
        submit_button();
        echo '</form>';
        echo '</div>';
    }

    public static function register_block(): void
    {
        if (function_exists('register_block_type')) {
            register_block_type(
                __DIR__,
                array(
                    'render_callback' => array(__CLASS__, 'render_block'),
                )
            );
        }
    }

    public static function enqueue_frontend_assets(): void
    {
        $settings = self::get_settings();
        $asset_base = plugin_dir_url(__FILE__) . 'assets/';

        wp_enqueue_script(
            'nmpv3',
            $asset_base . 'nmpv3.min.js',
            array(),
            self::VERSION,
            true
        );

        if (!empty($settings['apiBaseUrl'])) {
            wp_add_inline_script(
                'nmpv3',
                'window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {"apiBaseUrl":' . wp_json_encode($settings['apiBaseUrl']) . '});',
                'before'
            );
        }

        wp_enqueue_script(
            'nmpv3-plus-runtime',
            $asset_base . 'nmpv3-plus.wordpress.js',
            array('nmpv3'),
            self::VERSION,
            true
        );
        wp_script_add_data('nmpv3-plus-runtime', 'type', 'module');

        wp_add_inline_script(
            'nmpv3-plus-runtime',
            'window.NMPv3PlusWordPress = ' . wp_json_encode(self::runtime_config($settings, $asset_base)) . ';',
            'before'
        );

    }

    public static function enqueue_block_editor_assets(): void
    {
        $settings = self::get_settings();
        $asset_base = plugin_dir_url(__FILE__) . 'assets/';

        wp_enqueue_script(
            'nmpv3',
            $asset_base . 'nmpv3.min.js',
            array(),
            self::VERSION,
            true
        );

        if (!empty($settings['apiBaseUrl'])) {
            wp_add_inline_script(
                'nmpv3',
                'window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {"apiBaseUrl":' . wp_json_encode($settings['apiBaseUrl']) . '});',
                'before'
            );
        }

        wp_enqueue_script(
            'nmpv3-plus-runtime',
            $asset_base . 'nmpv3-plus.wordpress.js',
            array('nmpv3'),
            self::VERSION,
            true
        );
        wp_script_add_data('nmpv3-plus-runtime', 'type', 'module');

        wp_add_inline_script(
            'nmpv3-plus-runtime',
            'window.NMPv3PlusWordPress = ' . wp_json_encode(self::runtime_config($settings, $asset_base)) . ';',
            'before'
        );

        wp_enqueue_script(
            'nmpv3-plus-block-editor',
            $asset_base . 'block-editor.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n'),
            self::VERSION,
            true
        );

        wp_localize_script(
            'nmpv3-plus-block-editor',
            'NMPv3PlusWordPress',
            array(
                'settings' => array_merge(
                    $settings,
                    array(
                        'availableSkins' => self::options_for_js(self::SKINS),
                        'availableExtensions' => self::options_for_js(self::EXTENSIONS),
                    )
                ),
            )
        );
    }

    public static function render_shortcode($atts): string
    {
        $atts = shortcode_atts(
            array(
                'song' => '',
                'playlist' => '',
                'source' => 'netease',
                'skin' => '',
                'lyrics' => '',
                'translation_lyrics' => '',
                'api_base_url' => '',
                'host_sync' => '',
                'page_linking' => '',
                'layout' => '',
            ),
            (array) $atts,
            self::SHORTCODE
        );

        return self::render_player(
            array(
                'songId' => $atts['song'],
                'playlistId' => $atts['playlist'],
                'source' => $atts['source'],
                'localMusicJsonUrl' => $atts['playlist'],
                'skin' => $atts['skin'],
                'customLyricsUrl' => $atts['lyrics'],
                'customTranslationLyricsUrl' => $atts['translation_lyrics'],
                'apiBaseUrl' => $atts['api_base_url'],
                'hostSync' => self::to_bool($atts['host_sync']),
                'pageLinking' => self::to_bool($atts['page_linking']),
                'layout' => $atts['layout'],
            )
        );
    }

    public static function render_block(array $attributes): string
    {
        return self::render_player(
            array(
                'songId' => $attributes['songId'] ?? '',
                'playlistId' => $attributes['playlistId'] ?? '',
                'source' => $attributes['source'] ?? 'netease',
                'localMusicJsonUrl' => $attributes['localMusicJsonUrl'] ?? '',
                'skin' => $attributes['skin'] ?? '',
                'customLyricsUrl' => $attributes['customLyricsUrl'] ?? '',
                'customTranslationLyricsUrl' => $attributes['customTranslationLyricsUrl'] ?? '',
                'hostSync' => isset($attributes['hostSync']) ? (bool) $attributes['hostSync'] : null,
                'pageLinking' => isset($attributes['pageLinking']) ? (bool) $attributes['pageLinking'] : null,
            )
        );
    }

    private static function render_player(array $config): string
    {
        $settings = self::get_settings();
        $source = self::clean_slug($config['source'] ?? 'netease');
        $attrs = array();

        self::set_attr($attrs, 'song-id', $config['songId'] ?? '');

        if ($source !== 'netease') {
            self::set_attr($attrs, 'source-type', $source);
            self::set_attr($attrs, 'source', $config['localMusicJsonUrl'] ?? $settings['localMusicJsonUrl']);
        } else {
            self::set_attr($attrs, 'playlist-id', $config['playlistId'] ?? '');
        }

        self::set_attr($attrs, 'lyrics-url', $config['customLyricsUrl'] ?? $settings['customLyricsUrl']);
        self::set_attr($attrs, 'translation-lyrics-url', $config['customTranslationLyricsUrl'] ?? $settings['customTranslationLyricsUrl']);
        self::set_attr($attrs, 'skin', $config['skin'] ?? $settings['defaultSkin']);
        self::set_attr($attrs, 'api-base-url', $config['apiBaseUrl'] ?? $settings['apiBaseUrl']);
        self::set_attr($attrs, 'host-sync', self::bool_attr($config['hostSync'] ?? $settings['hostSyncEnabled']));
        self::set_attr($attrs, 'page-linking', self::bool_attr($config['pageLinking'] ?? $settings['pageLinkingEnabled']));
        self::set_attr($attrs, 'layout', $config['layout'] ?? '');

        $serialized = array();
        foreach ($attrs as $name => $value) {
            $serialized[] = $name . '="' . esc_attr($value) . '"';
        }

        return '<nmp-player ' . implode(' ', $serialized) . '></nmp-player>';
    }

    public static function sanitize_settings(array $settings): array
    {
        return array(
            'apiBaseUrl' => esc_url_raw($settings['apiBaseUrl'] ?? ''),
            'defaultSkin' => self::clean_allowed($settings['defaultSkin'] ?? 'default', self::SKINS, 'default'),
            'enabledExtensions' => self::clean_allowed_list($settings['enabledExtensions'] ?? array(), self::EXTENSIONS),
            'enabledSkins' => self::clean_allowed_list($settings['enabledSkins'] ?? array('default'), self::SKINS),
            'localMusicJsonUrl' => esc_url_raw($settings['localMusicJsonUrl'] ?? ''),
            'customLyricsUrl' => esc_url_raw($settings['customLyricsUrl'] ?? ''),
            'customTranslationLyricsUrl' => esc_url_raw($settings['customTranslationLyricsUrl'] ?? ''),
            'hostSyncEnabled' => !empty($settings['hostSyncEnabled']),
            'pageLinkingEnabled' => !empty($settings['pageLinkingEnabled']),
        );
    }

    private static function add_field(string $key, string $label, string $callback): void
    {
        add_settings_field(
            'nmpv3plus_' . $key,
            $label,
            array(__CLASS__, $callback),
            self::PAGE_SLUG,
            'nmpv3plus_main',
            array('key' => $key)
        );
    }

    public static function render_url_field(array $args): void
    {
        $settings = self::get_settings();
        $key = $args['key'];
        echo '<input type="url" class="regular-text" name="' . esc_attr(self::OPTION . '[' . $key . ']') . '" value="' . esc_attr($settings[$key]) . '" />';
    }

    public static function render_toggle_field(array $args): void
    {
        $settings = self::get_settings();
        $key = $args['key'];
        echo '<label><input type="checkbox" name="' . esc_attr(self::OPTION . '[' . $key . ']') . '" value="1" ' . checked($settings[$key], true, false) . ' /> Enabled</label>';
    }

    public static function render_skin_select(array $args): void
    {
        $settings = self::get_settings();
        $key = $args['key'];
        echo '<select name="' . esc_attr(self::OPTION . '[' . $key . ']') . '">';
        foreach (self::SKINS as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($settings[$key], $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }

    public static function render_skin_checkboxes(array $args): void
    {
        self::render_checkboxes($args['key'], self::SKINS);
    }

    public static function render_extension_checkboxes(array $args): void
    {
        self::render_checkboxes($args['key'], self::EXTENSIONS);
    }

    private static function render_checkboxes(string $key, array $options): void
    {
        $settings = self::get_settings();
        $selected = is_array($settings[$key]) ? $settings[$key] : array();

        foreach ($options as $value => $label) {
            echo '<label style="display:block;margin:0 0 6px;">';
            echo '<input type="checkbox" name="' . esc_attr(self::OPTION . '[' . $key . '][]') . '" value="' . esc_attr($value) . '" ' . checked(in_array($value, $selected, true), true, false) . ' /> ';
            echo esc_html($label);
            echo '</label>';
        }
    }

    private static function runtime_config(array $settings, string $asset_base): array
    {
        return array(
            'apiBaseUrl' => $settings['apiBaseUrl'],
            'defaultSkin' => $settings['defaultSkin'],
            'enabledExtensions' => $settings['enabledExtensions'],
            'enabledSkins' => $settings['enabledSkins'],
            'localMusicJsonUrl' => $settings['localMusicJsonUrl'],
            'customLyricsUrl' => $settings['customLyricsUrl'],
            'customTranslationLyricsUrl' => $settings['customTranslationLyricsUrl'],
            'hostSyncEnabled' => $settings['hostSyncEnabled'],
            'pageLinkingEnabled' => $settings['pageLinkingEnabled'],
            'assetBaseUrl' => $asset_base,
        );
    }

    private static function options_for_js(array $options): array
    {
        $items = array();
        foreach ($options as $value => $label) {
            $items[] = array('label' => $label, 'value' => $value);
        }
        return $items;
    }

    private static function set_attr(array &$attrs, string $name, $value): void
    {
        if ($value !== null && $value !== '') {
            $attrs[$name] = (string) $value;
        }
    }

    private static function bool_attr($value): string
    {
        return $value ? 'true' : 'false';
    }

    private static function to_bool($value): ?bool
    {
        if ($value === '') {
            return null;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private static function clean_slug($value): string
    {
        return sanitize_key((string) $value);
    }

    private static function clean_allowed($value, array $allowed, string $fallback): string
    {
        $value = self::clean_slug($value);
        return isset($allowed[$value]) ? $value : $fallback;
    }

    private static function clean_allowed_list($values, array $allowed): array
    {
        $values = is_array($values) ? $values : array();
        $clean = array();

        foreach ($values as $value) {
            $value = self::clean_slug($value);
            if (isset($allowed[$value])) {
                $clean[] = $value;
            }
        }

        return array_values(array_unique($clean));
    }
}

NMPv3Plus_WordPress_Plugin::init();
