/**
 * scripts/core/common.js
 * @purpose 공통 초기화/바인딩(실행 트리거)
 * @assumption
 *  - jQuery는 전역(window.jQuery 또는 window.$)에 존재해야 한다
 *  - UI.init은 core/ui.js에서 정의되어 있어야 한다
 * @maintenance
 *  - 페이지 의미 분기(gnb/main/detail 등) 로직 금지
 *  - 공통 실행(초기화 트리거)만 담당하고, 기능 구현은 ui/*로 분리한다
 *  - DOMReady에서 UI.init은 1회만 호출한다(중복 호출 금지)
 */
(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[common] jQuery not found (window.jQuery/window.$ undefined)');
    return;
  }

  $(function () {
    console.log('[common] DOM ready');
    if (window.UI && window.UI.init) window.UI.init();
  });
})(window.jQuery || window.$, window);
