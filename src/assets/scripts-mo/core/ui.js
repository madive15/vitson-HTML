/**
 * @file mobile/core/ui.js
 * @description 모바일 UI 모듈 import + 초기화 진입점
 * @note
 *  - UI 기능은 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함
 *  - UI.init에는 "초기화 호출"만 (기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */
import '../ui/scroll-lock';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  /**
   * 공통 UI 초기화 진입점
   * @returns {void}
   */
  window.UI.init = function () {
    if (window.UI.scrollLock && window.UI.scrollLock.init) window.UI.scrollLock.init();
  };

  console.log('[mobile/core/ui] loaded');
})(window);
