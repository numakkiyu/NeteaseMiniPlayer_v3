import type { NMPv3Player } from "../types";

const players = new Set<NMPv3Player>();

/**
 * 全局音频管理器（单例）
 * 维护所有播放器实例，确保同一时间只有一个在播放
 */
export const globalAudioManager = {
  add(player: NMPv3Player): void {
    players.add(player);
  },

  remove(player: NMPv3Player): void {
    players.delete(player);
  },

  all(): NMPv3Player[] {
    return Array.from(players);
  },

  /**
   * 暂停除 except 之外的其它实例
   * 走静默暂停路径：被抢占不算用户主动暂停，不应派发 nmpv3:pause 事件
   */
  pauseAll(except?: NMPv3Player): void {
    for (const player of players) {
      if (player !== except) {
        player.pauseSilently();
      }
    }
  },
};
