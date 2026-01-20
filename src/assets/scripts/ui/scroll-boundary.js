/**
 * @file scripts/ui/scroll-boundary.js
 * @purpose 스크롤 overflow 감지 후 경계 라인 표시 클래스 제어
 * @description
 *  - 대상: [data-scroll-boundary] (특정 영역만 적용)
 *  - 기준: scrollHeight > clientHeight (세로 스크롤 기준)
 *  - 표시: is-scrollable 클래스가 있을 때만 경계 라인(::after 등) 노출(CSS 담당)
 * @option
 *  - data-scroll-axis="y|x|both" : 감지 축(기본 y)
 *  - data-scroll-class="className" : 토글 클래스 커스텀(기본 is-scrollable)
 * @event
 *  - window resize 시 refresh 수행
 *  - (지원 시) ResizeObserver로 컨테이너 크기 변화 감지 후 갱신
 * @maintenance
 *  - 페이지별 분기 금지(대상은 data-로만 지정)
 *  - 스타일 표현은 CSS에서만 처리(여기서는 클래스 토글만)
 *  - init은 1회 호출 전제(중복 바인딩 방지)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[scroll-boundary] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var DEFAULT_SELECTOR = '[data-scroll-boundary]';
  var DEFAULT_CLASS = 'is-scrollable';
  var BOUND_KEY = 'scrollBoundaryBound';

  // hasOverflow: 지정 축 기준 overflow 여부 판정
  function hasOverflow(el, axis) {
    if (axis === 'x') return el.scrollWidth > el.clientWidth;
    if (axis === 'both') return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    return el.scrollHeight > el.clientHeight; // 기본 y
  }

  // updateOne: overflow 여부에 따라 클래스 토글
  function updateOne($el) {
    var el = $el.get(0);
    if (!el) return;

    var axis = $el.attr('data-scroll-axis') || 'y';
    var className = $el.attr('data-scroll-class') || DEFAULT_CLASS;

    $el.toggleClass(className, hasOverflow(el, axis));
  }

  // bindResizeObserver: 요소 크기 변경 감지(지원 브라우저)
  function bindResizeObserver($targets) {
    if (!('ResizeObserver' in window)) return null;

    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        updateOne($(entry.target));
      });
    });

    $targets.each(function () {
      ro.observe(this);
    });

    return ro;
  }

  window.UI.scrollBoundary = {
    // init: [data-scroll-boundary] 대상 수집 후 감지/바인딩
    init: function () {
      // 중복 초기화 방지(공통 init이 여러 번 호출되는 사고 대응)
      if ($('body').data(BOUND_KEY) === true) return;
      $('body').data(BOUND_KEY, true);

      var $targets = $(DEFAULT_SELECTOR);
      if (!$targets.length) return;

      // 최초 1회 판정
      $targets.each(function () {
        updateOne($(this));
      });

      // 리사이즈 시 재판정
      $(window).on('resize.uiScrollBoundary', function () {
        $targets.each(function () {
          updateOne($(this));
        });
      });

      // 요소 자체 리사이즈(컨텐츠/레이아웃 변화) 대응
      bindResizeObserver($targets);

      console.log('[scroll-boundary] init');
    },

    // refresh: 필요 시 외부에서 강제 갱신(동적 렌더링 대응)
    refresh: function () {
      var $targets = $(DEFAULT_SELECTOR);
      if (!$targets.length) return;

      $targets.each(function () {
        updateOne($(this));
      });
      console.log('[scroll-boundary] refresh');
    }
  };

  console.log('[scroll-boundary] module loaded');
})(window.jQuery || window.$, window);
