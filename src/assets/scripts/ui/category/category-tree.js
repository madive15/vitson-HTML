/**
 * @file scripts/ui/category/category-tree.js
 * @description 검색결과 좌측 카테고리 트리: 아코디언 토글 (기본 접힘)
 * @scope .vits-category-tree 내부 (1뎁스 단위 블록 × N개)
 *
 * @behavior
 *  - 하위가 있는 버튼 클릭: 패널 토글 (is-open)
 *  - 말단 카테고리 클릭: is-active 표시 + 기본 동작 위임 (개발자 바인딩)
 *  - 초기 상태: 모든 패널 접힘
 *
 * @state is-open(패널 열림), is-active(말단 선택)
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'categoryTree';
  var EVENT_NS = '.' + MODULE_KEY;

  var TREE_ROOT = '.vits-category-tree';
  var BTN = '.category-tree-btn';
  var ITEM = '.category-tree-item';
  var PANEL = '.category-tree-panel';

  var CLS_OPEN = 'is-open';
  var CLS_ACTIVE = 'is-active';

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
    $tree.find(BTN + '[data-has-children="true"]').attr('aria-expanded', 'false');
  }

  function createInstance($tree) {
    function bindTree() {
      $tree.off('click' + EVENT_NS).on('click' + EVENT_NS, BTN, function (e) {
        var $btn = $(this);

        // 하위가 있으면 토글
        if ($btn.attr('data-has-children') === 'true') {
          e.preventDefault();
          togglePanel($btn);
          return;
        }

        // 말단 카테고리: 전체 트리에서 선택 초기화 후 현재 선택
        $(TREE_ROOT).find(ITEM).removeClass(CLS_ACTIVE);
        $btn.closest(ITEM).addClass(CLS_ACTIVE);
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

  window.UI.categoryTree = {
    init: function () {
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
      $(TREE_ROOT).each(function () {
        var inst = $(this).data(MODULE_KEY);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      });
    }
  };
})(window.jQuery || window.$, window);
