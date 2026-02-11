/**
 * @file scripts-mo/ui/filter/index.js
 * @description 필터 UI 모듈 통합
 */

import './filter-product.js';
import './filter-mapage.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['FilterProduct', 'FilterMypage'];

  window.UI.filter = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
