/**
 * @file scripts-mo/core/ui.js
 * @description 모바일 UI 모듈 진입점
 * @note import 순서가 의존성에 영향 — 임의 재정렬 금지
 */

import '../ui/scroll-lock.js';
import '../ui/kendo/index.js';
import '../ui/common/index.js';
import '../ui/form/index.js';
import '../ui/product/index.js';
import '../ui/category/index.js';
import '../ui/filter/index.js';
import '../ui/cart-order/index.js';

(function ($, window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['scrollLock', 'kendo', 'common', 'form', 'product', 'category', 'filter', 'cart-order'];

  window.UI.init = function () {
    modules.forEach(function (name) {
      var mod = window.UI[name];
      if (mod && typeof mod.init === 'function') mod.init();
    });
  };

  // DOM 준비 후 자동 초기화
  $(document).ready(function () {
    window.UI.init();
  });
})(window.jQuery, window);
