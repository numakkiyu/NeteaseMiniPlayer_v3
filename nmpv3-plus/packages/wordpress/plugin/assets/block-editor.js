(function (wp) {
  if (!wp || !wp.blocks || !wp.element || !wp.components || !wp.blockEditor) {
    return;
  }

  var createElement = wp.element.createElement;
  var useEffect = wp.element.useEffect;
  var InspectorControls = wp.blockEditor.InspectorControls;
  var PanelBody = wp.components.PanelBody;
  var SelectControl = wp.components.SelectControl;
  var TextControl = wp.components.TextControl;
  var ToggleControl = wp.components.ToggleControl;
  var nmpv3PlusEditorPreviewStyle = {
    width: "min(100%, 420px)",
    margin: "0 auto",
  };

  var settings = (window.NMPv3PlusWordPress || {}).settings || {};
  var skins = settings.availableSkins || [
    { label: "Default", value: "default" },
    { label: "Glass", value: "glass" },
    { label: "Minimal", value: "minimal" },
    { label: "Anime", value: "anime" },
    { label: "Cyber", value: "cyber" },
    { label: "Vinyl", value: "vinyl" },
  ];

  function updateAttr(setAttributes, key) {
    return function (value) {
      setAttributes(Object.fromEntries([[key, value]]));
    };
  }

  function setPreviewAttr(attrs, name, value) {
    if (value !== undefined && value !== null && value !== "") {
      attrs[name] = String(value);
    }
  }

  function createPreviewAttrs(attrs, clientId) {
    var source = attrs.source || "netease";
    var skin = attrs.skin || settings.defaultSkin || "default";
    var previewAttrs = {
      id: "nmpv3plus-editor-preview-" + clientId,
      key: [
        source,
        attrs.songId || "",
        attrs.playlistId || "",
        attrs.localMusicJsonUrl || "",
        attrs.customLyricsUrl || "",
        attrs.customTranslationLyricsUrl || "",
        skin,
        attrs.hostSync ? "host" : "",
      ].join("|"),
      layout: "compact",
      theme: "auto",
      lyric: "true",
      playlist: source === "netease" ? "true" : "false",
      skin: skin,
      "data-plus-editor-preview": "true",
    };

    setPreviewAttr(previewAttrs, "song-id", attrs.songId);
    setPreviewAttr(previewAttrs, "api-base-url", settings.apiBaseUrl);
    setPreviewAttr(previewAttrs, "lyrics-url", attrs.customLyricsUrl);
    setPreviewAttr(
      previewAttrs,
      "translation-lyrics-url",
      attrs.customTranslationLyricsUrl,
    );
    setPreviewAttr(previewAttrs, "host-sync", attrs.hostSync ? "true" : "");
    setPreviewAttr(
      previewAttrs,
      "page-linking",
      attrs.pageLinking ? "true" : "",
    );

    if (source === "netease") {
      setPreviewAttr(previewAttrs, "playlist-id", attrs.playlistId);
    } else {
      setPreviewAttr(previewAttrs, "source-type", source);
      setPreviewAttr(previewAttrs, "source", attrs.localMusicJsonUrl);
      previewAttrs["plus-extensions"] = "custom-source,local-lyrics";
    }

    return previewAttrs;
  }

  wp.blocks.registerBlockType("netease-mini-player/nmpv3-plus", {
    edit: function (props) {
      var attrs = props.attributes;
      var setAttributes = props.setAttributes;

      if (typeof useEffect === "function") {
        useEffect(
          function () {
            window.dispatchEvent(new CustomEvent("nmpv3plus:refresh"));
          },
          [
            attrs.source,
            attrs.songId,
            attrs.playlistId,
            attrs.localMusicJsonUrl,
            attrs.customLyricsUrl,
            attrs.customTranslationLyricsUrl,
            attrs.skin,
            attrs.hostSync,
            attrs.pageLinking,
          ],
        );
      }

      return createElement(
        "div",
        null,
        createElement(
          InspectorControls,
          null,
          createElement(
            PanelBody,
            { title: "NMPv3+ Player", initialOpen: true },
            createElement(SelectControl, {
              label: "Source",
              value: attrs.source,
              options: [
                { label: "NetEase", value: "netease" },
                { label: "Local JSON", value: "local-json" },
                { label: "Custom API", value: "custom-api" },
              ],
              onChange: updateAttr(setAttributes, "source"),
            }),
            createElement(TextControl, {
              label: "Song ID",
              value: attrs.songId || "",
              onChange: updateAttr(setAttributes, "songId"),
            }),
            createElement(TextControl, {
              label: "Playlist ID",
              value: attrs.playlistId || "",
              onChange: updateAttr(setAttributes, "playlistId"),
            }),
            createElement(TextControl, {
              label: "Local music JSON",
              value: attrs.localMusicJsonUrl || "",
              onChange: updateAttr(setAttributes, "localMusicJsonUrl"),
            }),
            createElement(TextControl, {
              label: "Custom lyrics URL",
              value: attrs.customLyricsUrl || "",
              onChange: updateAttr(setAttributes, "customLyricsUrl"),
            }),
            createElement(TextControl, {
              label: "Custom translation lyrics URL",
              value: attrs.customTranslationLyricsUrl || "",
              onChange: updateAttr(setAttributes, "customTranslationLyricsUrl"),
            }),
            createElement(SelectControl, {
              label: "Skin",
              value: attrs.skin || settings.defaultSkin || "default",
              options: skins,
              onChange: updateAttr(setAttributes, "skin"),
            }),
            createElement(ToggleControl, {
              label: "Host page sync",
              checked: !!attrs.hostSync,
              onChange: updateAttr(setAttributes, "hostSync"),
            }),
            createElement(ToggleControl, {
              label: "Page linking",
              checked: !!attrs.pageLinking,
              onChange: updateAttr(setAttributes, "pageLinking"),
            }),
          ),
        ),
        createElement(
          "div",
          {
            className: "nmpv3plus-editor-preview",
            style: nmpv3PlusEditorPreviewStyle,
          },
          createElement(
            "nmp-player",
            createPreviewAttrs(attrs, props.clientId),
          ),
        ),
      );
    },
    save: function () {
      return null;
    },
  });
})(window.wp);
