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

  // 업종 맞춤 기획전 배너용 Swiper 키
  var EVENT_SWIPER_INSTANCE_KEY = 'homeEventBannerSwiper';

  // 홈 광고 라인 배너용 Swiper 키
  var LINE_AD_SWIPER_INSTANCE_KEY = 'homeLineAdBannerSwiper';

  // 브랜드 Pick 스와이퍼용 Swiper 키
  var BRAND_SWIPER_INSTANCE_KEY = 'homeBrandSwiper';

  // 상품 스와이퍼용 Swiper 키
  var PRODUCT_SWIPER_INSTANCE_KEY = 'homeProductSwiper';

  // 레전드 상품 스와이퍼용 Swiper 키
  var LEGEND_SWIPER_INSTANCE_KEY = 'homeLegendSwiper';

  // 인기 카테고리 수직 순위용 Swiper 키
  var VERTICAL_RANK_SWIPER_INSTANCE_KEY = 'homeVerticalRankSwiper';

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

    var prevButton = container.querySelector('.banner-nav-prev');
    var nextButton = container.querySelector('.banner-nav-next');
    var toggleButton = container.querySelector('.banner-progress-toggle');

    var swiperOptions = {
      slidesPerView: 'auto',
      spaceBetween: 20,
      speed: 500,
      loop: true,
      loopPreventsSliding: true, // 전환 중에는 다음/이전 입력 무시 → 건너뛰기 방지
      loopAdditionalSlides: 2, // 루프 시 복제 슬라이드 수 → 끝에서 끊기지 않고 이어지도록
      roundLengths: true, // 슬라이드 위치를 정수로 맞춰 루프 시 끊김/건너뛰기 완화
      initialSlide: 1, // 두 번째 슬라이드(인덱스 1)부터 시작
      watchSlidesProgress: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      // a11y: false,
      pagination: {
        el: container.querySelector('.banner-pagination-bar'),
        clickable: true,
        type: 'bullets'
      },
      navigation: {
        nextEl: nextButton,
        prevEl: prevButton,
        disabledClass: 'swiper-button-disabled'
      },
      on: {
        init: function (swiper) {
          updatePlayPauseState(swiper, toggleButton);
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

      // nav 버튼은 event-banner-container 밖에 있으므로 부모(.vits-home-event-banner)에서 탐색
      var section = container.closest('.vits-home-event-banner');
      if (!section) {
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

      var prevButton = section.querySelector('.event-banner-nav-prev');
      var nextButton = section.querySelector('.event-banner-nav-next');

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 24,
        speed: 500,
        slidesPerGroup: 1, // 항상 1장씩 이동
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
   * 레전드 상품 Swiper 초기화 (Grid 모드)
   */
  function initLegendSwiper() {
    var containers = document.querySelectorAll('.js-home-product-legend-swiper');
    if (!containers.length) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for legend swiper');
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
      var existingInstance = container[LEGEND_SWIPER_INSTANCE_KEY];
      if (existingInstance && typeof existingInstance.destroy === 'function') {
        return;
      }

      // 네비게이션 버튼 찾기 (상위 wrapper에서)
      var wrapper = container.closest('.legend-wrapper');
      var prevButton = wrapper ? wrapper.querySelector('.legend-nav-prev') : null;
      var nextButton = wrapper ? wrapper.querySelector('.legend-nav-next') : null;

      var options = {
        slidesPerView: 4,
        spaceBetween: 16,
        speed: 500,
        slidesPerGroup: 1,
        grid: {
          rows: 2,
          fill: 'row'
        },
        watchSlidesProgress: true,
        a11y: false,
        breakpoints: {
          0: {
            slidesPerView: 4,
            spaceBetween: 20,
            slidesPerGroup: 4,
            grid: {
              rows: 2,
              fill: 'row'
            }
          },
          1280: {
            slidesPerView: 4,
            spaceBetween: 24,
            slidesPerGroup: 8,
            grid: {
              rows: 2,
              fill: 'row'
            }
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
        container[LEGEND_SWIPER_INSTANCE_KEY] = instance;
        console.log('[home-ui] Legend swiper initialized with grid');
      } catch (e) {
        console.error('[home-ui] Failed to initialize legend swiper', e);
      }
    });
  }

  /**
   * 인기 카테고리 수직 순위 Swiper 초기화
   * - vertical 방향, 5개씩 표시
   * - autoplay, 6번(인덱스5) 이상일 때 ② 활성화
   * - 순위 클릭/슬라이드 시 좌측 상품 노출
   */
  function initVerticalRankSwiper() {
    var container = document.querySelector('.js-home-rank-swiper');
    if (!container) {
      return;
    }

    if (!Swiper) {
      console.error('[home-ui] Swiper is not available for vertical rank');
      return;
    }

    var existingInstance = container[VERTICAL_RANK_SWIPER_INSTANCE_KEY];
    if (existingInstance && typeof existingInstance.destroy === 'function') {
      return;
    }

    var block = container.closest('.home-rank');
    var productGroups = block ? block.querySelectorAll('.home-rank-product-group') : [];
    var rankItems = block ? block.querySelectorAll('.home-rank-item') : [];
    var pageBtns = block ? block.querySelectorAll('.home-rank-page-btn') : [];

    var initialIndex = parseInt(container.getAttribute('data-initial-index'), 10) || 0;

    function setActiveRank(index) {
      productGroups.forEach(function (grp, i) {
        var isActive = i === index;
        grp.classList.toggle('is-active', isActive);
        grp.setAttribute('aria-hidden', !isActive);
      });
      rankItems.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
      });
      // 6번(인덱스5) 이상일 때 ② 활성화
      var pageIndex = index >= 5 ? 1 : 0;
      pageBtns.forEach(function (btn, i) {
        var isActive = i === pageIndex;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive);
      });
    }

    var RANK_SPACE_BETWEEN = 24;

    // groupIndex: 0 = 1~5번, 1 = 6~10번 — 해당 그룹 높이로만 컨테이너 높이 설정
    function setRankSwiperHeight(groupIndex) {
      var slides = container.querySelectorAll('.swiper-slide');
      if (!slides.length) {
        return;
      }
      function groupHeight(startIndex, count) {
        var sum = 0;
        for (var i = 0; i < count && startIndex + i < slides.length; i++) {
          sum += slides[startIndex + i].offsetHeight;
        }
        return sum + (count - 1) * RANK_SPACE_BETWEEN;
      }
      var start = groupIndex === 0 ? 0 : 5;
      var count = groupIndex === 0 ? 5 : Math.min(5, slides.length - 5);
      var height = count > 0 ? groupHeight(start, count) : groupHeight(0, 5);
      container.style.height = height + 'px';
    }

    var options = {
      direction: 'vertical',
      slidesPerView: 5,
      spaceBetween: RANK_SPACE_BETWEEN,
      speed: 400,
      initialSlide: initialIndex,
      a11y: false,
      allowTouchMove: false,
      on: {
        init: function (swiper) {
          setActiveRank(swiper.activeIndex);
          requestAnimationFrame(function () {
            setRankSwiperHeight(swiper.activeIndex >= 5 ? 1 : 0);
          });
        },
        slideChange: function (swiper) {
          setActiveRank(swiper.activeIndex);
        }
      }
    };

    try {
      var instance = new Swiper(container, options);
      container[VERTICAL_RANK_SWIPER_INSTANCE_KEY] = instance;

      // 1→2→…→10→1 순으로 active 순환, 5→6 / 10→1 구간에서만 스와이퍼 그룹 전환
      var currentActiveIndex = initialIndex;
      var RANK_AUTOPLAY_DELAY = 3000;
      var rankAutoplayTimer;
      var totalRanks = 10;

      var getNextRankIndex = function () {
        return (currentActiveIndex + 1) % totalRanks;
      };

      var startRankAutoplay = function () {
        clearInterval(rankAutoplayTimer);
        rankAutoplayTimer = setInterval(function () {
          var next = getNextRankIndex();
          currentActiveIndex = next;
          setActiveRank(next);
          // 6번(인덱스5)으로 넘어갈 때 ② 구간으로, 1번(인덱스0)으로 넘어갈 때 ① 구간으로 스와이퍼 이동 + 높이 재계산
          if (next === 0) {
            instance.slideTo(0);
            setRankSwiperHeight(0);
          } else if (next === 5) {
            instance.slideTo(5);
            setRankSwiperHeight(1);
          }
        }, RANK_AUTOPLAY_DELAY);
      };

      startRankAutoplay();

      // ① ② 버튼 클릭: 해당 그룹으로 이동, 그룹 높이 재계산, 그룹 첫 번째부터 active 순환
      pageBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var page = parseInt(btn.getAttribute('data-page'), 10);
          var targetIndex = page === 0 ? 0 : 5;
          instance.slideTo(targetIndex);
          setRankSwiperHeight(page);
          currentActiveIndex = targetIndex;
          setActiveRank(targetIndex);
          startRankAutoplay();
        });
      });

      // 순위 항목 클릭: active만 변경, 해당 그룹 안에서 순환 재개
      rankItems.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-rank-index'), 10);
          currentActiveIndex = idx;
          setActiveRank(idx);
          startRankAutoplay();
        });
      });

      // 리사이즈 시 현재 보고 있는 그룹(1~5 / 6~10) 기준으로 높이 재계산
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          setRankSwiperHeight(instance.activeIndex >= 5 ? 1 : 0);
        }, 100);
      });

      console.log('[home-ui] Vertical rank swiper initialized');
    } catch (e) {
      console.error('[home-ui] Failed to initialize vertical rank swiper', e);
    }
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
          initLegendSwiper();
          initVerticalRankSwiper();
        });
      } else {
        initMainBannerSwiper();
        initEventBannerSwiper();
        initLineAdBannerSwiper();
        initBrandSwiper();
        initProductSwiper();
        initLegendSwiper();
        initVerticalRankSwiper();
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
