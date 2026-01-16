/**
 * @file scripts/ui/form/select.js
 * @purpose select 공통: 단독/브레드크럼(1~3뎁스) 셀렉트 UI + 옵션 렌더링 + placeholder/선택값 표시 + 연동 활성화 규칙
 * @scope [data-vits-select] 컴포넌트만 적용(전역 영향 없음)
 *
 * @rule
 *  - 브레드크럼:
 *    - 1뎁스 선택 → 2뎁스 옵션 주입/활성(옵션 없으면 disabled 유지 + is-no-option)
 *    - 2뎁스 선택 → 3뎁스 옵션 주입/활성(옵션 없으면 disabled 유지 + is-no-option)
 *    - placeholder(선택값 '')면 다음뎁스 비활성
 *  - 옵션 데이터는 window.__mockData.category.tree 기준(categoryCode/categoryNm/categoryList)
 *
 * @state
 *  - root.vits-select-open: 옵션 리스트 오픈 상태
 *  - root.vits-select-disabled: 비활성 상태(클릭 차단)
 *  - root.is-no-option: 하위 옵션 없음 상태(스타일링용)
 *  - option.vits-select-selected: 선택 옵션 표시
 *
 * @option (root) data-root="groupId" // 브레드크럼 그룹 식별자(같은 값끼리 연동)
 * @option (root) data-depth="1|2|3"  // 브레드크럼 뎁스(단독이면 생략 가능)
 * @hook  (list) data-vits-select-list // 옵션 컨테이너(ul)
 * @hook  (hidden) data-vits-select-hidden // 선택값 저장
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[select] jQuery not found');
    return;
  }

  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var NS = '.uiSelect';

  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  function getGroup($root) {
    return $root.attr('data-root') || '';
  }

  function getDepth($root) {
    return parseInt($root.attr('data-depth'), 10) || 0;
  }

  function getGroupRoots(group) {
    return $(ROOT).filter(function () {
      return ($(this).attr('data-root') || '') === group;
    });
  }

  function findDepth($roots, depth) {
    var $found = $();
    $roots.each(function () {
      var $r = $(this);
      if (getDepth($r) === depth) $found = $found.add($r);
    });
    return $found;
  }

  function closeAll() {
    $(ROOT).removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');
  }

  function openOne($root) {
    closeAll();
    $root.addClass('vits-select-open');
    $root.find(TRIGGER).attr('aria-expanded', 'true');
  }

  function setDisabled($root, disabled) {
    $root.toggleClass('vits-select-disabled', !!disabled);
    $root.find(TRIGGER).prop('disabled', !!disabled);

    if (disabled) {
      $root.removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');
    }
  }

  function setNoOption($root, on) {
    $root.toggleClass('is-no-option', !!on);
  }

  function resetToPlaceholder($root, clearOptions) {
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');

    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) $hidden.val('');

    $root.find(OPT).removeClass('vits-select-selected').attr('aria-selected', 'false');

    if (clearOptions) $root.find(LIST).empty();
  }

  function setSelectedByValue($root, value) {
    var v = String(value || '');
    if (!v) return false;

    // // hidden 값 기준으로 옵션 선택 복원
    var $match = $root.find(OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]');
    if (!$match.length) return false;

    setSelected($root, $match.eq(0));
    return true;
  }

  function setSelected($root, $opt) {
    // // 선택 옵션 1개만 유지
    $root.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass('vits-select-selected', sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });

    // // 표시 텍스트 갱신
    $root.find(VALUE).text($opt.text());

    // // hidden 값 갱신(연동 기준)
    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) {
      $hidden.val($opt.attr('data-value') || $opt.text());
      $hidden.trigger('change');
    }
  }

  function renderOptions($root, items) {
    var $list = $root.find(LIST);
    if (!$list.length) return;

    // // 옵션 DOM 생성(최소 마크업)
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.value) continue;

      html +=
        '<li class="vits-select-option" role="option" tabindex="-1" data-value="' +
        String(it.value) +
        '" aria-selected="false">' +
        String(it.text || '') +
        '</li>';
    }
    $list.html(html);
  }

  function findNodeByCode(list, code) {
    if (!code) return null;

    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].categoryCode) === String(code)) return list[i];
    }
    return null;
  }

  // // categoryList가 null이어도 안전 처리
  function mapChildren(node) {
    var out = [];
    var children = node && Array.isArray(node.categoryList) ? node.categoryList : [];

    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (!c || !c.categoryCode) continue;
      out.push({value: c.categoryCode, text: c.categoryNm || ''});
    }
    return out;
  }

  function disableAsNoOption($root) {
    // // 하위 옵션 없음: 비활성 + 스타일용 클래스
    resetToPlaceholder($root, true);
    setDisabled($root, true);
    setNoOption($root, true);
  }

  function enableWithOptions($root, items) {
    // // 옵션 주입 + 활성
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? String($hidden.val() || '') : '';
  }

  /**
   * 그룹(cat) 기준 연동 갱신
   * @param {$} $changedRoot - 변경된 root(클릭한 셀렉트 root)
   * @param {number} reasonDepth - 0: 초기, 1: 1뎁스 변경, 2: 2뎁스 변경
   */
  function applyBreadcrumb($changedRoot, reasonDepth) {
    var group = getGroup($changedRoot);
    if (!group) return;

    var $groupRoots = getGroupRoots(group);
    if (!$groupRoots.length) return;

    var $d1 = findDepth($groupRoots, 1);
    var $d2 = findDepth($groupRoots, 2);
    var $d3 = findDepth($groupRoots, 3);

    if (!$d2.length && !$d3.length) return;

    var tree = getTree();

    // // 1뎁스 선택값 기준으로 2뎁스 옵션 구성
    var d1Val = $d1.length ? getHiddenVal($d1) : '';
    var d1Node = d1Val ? findNodeByCode(tree, d1Val) : null;

    // // 1뎁스 미선택: 2/3 비활성(옵션/상태 정리)
    if (!d1Node) {
      if ($d2.length) {
        resetToPlaceholder($d2, true);
        setDisabled($d2, true);
        setNoOption($d2, false);
      }
      if ($d3.length) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
      }
      return;
    }

    // ----- 2뎁스 -----
    if ($d2.length) {
      var d2Items = mapChildren(d1Node);

      if (!d2Items.length) {
        disableAsNoOption($d2);

        // // 2뎁스가 없으면 3뎁스도 의미 없음
        if ($d3.length) {
          resetToPlaceholder($d3, true);
          setDisabled($d3, true);
          setNoOption($d3, false);
        }
        return;
      }

      // // 1뎁스가 바뀌면 2뎁스는 “선택 초기화”가 기본
      if (reasonDepth === 1) {
        resetToPlaceholder($d2, true);
      }

      // // 옵션 주입
      enableWithOptions($d2, d2Items);

      // // 초기/유지 케이스면 hidden 값으로 선택 복원
      if (reasonDepth === 0) {
        setSelectedByValue($d2, getHiddenVal($d2));
      } else if (reasonDepth !== 1) {
        // // 2뎁스 변경(reasonDepth=2)에서는 선택이 이미 반영됨(유지)
        setSelectedByValue($d2, getHiddenVal($d2));
      }

      // // 선택 복원이 안 됐으면 placeholder 유지(UX 안정)
      if (!getHiddenVal($d2)) {
        // // 2뎁스 미선택이면 3뎁스는 비활성로 유지
        if ($d3.length) {
          resetToPlaceholder($d3, true);
          setDisabled($d3, true);
          setNoOption($d3, false);
        }
      }
    }

    // ----- 3뎁스 -----
    if ($d3.length) {
      var d2Val = $d2.length ? getHiddenVal($d2) : '';

      // // 2뎁스 미선택: 3뎁스 비활성
      if (!d2Val) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
        return;
      }

      var d2ListSafe = Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
      var d2Node = findNodeByCode(d2ListSafe, d2Val);

      if (!d2Node) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
        return;
      }

      var d3Items = mapChildren(d2Node);

      if (!d3Items.length) {
        disableAsNoOption($d3);
        return;
      }

      // // 2뎁스가 바뀌면 3뎁스는 “선택 초기화”가 기본
      if (reasonDepth === 2) {
        resetToPlaceholder($d3, true);
      }

      // // 옵션 주입
      enableWithOptions($d3, d3Items);

      // // 초기/유지 케이스면 hidden 값으로 선택 복원
      if (reasonDepth === 0) {
        setSelectedByValue($d3, getHiddenVal($d3));
      } else if (reasonDepth !== 2) {
        setSelectedByValue($d3, getHiddenVal($d3));
      }
    }
  }

  /**
   * 현재 선택된 브레드크럼 기준으로 PLP 상단 카테고리 타이틀 갱신
   * - depth3 → depth2 → depth1 우선
   */
  function updateCategoryTitle() {
    var $title = $('[data-plp-category-title]');
    if (!$title.length) return;

    // // 선택된 옵션이 없으면 placeholder 텍스트로 유지(원하면 여기서 비우기 처리 가능)
    var $d3 = $('[data-vits-select][data-depth="3"] ' + OPT + '.vits-select-selected').last();
    var $d2 = $('[data-vits-select][data-depth="2"] ' + OPT + '.vits-select-selected').last();
    var $d1 = $('[data-vits-select][data-depth="1"] ' + OPT + '.vits-select-selected').last();

    var $pick = $d3.length ? $d3 : $d2.length ? $d2 : $d1;

    if ($pick && $pick.length) {
      $title.text($pick.text());
    }
  }

  function bind() {
    // // 외부 클릭 시 전체 닫기
    $(document).on('mousedown' + NS, function (e) {
      if (!$(e.target).closest(ROOT).length) closeAll();
    });

    // // 트리거 클릭(비활성이면 무시)
    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();

      var $root = $(this).closest(ROOT);
      if ($root.hasClass('vits-select-disabled')) return;

      if ($root.hasClass('vits-select-open')) closeAll();
      else openOne($root);
    });

    // // 옵션 클릭(선택 + 연동 갱신)
    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();

      var $opt = $(this);
      if ($opt.hasClass('vits-select-option-disabled')) return;

      var $root = $opt.closest(ROOT);
      var depth = getDepth($root);
      var group = getGroup($root);

      // // 선택 반영(여기서 VALUE/hidden이 확정됨)
      setSelected($root, $opt);
      closeAll();

      // // 하위뎁스는 선택 변경 시 초기화(옵션은 applyBreadcrumb에서 재결정)
      if (group) {
        var $groupRoots = getGroupRoots(group);
        var $d2 = findDepth($groupRoots, 2);
        var $d3 = findDepth($groupRoots, 3);

        if (depth === 1) {
          if ($d2.length) {
            resetToPlaceholder($d2, true);
            setDisabled($d2, true);
            setNoOption($d2, false);
          }
          if ($d3.length) {
            resetToPlaceholder($d3, true);
            setDisabled($d3, true);
            setNoOption($d3, false);
          }
        }

        if (depth === 2) {
          if ($d3.length) {
            resetToPlaceholder($d3, true);
            setDisabled($d3, true);
            setNoOption($d3, false);
          }
        }
      }

      // // 클릭한 depth를 reasonDepth로 넘겨서 “리셋 규칙”을 정확히 적용
      applyBreadcrumb($root, depth);

      // // 현재 카테고리 타이틀 갱신
      updateCategoryTitle();
    });
  }

  function init(root) {
    var $roots = root ? $(root).find(ROOT) : $(ROOT);

    // // aria 초기화
    $roots.find(TRIGGER).attr('aria-expanded', 'false');

    // // 마크업 disabled 동기화
    $roots.each(function () {
      var $r = $(this);
      if ($r.hasClass('vits-select-disabled')) setDisabled($r, true);
    });

    // // 초기 진입: 그룹별로 1회만 “옵션 주입 + 선택 복원” 실행
    var groups = {};
    $roots.each(function () {
      var g = getGroup($(this));
      if (g) groups[g] = true;
    });

    Object.keys(groups).forEach(function (g) {
      var $groupRoots = getGroupRoots(g);
      var $d1 = findDepth($groupRoots, 1);
      if ($d1.length) {
        applyBreadcrumb($d1.eq(0), 0); // // reasonDepth=0(초기) → 2/3뎁스 선택 복원까지 수행
      }
    });

    updateCategoryTitle();
  }

  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };
})(window.jQuery, window, document);
