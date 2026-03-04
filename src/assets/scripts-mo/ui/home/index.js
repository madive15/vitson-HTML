/**
 * @file scripts-mo/ui/home/index.js
 * @description 홈 진입점
 */
import './home-swiper-visual';
import './home-swiper-tab';
import './home-swiper-peek';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['homeSwiperVisual', 'homeSwiperTab', 'homeSwiperPeek'];

  window.UI.home = {
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
})(window.jQuery, window);
