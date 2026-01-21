/**
 * @file scripts/ui/swiper-boxed.js
 * @purpose data-속성 기반 Swiper Boxed 초기화 (정석 마크업 기준)
 * @description
 *  - 컨테이너: [data-swiper-options] 요소 자체가 Swiper 컨테이너
 *  - 구조(정석): [data-swiper-options] > .swiper-wrapper > .swiper-slide
 *  - 초기화: 각 컨테이너마다 별도 Swiper 인스턴스 생성
 *  - 파괴: destroy 메서드로 인스턴스 정리 가능
 * @option (data-swiper-options JSON 내부)
 *  - slidesPerView: 보여질 슬라이드 개수 (number | 'auto')
 *  - spaceBetween: 슬라이드 간격 (px)
 *  - slidesOffsetBefore: 첫 슬라이드 왼쪽 여백 (px)
 *  - slidesOffsetAfter: 마지막 슬라이드 오른쪽 여백 (px)
 *  - slidesPerGroup: 한 번에 이동할 슬라이드 개수
 *  - navigation: 화살표 버튼 사용 여부 (boolean) // false면 비활성
 *  - pagination: 페이지네이션 사용 여부 (boolean) // true면 활성
 *  - centerWhenSingle: 슬라이드 1개일 때 중앙 정렬 (boolean)
 *  - hideNavWhenSingle: 슬라이드 1개일 때 화살표 숨김 (boolean, 기본 true)
 *  - speed: 전환 속도 (ms, 기본 300)
 *  - loop: 무한 루프 (boolean)
 *  - autoplay: 자동 재생 설정 (object | boolean)
 * @a11y
 *  - 키보드 제어 기본 활성화
 * @maintenance
 *  - Swiper 번들 의존 (swiper/bundle)
 *  - 인스턴스는 DOM 요소에 data로 저장 (재초기화 방지)
 */

import Swiper from 'swiper/bundle';

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[swiper-boxed] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var SWIPER_INSTANCE_KEY = 'swiperInstance';

  /**
   * 단일 Swiper 초기화
   * @param {jQuery} $wrapper - Swiper 컨테이너([data-swiper-options]) 요소
   */
  function initSwiper($wrapper) {
    // 이미 초기화된 경우 중복 방지
    if ($wrapper.data(SWIPER_INSTANCE_KEY)) {
      return;
    }

    // [정석] 컨테이너는 래퍼 자체
    var $container = $wrapper;

    // [정석] 컨테이너 바로 아래 wrapper 필수
    var $swiperWrapper = $container.children('.swiper-wrapper').first();
    if (!$swiperWrapper.length) {
      console.warn('[swiper-boxed] .swiper-wrapper not found in', $wrapper[0]);
      return;
    }

    // data-swiper-options에서 설정 파싱
    var optionsStr = $wrapper.attr('data-swiper-options');
    var userOptions = {};

    try {
      userOptions = optionsStr ? JSON.parse(optionsStr) : {};
    } catch (e) {
      console.error('[swiper-boxed] Invalid JSON in data-swiper-options', e);
      return;
    }

    // [정석] 직계 slide 기준
    var slideCount = $swiperWrapper.children('.swiper-slide').length;

    // navigation/pagination 플래그는 미리 보존 (병합 시 덮어쓰기 방지용)
    var navEnabled = userOptions.navigation !== false;
    var paginationEnabled = userOptions.pagination === true;

    // navigation/pagination은 아래에서 엘리먼트 바인딩 객체로 세팅하므로, boolean 덮어쓰기 방지
    delete userOptions.navigation;
    delete userOptions.pagination;

    // 기본 설정
    var defaultOptions = {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 300,
      keyboard: {
        enabled: true,
        onlyInViewport: true
      },
      a11y: {
        enabled: true,
        prevSlideMessage: '이전 슬라이드',
        nextSlideMessage: '다음 슬라이드',
        firstSlideMessage: '첫 번째 슬라이드',
        lastSlideMessage: '마지막 슬라이드'
      }
    };

    // Navigation 설정
    if (navEnabled) {
      var $prevBtn = $wrapper.children('.swiper-button-prev');
      var $nextBtn = $wrapper.children('.swiper-button-next');

      if ($prevBtn.length && $nextBtn.length) {
        defaultOptions.navigation = {
          prevEl: $prevBtn[0],
          nextEl: $nextBtn[0]
        };

        // 슬라이드 1개일 때 버튼 숨김 옵션(기본 true)
        if (slideCount === 1 && userOptions.hideNavWhenSingle !== false) {
          $prevBtn.hide();
          $nextBtn.hide();
        }
      }
    }

    // Pagination 설정
    if (paginationEnabled) {
      var $pagination = $wrapper.children('.swiper-pagination');
      if ($pagination.length) {
        defaultOptions.pagination = {
          el: $pagination[0],
          clickable: true,
          type: 'bullets'
        };
      }
    }

    // 슬라이드 1개일 때 중앙 정렬 옵션
    if (slideCount === 1 && userOptions.centerWhenSingle === true) {
      defaultOptions.centeredSlides = true;
    }

    // 사용자 옵션 병합
    var finalOptions = $.extend(true, {}, defaultOptions, userOptions);
    delete finalOptions.centerWhenSingle;
    delete finalOptions.hideNavWhenSingle;

    // Swiper 인스턴스 생성
    try {
      var swiperInstance = new Swiper($container[0], finalOptions);
      $wrapper.data(SWIPER_INSTANCE_KEY, swiperInstance);
      console.log('[swiper-boxed] initialized:', $wrapper.attr('class'));
    } catch (e) {
      console.error('[swiper-boxed] Initialization failed', e);
    }
  }

  /**
   * 단일 Swiper 파괴
   * @param {jQuery} $wrapper - Swiper 컨테이너([data-swiper-options]) 요소
   */
  function destroySwiper($wrapper) {
    var instance = $wrapper.data(SWIPER_INSTANCE_KEY);
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy(true, true);
      $wrapper.removeData(SWIPER_INSTANCE_KEY);
      console.log('[swiper-boxed] destroyed:', $wrapper.attr('class'));
    }
  }

  window.UI.swiperBoxed = {
    init: function () {
      $('[data-swiper-options]').each(function () {
        initSwiper($(this));
      });
      console.log('[swiper-boxed] init');
    },

    destroy: function () {
      $('[data-swiper-options]').each(function () {
        destroySwiper($(this));
      });
      console.log('[swiper-boxed] destroy');
    },

    reinit: function (selector) {
      var $target = typeof selector === 'string' ? $(selector) : selector;
      $target.each(function () {
        var $wrapper = $(this);
        destroySwiper($wrapper);
        initSwiper($wrapper);
      });
    }
  };

  console.log('[swiper-boxed] module loaded');
})(window.jQuery || window.$, window);
