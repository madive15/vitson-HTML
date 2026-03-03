(function ($) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var instance = null;
  // 상단에 추가 — webpack이 빌드 시 파일을 output에 복사하고 URL 반환
  var voiceBlobPath = require('./voice-blob.json');

  function init() {
    var $container = $('[data-voice-blob-anim]');
    if (!$container.length || instance) return;

    var lottiePath = voiceBlobPath;
    if (!lottiePath) return;

    import('@lottiefiles/dotlottie-wc').then(function () {
      if (instance) return;

      var player = document.createElement('dotlottie-wc');

      player.setAttribute('src', lottiePath);
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
