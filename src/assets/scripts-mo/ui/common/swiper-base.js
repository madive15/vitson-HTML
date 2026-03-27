/**
 * @file scripts-mo/ui/common/swiper-base.js
 * @description 범용 Swiper (프리셋 이름으로 옵션 매핑, 홈 외 공통 사용)
 * @scope [data-ui="swiper-base"]
 * @option data-swiper — 프리셋 이름 (product 등)
 * @option data-overflow-gradient — 끝 미도달 시 그라데이션 표시
 * @state is-overflow — 끝 미도달 상태
 * @note slidesPerView: 'auto' 고정, 슬라이드 너비는 프리셋의 slideWidth로 인라인 적용
 * @note equalHeight: true인 프리셋은 가장 높은 슬라이드 기준으로 높이 균일화
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="swiper-base"]';
  var CLS_OVERFLOW = 'is-overflow';

  // 공통 기본값 (프리셋에 없는 항목은 여기서 가져감)
  var DEFAULTS = {
    slidesPerView: 'auto',
    speed: 400
  };

  // 프리셋: 공통과 다른 값만 정의
  var PRESETS = {
    product: {
      slideWidth: 136,
      spaceBetween: 20,
      equalHeight: true
    }
  };

  function getBool(el, name) {
    return el.getAttribute('data-' + name) === 'true';
  }

  // 프리셋 + 기본값 병합 → Swiper config 생성
  function buildConfig(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};

    var config = {
      slidesPerView: DEFAULTS.slidesPerView,
      speed: preset.speed || DEFAULTS.speed,
      observer: true,
      observeParents: true,
      preventClicks: true,
      preventClicksPropagation: true
    };

    // spaceBetween은 프리셋에 있을 때만 적용
    if (preset.spaceBetween != null) {
      config.spaceBetween = preset.spaceBetween;
    }

    return config;
  }

  // 프리셋 slideWidth가 있으면 슬라이드에 인라인 너비 적용
  function applySlideWidth(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};
    if (!preset.slideWidth) return;

    $(el)
      .find('.swiper-slide')
      .each(function () {
        this.style.width = preset.slideWidth + 'px';
      });
  }

  // 슬라이드 높이 균일화 — DOM 변화 시 재계산 (debounce 적용)
  function applyEqualHeight(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};
    if (!preset.equalHeight) return;

    var timer = null;
    var wrapper = el.querySelector('.swiper-wrapper');

    var observer = new MutationObserver(debouncedRecalc);

    function recalc() {
      // 재계산 중 observer 일시 중단 (height 변경이 다시 트리거하는 것 방지)
      observer.disconnect();

      var $slides = $(el).find('.swiper-slide');
      $slides.css('height', '');

      var maxH = 0;
      $slides.each(function () {
        var h = this.offsetHeight;
        if (h > maxH) maxH = h;
      });

      if (maxH > 0) {
        $slides.css('height', maxH + 'px');
      }

      // observer 재연결
      observer.observe(wrapper, {
        childList: true,
        subtree: true
      });
    }

    function debouncedRecalc() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(recalc, 50);
    }

    recalc();

    $(el).data('equalHeightObserver', observer);
  }

  // 끝 미도달 시 그라데이션 토글
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;

    var update = function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    };

    update();
    swiper.on('slideChange', update);
    swiper.on('reachEnd', update);
  }

  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;

      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;

      applySlideWidth(el);
      applyEqualHeight(el);

      var config = buildConfig(el);
      var swiperInstance = new Swiper(swiperEl, config);

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

      // 인라인 스타일 제거
      $root.find('.swiper-slide').each(function () {
        this.style.width = '';
        this.style.height = '';
      });

      $root.removeClass(CLS_OVERFLOW);
      $root.removeData('init');

      var observer = $root.data('equalHeightObserver');
      if (observer) {
        observer.disconnect();
        $root.removeData('equalHeightObserver');
      }
    });
  }

  window.UI = window.UI || {};
  window.UI.swiperBase = {init: init, destroy: destroy};
})(window.jQuery);
