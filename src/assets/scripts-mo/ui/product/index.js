/**
 * @file scripts-mo/ui/product/index.js
 * @description 상품 관련 UI 모듈 통합
 */
import './product-view-toggle.js';
import './product-inline-banner.js';
import './detail-gallery.js';
import './bottom-product-bar.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['productViewToggle', 'productInlineBanner', 'detailGallery', 'bottomProductBar'];

  window.UI.product = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (!mod) return;

        // initAll 우선, 없으면 init
        if (typeof mod.initAll === 'function') {
          mod.initAll();
        } else if (typeof mod.init === 'function') {
          mod.init();
        }
      });
    }
  };
})(window.jQuery, window);
