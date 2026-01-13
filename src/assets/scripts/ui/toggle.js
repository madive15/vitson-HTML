/**
 * @file scripts/ui/toggle.js
 * @purpose data-속성 기반 토글/아코디언 공통
 * @description
 *  - 스코프: [data-toggle-scope] 내부에서만 동작
 *  - 매핑: [data-toggle-btn][data-toggle-target] ↔ [data-toggle-box="target"]
 *  - 상태: is-open 클래스 + aria-expanded 값으로만 제어
 * @option
 *  - data-toggle-group="true"   : 스코프 내 1개만 오픈(아코디언)
 *  - data-toggle-outside="true" : 스코프 외 클릭 시 closeAll 실행(document 이벤트)
 * @a11y
 *  - aria-expanded만 제어(aria-controls는 마크업 선택)
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일, 표현/스타일은 CSS에서만 처리)
 *  - closeAll은 스코프 내부만 정리(외부 클릭/그룹 전환에 공용)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[toggle] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var ACTIVE = 'is-open';
  var GROUP_EXCEPT_KEY = 'toggleGroupExceptActive';
  var OUTSIDE_ACTIVE_KEY = 'toggleOutsideActive';

  // syncAriaLabel: aria-expanded(true/false)에 맞춰 aria-label("... 열기/닫기") 동기화(옵션)
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;

    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }

  // open: 패널 오픈 + 버튼 aria-expanded(true) 갱신
  function open($btn, $box) {
    var shouldCloseOnOutside = $btn.data('toggleOutside') === true;
    var isGroupExcept = $btn.data('toggleGroupExcept') === true;

    $box.addClass(ACTIVE);
    $box.data(OUTSIDE_ACTIVE_KEY, shouldCloseOnOutside);
    $box.data(GROUP_EXCEPT_KEY, isGroupExcept);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);
  }

  // close: 패널 닫기 + 버튼 aria-expanded(false) 갱신
  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $box.removeData(OUTSIDE_ACTIVE_KEY);
    $box.removeData(GROUP_EXCEPT_KEY);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);
  }

  // closeAll: 스코프 내 열린 패널/버튼을 일괄 닫기(그룹/외부클릭)
  function closeAll($scope) {
    // 패널: 예외로 표시된 패널은 닫지 않음
    $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
      var $box = $(this);
      if ($box.data(GROUP_EXCEPT_KEY) === true) return; // 그룹 제외 패널 유지

      $box.removeClass(ACTIVE);
      $box.removeData(OUTSIDE_ACTIVE_KEY);
      $box.removeData(GROUP_EXCEPT_KEY);
    });

    // 버튼: 열린 버튼 중 "유지되는 패널(예외)"에 연결된 버튼은 aria-expanded를 false로 내리지 않음
    var $openBtns = $scope.find('[data-toggle-btn][aria-expanded="true"]');
    $openBtns.each(function () {
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;

      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if ($box.length && $box.hasClass(ACTIVE) && $box.data(GROUP_EXCEPT_KEY) === true) {
        return; // 예외 패널이 유지 중이면 버튼도 열린 상태 유지
      }

      $btn.attr('aria-expanded', 'false');
      syncAriaLabel($btn);
    });
  }

  // bindOutsideClose: 스코프 밖 클릭 시, outside=true로 열린 패널만 닫기
  function bindOutsideClose($scope) {
    // 같은 스코프에 중복 바인딩 방지
    if ($scope.data('toggleOutsideBound') === true) return;
    $scope.data('toggleOutsideBound', true);

    $(document).on('click.uiToggleOutside', function (e) {
      // 스코프 내부 클릭은 무시(패널 유지)
      if ($scope.has(e.target).length) return;

      // outside=true 버튼으로 열린 패널만 닫기
      $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
        var $box = $(this);
        if ($box.data(OUTSIDE_ACTIVE_KEY) !== true) return;

        var target = $box.attr('data-toggle-box');
        var $btn = $scope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
        if (!$btn.length) return;

        close($btn, $box);
      });
    });
  }

  // bindScope: 스코프 내부에서 버튼 클릭 위임 처리(그룹이면 closeAll 후 open)
  function bindScope($scope) {
    $scope.on('click', '[data-toggle-btn]', function (e) {
      e.preventDefault();

      var $btn = $(this);
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

    // data-toggle-outside="true"가 있는 버튼이 이 스코프에 존재하면 바인딩
    if ($scope.find('[data-toggle-btn][data-toggle-outside="true"]').length) {
      bindOutsideClose($scope);
    }
  }
  window.UI.toggle = {
    // init: [data-toggle-scope]별로 이벤트 위임 바인딩
    init: function () {
      $('[data-toggle-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[toggle] init');
    }
  };

  console.log('[toggle] module loaded');
})(window.jQuery || window.$, window);
