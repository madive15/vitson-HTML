/**
 * @file scripts/ui/more-expand.js
 * @purpose 공통 더보기: 스코프 내 숨김 항목 일괄 노출(단방향)
 * @scope [data-more-scope] 내부만, 이벤트는 document 위임
 * @rule [data-more-btn] 클릭 → [data-more-hidden="true"] 해제 + .filter-more 제거
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.moreExpand = window.UI.moreExpand || {};

  var NS = '.uiMoreExpand';
  var BTN = '[data-more-btn]';
  var SCOPE = '[data-more-scope]';
  var HIDDEN = '[data-more-hidden="true"]';

  function bind() {
    // 더보기 클릭: 스코프 내 숨김 항목 노출 후 버튼 영역 제거(접기 없음)
    $(document)
      .off('click' + NS, BTN)
      .on('click' + NS, BTN, function () {
        var $btn = $(this);
        var $scope = $btn.closest(SCOPE);
        if (!$scope.length) return;

        $scope.find(HIDDEN).removeAttr('data-more-hidden');
        $btn.closest('.filter-more').remove();
      });
  }

  window.UI.moreExpand.init = function () {
    // 공통 더보기 이벤트(문서 위임) 바인딩
    bind();
  };
})(window.jQuery || window.$, window);
