/**
 * @file mobile/core/utils.js
 * @description 모바일 공통 유틸
 * @note 실행 트리거(DOMReady/이벤트 바인딩) 금지, 범용 로직만
 */
(function (window, document) {
  'use strict';

  /**
   * @description 뷰포트 높이 보정 (iOS/Android 주소창 변화 대응)
   * @note CSS: min-height: calc(var(--vh, 1vh) * 100)
   */
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }

  setVh();
  window.addEventListener('resize', setVh);
})(window, document);
