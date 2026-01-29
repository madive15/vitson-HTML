/**
 * @file scripts/ui/stepTab.js
 * @purpose data-속성 기반 스텝 탭(단계별 진행) 공통
 * @description
 *  - 스코프: [data-step-scope="id"] 내부에서만 동작
 *  - 매핑: [data-step-tab="n"] ↔ [data-step-panel="n"]
 *  - 상태: is-active(현재), is-done(완료), is-disabled(비활성)
 *  - 진행: [data-step-complete] 버튼 클릭 시 다음 스텝 이동
 * @flow
 *  - 탭 헤더는 클릭 불가 (시각적 표시만)
 *  - 패널 내 완료 버튼으로만 다음 스텝 이동
 *  - 이전 스텝으로 돌아가기 불가 (단방향)
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일, 표현/스타일은 CSS에서만 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[stepTab] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var ACTIVE = 'is-active';
  var DONE = 'is-done';
  var DISABLED = 'is-disabled';

  function getScope(scopeId) {
    return $('[data-step-scope="' + scopeId + '"]');
  }

  function getCurrentStep($scope) {
    var $activePanel = $scope.find('[data-step-panel].' + ACTIVE);
    return $activePanel.length ? parseInt($activePanel.data('stepPanel'), 10) : 1;
  }

  function getTotalSteps($scope) {
    return $scope.find('[data-step-panel]').length;
  }

  function activateStep($scope, stepNum) {
    var $tabs = $scope.find('[data-step-tab]');
    var $panels = $scope.find('[data-step-panel]');

    $panels.removeClass(ACTIVE);
    $panels.filter('[data-step-panel="' + stepNum + '"]').addClass(ACTIVE);

    $tabs.each(function () {
      var $tab = $(this);
      var tabNum = parseInt($tab.data('stepTab'), 10);

      $tab.removeClass(ACTIVE + ' ' + DONE + ' ' + DISABLED);

      if (tabNum === stepNum) {
        $tab.addClass(ACTIVE);
      } else if (tabNum < stepNum) {
        $tab.addClass(DONE);
      } else {
        $tab.addClass(DISABLED);
      }
    });
  }

  function completeStep($scope) {
    var scopeId = $scope.data('stepScope');
    var currentStep = getCurrentStep($scope);
    var totalSteps = getTotalSteps($scope);
    var nextStep = currentStep + 1;
    var isLast = currentStep >= totalSteps;

    var event = new CustomEvent('stepTab:complete', {
      bubbles: true,
      detail: {
        scopeId: scopeId,
        currentStep: currentStep,
        nextStep: isLast ? null : nextStep,
        isLast: isLast
      }
    });
    $scope[0].dispatchEvent(event);

    if (isLast) {
      $scope
        .find('[data-step-tab="' + currentStep + '"]')
        .removeClass(ACTIVE)
        .addClass(DONE);
      console.log('[stepTab] 모든 스텝 완료');
      return;
    }

    activateStep($scope, nextStep);
    console.log('[stepTab] step ' + currentStep + ' → ' + nextStep);
  }

  function bindScope($scope) {
    $scope.on('click', '[data-step-complete]', function (e) {
      e.preventDefault();
      completeStep($scope);
    });
  }

  window.UI.stepTab = {
    init: function () {
      $('[data-step-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[stepTab] init');
    },

    complete: function (scopeId) {
      var $scope = getScope(scopeId);
      if ($scope.length) {
        completeStep($scope);
      }
    },

    reset: function (scopeId) {
      var $scope = getScope(scopeId);
      if (!$scope.length) return;

      $scope.find('[data-step-tab]').removeClass(DONE);
      activateStep($scope, 1);
      console.log('[stepTab] reset');
    },

    getCurrentStep: function (scopeId) {
      var $scope = getScope(scopeId);
      return $scope.length ? getCurrentStep($scope) : null;
    }
  };

  console.log('[stepTab] module loaded');
})(window.jQuery || window.$, window);
