/**
 * scripts/ui/toggle.js
 * @purpose 토글/아코디언 공통 UI
 * @assumption
 *  - data- 속성 기반으로 “스코프(data-toggle-scope)” 내부에서만 동작한다
 *  - 버튼(data-toggle-btn) ↔ 패널(data-toggle-box) 매핑은 data-toggle-target 값으로 연결한다
 * @options
 *  - data-toggle-group="true"   : 같은 스코프에서 하나만 열림(아코디언)
 *  - data-toggle-outside="true" : 스코프 외부 클릭 시 닫힘(기본 사용 지양)
 * @maintenance
 *  - 페이지 의미(gnb, detail 등) 분기 금지
 *  - 디자인 차이는 CSS로 처리(동작은 동일)
 *  - 토글 상태 클래스는 is-open만 사용한다
 *  - 접근성: aria-expanded만 최소 보장(aria-controls는 마크업에서 선택 적용)
 *  - outside 옵션은 document 이벤트를 사용하므로 남용 금지(필요한 스코프에만 제한 적용)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[toggle] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var ACTIVE = 'is-open';

  /**
   * 패널 오픈
   * @param {jQuery} $btn 토글 버튼
   * @param {jQuery} $box 토글 패널
   * @returns {void}
   */
  function open($btn, $box) {
    $box.addClass(ACTIVE);
    $btn.attr('aria-expanded', 'true');
  }

  /**
   * 패널 클로즈
   * @param {jQuery} $btn 토글 버튼
   * @param {jQuery} $box 토글 패널
   * @returns {void}
   */
  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $btn.attr('aria-expanded', 'false');
  }

  /**
   * 스코프 내 열린 패널 모두 닫기(아코디언용)
   * @param {jQuery} $scope 스코프 루트
   * @returns {void}
   */
  function closeAll($scope) {
    $scope.find('[data-toggle-box].' + ACTIVE).removeClass(ACTIVE);
    $scope.find('[data-toggle-btn][aria-expanded="true"]').attr('aria-expanded', 'false');
  }

  /**
   * 스코프 외부 클릭 시 닫기 바인딩
   * @param {jQuery} $scope 스코프 루트
   * @returns {void}
   * @example
   * // <div data-toggle-scope data-toggle-outside="true">...</div>
   */
  function bindOutsideClose($scope) {
    $(document).on('click.uiToggleOutside', function (e) {
      if ($scope.has(e.target).length) return;
      closeAll($scope);
    });
  }

  /**
   * 스코프 바인딩(이벤트 위임)
   * @param {jQuery} $scope 스코프 루트
   * @returns {void}
   */
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

      if (isOpen) {
        close($btn, $box);
        return;
      }

      if (isGroup) closeAll($scope);
      open($btn, $box);
    });

    if ($scope.data('toggleOutside') === true) {
      bindOutsideClose($scope);
    }
  }

  window.UI.toggle = {
    /**
     * 토글 초기화
     * @returns {void}
     * @example
     * // scripts/core/ui.js의 UI.init()에서 호출
     * UI.toggle.init();
     */
    init: function () {
      $('[data-toggle-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[toggle] init');
    }
  };

  console.log('[toggle] module loaded');
})(window.jQuery || window.$, window);
