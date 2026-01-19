/**
 * @file scripts/ui/filter-expand.js
 * @purpose 필터 항목 펼치기/접기(아이템 단위 토글)
 * @scope .filter-box-item 내부에서만 동작, 이벤트는 document 위임
 * @rule 버튼 클릭 → 해당 아이템의 chip-group is-open 토글 + aria-expanded/텍스트 갱신
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.filterExpand = window.UI.filterExpand || {};

  var NS = '.uiFilterExpand';
  var ITEM = '.filter-box-item';
  var BTN = '.vits-filter-more';
  var GROUP = '.filter-chip-group';
  var ACTIVE = 'is-open';
  var TEXT = '.text';
  var CHIP = '.filter-chip';
  var CHIP_ACTIVE = 'is-active';
  var RESET_BTN = '.filter-box-buttons [type="reset"]';
  var MODAL = '[data-toggle-box="vits-options-modal"]';
  var MODAL_BTN = '[data-toggle-btn][data-toggle-target="vits-options-modal"]';
  var MODAL_DIM = '[data-toggle-dim="vits-options-modal"]';
  var BODY_SCOPE = 'body.vits-scope';

  function setButtonState($btn, isOpen) {
    $btn.attr('aria-expanded', isOpen ? 'true' : 'false');
    var $text = $btn.find(TEXT).first();
    if ($text.length) {
      $text.text(isOpen ? '접기' : '더보기');
    }
  }

  function toggleItem($item, $btn) {
    var $group = $item.find(GROUP).first();
    if (!$group.length) return;

    var isOpen = $group.hasClass(ACTIVE);
    $group.toggleClass(ACTIVE, !isOpen);
    setButtonState($btn, !isOpen);
  }

  function syncModalScrollLock() {
    var isOpen = $(MODAL).first().hasClass(ACTIVE);
    $(BODY_SCOPE).css('overflow', isOpen ? 'hidden' : '');
  }

  function closeModal() {
    var $box = $(MODAL).first();
    if (!$box.length) return;

    $box.removeClass(ACTIVE);
    $(MODAL_BTN).attr('aria-expanded', 'false');
    syncModalScrollLock();
  }

  function bind() {
    $(document)
      .off('click' + NS, BTN)
      .on('click' + NS, BTN, function (e) {
        e.preventDefault();

        var $btn = $(this);
        var $item = $btn.closest(ITEM);
        if (!$item.length) return;

        toggleItem($item, $btn);
      });

    $(document)
      .off('click' + NS, CHIP)
      .on('click' + NS, CHIP, function (e) {
        e.preventDefault();

        var $chip = $(this);
        if ($chip.is(':disabled')) return;

        var isActive = $chip.hasClass(CHIP_ACTIVE);
        $chip.toggleClass(CHIP_ACTIVE, !isActive);
        $chip.attr('aria-pressed', !isActive ? 'true' : 'false');
      });

    $(document)
      .off('click' + NS, RESET_BTN)
      .on('click' + NS, RESET_BTN, function () {
        var $scope = $(this).closest('[data-toggle-box="filter-box"]');
        var $chips = $scope.length ? $scope.find(CHIP) : $(CHIP);
        $chips.removeClass(CHIP_ACTIVE).attr('aria-pressed', 'false');
      });

    $(document)
      .off('click' + NS, MODAL_BTN)
      .on('click' + NS, MODAL_BTN, function () {
        // toggle.js 처리 이후 상태 반영
        window.requestAnimationFrame(syncModalScrollLock);
      });

    $(document)
      .off('click' + NS, MODAL_DIM)
      .on('click' + NS, MODAL_DIM, function (e) {
        e.preventDefault();
        closeModal();
      });
  }

  window.UI.filterExpand.init = function () {
    // 필터 아이템 토글 이벤트(문서 위임) 바인딩
    bind();
    syncModalScrollLock();
  };
})(window.jQuery || window.$, window);
