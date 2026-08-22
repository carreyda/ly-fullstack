import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import type { ShallowRef } from 'vue';

/**
 * 西瓜播放器官方演示视频地址。
 */
const XGPLAYER_DEMO_URL = 'https://s2.pstatp.com/cdn/expire-1-M/byted-player-videos/1.0.0/xgplayer-demo.mp4';

/**
 * 管理西瓜播放器的初始化与资源释放。
 *
 * @param playerRef 播放器挂载节点。
 */
export const useVideoPlayer = (playerRef: Readonly<ShallowRef<HTMLElement | null>>): void => {
  let player: Player | undefined;

  /**
   * 挂载后创建播放器实例。
   */
  onMounted(() => {
    if (!playerRef.value) {
      return;
    }

    player = new Player({
      el: playerRef.value,
      url: XGPLAYER_DEMO_URL,
      autoplay: false,
      fluid: true,
      lang: 'zh-cn',
    });
  });

  /**
   * 离开页面时销毁媒体节点、事件和播放器插件。
   */
  onBeforeUnmount(() => {
    player?.destroy();
    player = undefined;
  });
};
