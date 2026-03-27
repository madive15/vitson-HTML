/**
 * @file scripts-mo/ui/common/pull-refresh.js
 * @description 모바일 커스텀 pull-to-refresh (내부 스크롤 컨테이너용)
 * @scope .vm-content-wrap
 * @mapping .vm-wrap (상태 클래스 부여 대상)
 * @state is-pull-refreshing: 당기는 중
 * @state is-pull-triggered: 임계값 초과 (놓으면 새로고침)
 * @note
 *  - body 스크롤이 아닌 .vm-content-wrap 내부 스크롤 환경에서
 *    브라우저 기본 pull-to-refresh가 동작하지 않는 문제를 보완한다.
 *  - --pull-distance CSS 변수로 당김 거리 전달 (스피너 연동용)
 *  - init(): 멱등성 보장
 *  - destroy(): DOM 제거 전 호출 권장
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var STATE = {
    PULLING: 'is-pull-refreshing',
    TRIGGERED: 'is-pull-triggered'
  };

  var SELECTOR = {
    SCROLL_CONTAINER: '.vm-content-wrap',
    WRAP: '.vm-wrap'
  };

  var INTERNAL = {
    THRESHOLD: 80,
    MAX_PULL: 120,
    RESISTANCE: 0.4
  };

  var CSS_VAR = '--pull-distance';

  var $scrollContainer = null;
  var $wrap = null;
  var isBound = false;
  var isRefreshing = false;
  var startY = 0;
  var pullDistance = 0;
  var isTouching = false;

  // 옵션 (init 시 덮어쓰기 가능)
  var opts = {
    onRefresh: null
  };

  // 스크롤 컨테이너 캐싱
  function getScrollContainer() {
    if (!$scrollContainer || !$scrollContainer.length) {
      $scrollContainer = $(SELECTOR.SCROLL_CONTAINER)
        .not(function () {
          return this.closest('.vm-search-overlay');
        })
        .first();
    }
    return $scrollContainer;
  }

  // 래퍼 캐싱
  function getWrap() {
    if (!$wrap || !$wrap.length) {
      $wrap = getScrollContainer().closest(SELECTOR.WRAP);
    }
    return $wrap;
  }

  // UI 리셋
  function resetUI() {
    pullDistance = 0;
    var wrap = getWrap();
    if (wrap.length) {
      wrap.removeClass(STATE.PULLING).removeClass(STATE.TRIGGERED);
      wrap[0].style.removeProperty(CSS_VAR);
    }
  }

  // 새로고침 트리거
  function trigger() {
    isRefreshing = true;

    if (typeof opts.onRefresh === 'function') {
      // 비동기 완료 후 done() 호출
      opts.onRefresh(function () {
        isRefreshing = false;
        resetUI();
      });
    } else {
      location.reload();
    }
  }

  // --- 터치 핸들러 ---
  function onTouchStart(e) {
    if (isRefreshing) return;

    var el = getScrollContainer()[0];
    if (!el || el.scrollTop > 0) return;

    startY = e.touches[0].clientY;
    isTouching = true;
    pullDistance = 0;
  }

  function onTouchMove(e) {
    if (!isTouching || isRefreshing) return;

    var el = getScrollContainer()[0];
    if (!el) return;

    var delta = e.touches[0].clientY - startY;

    // 위로 스와이프는 무시
    if (delta <= 0) {
      resetUI();
      return;
    }

    // 스크롤이 내려간 상태에서 시작된 터치 무시
    if (el.scrollTop > 0) {
      isTouching = false;
      return;
    }

    // 당기는 중 기본 스크롤 차단
    e.preventDefault();

    // 저항 적용
    pullDistance = Math.min(delta * INTERNAL.RESISTANCE, INTERNAL.MAX_PULL);

    var wrap = getWrap();
    wrap.addClass(STATE.PULLING);

    if (pullDistance >= INTERNAL.THRESHOLD) {
      wrap.addClass(STATE.TRIGGERED);
    } else {
      wrap.removeClass(STATE.TRIGGERED);
    }

    // CSS 변수로 당김 거리 전달
    wrap[0].style.setProperty(CSS_VAR, pullDistance + 'px');
  }

  function onTouchEnd() {
    if (!isTouching) return;
    isTouching = false;

    if (pullDistance >= INTERNAL.THRESHOLD && !isRefreshing) {
      trigger();
    } else {
      resetUI();
    }
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (isBound) return;

    var el = getScrollContainer()[0];
    if (!el) return;

    isBound = true;
    // passive: false — 당기는 중 preventDefault 필요
    el.addEventListener('touchstart', onTouchStart, {passive: true});
    el.addEventListener('touchmove', onTouchMove, {passive: false});
    el.addEventListener('touchend', onTouchEnd, {passive: true});
  }

  // 이벤트 해제
  function unbindEvents() {
    if (!isBound) return;
    isBound = false;

    var el = getScrollContainer()[0];
    if (!el) return;

    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  }

  window.UI.pullRefresh = {
    /**
     * @param {Object} [options]
     * @option {Function} [onRefresh] - 커스텀 새로고침 콜백. done()을 인자로 받음.
     *         null이면 location.reload() 실행.
     */
    init: function (options) {
      if (isBound) return;
      $.extend(opts, options);
      bindEvents();
    },

    destroy: function () {
      unbindEvents();
      resetUI();
      $scrollContainer = null;
      $wrap = null;
      isRefreshing = false;
      isTouching = false;
    }
  };
})(window.jQuery, window);
