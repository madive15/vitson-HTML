/**
 * @file scripts-mo/ui/header/index.js
 * @description 헤더 UI 모듈 통합
 */

import './header-button.js';
import './sticky-header.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['headerButton', 'stickyHeader'];

  window.UI.header = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
