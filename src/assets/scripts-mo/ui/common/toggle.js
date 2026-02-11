/**
 * @file scripts-mo/ui/common/toggle.js
 * @description data-속성 기반 토글/아코디언 공통 (모바일)
 * @scope [data-toggle-scope]
 *
 * @mapping [data-toggle-btn][data-toggle-target] ↔ [data-toggle-box="target"]
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @option
 *  - data-toggle-group="true"   : 스코프 내 1개만 오픈 (아코디언)
 *  - data-toggle-outside="true" : 스코프 외 클릭/터치 시 닫기
 *  - data-toggle-group-except="true" : 그룹 닫기에서 제외
 *  - data-aria-label-base="..." : aria-label "열기/닫기" 자동 동기화
 *
 * @a11y aria-expanded 제어, aria-label-base 옵션 시 열기/닫기 라벨 동기화
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiToggle';
  var ACTIVE = 'is-open';
  var GROUP_EXCEPT_KEY = 'toggleGroupExceptActive';
  var OUTSIDE_ACTIVE_KEY = 'toggleOutsideActive';

  var _bound = false;

  // aria-label 동기화
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;

    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }

  function open($btn, $box) {
    var shouldCloseOnOutside = $btn.data('toggleOutside') === true;
    var isGroupExcept = $btn.data('toggleGroupExcept') === true;

    $box.addClass(ACTIVE);
    $box.data(OUTSIDE_ACTIVE_KEY, shouldCloseOnOutside);
    $box.data(GROUP_EXCEPT_KEY, isGroupExcept);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);
  }

  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $box.removeData(OUTSIDE_ACTIVE_KEY);
    $box.removeData(GROUP_EXCEPT_KEY);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);
  }

  // 스코프 내 열린 패널 일괄 닫기
  function closeAll($scope) {
    $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
      var $box = $(this);
      if ($box.data(GROUP_EXCEPT_KEY) === true) return;

      $box.removeClass(ACTIVE);
      $box.removeData(OUTSIDE_ACTIVE_KEY);
      $box.removeData(GROUP_EXCEPT_KEY);
    });

    $scope.find('[data-toggle-btn][aria-expanded="true"]').each(function () {
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;

      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if ($box.length && $box.hasClass(ACTIVE) && $box.data(GROUP_EXCEPT_KEY) === true) return;

      $btn.attr('aria-expanded', 'false');
      syncAriaLabel($btn);
    });
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // 버튼 클릭 위임
    $doc.on('click' + NS, '[data-toggle-btn]', function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $scope = $btn.closest('[data-toggle-scope]');
      if (!$scope.length) return;

      var target = $btn.data('toggleTarget');
      if (!target) return;

      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if (!$box.length) return;

      var isOpen = $box.hasClass(ACTIVE);
      var isGroup = $scope.data('toggleGroup') === true;
      var isGroupExcept = $btn.data('toggleGroupExcept') === true;

      if (isOpen) {
        close($btn, $box);
        return;
      }

      if (isGroup && !isGroupExcept) closeAll($scope);
      open($btn, $box);
    });

    // 외부 클릭/터치 시 outside=true 패널 닫기
    $doc.on('mousedown' + NS + ' touchstart' + NS, function (e) {
      $('[data-toggle-scope]').each(function () {
        var $scope = $(this);
        if ($(e.target).closest($scope).length) return;

        $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
          var $box = $(this);
          if ($box.data(OUTSIDE_ACTIVE_KEY) !== true) return;

          var target = $box.attr('data-toggle-box');
          var $btn = $scope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
          if (!$btn.length) return;

          close($btn, $box);
        });
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

  window.UI.toggle = {
    init: init,
    destroy: destroy,
    closeAll: closeAll
  };
})(window.jQuery, window);
