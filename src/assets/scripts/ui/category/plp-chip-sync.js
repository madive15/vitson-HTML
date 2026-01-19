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
 *  - 칩은 JS 생성(디자인은 CSS로)
 *  - 그룹 순서: 공통 > 속성 > 브랜드(좌측 메뉴 기준 고정)
 */
(function ($, window) {
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

  // 공통 > 속성 > 브랜드 순으로 고정 렌더(클릭 순서 무시)
  var GROUPS = [
    {name: 'plpCommon', title: '공통', showCategory: false},
    {name: 'plpAttr', title: '속성', showCategory: true},
    {name: 'plpBrand', title: '브랜드', showCategory: true}
  ];

  // 칩 영역 반환
  function getChipArea() {
    return $(CHIP_AREA).first();
  }

  // 체크박스 대상 여부(name 기준)
  function isWatchedCheckbox(el) {
    if (!el || el.type !== 'checkbox') return false;
    var nm = String(el.name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return true;
    }
    return false;
  }

  // 그룹 config
  function getGroupByName(name) {
    var nm = String(name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return GROUPS[i];
    }
    return null;
  }

  // chip value(checkbox.value) 안전 문자열
  function escAttr(v) {
    return String(v || '').replace(/"/g, '\\"');
  }

  // 칩 value 기준 존재 여부
  function hasChip($area, value) {
    return $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').length > 0;
  }

  // 체크박스 라벨 텍스트(.label-name 기준, 자식/배지 제거)
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

    // 브랜드(plpBrand)만 "(숫자)" 제거
    if (String($chk.attr('name') || '') === 'plpBrand') {
      txt = $.trim(String(txt || '').replace(/\s*\(\s*\d+\s*\)\s*$/, ''));
    }

    return txt;
  }

  // 그룹명(속성/브랜드는 무조건 노출)
  function getChipCategoryName($chk) {
    var cfg = getGroupByName($chk.attr('name'));
    if (!cfg) return '';
    return cfg.showCategory ? cfg.title : '';
  }

  // 칩 DOM 생성(action='x' 형태, 아이콘은 × 텍스트로 폴백)
  function buildChipEl(groupName, value, name, category) {
    var $chip = $('<div/>', {class: 'vits-chip-button type-filled'});
    $chip.attr(CHIP_VALUE, value);
    $chip.attr('data-chip-group', groupName);

    if (category) {
      $('<span/>', {class: 'text category', text: category}).appendTo($chip);
    }

    $('<span/>', {class: 'text', text: name}).appendTo($chip);

    var $btn = $('<button/>', {
      type: 'button',
      class: 'remove',
      'data-chip-action': 'remove',
      'aria-label': name + ' 삭제',
      text: '×'
    });

    $btn.attr(CHIP_VALUE, value);
    $chip.append($btn);

    return $chip;
  }

  // 그룹 순서대로 DOM 정렬(공통 > 속성 > 브랜드)
  function sortChipsByGroup($area) {
    if (!$area || !$area.length) return;

    for (var i = 0; i < GROUPS.length; i += 1) {
      var g = GROUPS[i].name;
      $area.find('[data-chip-group="' + escAttr(g) + '"]').appendTo($area);
    }
  }

  // 체크박스 → 칩 추가
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

  // value로 칩 제거
  function removeChipByValue(value) {
    var $area = getChipArea();
    if (!$area.length) return;

    $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').remove();
  }

  // value로 체크박스 해제(해제 시 change를 태워 동기화 유지)
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

  // 칩 유무에 따라 결과 영역 토글(데이터 없으면 클래스 폴백)
  function syncResultUi() {
    var $area = getChipArea();
    if (!$area.length) return;

    var hasAny = $area.children().length > 0;

    // result-chips 래퍼 토글: data-result-chips > .result-chips 폴백
    var $chipsWrap = $area.closest(RESULT_CHIPS);
    if (!$chipsWrap.length) $chipsWrap = $area.closest('.result-chips');
    if ($chipsWrap.length) $chipsWrap.toggleClass('is-hidden', !hasAny);

    // result-actions 래퍼 토글: data-result-actions > .result-actions 폴백
    var $actionsWrap = $(RESULT_ACTIONS).first();
    if (!$actionsWrap.length) $actionsWrap = $('.result-actions').first();
    if ($actionsWrap.length) $actionsWrap.toggleClass('is-hidden', !hasAny);
  }

  // 전체 해제(체크박스/칩)
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

  // 체크박스 change → 칩 반영
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

  // 칩 X 클릭 → 체크 해제(체크 해제 후 change에서 칩 제거/토글 처리)
  function bindChipRemove() {
    $(document)
      .off('click' + NS, CHIP_REMOVE)
      .on('click' + NS, CHIP_REMOVE, function (ev) {
        ev.preventDefault();

        // value는 버튼 자체 또는 부모 칩에서 획득
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

  // 전체 해제 버튼
  function bindClear() {
    $(document)
      .off('click' + NS, CLEAR_BTN)
      .on('click' + NS, CLEAR_BTN, function (ev) {
        ev.preventDefault();
        clearAll();
      });
  }

  // 초기 렌더: 체크된 값 기준으로 칩 재생성
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
    // 이벤트 위임 바인딩
    bindCheckbox();
    bindChipRemove();
    bindClear();

    // 초기 동기화
    buildInitialChips();
  };
})(window.jQuery || window.$, window);
