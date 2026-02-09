/**
 * @file scripts-mo/core/common.js
 * @description 공통 초기화 — DOMContentLoaded 시 UI 모듈 일괄 init
 */
(function ($, window) {
  'use strict';

  var initialized = false;

  $(function () {
    if (initialized || !window.UI) return;
    initialized = true;

    Object.keys(window.UI).forEach(function (key) {
      var mod = window.UI[key];
      if (mod && typeof mod.init === 'function') mod.init();
    });
  });
})(window.jQuery, window);
