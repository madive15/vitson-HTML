/**
 * @file scripts-mo/ui/common/index.js
 * @description 공통 UI 모듈 통합
 */

import './tooltip.js';
import './sticky-observer.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['tooltip', 'stickyObserver'];

  window.UI.common = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
