/**
 * @file scripts/ui/category/category-tree-search.js
 * @description 검색결과 좌측 카테고리 트리: 체크박스 + 아코디언 토글 + 더보기/접기
 * @scope .vits-category-tree-list 내부
 *
 * @behavior
 *  - [data-tree-toggle] 클릭: 패널 토글 (is-open) + aria-expanded 전환
 *  - [data-search-more-btn] 클릭: 숨김 영역 토글 + 버튼 텍스트 전환 + 접기 시 count 숨김
 *  - 초기 상태: 모든 패널 접힘, 더보기 영역 숨김
 *
 * @state is-open(패널 열림)
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'categoryTreeSearch';
  var EVENT_NS = '.' + MODULE_KEY;

  var TREE_ROOT = '.vits-category-tree-list .vits-category-tree';
  var BTN = '[data-tree-toggle]';
  var ITEM = '.category-tree-item';
  var PANEL = '.category-tree-panel';

  var MORE_SCOPE = '[data-search-more-scope]';
  var MORE_BTN = '[data-search-more-btn]';
  var MORE_TOGGLE = '[data-search-more-toggle]';

  var CLS_OPEN = 'is-open';

  var TXT_MORE = '더보기';
  var TXT_LESS = '접기';
  var IC_PLUS = 'ic-plus';
  var IC_MINUS = 'ic-minus';

  // 패널 토글
  function togglePanel($btn) {
    var $item = $btn.closest(ITEM);
    var $panel = $item.children(PANEL).first();
    if (!$panel.length) return;

    var isOpen = $panel.hasClass(CLS_OPEN);

    $panel.toggleClass(CLS_OPEN, !isOpen);
    $btn.attr('aria-expanded', String(!isOpen));
  }

  // 모든 패널 접힘 처리
  function collapseAll($tree) {
    $tree.find(PANEL).removeClass(CLS_OPEN);
    $tree.find(BTN).attr('aria-expanded', 'false');
  }

  function createInstance($tree) {
    function bindTree() {
      $tree.off('click' + EVENT_NS).on('click' + EVENT_NS, BTN, function (e) {
        e.preventDefault();
        togglePanel($(this));
      });
    }

    function init() {
      collapseAll($tree);
      bindTree();
    }

    function destroy() {
      $tree.off(EVENT_NS);
    }

    return {init: init, destroy: destroy};
  }

  // 더보기/접기 바인딩
  function bindMoreToggle() {
    $(document)
      .off('click' + EVENT_NS, MORE_BTN)
      .on('click' + EVENT_NS, MORE_BTN, function () {
        var $btn = $(this);
        var $scope = $btn.closest(MORE_SCOPE);
        if (!$scope.length) return;

        var $target = $scope.find(MORE_TOGGLE);
        if (!$target.length) return;

        var isVisible = $target.is(':visible');

        $target.toggle(!isVisible);
        $btn.find('.text').text(isVisible ? TXT_MORE : TXT_LESS);
        $btn.find('.count').toggle(isVisible);
        $btn.find('.icon .ic').toggleClass(IC_PLUS, isVisible).toggleClass(IC_MINUS, !isVisible);
      });
  }

  window.UI.categoryTreeSearch = {
    init: function () {
      bindMoreToggle();

      $(TREE_ROOT).each(function () {
        var $tree = $(this);
        var inst = $tree.data(MODULE_KEY);

        if (!inst) {
          inst = createInstance($tree);
          $tree.data(MODULE_KEY, inst);
        }

        inst.init();
      });
    },

    destroy: function () {
      $(document).off('click' + EVENT_NS, MORE_BTN);

      $(TREE_ROOT).each(function () {
        var inst = $(this).data(MODULE_KEY);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      });
    }
  };
})(window.jQuery || window.$, window);
