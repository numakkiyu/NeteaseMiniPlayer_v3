declare module "vue" {
  export interface GlobalComponents {
    "nmp-player": import("./index").NMPv3PlusVuePlayerProps;
    NMPv3PlusPlayer: import("./index").NMPv3PlusVuePlayerProps;
  }
}
