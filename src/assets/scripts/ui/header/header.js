/**
 * scripts/ui/kendo/kendo.js
 * @purpose Kendo UI 관련 모듈 통합 관리
 */
import './header-gnb.js';
import './header-rank.js';
import './header-search.js';
import './header-brand.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  window.UI.header = {
    init: function () {
      if (window.UI.headerRank && window.UI.headerRank.init) window.UI.headerRank.init();
      if (window.UI.headerSearch && window.UI.headerSearch.init) window.UI.headerSearch.init();
      if (window.UI.headerGnb && window.UI.headerGnb.init) window.UI.headerGnb.init();
      if (window.UI.Brand && window.UI.Brand.init) window.UI.Brand.init();
      console.log('[header] all modules initialized');
    }
  };

  console.log('[header] loaded');
})(window);
