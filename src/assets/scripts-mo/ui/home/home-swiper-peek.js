/**
 * @file scripts-mo/ui/home/home-swiper-peek.js
 * @description 홈 peek형 배너 Swiper
 * @scope [data-ui="banner-peek"]
 * @option data-slides-per-view, data-space-between, data-loop, data-autoplay,
 *         data-speed, data-centered-slides
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-peek"]';

  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  function getFloat(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseFloat(val) : null;
  }

  function getBool(el, name) {
    return el.getAttribute('data-' + name) === 'true';
  }

  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;

      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;

      var config = {
        slidesPerView: getFloat(el, 'slides-per-view') || 1.2,
        spaceBetween: getInt(el, 'space-between') || 12,
        observer: true,
        observeParents: true,
        preventClicks: true,
        preventClicksPropagation: true
      };

      if (getBool(el, 'loop')) config.loop = true;
      if (getBool(el, 'centered-slides')) config.centeredSlides = true;
      var autoplayVal = getInt(el, 'autoplay');
      if (autoplayVal) config.autoplay = {delay: autoplayVal, disableOnInteraction: false};
      var speedVal = getInt(el, 'speed');
      if (speedVal) config.speed = speedVal;

      new Swiper(swiperEl, config);

      $root.data('init', true);
    });
  }

  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }
      $root.removeData('init');
    });
  }

  window.UI = window.UI || {};
  window.UI.homeSwiperPeek = {init: init, destroy: destroy};
})(window.jQuery);
