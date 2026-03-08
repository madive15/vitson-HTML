/**
 * @file scripts-mo/ui/home/home-swiper-peek.js
 * @description 홈 peek형 배너 Swiper
 * @scope [data-ui="banner-peek"]
 * @option data-slides-per-view, data-space-between, data-loop, data-autoplay,
 *         data-speed, data-centered-slides, data-overflow-gradient
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-peek"]';
  var CLS_OVERFLOW = 'is-overflow';

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

  // Swiper 끝 미도달 시 오른쪽 그라데이션 표시
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;
    $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    swiper.on('slideChange', function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    });
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

      var swiperInstance = new Swiper(swiperEl, config);

      // 그라데이션 바인딩
      if (getBool(el, 'overflow-gradient')) {
        bindOverflow(swiperInstance, $root);
      }

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

      $root.removeClass(CLS_OVERFLOW);
      $root.removeData('init');
    });
  }

  window.UI = window.UI || {};
  window.UI.homeSwiperPeek = {init: init, destroy: destroy};
})(window.jQuery);
