/**
 * @file scripts/ui/checkbox-total.js
 * @purpose data-속성 기반 체크박스 전체선택/해제
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[checkbox-total] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var CHECKED = 'is-checked';

  function updateCheckAllState($scope) {
    var $allCheckbox = $scope.find('[data-checkbox-all]');
    if (!$allCheckbox.length) return;

    var $items = $scope.find('[data-checkbox-item]');
    var totalCount = $items.length;
    var checkedCount = $items.filter(':checked').length;
    var isAllChecked = totalCount === checkedCount && totalCount > 0;

    $allCheckbox.prop('checked', isAllChecked);
    $allCheckbox.toggleClass(CHECKED, isAllChecked);
  }

  function bindScope($scope) {
    $scope.on('change', '[data-checkbox-all]', function () {
      var $allCheckbox = $(this);
      var isChecked = $allCheckbox.is(':checked');
      var $items = $scope.find('[data-checkbox-item]');

      $items.prop('checked', isChecked);
      $items.toggleClass(CHECKED, isChecked);
      $allCheckbox.toggleClass(CHECKED, isChecked);
    });

    $scope.on('change', '[data-checkbox-item]', function () {
      var $checkbox = $(this);
      $checkbox.toggleClass(CHECKED, $checkbox.is(':checked'));
      updateCheckAllState($scope);
    });
  }

  window.UI.checkboxTotal = {
    init: function () {
      $('[data-checkbox-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[checkbox-total] init');
    }
  };

  console.log('[checkbox-total] module loaded');
})(window.jQuery || window.$, window);
