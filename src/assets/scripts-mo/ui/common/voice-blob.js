/**
 * @file voice-blob.js
 * @description AI 음성인식 Lottie 애니메이션 제어
 * @scope [data-voice-blob-anim]
 * @state instance — dotlottie-wc 플레이어 인스턴스
 */
import voiceBlobData from './voice-blob.json';

(function ($) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var instance = null;

  // 로티 애니메이션 초기화
  function init() {
    var $container = $('[data-voice-blob-anim]');
    if (!$container.length || instance) return;

    if (!voiceBlobData) return;

    import('@lottiefiles/dotlottie-wc').then(function () {
      if (instance) return;

      var player = document.createElement('dotlottie-wc');

      // JSON 데이터 직접 전달 (빌드 시 URL 의존 제거)
      player.data = voiceBlobData;
      player.setAttribute('loop', '');
      player.setAttribute('autoplay', '');
      player.setAttribute(
        'layout',
        JSON.stringify({
          fit: 'contain',
          align: [0.5, 0.5]
        })
      );
      player.useFrameInterpolation = false;
      player.style.width = '100%';
      player.style.height = '100%';

      $container[0].innerHTML = '';
      $container[0].appendChild(player);
      instance = player;
    });
  }

  // 인스턴스 제거
  function destroy() {
    if (!instance) return;
    instance.remove();
    instance = null;
  }

  window.UI.voiceBlob = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);
