/**
 * @file scripts-mo/ui/header/sticky-header.js
 * @description 메인 헤더 스크롤 동작
 * @scope .header-main-bar[data-ui="sticky"]
 * @state
 *   is-top       : 최상단 → 전부 노출
 *   is-show-top  : 스크롤 업 → top-bar+GNB 노출, search 숨김
 *   (없음)       : 기본 → sticky 음수 top, GNB만 걸림
 * @note
 *   - rAF 배칭으로 DOM 조작 최소화
 *   - THRESHOLD(5px) 미만 미세 움직임 무시 → 떨림 방지
 *   - touch: window (iOS Chrome 대응)
 *   - scroll/wheel: .vm-content-wrap
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  var SELECTOR = '.header-main-bar[data-ui="sticky"]';
  var SCROLL_WRAP = '.vm-content-wrap';
  var CLS_TOP = 'is-top';
  var CLS_SHOW_TOP = 'is-show-top';
  // 방향 전환 최소 이동량 (px) — 미세 떨림 무시
  var THRESHOLD = 5;

  var el = null;
  var scrollEl = null;
  var direction = 'none';
  var rafId = 0;
  var dirty = false;

  // touch 누적 거리
  var touchAccum = 0;
  var touchLastY = 0;

  // scroll 누적 거리
  var scrollAccum = 0;
  var lastScrollY = 0;

  // rAF 콜백 — 프레임당 최대 1회 DOM 조작
  function flush() {
    rafId = 0;

    if (!dirty) return;
    dirty = false;

    var scrollY = scrollEl.scrollTop;
    var cl = el.classList;

    if (scrollY <= 0) {
      cl.add(CLS_TOP);
      cl.remove(CLS_SHOW_TOP);
      direction = 'none';
      return;
    }

    cl.remove(CLS_TOP);

    if (direction === 'up') {
      cl.add(CLS_SHOW_TOP);
    } else {
      cl.remove(CLS_SHOW_TOP);
    }
  }

  function scheduleUpdate() {
    dirty = true;
    if (!rafId) {
      rafId = requestAnimationFrame(flush);
    }
  }

  // 방향 판정 — threshold 초과 시에만 전환
  function resolveDirection(accum) {
    var newDir = accum > 0 ? 'down' : 'up';

    if (newDir === direction) return;
    direction = newDir;
    scheduleUpdate();
  }

  // touch 핸들러
  function onTouchStart(e) {
    if (e.touches[0]) {
      touchLastY = e.touches[0].clientY;
      touchAccum = 0;
    }
  }

  function onTouchMove(e) {
    if (!e.touches[0]) return;

    var y = e.touches[0].clientY;
    var delta = touchLastY - y;

    touchLastY = y;
    if (delta === 0) return;

    // 최상단 체크
    if (scrollEl.scrollTop <= 0) {
      if (direction !== 'none') {
        direction = 'none';
        scheduleUpdate();
      }
      touchAccum = 0;
      return;
    }

    // 같은 방향이면 누적, 반대 방향이면 리셋
    if ((touchAccum > 0 && delta > 0) || (touchAccum < 0 && delta < 0)) {
      touchAccum += delta;
    } else {
      touchAccum = delta;
    }

    if (Math.abs(touchAccum) >= THRESHOLD) {
      resolveDirection(touchAccum);
    }
  }

  // scroll/wheel 핸들러
  function onScroll() {
    var y = scrollEl.scrollTop;

    if (y <= 0) {
      if (direction !== 'none') {
        direction = 'none';
        scheduleUpdate();
      }
      lastScrollY = 0;
      scrollAccum = 0;
      return;
    }

    var delta = y - lastScrollY;

    lastScrollY = y;
    if (delta === 0) return;

    if ((scrollAccum > 0 && delta > 0) || (scrollAccum < 0 && delta < 0)) {
      scrollAccum += delta;
    } else {
      scrollAccum = delta;
    }

    if (Math.abs(scrollAccum) >= THRESHOLD) {
      resolveDirection(scrollAccum);
    }
  }

  window.stickyHeader = {
    init: function () {
      var $el = $(SELECTOR);

      if (!$el.length) return;

      el = $el[0];
      scrollEl = $(SCROLL_WRAP)[0];

      if (!scrollEl) return;

      lastScrollY = scrollEl.scrollTop || 0;
      scrollAccum = 0;
      touchAccum = 0;

      if (lastScrollY <= 0) {
        el.classList.add(CLS_TOP);
      }

      window.addEventListener('touchstart', onTouchStart, {passive: true});
      window.addEventListener('touchmove', onTouchMove, {passive: true});
      scrollEl.addEventListener('scroll', onScroll, {passive: true});
      scrollEl.addEventListener('wheel', onScroll, {passive: true});
    },

    destroy: function () {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      if (scrollEl) {
        scrollEl.removeEventListener('scroll', onScroll);
        scrollEl.removeEventListener('wheel', onScroll);
      }

      if (el) {
        el.classList.remove(CLS_TOP);
        el.classList.remove(CLS_SHOW_TOP);
      }

      el = null;
      scrollEl = null;
      dirty = false;
      direction = 'none';
    }
  };
})(window.jQuery, window);
