/**
 * @file scripts-mo/ui/common/expand.js
 * @description data-속성 기반 텍스트 더보기(expand/collapse) (모바일)
 * @scope [data-expand]
 *
 * @mapping [data-expand-text] → 넘침 감지 시 [data-expand-btn] 동적 생성
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @note
 *  - 텍스트가 넘치면 버튼 동적 생성, 넘치지 않으면 버튼 미생성 또는 hidden
 *  - overflow: hidden 상태에서 scrollWidth 측정을 위해 일시적으로 해제
 *  - ResizeObserver로 레이아웃 변경 시 넘침 여부 자동 재판별
 *  - destroy 시 동적 생성된 버튼 제거
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
  var _observers = [];

  // 버튼 동적 생성
  function createBtn($root) {
    var $btn = $(
      '<button type="button" class="coupon-scope-toggle" data-expand-btn aria-expanded="false">' +
        '<i class="ic ic-arrow-down"></i>' +
        '</button>'
    );
    $root.append($btn);
    return $btn;
  }

  // 텍스트 넘침 여부 체크 → 버튼 노출 제어
  function checkOverflow($root) {
    var $text = $root.find(TEXT);
    if (!$text.length) return;

    // 펼친 상태면 체크 생략
    if ($root.hasClass(ACTIVE)) return;

    var el = $text[0];

    // overflow: hidden 상태에서 scrollWidth === clientWidth 방지
    el.style.setProperty('overflow', 'visible', 'important');

    var sw = el.scrollWidth;
    var cw = el.clientWidth;

    el.style.removeProperty('overflow');

    // 레이아웃 미계산 상태면 건너뜀
    if (sw === 0 && cw === 0) return;

    var isOverflow = sw > cw;
    var $btn = $root.find(BTN);

    if (isOverflow && !$btn.length) {
      createBtn($root);
    } else if ($btn.length) {
      $btn.prop('hidden', !isOverflow);
    }
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 버튼 클릭 (동적 생성 요소 대응 — 이벤트 위임)
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $root = $btn.closest(ROOT);
      if (!$root.length) return;

      var isOpen = $root.hasClass(ACTIVE);

      $root.toggleClass(ACTIVE);
      $btn.attr('aria-expanded', !isOpen ? 'true' : 'false');
    });
  }

  function init() {
    bind();

    // ResizeObserver로 넘침 체크
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

    _observers.forEach(function (observer) {
      observer.disconnect();
    });
    _observers = [];

    // 동적 생성된 버튼 제거
    $(ROOT).find(BTN).remove();

    _bound = false;
  }

  window.UI.expand = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
