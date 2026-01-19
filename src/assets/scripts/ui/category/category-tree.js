/**
 * @file scripts/ui/category/category-tree.js
 * @purpose 좌측 카테고리 드릴다운(1~3뎁스): 트리/브레드크럼 동기화 + 4뎁스(속성) 체크박스 동적 렌더
 * @scope .vits-category-tree / [data-plp-attr-anchor] 내부만 제어
 *
 * @assumption
 *  - 트리 버튼: .category-tree-btn (data-depth="1|2|3", data-id="code")
 *  - 상태 클래스: is-active, is-open, is-hidden
 *  - 브레드크럼 셀렉트: [data-vits-select][data-root="cat"][data-depth="1|2|3"] + [data-vits-select-hidden]
 *  - 4뎁스 앵커: [data-plp-attr-anchor] (li 권장, 기본 is-hidden 권장)
 *  - 카테고리 트리 데이터: window.__mockData.category.tree (categoryCode/categoryNm/categoryList/categoryQty)
 *  - 체크박스 마크업: input-checkbox.ejs 구조(checkbox-wrapper/checkbox-item-area/checkbox-item-box...)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var TREE_ROOT = '.vits-category-tree';
  var BTN = '.category-tree-btn';
  var ITEM = '.category-tree-item';
  var PANEL = '.category-tree-panel';

  var CLS_ACTIVE = 'is-active';
  var CLS_OPEN = 'is-open';
  var CLS_HIDDEN = 'is-hidden';

  var SELECT_ROOT = '[data-vits-select][data-root="cat"]';
  var SELECT_OPT = '.vits-select-option';
  var SELECT_HIDDEN = '[data-vits-select-hidden]';
  var SELECT_VALUE = '[data-vits-select-value]';
  var SELECT_LIST = '[data-vits-select-list]';
  var SELECT_TRIGGER = '[data-vits-select-trigger]';

  var ATTR_ANCHOR = '[data-plp-attr-anchor]';

  var ATTR_NAME = 'plpAttr';
  var ATTR_VARIANT = 'basic';
  var ATTR_LIST = 'column';
  var ATTR_GAP = 16;

  // mockData 카테고리 트리를 안전하게 반환
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  // 리스트에서 categoryCode로 노드를 찾음
  function findByCode(list, code) {
    if (!Array.isArray(list) || !code) return null;

    var c = String(code || '');
    for (var i = 0; i < list.length; i += 1) {
      var n = list[i];
      if (n && String(n.categoryCode) === c) return n;
    }
    return null;
  }

  // 브레드크럼 셀렉트 루트를 depth로 찾음
  function getSelectRoot(depth) {
    return $(SELECT_ROOT + '[data-depth="' + depth + '"]').first();
  }

  // 브레드크럼 hidden 값을 depth로 읽음
  function getSelectValue(depth) {
    var $sel = getSelectRoot(depth);
    if (!$sel.length) return '';
    var $hidden = $sel.find(SELECT_HIDDEN).first();
    return $hidden.length ? String($hidden.val() || '') : '';
  }

  // 트리 버튼을 depth+code로 찾음
  function findTreeBtnByCode($tree, depth, code) {
    var c = String(code || '');
    if (!c) return $();
    return $tree.find(BTN + '[data-depth="' + depth + '"][data-id="' + c.replace(/"/g, '\\"') + '"]').first();
  }

  // 버튼 depth 값을 숫자로 반환
  function getBtnDepth($btn) {
    return parseInt($btn.attr('data-depth'), 10) || 0;
  }

  // 버튼 카테고리 코드를 반환
  function getBtnId($btn) {
    return String($btn.attr('data-id') || '');
  }

  // 아이템의 active/open 상태를 설정
  function setItemState($btn, active) {
    var $item = $btn.closest(ITEM);
    var $panel = $item.children(PANEL).first();

    $item.toggleClass(CLS_ACTIVE, !!active);
    $btn.attr('aria-expanded', active ? 'true' : 'false');

    if ($panel.length) $panel.toggleClass(CLS_OPEN, !!active);
  }

  // depth의 아이템 상태를 모두 초기화
  function resetDepthState($tree, depth) {
    $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
      setItemState($(this), false);
    });
  }

  // depth의 아이템을 모두 노출
  function showAllAtDepth($tree, depth) {
    $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
      $(this).closest(ITEM).removeClass(CLS_HIDDEN);
    });
  }

  // 현재 선택 버튼만 남기고 나머지 숨김
  function keepOnly($tree, $btn) {
    var depth = getBtnDepth($btn);
    $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
      $(this).closest(ITEM).toggleClass(CLS_HIDDEN, !$(this).is($btn));
    });
  }

  // 브레드크럼을 placeholder 상태로 리셋(표시/선택/hidden)
  function resetSelectToPlaceholder($root) {
    if (!$root || !$root.length) return;

    var $value = $root.find(SELECT_VALUE).first();
    var $hidden = $root.find(SELECT_HIDDEN).first();
    var placeholder = $value.attr('data-placeholder') || '';

    $root.find(SELECT_OPT).removeClass('vits-select-selected').attr('aria-selected', 'false');

    if ($value.length) $value.text(placeholder);
    if ($hidden.length) {
      $hidden.val('');
      $hidden.trigger('change');
    }
  }

  // 브레드크럼을 “비활성+옵션 비움”까지 포함해서 리셋(1뎁스 변경 시 잔상 방지)
  function disableSelectAndClear($root) {
    if (!$root || !$root.length) return;

    resetSelectToPlaceholder($root);

    var $list = $root.find(SELECT_LIST).first();
    if ($list.length) $list.empty();

    $root.addClass('vits-select-disabled');

    var $trigger = $root.find(SELECT_TRIGGER).first();
    if ($trigger.length) $trigger.prop('disabled', true);
  }

  // 브레드크럼 옵션을 value로 찾아 click()로 선택 처리
  function clickSelectOptionByValue($root, value) {
    if (!$root || !$root.length) return false;

    var v = String(value || '');
    if (!v) return false;

    var $opt = $root.find(SELECT_OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]').first();
    if (!$opt.length) return false;

    $opt.trigger('click');
    return true;
  }

  // 4뎁스 후보를 “선택된 3뎁스의 하위(categoryList)”에서만 추출
  function getDepth4ListFromBreadcrumb() {
    var tree = getTree();

    var d1 = getSelectValue(1);
    var d2 = getSelectValue(2);
    var d3 = getSelectValue(3);

    if (!d1 || !d2 || !d3) return [];

    var d1Node = findByCode(tree, d1);
    var d2List = d1Node && Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
    var d2Node = findByCode(d2List, d2);
    var d3List = d2Node && Array.isArray(d2Node.categoryList) ? d2Node.categoryList : [];
    var d3Node = findByCode(d3List, d3);

    var d4List = d3Node && Array.isArray(d3Node.categoryList) ? d3Node.categoryList : [];
    return d4List.filter(function (n) {
      return n && n.categoryCode && n.categoryNm;
    });
  }

  // 속성 앵커(li)를 1개만 찾음
  function getAttrAnchor() {
    return $(ATTR_ANCHOR).first();
  }

  // 속성 앵커를 비우고 숨김 처리
  function hideAttrAnchor() {
    var $li = getAttrAnchor();
    if (!$li.length) return;

    $li.empty().addClass(CLS_HIDDEN);
  }

  // 체크박스 리스트 클래스(list/gap)를 조합
  function getAttrListClass() {
    return 'list-' + ATTR_LIST + '-gap' + ATTR_GAP;
  }

  // input-checkbox.ejs 구조로 “속성” 체크박스 영역을 렌더링
  function renderAttrAnchor(d4List) {
    var $li = getAttrAnchor();
    if (!$li.length) return;

    if (!Array.isArray(d4List) || !d4List.length) {
      hideAttrAnchor();
      return;
    }

    $li.removeClass(CLS_HIDDEN);

    var $wrap = $('<div/>', {class: 'plp-side-filter-item'});
    $('<p/>', {class: 'plp-side-title', text: '속성'}).appendTo($wrap);

    var $checkboxWrap = $('<div/>', {
      class: 'checkbox-wrapper size-m type-' + ATTR_VARIANT
    }).appendTo($wrap);

    var $ul = $('<ul/>', {
      class: 'checkbox-item-area ' + getAttrListClass()
    }).appendTo($checkboxWrap);

    for (var i = 0; i < d4List.length; i += 1) {
      var n = d4List[i];
      var code = n && n.categoryCode ? String(n.categoryCode) : '';
      var name = n && n.categoryNm ? String(n.categoryNm) : '';
      var qty = n && n.categoryQty !== undefined && n.categoryQty !== null ? String(n.categoryQty) : '';
      if (!code || !name) continue;

      var $liItem = $('<li/>', {class: 'checkbox-item-box'}).appendTo($ul);
      var $label = $('<label/>', {class: 'checkbox-item'}).appendTo($liItem);

      $('<input/>', {type: 'checkbox', name: ATTR_NAME, value: code}).appendTo($label);
      $('<span/>', {class: 'checkbox-icon', 'aria-hidden': 'true'}).appendTo($label);

      var $name = $('<span/>', {class: 'label-name'}).appendTo($label);
      $name.append(document.createTextNode(name));

      if (qty !== '') $('<em/>', {class: 'label-unit', text: qty}).appendTo($name);
    }

    $li.empty().append($wrap);
  }

  // 브레드크럼 상태에 맞춰 4뎁스(속성) 앵커를 동기화
  function syncDepth4Attr() {
    var d4List = getDepth4ListFromBreadcrumb();
    renderAttrAnchor(d4List);
  }

  // 브레드크럼 상태를 기준으로 트리 UI를 재구성
  function applyFromBreadcrumb($tree) {
    var d1 = getSelectValue(1);
    var d2 = getSelectValue(2);
    var d3 = getSelectValue(3);

    showAllAtDepth($tree, 1);
    showAllAtDepth($tree, 2);
    showAllAtDepth($tree, 3);

    resetDepthState($tree, 1);
    resetDepthState($tree, 2);
    resetDepthState($tree, 3);

    if (!d1) {
      syncDepth4Attr();
      return;
    }

    var $b1 = findTreeBtnByCode($tree, 1, d1);
    if ($b1.length) {
      setItemState($b1, true);
      keepOnly($tree, $b1);
    }

    if (!d2) {
      syncDepth4Attr();
      return;
    }

    var $b2 = findTreeBtnByCode($tree, 2, d2);
    if ($b2.length) {
      setItemState($b2, true);
      keepOnly($tree, $b2);
    }

    if (!d3) {
      syncDepth4Attr();
      return;
    }

    var $b3 = findTreeBtnByCode($tree, 3, d3);
    if ($b3.length) {
      setItemState($b3, true);
      keepOnly($tree, $b3);
    }

    syncDepth4Attr();
  }

  // 1뎁스 클릭을 처리(선택/되돌리기)
  function handleDepth1($tree, $btn) {
    var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);

    // 1뎁스 해제 시: 1~3뎁스 모두 초기화
    if (isActive) {
      disableSelectAndClear(getSelectRoot(3));
      disableSelectAndClear(getSelectRoot(2));
      resetSelectToPlaceholder(getSelectRoot(1));
      return;
    }

    // 1뎁스 변경/선택 시: 2/3뎁스는 반드시 먼저 비움(잔상 방지)
    disableSelectAndClear(getSelectRoot(3));
    disableSelectAndClear(getSelectRoot(2));

    clickSelectOptionByValue(getSelectRoot(1), getBtnId($btn));
  }

  // 2뎁스 클릭을 처리(선택/되돌리기)
  function handleDepth2($tree, $btn) {
    var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);

    // 2뎁스 해제 시: 2/3뎁스 초기화(1뎁스는 유지)
    if (isActive) {
      disableSelectAndClear(getSelectRoot(3));
      resetSelectToPlaceholder(getSelectRoot(2));
      return;
    }

    // 2뎁스 변경/선택 시: 3뎁스는 반드시 먼저 비움(잔상 방지)
    disableSelectAndClear(getSelectRoot(3));

    clickSelectOptionByValue(getSelectRoot(2), getBtnId($btn));
  }

  // 3뎁스 클릭을 처리(선택만)
  function handleDepth3($tree, $btn) {
    clickSelectOptionByValue(getSelectRoot(3), getBtnId($btn));
  }

  // 트리 클릭 이벤트를 바인딩
  function bindTree($tree) {
    $tree.on('click.categoryTree', BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var depth = getBtnDepth($btn);
      if (!depth) return;

      if (depth === 1) handleDepth1($tree, $btn);
      if (depth === 2) handleDepth2($tree, $btn);
      if (depth === 3) handleDepth3($tree, $btn);
    });
  }

  // 브레드크럼 변경을 트리에 반영
  function bindBreadcrumbSync($tree) {
    $(document).on('change.categoryTree', SELECT_ROOT + ' ' + SELECT_HIDDEN, function () {
      window.requestAnimationFrame(function () {
        applyFromBreadcrumb($tree);
      });
    });
  }

  // 트리 루트를 초기화
  function initTree($tree) {
    hideAttrAnchor();
    applyFromBreadcrumb($tree);
    bindTree($tree);
    bindBreadcrumbSync($tree);
  }

  window.UI.categoryTree = {
    init: function () {
      $(TREE_ROOT).each(function () {
        initTree($(this));
      });
    }
  };
})(window.jQuery || window.$, window, document);
