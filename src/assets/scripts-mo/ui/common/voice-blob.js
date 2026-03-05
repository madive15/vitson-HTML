/**
 * @file voice-blob.js
 * @description AI 음성인식 Lottie 애니메이션 제어
 * @scope [data-voice-blob-anim]
 * @state instance — dotlottie-wc 플레이어 인스턴스
 */
import voiceBlobData from './voice-blob.json'; // 이건 유지

(function ($) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var instance = null;

  // 로티 애니메이션 초기화
  function init() {
    var $container = $('[data-voice-blob-anim]');
    if (!$container.length || instance) return;

    // 모바일 디바이스에서만 실행
    if (!/Mobi|Android/i.test(navigator.userAgent)) return;

    if (!voiceBlobData) return;

    // CDN 동적 로드 (모바일에서만 다운로드)
    var CDN_URL = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js';
    var script = document.createElement('script');
    script.type = 'module';
    script.src = CDN_URL;
    script.onload = function () {
      // Web Component 등록 완료까지 대기
      customElements.whenDefined('dotlottie-wc').then(function () {
        if (instance) return;

        var player = document.createElement('dotlottie-wc');

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
    };

    document.head.appendChild(script);
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
