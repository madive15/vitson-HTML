(function ($, window) {
  'use strict';

  if (!$) return;

  var SELECTOR = '.header-main-bar[data-ui="sticky"]';
  var SCROLL_WRAP = '.vm-content-wrap';
  var CLS_SCROLLED = 'is-scrolled';
  var CLS_HIDE_TOP = 'is-hide-top';
  var CLS_TOP = 'is-top';
  var CLS_BODY_SCROLL = 'is-body-scroll';
  var THRESHOLD = 5;

  var scrollEl = null;
  var wrapEl = null;
  var headerEl = null;
  var searchEl = null;
  var isBodyScroll = false;
  var direction = 'none';
  var lastScrollY = 0;
  var accumUp = 0;
  var accumDown = 0;
  var scrolledLocked = false;

  function getScrollY() {
    if (isBodyScroll) {
      return window.pageYOffset || document.documentElement.scrollTop;
    }
    return scrollEl.scrollTop;
  }

  function hideSearchAfterTransition() {
    if (!headerEl) return;

    function handler() {
      headerEl.removeEventListener('transitionend', handler);
      if (searchEl && wrapEl.classList.contains(CLS_SCROLLED)) {
        searchEl.style.display = 'none';
      }
    }

    headerEl.addEventListener('transitionend', handler);
  }

  function onScroll() {
    var y = getScrollY();
    var cl = wrapEl.classList;

    if (y <= 0) {
      if (isBodyScroll) {
        if (y < 0) return;
        cl.remove(CLS_HIDE_TOP);
        cl.add(CLS_TOP);
        if (searchEl) searchEl.style.display = '';
      } else {
        if (scrolledLocked) {
          lastScrollY = 0;
          return;
        }
        cl.remove(CLS_SCROLLED);
        cl.remove(CLS_HIDE_TOP);
      }
      direction = 'none';
      lastScrollY = 0;
      accumUp = 0;
      accumDown = 0;
      return;
    }

    if (isBodyScroll && cl.contains(CLS_TOP)) {
      cl.remove(CLS_TOP);
      cl.add(CLS_HIDE_TOP);
      direction = 'down';
      accumUp = 0;
      accumDown = 0;
      lastScrollY = y;
      hideSearchAfterTransition();
      return;
    }

    scrolledLocked = false;

    if (!cl.contains(CLS_SCROLLED)) {
      cl.add(CLS_SCROLLED);
      cl.add(CLS_HIDE_TOP);
      direction = 'down';
      accumUp = 0;
      accumDown = 0;
      lastScrollY = y;
      if (!isBodyScroll) scrolledLocked = true;
      return;
    }

    var delta = y - lastScrollY;
    lastScrollY = y;

    if (delta === 0) return;

    if (delta > 0) {
      accumDown += delta;
      accumUp = 0;
    } else {
      accumUp += Math.abs(delta);
      accumDown = 0;
    }

    if (direction !== 'down' && accumDown >= THRESHOLD) {
      direction = 'down';
      cl.add(CLS_HIDE_TOP);
      lastScrollY = getScrollY();
      accumUp = 0;
      accumDown = 0;
    } else if (direction !== 'up' && accumUp >= THRESHOLD) {
      direction = 'up';
      cl.remove(CLS_HIDE_TOP);
      lastScrollY = getScrollY();
      accumUp = 0;
      accumDown = 0;
    }
  }

  function reset() {
    if (isBodyScroll) {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove(CLS_BODY_SCROLL);
    } else if (scrollEl) {
      scrollEl.removeEventListener('scroll', onScroll);
    }

    if (wrapEl) {
      wrapEl.classList.remove(CLS_SCROLLED);
      wrapEl.classList.remove(CLS_HIDE_TOP);
      wrapEl.classList.remove(CLS_TOP);
    }

    if (searchEl) searchEl.style.display = '';

    scrollEl = null;
    wrapEl = null;
    headerEl = null;
    searchEl = null;
    isBodyScroll = false;
    direction = 'none';
    accumUp = 0;
    accumDown = 0;
    lastScrollY = 0;
    scrolledLocked = false;
  }

  window.stickyHeader = {
    init: function () {
      headerEl = $(SELECTOR)[0];

      if (!headerEl) return;

      searchEl = headerEl.querySelector('.header-main-search');

      var $test = $('.vm-wrap.test');

      // case 2: body 스크롤 (.vm-wrap.test)
      if ($test.length) {
        document.documentElement.classList.add(CLS_BODY_SCROLL);

        isBodyScroll = true;
        wrapEl = $test[0];
        scrollEl = null;
        lastScrollY = window.pageYOffset || 0;
        accumUp = 0;
        accumDown = 0;
        scrolledLocked = false;
        wrapEl.classList.add(CLS_TOP);
        window.addEventListener('scroll', onScroll, {passive: true});
        return;
      }

      // case 1: 내부 컨테이너 스크롤 (기존)
      isBodyScroll = false;
      scrollEl = $(SCROLL_WRAP)[0];

      if (!scrollEl) return;

      wrapEl = scrollEl;
      lastScrollY = scrollEl.scrollTop || 0;
      accumUp = 0;
      accumDown = 0;
      scrolledLocked = false;
      scrollEl.addEventListener('scroll', onScroll, {passive: true});
    },

    destroy: function () {
      reset();
    }
  };
})(window.jQuery, window);
