import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import FooterBrand from "./FooterBrand.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "layout-bottom": () => h(FooterBrand),
    });
  },
};
