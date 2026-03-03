/**
 * @file scripts-mo/ui/common/chip-button.js
 * @description 칩 버튼 제거(삭제) 공통: data-속성 기반
 * @scope .vits-chip-button-group
 *
 * @mapping
 *  [data-chip-action="remove"] → 해당 칩(.vits-chip-button) DOM 제거
 *  [data-chip-clear]           → 스코프([data-chip-clear-scope]) 내 칩 전체 제거
 *
 * @events
 *  ui:chip-remove     (document) — 칩 삭제 시 발행 { value, chipEl, groupEl }
 *  ui:chip-remove-all (document) — 전체 삭제 시 발행 { groupEl }
 *
 * @a11y
 *  - X 버튼은 aria-label로 "… 삭제" 제공(마크업에서 처리)
 *
 * @note
 *  - 이벤트 위임 방식으로 동적 렌더에도 대응
 *  - 표현/상태는 CSS에서 처리, JS는 삭제 동작만 담당
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiChipButton';
  var GROUP_SEL = '.vits-chip-button-group';
  var CHIP_SEL = '.vits-chip-button';
  var REMOVE_SEL = '[data-chip-action="remove"]';
  var CLEAR_SEL = '[data-chip-clear]';
  var SCOPE_SEL = '[data-chip-clear-scope]';

  var _bound = false;
  var _observers = [];

  // 칩 제거 → DOM 삭제 + 커스텀 이벤트 발행
  function removeChip($chip) {
    if (!$chip || !$chip.length) return;

    var value = $chip.attr('data-chip-value') || '';
    var chipEl = $chip[0];
    var $group = $chip.closest(GROUP_SEL);
    var groupEl = $group.length ? $group[0] : null;

    $chip.remove();

    // 스코프 내 남은 칩 없으면 전체삭제 버튼 숨김
    var $scope = $(groupEl).closest(SCOPE_SEL);
    if ($scope.length && !$scope.find(CHIP_SEL).length) {
      $scope.find(CLEAR_SEL).addClass('is-hidden');
    }

    $(document).trigger('ui:chip-remove', {
      value: value,
      chipEl: chipEl,
      groupEl: groupEl
    });
  }

  // 전체 삭제 → 스코프 내 칩 일괄 제거 + 커스텀 이벤트 발행
  function removeAll($scope) {
    if (!$scope || !$scope.length) return;

    var $group = $scope.find(GROUP_SEL);
    var groupEl = $group.length ? $group[0] : null;

    $scope.find(CHIP_SEL).remove();

    // 전체삭제 후 버튼 숨김
    $scope.find(CLEAR_SEL).addClass('is-hidden');

    $(document).trigger('ui:chip-remove-all', {
      groupEl: groupEl
    });
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 이벤트 위임: 그룹 내 remove 버튼 클릭(터치) 처리
    $(document).on('click' + NS, GROUP_SEL + ' ' + REMOVE_SEL, function (e) {
      e.preventDefault();
      var $chip = $(this).closest(CHIP_SEL);
      removeChip($chip);
    });

    // 칩 추가/제거 감지 → 전체삭제 버튼 상태 갱신
    $(SCOPE_SEL).each(function (_, el) {
      var $scope = $(el);
      var groupEl = $scope.find(GROUP_SEL)[0];
      if (!groupEl) return;

      var ob = new MutationObserver(function () {
        var hasChip = $scope.find(CHIP_SEL).length > 0;
        $scope.find(CLEAR_SEL).toggleClass('is-hidden', !hasChip);
      });
      ob.observe(groupEl, {childList: true});
      _observers.push(ob);
    });

    // 전체삭제: 가장 가까운 부모 스코프 내 칩 전체 제거
    $(document).on('click' + NS, CLEAR_SEL, function (e) {
      e.preventDefault();
      var $scope = $(this).closest(SCOPE_SEL);
      if (!$scope.length) $scope = $(this).parent();
      removeAll($scope);
    });
  }

  function init() {
    bind();
  }

  function destroy() {
    $(document).off(NS);
    _bound = false;
  }

  window.UI.chipButton = {
    init: init,
    destroy: destroy,
    // 외부에서 칩 추가 후 전체삭제 버튼 상태 갱신
    updateClearBtn: function ($scope) {
      if (!$scope || !$scope.length) return;
      var hasChip = $scope.find(CHIP_SEL).length > 0;
      $scope.find(CLEAR_SEL).toggleClass('is-hidden', !hasChip);
    }
  };
})(window.jQuery, window);
