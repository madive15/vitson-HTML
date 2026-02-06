/**
 * @file scripts-mo/ui/category/category-sheet.js
 * @description 카테고리 바텀시트 — depth1/2/3 렌더링 및 선택
 * @scope .vm-category-sheet
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiCategorySheet';
  var SCOPE = '.vm-category-sheet';
  var DEPTH1_LIST = '.depth1-list';
  var SUB_LIST = '.depth-sub-list';

  var treeData = [];
  var currentPath = {};

  function setData(tree, path) {
    treeData = tree || [];
    currentPath = path || {};
  }

  function scrollToCenter($panel, selector) {
    requestAnimationFrame(function () {
      var $active = $panel.find(selector);
      if (!$active.length) return;

      var panel = $panel[0];
      var item = $active[0];

      var panelRect = panel.getBoundingClientRect();
      var itemRect = item.getBoundingClientRect();

      var itemTop = panel.scrollTop + (itemRect.top - panelRect.top);
      var panelHeight = panel.clientHeight;
      var itemHeight = itemRect.height;

      var scrollPos = itemTop - (panelHeight - itemHeight) / 2;
      var maxScroll = panel.scrollHeight - panelHeight;

      panel.scrollTop = Math.max(0, Math.min(scrollPos, maxScroll));
    });
  }

  function renderDepth1() {
    var $list = $(SCOPE).find(DEPTH1_LIST);
    if (!$list.length || !treeData.length) return;

    var html = '';

    for (var i = 0; i < treeData.length; i++) {
      var node = treeData[i];
      if (!node || !node.categoryCode) continue;

      var isActive = node.categoryCode === currentPath.depth1Id;

      html +=
        '<li class="depth1-item' +
        (isActive ? ' is-active' : '') +
        '"' +
        ' role="option"' +
        ' aria-selected="' +
        isActive +
        '"' +
        ' data-code="' +
        node.categoryCode +
        '"' +
        '>' +
        escapeHtml(node.categoryNm) +
        '</li>';
    }

    $list.html(html);

    if (currentPath.depth1Id) {
      renderSub(currentPath.depth1Id);
      scrollToCenter($(SCOPE).find('.depth1-panel'), '.depth1-item.is-active');
    }
  }

  function renderSub(depth1Code) {
    var $list = $(SCOPE).find(SUB_LIST);
    if (!$list.length) return;

    var node = findNode(treeData, depth1Code);
    if (!node || !Array.isArray(node.categoryList)) {
      $list.empty();
      return;
    }

    var html = '';

    for (var i = 0; i < node.categoryList.length; i++) {
      var d2 = node.categoryList[i];
      if (!d2 || !d2.categoryCode) continue;

      var children = Array.isArray(d2.categoryList)
        ? d2.categoryList.filter(function (d3) {
            return d3 && d3.categoryCode;
          })
        : [];

      var hasChildren = children.length > 0;

      var hasActiveD3 =
        hasChildren &&
        currentPath.depth3Id &&
        children.some(function (d3) {
          return d3.categoryCode === currentPath.depth3Id;
        });

      html +=
        '<li class="depth2-item' +
        (hasChildren ? ' has-children' : '') +
        (hasActiveD3 ? ' is-open' : '') +
        '"' +
        ' data-code="' +
        d2.categoryCode +
        '"' +
        '><span class="text">' +
        escapeHtml(d2.categoryNm) +
        '</span></li>';

      if (hasChildren) {
        html +=
          '<ul class="depth3-list" data-parent="' +
          d2.categoryCode +
          '"' +
          (hasActiveD3 ? '' : ' style="display:none"') +
          '>';
        for (var j = 0; j < children.length; j++) {
          var d3 = children[j];
          var isD3Active = d3.categoryCode === currentPath.depth3Id;

          html +=
            '<li class="depth3-item' +
            (isD3Active ? ' is-active' : '') +
            '"' +
            ' data-code="' +
            d3.categoryCode +
            '"' +
            ' data-depth2="' +
            d2.categoryCode +
            '"' +
            '>' +
            escapeHtml(d3.categoryNm) +
            '</li>';
        }
        html += '</ul>';
      }
    }

    $list.html(html);

    if (currentPath.depth3Id) {
      scrollToCenter($(SCOPE).find('.depth-sub-panel'), '.depth3-item.is-active');
    }
  }

  function findNode(tree, code) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i].categoryCode === code) return tree[i];
    }
    return null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildPathNames() {
    var names = [];
    var d1 = findNode(treeData, currentPath.depth1Id);
    if (!d1) return names;

    names.push(d1.categoryNm);

    if (Array.isArray(d1.categoryList)) {
      for (var i = 0; i < d1.categoryList.length; i++) {
        if (d1.categoryList[i].categoryCode === currentPath.depth2Id) {
          names.push(d1.categoryList[i].categoryNm);
          if (Array.isArray(d1.categoryList[i].categoryList)) {
            for (var j = 0; j < d1.categoryList[i].categoryList.length; j++) {
              if (d1.categoryList[i].categoryList[j].categoryCode === currentPath.depth3Id) {
                names.push(d1.categoryList[i].categoryList[j].categoryNm);
              }
            }
          }
        }
      }
    }

    return names;
  }

  function bindEvents() {
    $(document)
      .off('click' + NS)
      .on('click' + NS, SCOPE + ' .depth1-item', function () {
        var $item = $(this);
        var code = $item.data('code');

        $item
          .addClass('is-active')
          .attr('aria-selected', 'true')
          .siblings()
          .removeClass('is-active')
          .attr('aria-selected', 'false');

        currentPath.depth1Id = code;
        currentPath.depth2Id = '';
        currentPath.depth3Id = '';
        renderSub(code);
      })
      .on('click' + NS, SCOPE + ' .depth2-item.has-children', function () {
        var $item = $(this);
        var code = $item.data('code');
        var $list = $(SCOPE).find('.depth3-list[data-parent="' + code + '"]');

        $item.toggleClass('is-open');
        $list.slideToggle(200);
      })
      .on('click' + NS, SCOPE + ' .depth3-item', function () {
        var $item = $(this);

        $(SCOPE).find('.depth3-item').removeClass('is-active');
        $item.addClass('is-active');

        currentPath.depth2Id = $item.data('depth2');
        currentPath.depth3Id = $item.data('code');

        if (window.CategoryBreadcrumb) {
          window.CategoryBreadcrumb.update(buildPathNames());
        }

        if (window.KendoWindow) {
          window.KendoWindow.close('categorySheet');
        }
      });
  }

  function init() {
    bindEvents();
  }

  function scrollToActive() {
    var $d1Panel = $(SCOPE).find('.depth1-panel');
    var $subPanel = $(SCOPE).find('.depth-sub-panel');

    // depth1 스크롤
    var $activeD1 = $d1Panel.find('.depth1-item.is-active');
    if ($activeD1.length) {
      var panel = $d1Panel[0];
      var item = $activeD1[0];
      var panelHeight = panel.clientHeight;
      var itemTop = item.offsetTop;
      var itemHeight = item.offsetHeight;
      var scrollPos = itemTop - (panelHeight - itemHeight) / 2;
      panel.scrollTop = Math.max(0, Math.min(scrollPos, panel.scrollHeight - panelHeight));
    }

    // depth3 스크롤
    var $activeD3 = $subPanel.find('.depth3-item.is-active');
    if ($activeD3.length) {
      var panel2 = $subPanel[0];
      var item2 = $activeD3[0];
      var panelHeight2 = panel2.clientHeight;
      var itemTop2 = item2.offsetTop;
      var itemHeight2 = item2.offsetHeight;
      var scrollPos2 = itemTop2 - (panelHeight2 - itemHeight2) / 2;
      panel2.scrollTop = Math.max(0, Math.min(scrollPos2, panel2.scrollHeight - panelHeight2));
    }
  }

  window.CategorySheet = {
    init: init,
    setData: setData,
    render: renderDepth1,
    scrollToActive: scrollToActive
  };
})(window.jQuery, window);
