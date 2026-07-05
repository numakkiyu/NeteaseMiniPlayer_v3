<?php
/**
 * Plugin Name: NeteaseMiniPlayer v3 Basic
 * Description: Minimal WordPress integration for the lightweight NMPv3 single-JS player.
 * Version: 3.0.0-alpha.0
 * Author: BHCN STUDIO & contributors
 * License: Apache-2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function nmpv3_basic_enqueue_assets(): void
{
    wp_enqueue_script(
        'nmpv3',
        plugins_url('assets/nmpv3.min.js', __FILE__),
        array(),
        '3.0.0-alpha.0',
        array(
            'strategy' => 'defer',
            'in_footer' => true,
        )
    );
}

add_action('wp_enqueue_scripts', 'nmpv3_basic_enqueue_assets');

function nmpv3_basic_default_api_base_url(): string
{
    return (string) apply_filters('nmpv3_basic_default_api_base_url', '');
}

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

add_shortcode('nmpv3', 'nmpv3_basic_shortcode');
