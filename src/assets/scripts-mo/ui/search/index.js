/**
 * @file scripts-mo/ui/search/index.js
 * @description 검색 UI 모듈 통합
 */

import './search-rank.js';
import './search-suggest.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['searchRank', 'searchSuggest'];

  window.UI.search = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    },
    destroy: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.destroy === 'function') mod.destroy();
      });
    }
  };
})(window.jQuery || window.$, window);
