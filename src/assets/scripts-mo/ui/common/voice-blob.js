/**
 * @file voice-blob.js
 * @description AI 음성인식 Lottie 애니메이션 제어
 * @scope [data-voice-blob-anim]
 * @option {string} data-voice-blob-anim — Lottie JSON 파일 경로 (URL)
 * @state instance — dotlottie-wc 플레이어 인스턴스
 */

// voice-blob.json import 제거 — URL 직접 참조로 전환
(function ($) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var instance = null;

  var CDN_URL = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js';

  function init() {
    var $container = $('[data-voice-blob-anim]');
    if (!$container.length || instance) return;

    // data-voice-blob-anim 속성값으로 JSON 경로 주입 (마크업에서 관리)
    var animSrc = $container.data('voice-blob-anim');
    if (!animSrc) return;

    var script = document.createElement('script');
    script.type = 'module';
    script.src = CDN_URL;

    script.onload = function () {
      customElements.whenDefined('dotlottie-wc').then(function () {
        if (instance) return;

        var player = document.createElement('dotlottie-wc');

        // data prop 대신 src 속성 사용 — 서버 환경에서 안정적
        player.setAttribute('src', animSrc);
        player.setAttribute('loop', '');
        player.setAttribute('autoplay', '');
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
