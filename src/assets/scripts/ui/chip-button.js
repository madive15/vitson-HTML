/**
 * @file scripts/ui/chip-button.js
 * @purpose 칩 버튼 제거(삭제) 공통: data-속성 기반
 * @description
 *  - 트리거: [data-chip-action="remove"] 클릭 시 해당 칩(.vits-chip-button) DOM 제거
 *  - 대상 식별: data-chip-value(옵션) 값은 후속 연동(필터 상태 동기화 등)에 사용 가능
 * @a11y
 *  - X 버튼은 aria-label로 "… 삭제" 제공(마크업에서 처리)
 * @maintenance
 *  - 동작은 공통(삭제만), 표현/상태(활성 등)는 CSS에서 처리
 *  - 이벤트는 위임 방식으로 1회 바인딩(동적 렌더에도 대응)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[chip-button] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var EVENT_NS = '.uiChipButton';
  var GROUP_SEL = '.vits-chip-button-group';
  var REMOVE_SEL = '[data-chip-action="remove"]';
  var CHIP_SEL = '.vits-chip-button';

  // 칩 엘리먼트 찾기: 클릭 지점 기준으로 가장 가까운 칩 컨테이너
  function getChipEl($target) {
    return $target.closest(CHIP_SEL);
  }

  // 삭제 값 읽기: 연동 필요 시 외부에서 활용(없어도 삭제 동작은 수행)
  function getChipValue($chip) {
    return $chip.attr('data-chip-value') || '';
  }

  // 칩 제거: DOM에서 제거만 수행(부가 연동은 이벤트로 넘김)
  function removeChip($chip) {
    if (!$chip || !$chip.length) return;

    var value = getChipValue($chip);
    $chip.remove();

    // 외부 연동용 커스텀 이벤트(필요 시 상위에서 수신)
    $(document).trigger('ui:chip-remove', {value: value});
  }

  // 클릭 핸들러: remove 트리거 클릭 시 해당 칩 제거
  function onClickRemove(e) {
    var $t = $(e.target);

    // 아이콘(svg 등) 클릭도 버튼 클릭으로 처리
    if (!$t.is(REMOVE_SEL)) $t = $t.closest(REMOVE_SEL);
    if (!$t.length) return;

    e.preventDefault();

    var $chip = getChipEl($t);
    removeChip($chip);
  }

  // 이벤트 위임 바인딩: 그룹 내부에서만 remove 트리거 처리
  function bind() {
    $(document).off('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL);
    $(document).on('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL, onClickRemove);
  }

  window.UI.chipButton = {
    // init: 문서 전체에 1회 위임 바인딩
    init: function () {
      bind();
      console.log('[chip-button] init');
    }
  };

  console.log('[chip-button] module loaded');
})(window.jQuery || window.$, window);
