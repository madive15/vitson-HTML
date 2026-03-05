/**
 * @file scripts-mo/ui/home/home-swiper-visual.js
 * @description 홈 비주얼 배너 Swiper (coverflow 기반, 수동 복제로 loop 보정)
 * @scope [data-ui="banner-visual"]
 * @option data-autoplay, data-speed
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-visual"]';
  // loop 안정성을 위한 최소 슬라이드 수
  var MIN_SLIDES = 9;

  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  // 슬라이드 수동 복제 (원본 부족 시 loop 보정)
  function cloneSlides($wrapper) {
    var $originals = $wrapper.children('.swiper-slide');
    var originalCount = $originals.length;
    if (originalCount >= MIN_SLIDES) return originalCount;

    var needed = Math.ceil((MIN_SLIDES - originalCount) / originalCount);
    for (var i = 0; i < needed; i++) {
      $originals.each(function () {
        $wrapper.append($(this).clone().attr('data-cloned', 'true'));
      });
    }
    return originalCount;
  }

  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;

      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;

      var $wrapper = $(swiperEl).find('.swiper-wrapper');
      var slideCount = $wrapper.children('.swiper-slide').length;

      // 슬라이드 1개 이하면 Swiper 불필요
      if (slideCount < 2) return;

      // 복제 후 원본 슬라이드 수 저장
      var originalCount = cloneSlides($wrapper);
      $root.data('originalCount', originalCount);

      var config = {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: true,
        watchSlidesProgress: true,
        observer: true,
        observeParents: true,
        speed: getInt(el, 'speed') || 300,
        coverflowEffect: {
          rotate: 0,
          stretch: 20,
          depth: 0,
          modifier: 1,
          scale: 0.8,
          slideShadows: false
        }
      };

      var autoplayVal = getInt(el, 'autoplay');
      if (autoplayVal) {
        config.autoplay = {delay: autoplayVal, disableOnInteraction: false};
      }

      var swiper = new Swiper(swiperEl, config);

      // nav 버튼 (이벤트 위임)
      $root.on('click.bannerVisual', '[data-role]', function () {
        var role = $(this).attr('data-role');
        if (role === 'prev') swiper.slidePrev();
        if (role === 'next') swiper.slideNext();
        if (role === 'toggle-play') {
          if (swiper.autoplay.running) {
            swiper.autoplay.stop();
            $(this).addClass('is-play').attr('aria-label', '재생');
          } else {
            swiper.autoplay.start();
            $(this).removeClass('is-play').attr('aria-label', '일시정지');
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

      // 복제 슬라이드 제거
      $(swiperEl).find('[data-cloned="true"]').remove();

      $root.off('.bannerVisual');
      $root.removeData('init originalCount');
    });
  }

  window.UI = window.UI || {};
  window.UI.homeSwiperVisual = {init: init, destroy: destroy};
})(window.jQuery);
