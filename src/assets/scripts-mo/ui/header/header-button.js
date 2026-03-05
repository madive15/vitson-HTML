/**
 * @file scripts-mo/ui/header/header-button.js
 * @description 헤더 버튼 뱃지 카운트 관리
 * @scope [data-header-badge="count"]
 *
 * @state is-hidden (뱃지 숨김), is-single/is-double/is-over (자릿수)
 *
 * @note
 *   - init 시 MutationObserver로 .num 텍스트 변경 자동 감지
 *   - 99 초과 시 99+ 표시, 0이면 뱃지 숨김
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var SEL = {
    badge: '[data-header-badge="count"]',
    num: '.num'
  };

  var CLS = {
    hidden: 'is-hidden',
    single: 'is-single',
    double: 'is-double',
    over: 'is-over'
  };

  var MAX_COUNT = 99;
  var _observers = [];

  function syncBadge($badge, $num) {
    var text = $.trim($num.text());
    var raw = text === MAX_COUNT + '+' ? MAX_COUNT + 1 : parseInt(text, 10) || 0;
    var display = raw > MAX_COUNT ? MAX_COUNT + '+' : String(raw);

    if (text !== display) {
      $num.text(display);
    }

    $badge
      .toggleClass(CLS.single, raw > 0 && raw < 10)
      .toggleClass(CLS.double, raw >= 10 && raw <= MAX_COUNT)
      .toggleClass(CLS.over, raw > MAX_COUNT)
      .toggleClass(CLS.hidden, raw === 0);
  }

  function init() {
    $(SEL.badge).each(function () {
      var $badge = $(this);
      var $num = $badge.find(SEL.num);
      if (!$num.length) return;

      syncBadge($badge, $num);

      var observer = new MutationObserver(function () {
        syncBadge($badge, $num);
      });

      observer.observe($num[0], {
        childList: true,
        characterData: true,
        subtree: true
      });

      _observers.push(observer);
    });
  }

  function destroy() {
    _observers.forEach(function (obs) {
      obs.disconnect();
    });
    _observers = [];
  }

  window.headerButton = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
