/**
 * @file scripts-mo/ui/category/index.js
 * @description 카테고리 UI 관련 모듈 통합 관리
 */
import './category-sheet.js';
import './category-tree-search.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['CategorySheet', 'CategoryTreeSearch'];

  window.UI.category = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window);
