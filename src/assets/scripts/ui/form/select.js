/**
 * @file scripts/ui/form/select.js
 * @purpose 커스텀 셀렉트 공통: 단일/브레드크럼(1~3뎁스) UI + 옵션 렌더링 + 선택값 표시 + 연동 활성화
 * @scope [data-vits-select] 컴포넌트 범위 내에서만 동작
 *
 * @rule
 *  - 트리거 클릭: open/close 토글(외부 클릭 시 close)
 *  - 옵션 클릭: 선택 표시/hidden 갱신 + (브레드크럼이면) 다음 뎁스 옵션 주입/활성
 *  - placeholder(선택값 '')면 다음 뎁스 비활성
 *
 * @state
 *  - root.vits-select-open: 옵션 리스트 오픈
 *  - root.vits-select-dropup: 위로 오픈(공간 부족 시 자동)
 *  - root.vits-select-disabled: 비활성(클릭 차단)
 *  - root.is-no-option: 하위 옵션 없음
 *  - option.vits-select-selected: 선택 옵션
 *
 * @a11y
 *  - trigger[aria-expanded] 동기화
 *  - option[aria-selected] 동기화
 *
 * @note
 *  - 옵션 데이터: window.__mockData.category.tree 기준(categoryCode/categoryNm/categoryList)
 *  - 옵션 url 지원: option[data-url]이 있으면 선택 후 새창으로 열고(이동)
 *  - 강제 dropup 지원: 마크업에 vits-select-dropup이 이미 있으면 자동 방향 토글을 수행하지 않는다(클래스 유지)
 */

(function ($, window, document) {
  'use strict';

  // jQuery 의존(프로젝트 전제)
  if (!$) {
    console.log('[select] jQuery not found');
    return;
  }

  // UI 네임스페이스 보장
  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  // 루트/훅 셀렉터
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';

  // 이벤트 네임스페이스(중복 바인딩 방지)
  var NS = '.uiSelect';

  // dropup 제어용 상수
  var DROPUP = 'vits-select-dropup';
  var GUTTER = 8;
  var MIN_H = 120;

  // mockData 카테고리 트리를 안전하게 반환
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  // 루트의 브레드크럼 그룹 식별자를 반환
  function getGroup($root) {
    return $root.attr('data-root') || '';
  }

  // 루트의 브레드크럼 뎁스(1~3)를 반환
  function getDepth($root) {
    return parseInt($root.attr('data-depth'), 10) || 0;
  }

  // 동일 group에 속한 루트 셀렉트들을 수집
  function getGroupRoots(group) {
    return $(ROOT).filter(function () {
      return ($(this).attr('data-root') || '') === group;
    });
  }

  // 그룹 루트들 중 특정 depth 루트를 찾음
  function findDepth($roots, depth) {
    var $found = $();
    $roots.each(function () {
      var $r = $(this);
      if (getDepth($r) === depth) $found = $found.add($r);
    });
    return $found;
  }

  // 모든 셀렉트 옵션 리스트를 닫음
  function closeAll() {
    $(ROOT).removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');

    $(ROOT)
      .find(LIST)
      .each(function () {
        this.style.maxHeight = '0px';
      });
  }

  // trigger 기준으로 가장 가까운 스크롤 컨테이너를 찾음
  function getScrollParent(el) {
    var p = el && el.parentElement;

    while (p && p !== document.body && p !== document.documentElement) {
      var st = window.getComputedStyle(p);
      var oy = st.overflowY;

      if (oy === 'auto' || oy === 'scroll') return p;

      p = p.parentElement;
    }

    return window;
  }

  // 오픈 직전: 공간 계산 후 dropup/최대 높이를 확정
  function applyDropDirection($root) {
    if (!$root || !$root.length) return;

    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;

    var triggerEl = $trigger.get(0);
    var listEl = $list.get(0);
    if (!triggerEl || !listEl) return;

    var scroller = getScrollParent(triggerEl);

    var cRect;
    if (scroller === window) cRect = {top: 0, bottom: window.innerHeight};
    else cRect = scroller.getBoundingClientRect();

    var tRect = triggerEl.getBoundingClientRect();
    var spaceBelow = cRect.bottom - tRect.bottom;
    var spaceAbove = tRect.top - cRect.top;

    var prevMaxH = listEl.style.maxHeight;
    listEl.style.maxHeight = 'none';
    var listH = listEl.scrollHeight;
    listEl.style.maxHeight = prevMaxH;

    var shouldDropUp;
    var isForcedDropup = $root.hasClass(DROPUP);

    if (isForcedDropup) {
      shouldDropUp = true;
    } else {
      shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
      $root.toggleClass(DROPUP, shouldDropUp);
    }

    var maxH = (shouldDropUp ? spaceAbove : spaceBelow) - GUTTER;
    if (maxH < MIN_H) maxH = MIN_H;

    listEl.style.maxHeight = maxH + 'px';
    listEl.style.overflowY = 'auto';
  }

  // 특정 루트만 오픈
  function openOne($root) {
    closeAll();
    applyDropDirection($root);

    $root.addClass('vits-select-open');
    $root.find(TRIGGER).attr('aria-expanded', 'true');
  }

  // 루트 비활성 상태를 동기화
  function setDisabled($root, disabled) {
    $root.toggleClass('vits-select-disabled', !!disabled);
    $root.find(TRIGGER).prop('disabled', !!disabled);

    if (disabled) {
      $root.removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');
    }
  }

  // 하위 옵션 없음 상태 클래스를 토글
  function setNoOption($root, on) {
    $root.toggleClass('is-no-option', !!on);
  }

  // placeholder/hidden/선택표시를 초기화
  function resetToPlaceholder($root, clearOptions) {
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');

    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) {
      $hidden.val('');
      $hidden.trigger('change'); // 하위 뎁스 리셋을 외부(트리/타이틀)에도 즉시 반영
    }

    $root.find(OPT).removeClass('vits-select-selected').attr('aria-selected', 'false');

    if (clearOptions) $root.find(LIST).empty();
  }

  // placeholder/옵션 제거 후 비활성 상태로 정리
  function disableAndClear($root) {
    resetToPlaceholder($root, true);
    setDisabled($root, true);
    setNoOption($root, false);
  }

  // hidden 값 기준으로 선택 상태를 복원
  function setSelectedByValue($root, value) {
    var v = String(value || '');
    if (!v) return false;

    var $match = $root.find(OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]');
    if (!$match.length) return false;

    setSelected($root, $match.eq(0));
    return true;
  }

  // 옵션 1개를 선택 처리하고 표시/hidden을 갱신
  function setSelected($root, $opt) {
    $root.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass('vits-select-selected', sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });

    $root.find(VALUE).text($opt.text());

    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) {
      $hidden.val($opt.attr('data-value') || $opt.text());
      $hidden.trigger('change'); // 외부 로직(트리/리스트 재조회 등) 연동 포인트
    }
  }

  // items 배열을 옵션(li) 마크업으로 렌더링
  function renderOptions($root, items) {
    var $list = $root.find(LIST);
    if (!$list.length) return;

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

  // 카테고리 코드로 트리/리스트에서 노드를 찾음
  function findNodeByCode(list, code) {
    if (!code) return null;

    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].categoryCode) === String(code)) return list[i];
    }
    return null;
  }

  // 노드의 하위 categoryList를 options items로 변환
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

  // 옵션 없음 상태로 초기화
  function disableAsNoOption($root) {
    resetToPlaceholder($root, true);
    setDisabled($root, true);
    setNoOption($root, true);
  }

  // 옵션 주입 후 활성화 처리
  function enableWithOptions($root, items) {
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  // hidden 입력값을 안전하게 문자열로 반환
  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? String($hidden.val() || '') : '';
  }

  // 브레드크럼 그룹 기준으로 2/3뎁스 옵션/활성을 갱신
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

    var d1Val = $d1.length ? getHiddenVal($d1) : '';
    var d1Node = d1Val ? findNodeByCode(tree, d1Val) : null;

    // 1뎁스 미선택이면 하위 뎁스는 무조건 비활성/초기화
    if (!d1Node) {
      if ($d2.length) disableAndClear($d2);
      if ($d3.length) disableAndClear($d3);
      return;
    }

    // 2뎁스 옵션 주입/활성
    if ($d2.length) {
      var d2Items = mapChildren(d1Node);

      if (!d2Items.length) {
        disableAsNoOption($d2);
        if ($d3.length) disableAndClear($d3);
        return;
      }

      if (reasonDepth === 1) resetToPlaceholder($d2, true);

      enableWithOptions($d2, d2Items);

      if (reasonDepth === 0 || reasonDepth !== 1) setSelectedByValue($d2, getHiddenVal($d2));

      if (!getHiddenVal($d2)) {
        if ($d3.length) disableAndClear($d3);
      }
    }

    // 3뎁스 옵션 주입/활성
    if ($d3.length) {
      var d2Val = $d2.length ? getHiddenVal($d2) : '';

      if (!d2Val) {
        disableAndClear($d3);
        return;
      }

      var d2ListSafe = Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
      var d2Node = findNodeByCode(d2ListSafe, d2Val);

      if (!d2Node) {
        disableAndClear($d3);
        return;
      }

      var d3Items = mapChildren(d2Node);

      if (!d3Items.length) {
        disableAsNoOption($d3);
        return;
      }

      if (reasonDepth === 2) resetToPlaceholder($d3, true);

      enableWithOptions($d3, d3Items);

      if (reasonDepth === 0 || reasonDepth !== 2) setSelectedByValue($d3, getHiddenVal($d3));
    }
  }

  // 브레드크럼 선택값으로 PLP 타이틀을 갱신
  function updateCategoryTitle(group) {
    var $title = $('[data-plp-category-title]');
    if (!$title.length) return;

    var titleGroup = ($title.attr('data-root') || '').trim();
    var g = titleGroup || (group || '').trim();

    if (g) {
      var $groupRoots = getGroupRoots(g);
      if (!$groupRoots.length) return;

      var $gD1 = findDepth($groupRoots, 1);
      var $gD2 = findDepth($groupRoots, 2);
      var $gD3 = findDepth($groupRoots, 3);

      var $gD3Opt = $gD3.length ? $gD3.find(OPT + '.vits-select-selected').last() : $();
      var $gD2Opt = $gD2.length ? $gD2.find(OPT + '.vits-select-selected').last() : $();
      var $gD1Opt = $gD1.length ? $gD1.find(OPT + '.vits-select-selected').last() : $();
      var $pickG = $gD3Opt.length ? $gD3Opt : $gD2Opt.length ? $gD2Opt : $gD1Opt;

      if ($pickG.length) $title.text($pickG.text());
      return;
    }

    var $d3Sel = $('[data-vits-select][data-depth="3"] ' + OPT + '.vits-select-selected').last();
    var $d2Sel = $('[data-vits-select][data-depth="2"] ' + OPT + '.vits-select-selected').last();
    var $d1Sel = $('[data-vits-select][data-depth="1"] ' + OPT + '.vits-select-selected').last();
    var $pick = $d3Sel.length ? $d3Sel : $d2Sel.length ? $d2Sel : $d1Sel;

    if ($pick.length) $title.text($pick.text());
  }

  // 이벤트 바인딩(트리거/옵션 클릭, 외부 클릭 닫기)
  function bind() {
    $(document).on('mousedown' + NS, function (e) {
      if (!$(e.target).closest(ROOT).length) closeAll();
    });

    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();

      var $root = $(this).closest(ROOT);
      if ($root.hasClass('vits-select-disabled')) return;

      if ($root.hasClass('vits-select-open')) closeAll();
      else openOne($root);
    });

    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();

      var $opt = $(this);
      if ($opt.hasClass('vits-select-option-disabled')) return;

      var url = String($opt.attr('data-url') || '').trim();

      var $root = $opt.closest(ROOT);
      var depth = getDepth($root);
      var group = getGroup($root);

      setSelected($root, $opt);
      closeAll();

      // url이 있으면: 선택 후 새창 이동(패밀리 사이트 등)
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (group) {
        var $groupRoots = getGroupRoots(group);
        var $depth2Root = findDepth($groupRoots, 2);
        var $depth3Root = findDepth($groupRoots, 3);

        if (depth === 1) {
          if ($depth2Root.length) disableAndClear($depth2Root);
          if ($depth3Root.length) disableAndClear($depth3Root);
        }

        if (depth === 2) {
          if ($depth3Root.length) disableAndClear($depth3Root);
        }
      }

      applyBreadcrumb($root, depth);
      updateCategoryTitle(group);
    });
  }

  // 루트 스코프 내 셀렉트를 초기화
  function init(root) {
    var $roots = root ? $(root).find(ROOT) : $(ROOT);

    $roots.find(TRIGGER).attr('aria-expanded', 'false');

    $roots.each(function () {
      var $r = $(this);
      if ($r.hasClass('vits-select-disabled')) setDisabled($r, true);
    });

    var groups = {};
    $roots.each(function () {
      var g = getGroup($(this));
      if (g) groups[g] = true;
    });

    Object.keys(groups).forEach(function (g) {
      var $groupRoots = getGroupRoots(g);
      var $d1 = findDepth($groupRoots, 1);
      if ($d1.length) applyBreadcrumb($d1.eq(0), 0);
    });

    updateCategoryTitle();
  }

  // 외부에서 여러 번 init 호출되어도 이벤트는 1회만 바인딩
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };
})(window.jQuery, window, document);
