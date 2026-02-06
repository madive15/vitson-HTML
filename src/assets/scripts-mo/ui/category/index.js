/**
 * @file scripts-mo/ui/category/index.js
 * @description 카테고리 UI 관련 모듈 통합 관리
 */
import './category-breadcrumb.js';
import './category-sheet.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['CategoryBreadcrumb', 'CategorySheet'];

  window.UI.category = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window);
