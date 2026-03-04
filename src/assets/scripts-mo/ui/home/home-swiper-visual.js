/**
 * @file scripts-mo/ui/home/home-swiper-visual.js
 * @description 홈 비주얼 배너 Swiper
 * @scope [data-ui="banner-visual"]
 * @option data-autoplay, data-speed, data-space-between
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-visual"]';

  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;

      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;

      var config = {
        slidesPerView: 1.32,
        centeredSlides: true,
        loop: true,
        watchSlidesProgress: true,
        observer: true,
        observeParents: true,
        preventClicks: true,
        preventClicksPropagation: true,
        spaceBetween: getInt(el, 'space-between') || 0,
        speed: getInt(el, 'speed') || 300
      };

      var autoplayVal = getInt(el, 'autoplay');
      if (autoplayVal) {
        config.autoplay = {delay: autoplayVal, disableOnInteraction: false};
      }

      var swiper = new Swiper(swiperEl, config);

      // nav 버튼
      $root.on('click', '[data-role]', function () {
        var role = $(this).attr('data-role');
        if (role === 'prev') swiper.slidePrev();
        if (role === 'next') swiper.slideNext();
        if (role === 'toggle-play') {
          if (swiper.autoplay.running) {
            swiper.autoplay.stop();
            $(this).text('play');
          } else {
            swiper.autoplay.start();
            $(this).text('II');
          }
        }
      });

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
  window.UI.homeSwiperVisual = {init: init, destroy: destroy};
})(window.jQuery);
