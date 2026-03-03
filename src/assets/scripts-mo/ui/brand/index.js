/**
 * @file scripts-mo/ui/brand/index.js
 * @description 브랜드 UI 모듈 통합
 */

import './brand-sheet.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['brandSheet'];

  window.UI.brand = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
