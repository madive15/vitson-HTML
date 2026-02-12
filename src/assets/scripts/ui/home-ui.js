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
  var REAL_SLIDE_COUNT_KEY = 'homeMainBannerRealSlideCount';

  // 업종 맞춤 기획전 배너용 Swiper 키
  var EVENT_SWIPER_INSTANCE_KEY = 'homeEventBannerSwiper';

  // 홈 광고 라인 배너용 Swiper 키
  var LINE_AD_SWIPER_INSTANCE_KEY = 'homeLineAdBannerSwiper';

  // 브랜드 Pick 스와이퍼용 Swiper 키
  var BRAND_SWIPER_INSTANCE_KEY = 'homeBrandSwiper';

  // 상품 스와이퍼용 Swiper 키
  var PRODUCT_SWIPER_INSTANCE_KEY = 'homeProductSwiper';

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

    // Swiper 옵션 설정 (loop: 슬라이드 수가 slidesPerView + loopedSlides 이상이어야 동작)
    var slideCount = container.querySelectorAll('.swiper-slide').length;
    container[REAL_SLIDE_COUNT_KEY] = slideCount;
    var swiperOptions = {
      slidesPerView: 1.5,
      spaceBetween: 20, // 20px
      speed: 500,
      loop: true,
      loopAdditionalSlides: 0,
      centeredSlides: true, // loop + 중앙정렬: 슬라이드 4장 이상 필요 (현재 4그룹)
      watchSlidesProgress: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false
      },
      a11y: false,
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

    // loop 모드: realIndex 사용, 실제 슬라이드 수는 초기화 시 저장한 값(복제 제외)
    var isLoop = swiper.params && swiper.params.loop;
    var currentIndex = isLoop ? swiper.realIndex + 1 : swiper.activeIndex + 1;
    var totalSlides =
      isLoop && swiper.el && swiper.el[REAL_SLIDE_COUNT_KEY] != null
        ? swiper.el[REAL_SLIDE_COUNT_KEY]
        : swiper.slides.length;

    var progress = totalSlides > 0 ? Math.min(100, (currentIndex / totalSlides) * 100) : 0;

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
      delete targetContainer[REAL_SLIDE_COUNT_KEY];
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

  /**
   * 업종 맞춤 기획전 배너 Swiper 초기화
   * - 슬라이드가 3개 초과일 때만 Swiper 적용
   * - 다른 Swiper와 완전히 독립된 옵션/인스턴스로 관리
   */
  function initEventBannerSwiper() {
    var containers = document.querySelectorAll('.js-home-event-banner-swiper');
    if (!containers.length) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for event banner');
      return;
    }

    containers.forEach(function (container) {
      if (!container) {
        return;
      }

      // 슬라이드 개수 확인 (3개 이하면 Swiper 미적용, 정적인 리스트로 사용)
      var slides = container.querySelectorAll('.swiper-slide');
      var slideCount = slides.length;
      if (slideCount <= 3) {
        return;
      }

      // 이미 초기화된 경우 중복 실행 방지
      var existingInstance = container[EVENT_SWIPER_INSTANCE_KEY];
      if (existingInstance && typeof existingInstance.destroy === 'function') {
        return;
      }

      var prevButton = container.querySelector('.event-banner-nav-prev');
      var nextButton = container.querySelector('.event-banner-nav-next');

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 24,
        speed: 500,
        slidesPerGroup: 1, // 항상 1장씩 이동
        watchSlidesProgress: true,
        a11y: false,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false
        },
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
          disabledClass: 'swiper-button-disabled'
        }
      };

      try {
        var instance = new Swiper(container, options);
        container[EVENT_SWIPER_INSTANCE_KEY] = instance;
        console.log('[home-ui] Event banner swiper initialized');
      } catch (e) {
        console.error('[home-ui] Failed to initialize event banner swiper', e);
      }
    });
  }

  /**
   * 브랜드 Pick Swiper 초기화
   * - 브랜드가 3개 초과일 때만 Swiper 적용
   * - 브랜드 섹션을 가로로 스와이프할 수 있도록 구성
   */
  function initBrandSwiper() {
    var containers = document.querySelectorAll('.js-home-brand-swiper');
    if (!containers.length) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for brand swiper');
      return;
    }

    containers.forEach(function (container) {
      if (!container) {
        return;
      }

      // 브랜드 슬라이드 개수 확인 (3개 이하면 Swiper 미적용)
      var slides = container.querySelectorAll('.swiper-slide');
      var slideCount = slides.length;
      if (slideCount <= 3) {
        return;
      }

      // 이미 초기화된 경우 중복 실행 방지
      var existingInstance = container[BRAND_SWIPER_INSTANCE_KEY];
      if (existingInstance && typeof existingInstance.destroy === 'function') {
        return;
      }

      // 컨트롤러는 컨테이너 밖에 있으므로 상위 요소에서 찾기
      var wrapper = container.closest('.home-brand-swiper-wrapper');
      var prevButton = wrapper ? wrapper.querySelector('.home-brand-nav-prev') : null;
      var nextButton = wrapper ? wrapper.querySelector('.home-brand-nav-next') : null;

      var options = {
        slidesPerView: 3,
        spaceBetween: 24,
        speed: 500,
        slidesPerGroup: 1,
        watchSlidesProgress: true,
        a11y: false,
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
          disabledClass: 'swiper-button-disabled'
        }
      };

      try {
        var instance = new Swiper(container, options);
        container[BRAND_SWIPER_INSTANCE_KEY] = instance;
        console.log('[home-ui] Brand swiper initialized');
      } catch (e) {
        console.error('[home-ui] Failed to initialize brand swiper', e);
      }
    });
  }

  /**
   * 상품 스와이퍼 초기화
   * - data-desktop 속성으로 데스크톱에서 보여질 슬라이드 수 설정 (4 또는 5)
   * - 모바일에서는 1개씩 표시
   */
  function initProductSwiper() {
    var containers = document.querySelectorAll('.js-home-product-swiper');
    if (!containers.length) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for product swiper');
      return;
    }

    containers.forEach(function (container) {
      if (!container) {
        return;
      }

      // 슬라이드 개수 확인
      var slides = container.querySelectorAll('.swiper-slide');
      var slideCount = slides.length;

      // 슬라이드가 1개 이하면 Swiper 미적용
      if (slideCount <= 1) {
        return;
      }

      // 이미 초기화된 경우 중복 실행 방지
      var existingInstance = container[PRODUCT_SWIPER_INSTANCE_KEY];
      if (existingInstance && typeof existingInstance.destroy === 'function') {
        return;
      }

      // data-desktop 속성에서 데스크톱 슬라이드 수 읽기 (기본값: 4)
      var desktopSlides = parseInt(container.getAttribute('data-desktop'), 10) || 4;
      desktopSlides = Math.min(Math.max(desktopSlides, 1), 5); // 1~5 사이로 제한

      // 네비게이션 버튼 찾기 (상위 wrapper에서)
      var wrapper = container.closest('.home-product-swiper-wrapper');
      var prevButton = wrapper ? wrapper.querySelector('.home-product-swiper-nav-prev') : null;
      var nextButton = wrapper ? wrapper.querySelector('.home-product-swiper-nav-next') : null;

      var options = {
        slidesPerView: 1,
        spaceBetween: 16,
        speed: 500,
        slidesPerGroup: 1,
        watchSlidesProgress: true,
        a11y: false,
        breakpoints: {
          0: {
            slidesPerView: 4,
            spaceBetween: 16
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 20
          },
          1280: {
            slidesPerView: desktopSlides,
            spaceBetween: 24
          }
        },
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
          disabledClass: 'swiper-button-disabled'
        }
      };

      try {
        var instance = new Swiper(container, options);
        container[PRODUCT_SWIPER_INSTANCE_KEY] = instance;
        console.log('[home-ui] Product swiper initialized with desktop slides:', desktopSlides);
      } catch (e) {
        console.error('[home-ui] Failed to initialize product swiper', e);
      }
    });
  }

  /**
   * 홈 광고 라인 배너 Swiper 초기화
   * - 슬라이드가 2개 이상일 때만 Swiper 적용
   * - 항상 한 개씩만 이동
   */
  function initLineAdBannerSwiper() {
    var containers = document.querySelectorAll('.js-home-ad-banner-swiper');
    if (!containers.length) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for line ad banner');
      return;
    }

    containers.forEach(function (container) {
      if (!container) {
        return;
      }

      var slides = container.querySelectorAll('.swiper-slide');
      var slideCount = slides.length;

      // 슬라이드가 2개 미만이면 스와이프 미적용
      if (slideCount < 2) {
        return;
      }

      // 이미 초기화된 경우 중복 실행 방지
      var existingInstance = container[LINE_AD_SWIPER_INSTANCE_KEY];
      if (existingInstance && typeof existingInstance.destroy === 'function') {
        return;
      }

      // 네비게이션 버튼은 Swiper 컨테이너(.js-home-ad-banner-swiper) 밖에 있으므로
      // 상위 배너 요소에서 찾아 연결한다.
      var rootBanner = container.closest('.home-ad-banner.line-banner') || container.parentElement;
      var prevButton = rootBanner ? rootBanner.querySelector('.line-banner-nav-prev') : null;
      var nextButton = rootBanner ? rootBanner.querySelector('.line-banner-nav-next') : null;

      var options = {
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 500,
        loop: slideCount > 1,
        slidesPerGroup: 1, // 항상 1개씩 이동
        a11y: false,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false
        },
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
          disabledClass: 'swiper-button-disabled'
        }
      };

      try {
        var instance = new Swiper(container, options);
        container[LINE_AD_SWIPER_INSTANCE_KEY] = instance;
        console.log('[home-ui] Line ad banner swiper initialized');
      } catch (e) {
        console.error('[home-ui] Failed to initialize line ad banner swiper', e);
      }
    });
  }

  window.UI.homeUi = {
    init: function () {
      console.log('[home-ui] init');

      // DOM 로드 후 Swiper 초기화
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          initMainBannerSwiper();
          initEventBannerSwiper();
          initLineAdBannerSwiper();
          initBrandSwiper();
          initProductSwiper();
        });
      } else {
        initMainBannerSwiper();
        initEventBannerSwiper();
        initLineAdBannerSwiper();
        initBrandSwiper();
        initProductSwiper();
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
