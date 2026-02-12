/**
 * @file scripts-mo/ui/form/checkbox-total.js
 * @description data-속성 기반 체크박스 전체선택/해제
 * @scope [data-checkbox-scope]
 * @mapping data-checkbox-all: 전체선택, data-checkbox-item: 개별항목
 * @state is-checked - 체크 상태 시각적 반영
 * @note disabled 항목은 전체선택/해제 대상에서 제외
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[checkbox-total] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var CHECKED = 'is-checked';
  var NS = '.checkboxTotal';
  var BOUND_FLAG = 'checkboxTotalBound';

  // 활성(disabled 아닌) 아이템만 조회
  function getActiveItems($scope) {
    return $scope.find('[data-checkbox-item]').not(':disabled');
  }

  function syncClass($el) {
    $el.toggleClass(CHECKED, $el.is(':checked'));
  }

  function updateCheckAllState($scope) {
    var $allCheckbox = $scope.find('[data-checkbox-all]');
    if (!$allCheckbox.length) return;

    var $items = getActiveItems($scope);
    var totalCount = $items.length;
    var checkedCount = $items.filter(':checked').length;
    var isAllChecked = totalCount > 0 && totalCount === checkedCount;

    $allCheckbox.prop('checked', isAllChecked);
    syncClass($allCheckbox);
  }

  function bindScope($scope) {
    if ($scope.data(BOUND_FLAG)) return;

    $scope.on('change' + NS, '[data-checkbox-all]', function () {
      var $allCheckbox = $(this);
      var isChecked = $allCheckbox.is(':checked');
      var $items = getActiveItems($scope);

      $items.prop('checked', isChecked);
      $items.each(function () {
        syncClass($(this));
      });
      syncClass($allCheckbox);
    });

    $scope.on('change' + NS, '[data-checkbox-item]', function () {
      syncClass($(this));
      updateCheckAllState($scope);
    });

    $scope.data(BOUND_FLAG, true);
  }

  function unbindScope($scope) {
    $scope.off(NS);
    $scope.removeData(BOUND_FLAG);
  }

  window.UI.checkboxTotal = {
    init: function () {
      $('[data-checkbox-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[checkbox-total] init');
    },

    destroy: function () {
      $('[data-checkbox-scope]').each(function () {
        unbindScope($(this));
      });
      console.log('[checkbox-total] destroy');
    },

    // 동적 콘텐츠 변경 후 전체선택 상태 재계산
    refresh: function ($scope) {
      if (!$scope || !$scope.length) return;
      updateCheckAllState($scope);
    }
  };

  console.log('[checkbox-total] module loaded');
})(window.jQuery || window.$, window);
