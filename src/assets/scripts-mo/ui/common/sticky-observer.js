/**
 * @file scripts-mo/ui/common/sticky-observer.js
 * @description data-ui="sticky" 요소의 스티키 상태 감지 → is-sticky 클래스 토글
 * @scope [data-ui="sticky"]
 * @state is-sticky: 요소가 스티키 상태일 때 추가
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var STICKY = '[data-ui="sticky"]';
  var ACTIVE = 'is-sticky';

  // 개별 요소에 sentinel 삽입 + observer 등록
  function observe($el) {
    if ($el.data('sticky-bound')) return;
    $el.data('sticky-bound', true);

    var sentinel = $('<div>').css({height: 0, margin: 0, padding: 0});
    sentinel.insertBefore($el);

    // sticky top 값만큼 rootMargin 보정
    var topOffset = parseInt($el.css('top'), 10) || 0;

    var observer = new IntersectionObserver(
      function (entries) {
        $el.toggleClass(ACTIVE, !entries[0].isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-' + topOffset + 'px 0px 0px 0px'
      }
    );

    observer.observe(sentinel[0]);
  }

  window.UI.stickyObserver = {
    init: function () {
      $(STICKY).each(function () {
        observe($(this));
      });
    }
  };
})(window.jQuery, window);
