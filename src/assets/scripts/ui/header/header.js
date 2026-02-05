/**
 * scripts/ui/header/header.js
 * @purpose header UI 관련 모듈 통합 관리
 */
import './header-gnb.js';
import './header-rank.js';
import './header-search.js';
import './header-brand.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['headerRank', 'headerSearch', 'headerGnb', 'Brand'];

  window.UI.header = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window);
