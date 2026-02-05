/**
 * @file mobile/ui/scroll-lock.js
 * @description 스크롤 잠금/해제 (팝업, 바텀시트 등)
 * @scope .vm-wrap
 * @state is-locked
 * @note
 *  - iOS: overflow hidden만으로 스크롤 차단 불가
 *  - position fixed + top 보정 + touchmove 차단으로 완전 잠금
 *  - touch-action: none + touchmove preventDefault 이중 차단
 *  - 해제 시 원래 스크롤 위치 복원
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var $wrap = null;
  var scrollY = 0;
  var isLocked = false;

  function preventTouch(e) {
    e.preventDefault();
  }

  function lock() {
    if (isLocked) return;
    if (!$wrap || !$wrap.length) $wrap = $('.vm-wrap');

    scrollY = window.pageYOffset || document.documentElement.scrollTop;
    $wrap.addClass('is-locked').css('top', -scrollY + 'px');
    document.addEventListener('touchmove', preventTouch, {passive: false});
    isLocked = true;
  }

  function unlock() {
    if (!isLocked) return;
    if (!$wrap || !$wrap.length) return;

    document.removeEventListener('touchmove', preventTouch);
    $wrap.removeClass('is-locked').css('top', '');
    window.scrollTo(0, scrollY);
    isLocked = false;
  }

  window.UI.scrollLock = {
    init: function () {
      $wrap = $('.vm-wrap');
    },
    destroy: function () {
      unlock();
      $wrap = null;
    },
    lock: lock,
    unlock: unlock,
    isLocked: function () {
      return isLocked;
    }
  };
})(window.jQuery || window.$, window, document);
