/**
 * @file scripts-mo/ui/form/index.js
 * @description 폼 관련 UI 모듈 통합
 */

import './select.js';
import './checkbox-total.js';
import './textarea.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['select', 'checkboxTotal', 'textarea'];

  window.UI.form = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
