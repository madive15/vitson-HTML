/**
 * @file scripts-mo/ui/common/expand.js
 * @description data-속성 기반 텍스트 더보기(expand/collapse) (모바일)
 * @scope [data-expand]
 *
 * @mapping [data-expand-btn] ↔ [data-expand-text]
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @note
 *  - 텍스트가 넘치지 않으면 버튼 자동 숨김 (hidden)
 *  - ResizeObserver로 레이아웃 변경 시 넘침 여부 자동 재판별
 *
 * @a11y aria-expanded 제어
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiExpand';
  var ROOT = '[data-expand]';
  var TEXT = '[data-expand-text]';
  var BTN = '[data-expand-btn]';
  var ACTIVE = 'is-open';

  var _bound = false;
  var _observers = []; // destroy 시 해제용

  // 텍스트 넘침 여부 체크 → 버튼 노출 제어
  function checkOverflow($root) {
    var $text = $root.find(TEXT);
    var $btn = $root.find(BTN);
    if (!$text.length || !$btn.length) return;

    // 펼친 상태면 체크 생략
    if ($root.hasClass(ACTIVE)) return;

    var sw = $text[0].scrollWidth;
    var cw = $text[0].clientWidth;

    // 레이아웃 미계산 상태면 건너뜀
    if (sw === 0 && cw === 0) return;

    $btn.prop('hidden', sw <= cw);
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 버튼 클릭
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $root = $btn.closest(ROOT);
      if (!$root.length) return;

      var isOpen = $root.hasClass(ACTIVE);

      $root.toggleClass(ACTIVE);
      $btn.attr('aria-expanded', !isOpen);
    });
  }

  function init() {
    bind();

    // ResizeObserver로 요소가 실제 크기를 갖는 시점에 넘침 체크
    $(ROOT).each(function () {
      var $root = $(this);
      var $text = $root.find(TEXT);
      if (!$text.length) return;

      var observer = new ResizeObserver(function () {
        checkOverflow($root);
      });
      observer.observe($text[0]);
      _observers.push(observer);
    });
  }

  function destroy() {
    $(document).off(NS);

    // ResizeObserver 해제
    _observers.forEach(function (observer) {
      observer.disconnect();
    });
    _observers = [];

    _bound = false;
  }

  window.UI.expand = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
