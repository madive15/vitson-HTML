/**
 * @file scripts/ui/category/plp-chip-sync.js
 * @purpose 체크박스 ↔ 칩 UI 동기화(추가/삭제/전체해제) + 결과바 노출 제어(data-result-chips / data-result-actions)
 * @assumption
 *  - 칩 컨테이너: [data-chip-area] (내부에 .vits-chip-button DOM을 JS로 생성)
 *  - 결과 칩 래퍼: [data-result-chips] (없으면 .result-chips 폴백)
 *  - 결과 액션 래퍼: [data-result-actions] (없으면 .result-actions 폴백)
 *  - 체크박스: input[type="checkbox"] (name: plpCommon/plpAttr/plpBrand)
 *  - 칩 제거 버튼: [data-chip-action="remove"] + data-chip-value
 *  - 전체 해제 버튼: [data-chip-clear] (없으면 .result-clear-button 폴백)
 * @maintenance
 *  - 필터 칩은 체크박스가 상태의 기준이므로, X 클릭 시 반드시 체크박스 해제를 우선한다.
 *  - 공통 chip-button.js가 함께 로드되어도 충돌하지 않도록 remove 클릭은 stopPropagation으로 차단한다.
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.chipSync = window.UI.chipSync || {};

  var NS = '.uiChipSync';

  var CHIP_AREA = '[data-chip-area]';
  var CHIP_REMOVE = '[data-chip-action="remove"]';
  var CHIP_VALUE = 'data-chip-value';

  var RESULT_CHIPS = '[data-result-chips]';
  var RESULT_ACTIONS = '[data-result-actions]';

  var CLEAR_BTN = '[data-chip-clear], .result-clear-button';

  var GROUPS = [
    {name: 'plpCommon', title: '공통', showCategory: false},
    {name: 'plpAttr', title: '속성', showCategory: true},
    {name: 'plpCommonCategory', title: '카테고리', showCategory: false},
    {name: 'plpBrand', title: '브랜드', showCategory: true}
  ];

  function getChipArea() {
    return $(CHIP_AREA).first();
  }

  function isWatchedCheckbox(el) {
    if (!el || el.type !== 'checkbox') return false;
    var nm = String(el.name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return true;
    }
    return false;
  }

  function getGroupByName(name) {
    var nm = String(name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return GROUPS[i];
    }
    return null;
  }

  function escAttr(v) {
    return String(v || '').replace(/"/g, '\\"');
  }

  function hasChip($area, value) {
    return $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').length > 0;
  }

  function getChipLabel($chk) {
    var $label = $chk.closest('label');
    var $name = $label.find('.label-name').first();
    var txt = '';

    if ($name.length) {
      txt = $name.clone().children().remove().end().text();
      txt = $.trim(txt || '');
    } else {
      txt = String($chk.val() || '');
    }

    if (String($chk.attr('name') || '') === 'plpBrand') {
      txt = $.trim(String(txt || '').replace(/\s*\(\s*\d+\s*\)\s*$/, ''));
    }

    return txt;
  }

  function getChipCategoryName($chk) {
    var cfg = getGroupByName($chk.attr('name'));
    if (!cfg) return '';
    return cfg.showCategory ? cfg.title : '';
  }

  function buildChipEl(groupName, value, name, category) {
    var $chip = $('<button/>', {
      type: 'button',
      class: 'vits-chip-button type-filled',
      'data-chip-action': 'remove',
      'aria-label': name + ' 삭제'
    });

    $chip.attr(CHIP_VALUE, value);
    $chip.attr('data-chip-group', groupName);

    if (category) $('<span/>', {class: 'text category', text: category}).appendTo($chip);
    $('<span/>', {class: 'text', text: name}).appendTo($chip);
    $('<span/>', {class: 'icon ic ic-x', 'aria-hidden': 'true'}).appendTo($chip);

    return $chip;
  }

  function sortChipsByGroup($area) {
    if (!$area || !$area.length) return;

    for (var i = 0; i < GROUPS.length; i += 1) {
      var g = GROUPS[i].name;
      $area.find('[data-chip-group="' + escAttr(g) + '"]').appendTo($area);
    }
  }

  function addChipFromCheckbox($chk) {
    var $area = getChipArea();
    if (!$area.length) return;

    var value = String($chk.val() || '');
    if (!value) return;

    if (hasChip($area, value)) return;

    var groupName = String($chk.attr('name') || '');
    var name = getChipLabel($chk);
    var category = getChipCategoryName($chk);

    $area.append(buildChipEl(groupName, value, name, category));
    sortChipsByGroup($area);
  }

  function removeChipByValue(value) {
    var $area = getChipArea();
    if (!$area.length) return;

    $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').remove();
  }

  function uncheckByValue(value) {
    var v = String(value || '');
    if (!v) return;

    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (String(this.value || '') !== v) return;

      if (this.checked) {
        this.checked = false;
        $(this).trigger('change');
      }
    });
  }

  function syncResultUi() {
    var $area = getChipArea();
    if (!$area.length) return;

    var hasAny = $area.children().length > 0;

    var $chipsWrap = $area.closest(RESULT_CHIPS);
    if (!$chipsWrap.length) $chipsWrap = $area.closest('.result-chips');
    if ($chipsWrap.length) $chipsWrap.toggleClass('is-hidden', !hasAny);

    var $actionsWrap = $(RESULT_ACTIONS).first();
    if (!$actionsWrap.length) $actionsWrap = $('.result-actions').first();
    if ($actionsWrap.length) $actionsWrap.toggleClass('is-hidden', !hasAny);
  }

  function clearAll() {
    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (!this.checked) return;

      this.checked = false;
      $(this).trigger('change');
    });

    var $area = getChipArea();
    if ($area.length) $area.empty();

    syncResultUi();
  }

  function bindCheckbox() {
    $(document)
      .off('change' + NS, 'input[type="checkbox"]')
      .on('change' + NS, 'input[type="checkbox"]', function () {
        if (!isWatchedCheckbox(this)) return;

        var $chk = $(this);
        var value = String($chk.val() || '');
        if (!value) return;

        if (this.checked) addChipFromCheckbox($chk);
        else removeChipByValue(value);

        syncResultUi();
      });
  }

  function bindChipRemove() {
    $(document)
      .off('click' + NS, CHIP_REMOVE)
      .on('click' + NS, CHIP_REMOVE, function (ev) {
        ev.preventDefault();
        ev.stopPropagation(); // chip-button.js 등 공통 remove 처리와 충돌 방지(체크박스 기준 유지)

        var value =
          $(this).attr(CHIP_VALUE) ||
          $(this)
            .closest('[' + CHIP_VALUE + ']')
            .attr(CHIP_VALUE) ||
          '';
        if (!value) return;

        uncheckByValue(value);
      });
  }

  function bindClear() {
    $(document)
      .off('click' + NS, CLEAR_BTN)
      .on('click' + NS, CLEAR_BTN, function (ev) {
        ev.preventDefault();
        clearAll();
      });
  }

  function buildInitialChips() {
    var $area = getChipArea();
    if (!$area.length) return;

    $area.empty();

    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (!this.checked) return;

      addChipFromCheckbox($(this));
    });

    syncResultUi();
  }

  window.UI.chipSync.init = function () {
    bindCheckbox();
    bindChipRemove();
    bindClear();
    buildInitialChips();
  };
})(window.jQuery || window.$, window, document);
