/**
 * @file scripts-mo/ui/common/option-box.js
 * @description data-속성 기반 옵션 선택 박스 (모바일)
 * @scope [data-ui="option-box"]
 *
 * @mapping
 *   [data-option-trigger] — 열기/닫기 버튼
 *   [data-option-trigger] .text — 선택된 값 표시
 *   [data-option-list] — 옵션 목록 (열림/닫힘 대상)
 *   [data-select-value] — 옵션 버튼 (클릭 시 선택)
 *
 * @state
 *   is-open — 옵션 목록 열림
 *   is-selected — 선택된 옵션 항목
 *
 * @events
 *   option-box:select — 옵션 선택 시 발생 (detail: { value, text })
 *
 * @a11y aria-expanded 제어
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiOptionBox';
  var SCOPE = '[data-ui="option-box"]';
  var TRIGGER = '[data-option-trigger]';
  var LIST = '[data-option-list]';
  var OPTION_BTN = '[data-select-value]';
  var OPEN = 'is-open';
  var SELECTED = 'is-selected';

  var _bound = false;

  function openList($scope) {
    $scope.find(LIST).addClass(OPEN);
    $scope.find(TRIGGER).attr('aria-expanded', 'true');
  }

  function closeList($scope) {
    $scope.find(LIST).removeClass(OPEN);
    $scope.find(TRIGGER).attr('aria-expanded', 'false');
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 트리거 클릭 — 열기/닫기
    $(document).on('click' + NS, TRIGGER, function (e) {
      e.preventDefault();
      var $scope = $(this).closest(SCOPE);
      if (!$scope.length) return;

      if ($scope.find(LIST).hasClass(OPEN)) {
        closeList($scope);
      } else {
        openList($scope);
      }
    });

    // 옵션 선택
    $(document).on('click' + NS, OPTION_BTN, function () {
      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;

      var value = $btn.attr('data-select-value');

      // 선택 상태 갱신
      $scope.find(OPTION_BTN).removeClass(SELECTED);
      $btn.addClass(SELECTED);

      // 트리거 텍스트 갱신
      var $trigger = $scope.find(TRIGGER + ' .text');
      if ($trigger.length) {
        $trigger.html($btn.html());
      }

      // 닫기
      closeList($scope);

      // 커스텀 이벤트
      $scope.trigger('option-box:select', {value: value, text: $trigger.text()});
    });

    // 외부 클릭 시 닫기
    $(document).on('mousedown' + NS + ' touchstart' + NS, function (e) {
      $(SCOPE).each(function () {
        var $scope = $(this);
        if (!$scope.find(LIST).hasClass(OPEN)) return;
        if ($(e.target).closest($scope).length) return;
        closeList($scope);
      });
    });
  }

  function init() {
    bind();
  }

  function destroy() {
    $(document).off(NS);
    _bound = false;
  }

  window.UI.optionBox = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
