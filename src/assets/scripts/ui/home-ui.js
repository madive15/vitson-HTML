/**
 * @file scripts/ui/home-ui.js
 * @purpose 메인 홈 페이지 UI 컨트롤
 * @description
 *  - 메인 홈 페이지 전용 UI 기능 관리
 *  - 다른 공통 JS와 독립적으로 동작하도록 별도 Swiper 인스턴스로 관리
 */

import Swiper from 'swiper/bundle';

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[home-ui] jQuery not found');
  }

  window.UI = window.UI || {};

  // Swiper 인스턴스 저장용 키 (DOM 요소에 저장)
  var SWIPER_INSTANCE_KEY = 'homeMainBannerSwiper';

  /**
   * 메인 배너 Swiper 초기화
   * 다른 공통 JS와 독립적으로 동작하도록 별도 인스턴스로 관리
   *
   * @주의사항:
   * 1. 컨테이너 내부에서만 요소를 찾아 다른 Swiper와 충돌 방지
   * 2. DOM 요소에 인스턴스를 저장하여 중복 초기화 방지
   * 3. 재초기화 시 기존 인스턴스를 먼저 파괴
   */
  function initMainBannerSwiper() {
    var container = document.querySelector('.js-home-main-banner-swiper');
    if (!container) {
      console.warn('[home-ui] Banner container not found');
      return;
    }

    // 이미 초기화된 경우 중복 방지 (DOM 요소에 저장된 인스턴스 확인)
    var existingInstance = container[SWIPER_INSTANCE_KEY];
    if (existingInstance && typeof existingInstance.destroy === 'function') {
      console.log('[home-ui] Swiper already initialized, skipping...');
      return;
    }

    // import된 Swiper 사용 (모듈 스코프에서 직접 사용)
    if (!Swiper) {
      console.error('[home-ui] Swiper is not available');
      return;
    }

    // 컨테이너 내부에서만 요소를 찾아 다른 Swiper와 충돌 방지
    var progressBar = container.querySelector('.banner-progress-fill');
    var prevButton = container.querySelector('.banner-nav-prev');
    var nextButton = container.querySelector('.banner-nav-next');
    var toggleButton = container.querySelector('.banner-progress-toggle');

    // Swiper 옵션 설정
    var swiperOptions = {
      slidesPerView: 'auto',
      spaceBetween: 16, // 16px
      speed: 300,
      loop: true,
      watchSlidesProgress: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false
      },
      navigation: {
        nextEl: nextButton,
        prevEl: prevButton,
        disabledClass: 'swiper-button-disabled'
      },
      on: {
        init: function (swiper) {
          if (progressBar) {
            updateProgressBar(swiper, progressBar);
          }
          updatePlayPauseState(swiper, toggleButton);
        },
        slideChange: function (swiper) {
          if (progressBar) {
            updateProgressBar(swiper, progressBar);
          }
        }
      }
    };

    try {
      var swiperInstance = new Swiper(container, swiperOptions);

      // DOM 요소에 인스턴스 저장 (다른 Swiper와 충돌 방지 및 재초기화 방지)
      container[SWIPER_INSTANCE_KEY] = swiperInstance;

      // 재생/멈춤 토글 버튼 클릭
      if (toggleButton) {
        toggleButton.addEventListener('click', function () {
          var isRunning = swiperInstance.autoplay && swiperInstance.autoplay.running;
          if (isRunning) {
            // 재생 중이면 일시정지
            swiperInstance.autoplay.stop();
          } else {
            // 일시정지 중이면 재생
            swiperInstance.autoplay.start();
          }
          updatePlayPauseState(swiperInstance, toggleButton);
        });
      }

      console.log('[home-ui] Main banner swiper initialized');
    } catch (e) {
      console.error('[home-ui] Failed to initialize main banner swiper', e);
    }
  }

  /**
   * 재생/멈춤 토글 버튼 상태 갱신
   * @param {Object} swiper - Swiper 인스턴스
   * @param {HTMLElement} toggleBtn - 토글 버튼
   */
  function updatePlayPauseState(swiper, toggleBtn) {
    if (!toggleBtn) {
      return;
    }
    var isRunning = swiper.autoplay && swiper.autoplay.running;
    if (isRunning) {
      // 재생 중이면 일시정지 아이콘 표시
      toggleBtn.classList.remove('is-paused');
      toggleBtn.classList.add('is-playing');
      toggleBtn.setAttribute('aria-label', '멈춤');
      toggleBtn.setAttribute('aria-pressed', 'true');
      toggleBtn.setAttribute('title', '멈춤');
      toggleBtn.querySelector('.sr-only').textContent = '멈춤';
    } else {
      // 일시정지 중이면 재생 아이콘 표시
      toggleBtn.classList.remove('is-playing');
      toggleBtn.classList.add('is-paused');
      toggleBtn.setAttribute('aria-label', '재생');
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('title', '재생');
      toggleBtn.querySelector('.sr-only').textContent = '재생';
    }
  }

  /**
   * 진행 바 업데이트
   * @param {Object} swiper - Swiper 인스턴스
   * @param {HTMLElement} progressBar - 진행 바 요소
   */
  function updateProgressBar(swiper, progressBar) {
    if (!progressBar || !swiper) {
      return;
    }

    // loop 모드에서는 realIndex 사용, 일반 모드에서는 activeIndex 사용
    var currentIndex = swiper.loopedSlides !== undefined ? swiper.realIndex + 1 : swiper.activeIndex + 1;
    var totalSlides = swiper.slides.length;

    // loop 모드에서는 실제 슬라이드 개수 사용
    if (swiper.loopedSlides !== undefined) {
      totalSlides = swiper.slides.length - swiper.loopedSlides * 2;
    }

    var progress = (currentIndex / totalSlides) * 100;

    progressBar.style.width = progress + '%';
  }

  /**
   * 메인 배너 Swiper 파괴
   * @param {HTMLElement} container - Swiper 컨테이너 요소 (선택사항)
   */
  function destroyMainBannerSwiper(container) {
    var targetContainer = container || document.querySelector('.js-home-main-banner-swiper');

    if (!targetContainer) {
      return;
    }

    var swiperInstance = targetContainer[SWIPER_INSTANCE_KEY];
    if (swiperInstance && typeof swiperInstance.destroy === 'function') {
      swiperInstance.destroy(true, true);
      delete targetContainer[SWIPER_INSTANCE_KEY];
      console.log('[home-ui] Main banner swiper destroyed');
    }
  }

  /**
   * 메인 배너 Swiper 재초기화
   * 동적 콘텐츠 로드 시 사용
   */
  function reinitMainBannerSwiper() {
    var container = document.querySelector('.js-home-main-banner-swiper');
    if (container) {
      destroyMainBannerSwiper(container);
      // 약간의 지연 후 재초기화 (DOM 업데이트 대기)
      setTimeout(function () {
        initMainBannerSwiper();
      }, 100);
    }
  }

  window.UI.homeUi = {
    init: function () {
      console.log('[home-ui] init');

      // DOM 로드 후 Swiper 초기화
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          initMainBannerSwiper();
        });
      }
      // eslint-disable-next-line no-use-before-define
      else {
        initMainBannerSwiper();
      }
    },

    destroy: function () {
      destroyMainBannerSwiper();
    },

    reinit: function () {
      reinitMainBannerSwiper();
    }
  };

  console.log('[home-ui] module loaded');
})(window.jQuery || window.$, window);
