/**
 * @file scripts/ui/home-ui.js
 * @purpose 메인 홈 페이지 UI 컨트롤
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[home-ui] jQuery not found');
  }

  window.UI = window.UI || {};

  window.UI.homeUi = {
    init: function () {
      console.log('[home-ui] init');
    }
  };

  console.log('[home-ui] module loaded');
})(window.jQuery || window.$, window);
