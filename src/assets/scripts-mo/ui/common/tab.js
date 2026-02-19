/**
 * @file scripts-mo/ui/common/tab.js
 * @description data-속성 기반 탭 공통 (모바일)
 * @scope [data-tab-scope]
 *
 * @mapping [data-tab-btn][data-tab-target] ↔ [data-tab-panel="target"]
 * @state is-active 클래스 + aria-selected 값으로 제어
 *
 * @a11y role="tablist", role="tab", role="tabpanel", aria-selected 제어
 * @note URL 파라미터 딥링크 지원 — ?tab={data-tab-target 값}으로 특정 탭 직접 활성화
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiTab';
  var SCOPE = '[data-tab-scope]';
  var BTN = '[data-tab-btn]';
  var PANEL = '[data-tab-panel]';
  var ACTIVE = 'is-active';

  var _bound = false;

  // 탭 전환
  function activate($scope, target) {
    // 모든 버튼 비활성
    $scope.find(BTN).each(function () {
      var $btn = $(this);
      $btn.removeClass(ACTIVE);
      $btn.attr('aria-selected', 'false');
      $btn.attr('tabindex', '-1');
    });

    // 모든 패널 비활성
    $scope.find(PANEL).each(function () {
      $(this).removeClass(ACTIVE).attr('hidden', '');
    });

    // 대상 버튼 활성
    var $activeBtn = $scope.find(BTN + '[data-tab-target="' + target + '"]');
    $activeBtn.addClass(ACTIVE);
    $activeBtn.attr('aria-selected', 'true');
    $activeBtn.attr('tabindex', '0');

    // 대상 패널 활성
    var $activePanel = $scope.find(PANEL + '[data-tab-panel="' + target + '"]');
    $activePanel.addClass(ACTIVE).removeAttr('hidden');
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 탭 클릭
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;

      var target = $btn.data('tabTarget');
      if (!target) return;

      activate($scope, target);
    });

    // 키보드 좌우 화살표 이동
    $(document).on('keydown' + NS, BTN, function (e) {
      var key = e.keyCode;
      if (key !== 37 && key !== 39) return;

      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;

      var $tabs = $scope.find(BTN);
      var idx = $tabs.index($btn);
      var len = $tabs.length;

      // 좌: 이전, 우: 다음 (순환)
      var nextIdx = key === 37 ? (idx - 1 + len) % len : (idx + 1) % len;
      var $next = $tabs.eq(nextIdx);

      $next.focus();
      $next.trigger('click');
    });
  }

  function init() {
    bind();

    // URL 파라미터 기반 탭 딥링크 (?tab=tab2)
    var urlTab = new URLSearchParams(window.location.search).get('tab');

    // 초기 활성 탭 설정 (is-active 있는 버튼 기준)
    $(SCOPE).each(function () {
      var $scope = $(this);
      var $activeBtn;

      // URL 파라미터 우선
      if (urlTab) {
        $activeBtn = $scope.find(BTN + '[data-tab-target="' + urlTab + '"]');
      }

      // URL 매칭 없으면 is-active 기준
      if (!$activeBtn || !$activeBtn.length) {
        $activeBtn = $scope.find(BTN + '.' + ACTIVE);
      }

      // 그것도 없으면 첫 번째 자동 활성
      if (!$activeBtn.length) {
        $activeBtn = $scope.find(BTN).first();
      }

      var target = $activeBtn.data('tabTarget');
      if (target) activate($scope, target);
    });
  }

  function destroy() {
    $(document).off(NS);
    _bound = false;
  }

  window.UI.tab = {
    init: init,
    destroy: destroy,
    activate: activate
  };
})(window.jQuery, window);
