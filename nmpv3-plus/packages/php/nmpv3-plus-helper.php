<?php
/**
 * NMPv3+ PHP helper functions for advanced WordPress/PHP themes.
 *
 * This file intentionally belongs to NMPv3+. The lightweight NMPv3 WordPress
 * example stays a single-JS frontend integration.
 */

if (!function_exists('nmpv3plus_render_player')) {
    function nmpv3plus_render_player(array $args = array()): string
    {
        $attrs = array();
        $mapping = array(
            'song' => 'song-id',
            'playlist' => 'playlist-id',
            'source_type' => 'source-type',
            'source' => 'source',
            'lyrics_url' => 'lyrics-url',
            'translation_lyrics_url' => 'translation-lyrics-url',
            'skin' => 'skin',
            'extensions' => 'plus-extensions',
            'api_base_url' => 'api-base-url',
            'host_sync' => 'host-sync',
            'page_linking' => 'page-linking',
            'layout' => 'layout',
        );

        foreach ($mapping as $key => $attr) {
            if (!isset($args[$key]) || $args[$key] === '') {
                continue;
            }

            $value = is_array($args[$key]) ? implode(',', $args[$key]) : (string) $args[$key];
            $attrs[] = $attr . '="' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '"';
        }

        return '<nmp-player ' . implode(' ', $attrs) . '></nmp-player>';
    }
}

if (!function_exists('nmpv3plus_runtime_config_json')) {
    function nmpv3plus_runtime_config_json(array $settings = array()): string
    {
        $defaults = array(
            'apiBaseUrl' => '',
            'enabledExtensions' => array(),
            'enabledSkins' => array('default'),
            'defaultSkin' => 'default',
            'localMusicJsonUrl' => '',
            'customLyricsUrl' => '',
            'customTranslationLyricsUrl' => '',
            'hostSyncEnabled' => false,
            'pageLinkingEnabled' => false,
        );

        return json_encode(array_merge($defaults, $settings), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
