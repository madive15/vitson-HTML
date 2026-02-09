/**
 * @file scripts/ui/category/category-tree.js
 * @purpose 좌측 카테고리 드릴다운(1~3뎁스): 트리/브레드크럼 동기화 + 1촌 상위 표시 규칙 + 4뎁스(속성) 체크박스 동적 렌더
 * @scope .vits-category-tree 내부 + [data-plp-attr-anchor] 렌더(트리 내부 우선, 없으면 문서 fallback)
 *
 * @display_rules
 *  - 1뎁스 선택: 1뎁스(is-active) + 하위 2뎁스 목록
 *  - 2뎁스 선택: 1뎁스(1촌 상위) + 2뎁스(is-active) + 하위 3뎁스 목록
 *  - 3뎁스 선택: 2뎁스(1촌 상위) + 3뎁스(is-active) 형제 목록 (1뎁스 버튼 숨김)
 *
 * @click_behavior
 *  - 1뎁스 재클릭: 2뎁스, 3뎁스 초기화 (1뎁스 + 2뎁스 목록 상태로 복귀)
 *  - 2뎁스 재클릭: 3뎁스 초기화 (하위 없으면 무동작)
 *  - 3뎁스 클릭: 브레드크럼 선택 후 트리 동기화
 *
 * @assumption
 *  - 트리 버튼: .category-tree-btn (data-depth="1|2|3", data-id="code", data-has-children="true|false")
 *  - 상태 클래스: is-active(최종 선택), is-open(패널 열림), is-hidden(요소 숨김)
 *  - 브레드크럼 셀렉트: [data-vits-select][data-root="cat"][data-depth="1|2|3"] + [data-vits-select-hidden]
 *  - 4뎁스 앵커: [data-plp-attr-anchor] (li 권장, 기본 is-hidden 권장)
 *  - 카테고리 트리 데이터: window.__mockData.category.tree (categoryCode/categoryNm/categoryList/categoryQty)
 *  - 체크박스 마크업: input-checkbox.ejs 구조(checkbox-wrapper/checkbox-item-area/checkbox-item-box...)
 *
 * @maintenance
 *  - 문서 change 바인딩은 모듈에서 1회만 수행(중복 바인딩 방지)
 *  - 트리는 DOM 1개당 인스턴스로 분리(상태 충돌 방지)
 *  - 브레드크럼 셀렉트는 문서에서 depth별 1세트 전제(getSelectRoot는 first() 사용)
 *  - 4뎁스 앵커가 트리 외부에 있는 기존 구조를 위해 "트리 내부 우선 + 문서 fallback"을 사용
 *  - 3뎁스 선택 시 1뎁스 li는 유지하되 버튼만 is-hidden 처리 (하위 2,3뎁스 표시 위해)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'categoryTree';
  var EVENT_NS = '.' + MODULE_KEY;

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

  var INSTANCES = [];
  var IS_DOC_BOUND = false;
  var RAF_ID = 0;

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

  // data-* 셀렉터용 값 이스케이프(최소 방어)
  function escAttrValue(v) {
    return String(v || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
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

  // 브레드크럼을 "비활성+옵션 비움"까지 포함해서 리셋(상위 변경 시 잔상 방지)
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

    var $opt = $root.find(SELECT_OPT + '[data-value="' + escAttrValue(v) + '"]').first();
    if (!$opt.length) return false;

    $opt.trigger('click');
    return true;
  }

  // 트리 인스턴스를 생성(트리 DOM 단위로 스코프/이벤트/렌더를 묶음)
  function createInstance($tree) {
    // 4뎁스 앵커는 트리 내부 우선, 없으면 문서에서 fallback(기존 마크업 구조 호환)
    var $attrAnchor = $tree.find(ATTR_ANCHOR).first();
    if (!$attrAnchor.length) $attrAnchor = $(ATTR_ANCHOR).first();

    // 버튼 depth 값을 숫자로 반환
    function getBtnDepth($btn) {
      return parseInt($btn.attr('data-depth'), 10) || 0;
    }

    // 버튼 카테고리 코드를 반환
    function getBtnId($btn) {
      return String($btn.attr('data-id') || '');
    }

    // 버튼에 자식이 있는지 확인
    function hasChildren($btn) {
      return $btn.attr('data-has-children') === 'true';
    }

    // 트리 버튼을 depth+code로 찾음
    function findTreeBtnByCode(depth, code) {
      var c = String(code || '');
      if (!c) return $();
      return $tree.find(BTN + '[data-depth="' + depth + '"][data-id="' + escAttrValue(c) + '"]').first();
    }

    // 아이템의 open 상태를 설정 (패널 열림용)
    function setItemState($btn, active) {
      var $item = $btn.closest(ITEM);
      var $panel = $item.children(PANEL).first();

      $btn.attr('aria-expanded', active ? 'true' : 'false');

      if ($panel.length) $panel.toggleClass(CLS_OPEN, !!active);
    }

    // depth의 아이템 상태를 모두 초기화
    function resetDepthState(depth) {
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        setItemState($(this), false);
      });
    }

    // depth의 아이템을 모두 노출
    function showAllAtDepth(depth) {
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        $(this).closest(ITEM).removeClass(CLS_HIDDEN);
      });
    }

    // 현재 선택 버튼만 남기고 나머지 숨김
    function keepOnly($btn) {
      var depth = getBtnDepth($btn);
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        $(this).closest(ITEM).toggleClass(CLS_HIDDEN, !$(this).is($btn));
      });
    }

    // 같은 부모를 가진 형제 버튼들을 모두 표시
    function showSiblings($btn) {
      var depth = getBtnDepth($btn);
      var $item = $btn.closest(ITEM);
      var $parentPanel = $item.parent().closest(PANEL);

      if ($parentPanel.length) {
        // 같은 부모 패널 안의 같은 depth 아이템들만 표시
        $parentPanel.find(BTN + '[data-depth="' + depth + '"]').each(function () {
          $(this).closest(ITEM).removeClass(CLS_HIDDEN);
        });
      } else {
        // depth1인 경우 모든 depth1 표시
        showAllAtDepth(depth);
      }
    }

    // 속성 앵커를 비우고 숨김 처리
    function hideAttrAnchor() {
      if (!$attrAnchor.length) return;
      $attrAnchor.empty().addClass(CLS_HIDDEN);
    }

    // 체크박스 리스트 클래스(list/gap)를 조합
    function getAttrListClass() {
      return 'list-' + ATTR_LIST + '-gap' + ATTR_GAP;
    }

    // 4뎁스 후보를 "선택된 3뎁스의 하위(categoryList)"에서만 추출
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

    // input-checkbox.ejs 구조로 "속성" 체크박스 영역을 렌더링
    function renderAttrAnchor(d4List) {
      if (!$attrAnchor.length) return;

      if (!Array.isArray(d4List) || !d4List.length) {
        hideAttrAnchor();
        return;
      }

      $attrAnchor.removeClass(CLS_HIDDEN);

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

      $attrAnchor.empty().append($wrap);
    }

    // 브레드크럼 상태에 맞춰 4뎁스(속성) 앵커를 동기화
    function syncDepth4Attr() {
      renderAttrAnchor(getDepth4ListFromBreadcrumb());
    }

    // 브레드크럼 상태를 기준으로 트리 UI를 재구성
    function applyFromBreadcrumb() {
      var d1 = getSelectValue(1);
      var d2 = getSelectValue(2);
      var d3 = getSelectValue(3);

      showAllAtDepth(1);
      showAllAtDepth(2);
      showAllAtDepth(3);

      resetDepthState(1);
      resetDepthState(2);
      resetDepthState(3);

      // 모든 is-active 초기화
      $tree.find(ITEM).removeClass(CLS_ACTIVE);

      // 모든 버튼 보이기
      $tree.find(BTN).removeClass(CLS_HIDDEN);

      if (!d1) {
        syncDepth4Attr();
        return;
      }

      var $b1 = findTreeBtnByCode(1, d1);
      if ($b1.length) {
        setItemState($b1, true);
        keepOnly($b1);

        // 2뎁스가 없으면 1뎁스에 is-active
        if (!d2) {
          $b1.closest(ITEM).addClass(CLS_ACTIVE);
        }
      }

      if (!d2) {
        syncDepth4Attr();
        return;
      }

      var $b2 = findTreeBtnByCode(2, d2);
      if ($b2.length) {
        setItemState($b2, true);

        // 1뎁스 is-active 제거
        if ($b1 && $b1.length) {
          $b1.closest(ITEM).removeClass(CLS_ACTIVE);
        }

        // 3뎁스가 없으면 2뎁스에 is-active
        if (!d3) {
          $b2.closest(ITEM).addClass(CLS_ACTIVE);
        }

        // 2뎁스가 마지막 레벨이면 형제 표시
        if (!hasChildren($b2)) {
          showSiblings($b2);
        } else {
          keepOnly($b2);
        }
      }

      if (!d3) {
        syncDepth4Attr();
        return;
      }

      var $b3 = findTreeBtnByCode(3, d3);
      if ($b3.length) {
        // 3뎁스 선택 시: 1뎁스 버튼만 숨김 (li는 유지)
        if ($b1 && $b1.length) {
          $b1.addClass(CLS_HIDDEN); // 버튼만 숨김
        }

        // 2뎁스 is-active 제거, 3뎁스에 is-active 적용
        if ($b2 && $b2.length) {
          $b2.closest(ITEM).removeClass(CLS_ACTIVE);
        }

        $b3.closest(ITEM).addClass(CLS_ACTIVE);
        showSiblings($b3);
      }

      syncDepth4Attr();
    }

    // 1뎁스 클릭을 처리
    function handleDepth1($btn) {
      var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);

      if (isActive) {
        // 이미 선택된 1뎁스를 다시 클릭하면 2뎁스, 3뎁스 초기화
        disableSelectAndClear(getSelectRoot(3));
        resetSelectToPlaceholder(getSelectRoot(2));
        return;
      }

      // 새로운 1뎁스 선택
      disableSelectAndClear(getSelectRoot(3));
      disableSelectAndClear(getSelectRoot(2));
      clickSelectOptionByValue(getSelectRoot(1), getBtnId($btn));
    }

    // 2뎁스 클릭을 처리
    function handleDepth2($btn) {
      var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);

      if (isActive) {
        // 이미 선택된 2뎁스를 다시 클릭하면 3뎁스 초기화
        disableSelectAndClear(getSelectRoot(3));
        return;
      }

      // 새로운 2뎁스 선택
      disableSelectAndClear(getSelectRoot(3));
      clickSelectOptionByValue(getSelectRoot(2), getBtnId($btn));
    }

    // 3뎁스 클릭을 처리(선택만)
    function handleDepth3($btn) {
      clickSelectOptionByValue(getSelectRoot(3), getBtnId($btn));
    }

    // 트리 클릭 이벤트를 바인딩
    function bindTree() {
      $tree.off('click' + EVENT_NS).on('click' + EVENT_NS, BTN, function (e) {
        e.preventDefault();

        var $btn = $(this);
        var depth = getBtnDepth($btn);
        if (!depth) return;

        if (depth === 1) handleDepth1($btn);
        if (depth === 2) handleDepth2($btn);
        if (depth === 3) handleDepth3($btn);
      });
    }

    // 트리 루트를 초기화
    function init() {
      hideAttrAnchor();
      applyFromBreadcrumb();
      bindTree();
    }

    // 트리 인스턴스를 파기(이벤트/렌더 정리)
    function destroy() {
      $tree.off(EVENT_NS);
      hideAttrAnchor();
    }

    return {
      init: init,
      destroy: destroy,
      applyFromBreadcrumb: applyFromBreadcrumb
    };
  }

  // 브레드크럼 change 연쇄 호출을 1프레임으로 병합
  function broadcastApplyFromBreadcrumb() {
    if (RAF_ID) window.cancelAnimationFrame(RAF_ID);

    RAF_ID = window.requestAnimationFrame(function () {
      for (var i = 0; i < INSTANCES.length; i += 1) {
        if (INSTANCES[i] && typeof INSTANCES[i].applyFromBreadcrumb === 'function') {
          INSTANCES[i].applyFromBreadcrumb();
        }
      }
      RAF_ID = 0;
    });
  }

  // 문서 브레드크럼 변경을 1회만 바인딩
  function bindDocumentBreadcrumbSyncOnce() {
    if (IS_DOC_BOUND) return;

    $(document).on('change' + EVENT_NS, SELECT_ROOT + ' ' + SELECT_HIDDEN, function () {
      broadcastApplyFromBreadcrumb();
    });

    IS_DOC_BOUND = true;
  }

  window.UI.categoryTree = {
    // 모듈 초기화(트리별 인스턴스 생성/초기화)
    init: function () {
      bindDocumentBreadcrumbSyncOnce();

      $(TREE_ROOT).each(function () {
        var $tree = $(this);

        var inst = $tree.data(MODULE_KEY);
        if (!inst) {
          inst = createInstance($tree);
          $tree.data(MODULE_KEY, inst);
          INSTANCES.push(inst);
        }

        inst.init();
      });
    },

    // 모듈 파기(모든 트리 이벤트/렌더 정리)
    destroy: function () {
      for (var i = 0; i < INSTANCES.length; i += 1) {
        if (INSTANCES[i] && typeof INSTANCES[i].destroy === 'function') {
          INSTANCES[i].destroy();
        }
      }

      INSTANCES = [];

      if (RAF_ID) {
        window.cancelAnimationFrame(RAF_ID);
        RAF_ID = 0;
      }
    }
  };
})(window.jQuery || window.$, window, document);
