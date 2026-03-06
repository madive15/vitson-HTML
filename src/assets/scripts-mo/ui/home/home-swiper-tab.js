/**
 * @file scripts-mo/ui/home/home-swiper-tab.js
 * @description 홈 탭형 배너 Swiper (세로 리스트 + 가로 상품)
 * @scope [data-ui="banner-tab"]
 * @option data-autoplay — 콘텐츠 자동 재생 딜레이(ms)
 * @option data-type="hscroll" — 가로 스크롤 내부 Swiper 모드
 * @option data-menu-space-between — 탭 메뉴 간격(px, 기본 8) / inner 간격(px, 기본 10)
 * @option data-content-space-between — 콘텐츠 슬라이드 간격(px, 기본 0)
 * @option data-swipe-threshold — 경계 스와이프 감도(px, 기본 40)
 * @state swiper-slide-thumb-active — 활성 탭 표시
 * @state is-overflow — Swiper 끝 미도달 시 오른쪽 그라데이션 표시
 * @events click.bannerTab — 탭 클릭 바인딩 (destroy 시 해제)
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-tab"]';
  var DEFAULT_SWIPE_THRESHOLD = 40;
  var CLS_OVERFLOW = 'is-overflow';
  var TAB_GUTTER = 20;
  // 드래그 중 탭 클릭 오발 방지 임계값(px)
  var TAP_THRESHOLD = 5;

  // 공통 옵션 — observer 제거(동적 슬라이드 변경 없음)
  var commonOpts = {
    preventClicks: true,
    preventClicksPropagation: false
  };

  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  // 탭 활성 동기화 + 뷰포트 중앙 이동
  function syncTabActive(tabSwiper, idx) {
    var slides = tabSwiper.slides;
    for (var i = 0; i < slides.length; i++) {
      if (i === idx) {
        slides[i].classList.add('swiper-slide-thumb-active');
      } else {
        slides[i].classList.remove('swiper-slide-thumb-active');
      }
    }

    var slide = slides[idx];
    if (!slide) return;

    if (idx === 0) {
      tabSwiper.translateTo(0, 200);
      return;
    }

    var containerWidth = tabSwiper.el.clientWidth;
    var slideLeft = slide.offsetLeft;
    var slideWidth = slide.offsetWidth;
    // 그라데이션 가려짐 방지 — 활성 탭을 중앙에서 왼쪽으로 TAB_GUTTER만큼 추가 이동
    var centerOffset = slideLeft - containerWidth / 2 + slideWidth / 2 + TAB_GUTTER;

    var maxTranslate = tabSwiper.maxTranslate();
    var minTranslate = tabSwiper.minTranslate();
    var target = Math.max(maxTranslate, Math.min(minTranslate, -centerOffset));

    // 탭 이동 애니메이션 200ms로 경량화
    tabSwiper.translateTo(target, 200);
  }

  // Swiper 오버플로 그라데이션 바인딩
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;
    $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    swiper.on('reachEnd', function () {
      $target.removeClass(CLS_OVERFLOW);
    });
    swiper.on('fromEdge', function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    });
  }

  // 탭 Swiper 생성 — freeMode로 자유 드래그, 경계에서 터치 해제
  function createTabSwiper(el, spaceBetween) {
    return new Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: spaceBetween,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      watchSlidesProgress: true,
      freeMode: true,
      touchReleaseOnEdges: true
    });
  }

  // 탭 클릭(pointerup) 바인딩 — click보다 빠른 응답
  function bindTabTaps(tabSwiper, contentSwiper, isLoop) {
    var handlers = [];

    for (var i = 0; i < tabSwiper.slides.length; i++) {
      (function (idx) {
        var handler = function () {
          // 드래그 중 오발 방지
          if (Math.abs(tabSwiper.touches.diff) > TAP_THRESHOLD) return;
          if (isLoop) {
            contentSwiper.slideToLoop(idx);
          } else {
            contentSwiper.slideTo(idx);
          }
        };
        tabSwiper.slides[idx].addEventListener('pointerup', handler);
        handlers.push({el: tabSwiper.slides[idx], fn: handler});
      })(i);
    }

    return handlers;
  }

  // 탭 클릭 해제
  function unbindTabTaps(handlers) {
    for (var i = 0; i < handlers.length; i++) {
      handlers[i].el.removeEventListener('pointerup', handlers[i].fn);
    }
  }

  // 세로형(list) 초기화
  function initList($root, el) {
    var tabEl = $root.find('.tab-swiper-menus > .swiper')[0];
    var contentEl = $root.find('.tab-swiper-content > .swiper')[0];
    if (!tabEl || !contentEl) return;

    var tabSwiper = createTabSwiper(tabEl, getInt(el, 'menu-space-between') || 8);

    // 탭 메뉴 그라데이션
    bindOverflow(tabSwiper, $root.find('[data-role="menu-overflow"]'));

    var contentSwiper = new Swiper(
      contentEl,
      $.extend({}, commonOpts, {
        slidesPerView: 1,
        spaceBetween: getInt(el, 'content-space-between') || 0,
        loop: true,
        allowTouchMove: true,
        thumbs: {swiper: tabSwiper},
        on: {
          slideChange: function (swiper) {
            syncTabActive(tabSwiper, swiper.realIndex);
          }
        }
      })
    );

    // 탭 클릭 — pointerup으로 빠른 응답
    var tapHandlers = bindTabTaps(tabSwiper, contentSwiper, true);

    var autoplayVal = getInt(el, 'autoplay');
    if (autoplayVal) {
      contentSwiper.params.autoplay = {delay: autoplayVal, disableOnInteraction: false};
      contentSwiper.autoplay.start();
    }

    $root.data('tabSwiper', tabSwiper);
    $root.data('contentSwiper', contentSwiper);
    $root.data('tapHandlers', tapHandlers);
  }

  // 가로형(hscroll) 초기화
  function initHscroll($root, el) {
    var tabEl = $root.find('.tab-swiper-menus > .swiper')[0];
    var contentEl = $root.find('.tab-swiper-content > .swiper')[0];
    if (!tabEl || !contentEl) return;

    var totalTabs = tabEl.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide').length;
    var swipeThreshold = getInt(el, 'swipe-threshold') || DEFAULT_SWIPE_THRESHOLD;

    var tabSwiper = createTabSwiper(tabEl, getInt(el, 'menu-space-between') || 8);

    // 탭 메뉴 그라데이션
    bindOverflow(tabSwiper, $root.find('[data-role="menu-overflow"]'));

    var innerSwipers = [];

    var contentSwiper = new Swiper(
      contentEl,
      $.extend({}, commonOpts, {
        slidesPerView: 1,
        spaceBetween: getInt(el, 'content-space-between') || 0,
        loop: false,
        allowTouchMove: false,
        thumbs: {swiper: tabSwiper},
        on: {
          // 전환 시작 시점에 탭 동기화 + inner 리셋 (전환 완료 대기 불필요)
          slideChange: function (swiper) {
            syncTabActive(tabSwiper, swiper.activeIndex);
            var targetInner = innerSwipers[swiper.activeIndex];
            if (targetInner) targetInner.slideTo(0, 0);
          }
        }
      })
    );

    // 내부 가로 Swiper 초기화
    var innerSpaceBetween = getInt(el, 'content-space-between') || 10;
    var $contentOverflow = $root.find('[data-role="content-overflow"]');
    $root.find('[data-role="inner-swiper"] .swiper').each(function (i, innerEl) {
      var touchStartX = 0;
      var wasAtEnd = false;
      var wasAtBeginning = false;

      var inner = new Swiper(innerEl, {
        slidesPerView: 'auto',
        spaceBetween: innerSpaceBetween,
        nested: true,
        preventClicks: true,
        preventClicksPropagation: false,
        on: {
          touchStart: function (swiper, e) {
            var touch = (e.touches && e.touches[0]) || e;
            if (typeof touch.clientX !== 'number') return;
            touchStartX = touch.clientX;
            // 터치 시작 시점의 경계 상태 저장 — 2번 스와이프 판정용
            wasAtEnd = swiper.isEnd;
            wasAtBeginning = swiper.isBeginning;
          },
          touchEnd: function (swiper, e) {
            var touch = (e.changedTouches && e.changedTouches[0]) || e;
            if (typeof touch.clientX !== 'number') return;
            var diff = touchStartX - touch.clientX;

            if (totalTabs <= 1) return;

            var currentIdx = contentSwiper.activeIndex;

            // 왼쪽 스와이프 + 시작·끝 모두 끝 상태 → 다음 탭
            if (diff > swipeThreshold && wasAtEnd && swiper.isEnd) {
              var next = (currentIdx + 1) % totalTabs;
              contentSwiper.slideTo(next);
              syncTabActive(tabSwiper, next);
            }

            // 오른쪽 스와이프 + 시작·끝 모두 처음 상태 → 이전 탭
            if (diff < -swipeThreshold && wasAtBeginning && swiper.isBeginning) {
              var prev = (currentIdx - 1 + totalTabs) % totalTabs;
              contentSwiper.slideTo(prev);
              syncTabActive(tabSwiper, prev);
            }
          }
        }
      });

      // 내부 상품 그라데이션
      bindOverflow(inner, $contentOverflow);
      innerSwipers.push(inner);
    });

    // 탭 클릭 — pointerup으로 빠른 응답
    var tapHandlers = bindTabTaps(tabSwiper, contentSwiper, false);

    $root.data('tabSwiper', tabSwiper);
    $root.data('contentSwiper', contentSwiper);
    $root.data('innerSwipers', innerSwipers);
    $root.data('tapHandlers', tapHandlers);
  }

  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;

      var type = $root.attr('data-type');

      if (type === 'hscroll') {
        initHscroll($root, el);
      } else {
        initList($root, el);
      }

      $root.data('init', true);
    });
  }

  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;

      // pointerup 핸들러 해제
      var tapHandlers = $root.data('tapHandlers') || [];
      unbindTabTaps(tapHandlers);

      // 그라데이션 클래스 제거
      $root.find('[data-role="menu-overflow"]').removeClass(CLS_OVERFLOW);
      $root.find('[data-role="content-overflow"]').removeClass(CLS_OVERFLOW);

      var innerSwipers = $root.data('innerSwipers') || [];
      for (var i = 0; i < innerSwipers.length; i++) {
        if (innerSwipers[i]) innerSwipers[i].destroy(true, true);
      }

      var contentSwiper = $root.data('contentSwiper');
      var tabSwiper = $root.data('tabSwiper');
      if (contentSwiper) contentSwiper.destroy(true, true);
      if (tabSwiper) tabSwiper.destroy(true, true);

      $root.removeData('tabSwiper');
      $root.removeData('contentSwiper');
      $root.removeData('innerSwipers');
      $root.removeData('tapHandlers');
      $root.removeData('init');
    });
  }

  window.UI = window.UI || {};
  window.UI.homeSwiperTab = {init: init, destroy: destroy};
})(window.jQuery);
