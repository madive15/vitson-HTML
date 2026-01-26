/**
 * @file scripts/ui/form/select.js
 * @purpose 커스텀 셀렉트 공통: 단일/브레드크럼(1~3뎁스) UI + 옵션 렌더링 + 선택값 표시 + 연동 활성화
 * @scope init(root) 컨테이너 범위 내에서만 그룹(브레드크럼) 캐시를 구축하고, 이벤트는 closest(ROOT) 기반으로 동작
 * @rule group(data-root) 유무로 단일/연결(브레드크럼) 분기하며, 단일은 closest만으로 종료
 * @maintenance
 *  - 초기화: core/ui.js에서 UI.select.init(document) 1회 호출
 *  - 부분 렌더링: UI.select.destroy(root) 후 UI.select.init(root)로 재초기화
 */

(function ($, window, document) {
  'use strict';

  // jQuery 의존(프로젝트 전제)
  if (!$) {
    console.log('[select] jQuery not found');
    return;
  }

  // 네임스페이스 보장
  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  // 셀렉터
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var TITLE = '[data-plp-category-title]';
  var PORTAL = '[data-vits-select-portal]';

  // 클래스
  var CLS_OPEN = 'vits-select-open';
  var CLS_DROPUP = 'vits-select-dropup';
  var CLS_DISABLED = 'vits-select-disabled';
  var CLS_NO_OPTION = 'is-no-option';
  var CLS_SELECTED = 'vits-select-selected';
  var CLS_OPT_DISABLED = 'vits-select-option-disabled';
  var CLS_PORTAL_LIST = 'vits-select-list-portal';

  // 이벤트 네임스페이스
  var NS = '.uiSelect';

  // dropup 계산 상수
  var GUTTER = 8;
  var MIN_H = 120;
  var PORTAL_GAP = 4;

  // 컨테이너/루트 키 분리(부분 렌더링 destroy 안정화)
  var DATA_CONTAINER_KEY = 'uiSelectContainerKey';
  var DATA_ROOT_KEY = 'uiSelectRootKey';
  var DATA_PORTAL_ORIGIN = 'uiSelectPortalOrigin';

  // 스코프 저장소(scopeKey -> { $container, groups, openRoot })
  var scopes = {};
  var scopeSeq = 0;

  // 안전 문자열 변환
  function toStr(v) {
    return String(v == null ? '' : v);
  }

  // mockData 카테고리 트리 안전 반환
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  // 루트의 group 반환(연결 여부 판단 키)
  function getGroup($root) {
    return toStr($root.attr('data-root')).trim();
  }

  // 루트의 depth 반환
  function getDepth($root) {
    return parseInt($root.attr('data-depth'), 10) || 0;
  }

  // portal 여부 체크
  function isPortal($root) {
    return $root.is(PORTAL);
  }

  // 루트의 scopeKey 반환(없으면 0)
  function getRootScopeKey($root) {
    var v = $root && $root.length ? $root.data(DATA_ROOT_KEY) : null;
    return v != null ? v : 0;
  }

  // 컨테이너의 scopeKey 반환(없으면 null)
  function getContainerScopeKey($container) {
    var v = $container && $container.length ? $container.data(DATA_CONTAINER_KEY) : null;
    return v != null ? v : null;
  }

  // scopeKey로 스코프 조회
  function getScope(scopeKey) {
    return scopes[scopeKey] || null;
  }

  // 동일 스코프의 그룹 캐시 조회
  function getGroupCache($root) {
    var scope = getScope(getRootScopeKey($root));
    if (!scope) return null;

    var group = getGroup($root);
    if (!group) return null;

    return scope.groups[group] || null;
  }

  // 그룹 내 depth 루트 찾기
  function findDepth($roots, depth) {
    var $found = $();
    $roots.each(function () {
      var $r = $(this);
      if (getDepth($r) === depth) $found = $found.add($r);
    });
    return $found;
  }

  // root에 연결된 list 찾기 (portal 모드 대응)
  function findList($root) {
    // 일반 모드: 자식에서 찾기
    var $list = $root.find(LIST);
    if ($list.length) return $list;

    // portal 모드: body에서 origin 기준으로 찾기
    return $('body')
      .children(LIST)
      .filter(function () {
        var $origin = $(this).data(DATA_PORTAL_ORIGIN);
        return $origin && $origin.is($root);
      });
  }

  // portal list 닫기 (원위치 복귀)
  function closePortal($root) {
    var $list = $('body')
      .children(LIST)
      .filter(function () {
        var $origin = $(this).data(DATA_PORTAL_ORIGIN);
        return $origin && $origin.is($root);
      });

    if (!$list.length) return;

    $list
      .removeData(DATA_PORTAL_ORIGIN)
      .removeClass(CLS_PORTAL_LIST)
      .css({
        position: '',
        top: '',
        left: '',
        minWidth: '',
        maxHeight: '',
        zIndex: ''
      })
      .appendTo($root);
  }

  // 특정 루트 닫기
  function closeOne($root) {
    if (!$root || !$root.length) return;

    $root.removeClass(CLS_OPEN + ' ' + CLS_DROPUP);
    $root.find(TRIGGER).attr('aria-expanded', 'false');

    if (isPortal($root)) {
      closePortal($root);
    } else {
      $root.find(LIST).each(function () {
        this.style.maxHeight = '0px';
      });
    }
  }

  // 스코프 단위로 열린 셀렉트 닫기
  function closeOpenedInScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope || !scope.openRoot || !scope.openRoot.length) return;

    closeOne(scope.openRoot);
    scope.openRoot = null;
  }

  // 전체 스코프의 열린 셀렉트 닫기(전역 ROOT 스캔 없음)
  function closeAllOpened() {
    Object.keys(scopes).forEach(function (k) {
      closeOpenedInScope(parseInt(k, 10));
    });
  }

  // trigger 기준 스크롤 컨테이너 탐색
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

  // 오픈 직전 dropup/최대높이 계산 (일반 모드)
  function applyDropDirection($root) {
    if (!$root || !$root.length) return;

    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;

    var triggerEl = $trigger.get(0);
    var listEl = $list.get(0);
    if (!triggerEl || !listEl) return;

    var scroller = getScrollParent(triggerEl);
    var cRect = scroller === window ? {top: 0, bottom: window.innerHeight} : scroller.getBoundingClientRect();

    var tRect = triggerEl.getBoundingClientRect();
    var spaceBelow = cRect.bottom - tRect.bottom;
    var spaceAbove = tRect.top - cRect.top;

    var prevMaxH = listEl.style.maxHeight;
    listEl.style.maxHeight = 'none';
    var listH = listEl.scrollHeight;
    listEl.style.maxHeight = prevMaxH;

    var forced = $root.hasClass(CLS_DROPUP);
    var shouldDropUp = forced ? true : spaceBelow < listH && spaceAbove > spaceBelow;

    if (!forced) $root.toggleClass(CLS_DROPUP, shouldDropUp);

    var maxH = (shouldDropUp ? spaceAbove : spaceBelow) - GUTTER;
    if (maxH < MIN_H) maxH = MIN_H;

    listEl.style.maxHeight = maxH + 'px';
    listEl.style.overflowY = 'auto';
  }

  // portal 모드 열기
  function openPortal($root) {
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;

    var rect = $trigger[0].getBoundingClientRect();
    var customMaxH = $root.attr('data-max-height'); // 커스텀 max-height 읽기

    // 숫자만 있으면 px 붙이기
    if (customMaxH && /^\d+$/.test(customMaxH)) {
      customMaxH = customMaxH + 'px';
    }

    $list
      .data(DATA_PORTAL_ORIGIN, $root)
      .addClass(CLS_PORTAL_LIST)
      .css({
        position: 'fixed',
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        zIndex: 9999
      })
      .appendTo('body');

    var listH = $list.outerHeight();
    var spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    var spaceAbove = rect.top - GUTTER;
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    var maxH;
    var calcMaxH;
    var topPos;
    var bottomPos;

    // openPortal 함수 수정
    if (shouldDropUp) {
      calcMaxH = Math.max(spaceAbove, MIN_H) + 'px';
      bottomPos = window.innerHeight - rect.top + PORTAL_GAP;
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: '',
        bottom: bottomPos + 'px',
        maxHeight: maxH
      });
      $root.addClass(CLS_DROPUP);
    } else {
      calcMaxH = Math.max(spaceBelow, MIN_H) + 'px';
      topPos = rect.bottom + PORTAL_GAP;
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: topPos + 'px',
        bottom: '',
        maxHeight: maxH
      });
      $root.removeClass(CLS_DROPUP);
    }
  }

  // 특정 루트 오픈(스코프 단위 1개만 열림 유지)
  function openOne($root) {
    var scopeKey = getRootScopeKey($root);

    closeOpenedInScope(scopeKey);

    if (isPortal($root)) {
      openPortal($root);
    } else {
      applyDropDirection($root);
    }

    $root.addClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'true');

    var scope = getScope(scopeKey);
    if (scope) scope.openRoot = $root;
  }

  // disabled 동기화
  function setDisabled($root, disabled) {
    var on = !!disabled;

    $root.toggleClass(CLS_DISABLED, on);
    $root.find(TRIGGER).prop('disabled', on);

    if (on) {
      closeOne($root);
      var scope = getScope(getRootScopeKey($root));
      if (scope && scope.openRoot && scope.openRoot.is($root)) scope.openRoot = null;
    }
  }

  // 하위 옵션 없음 상태 토글
  function setNoOption($root, on) {
    $root.toggleClass(CLS_NO_OPTION, !!on);
  }

  // hidden 값 세팅 + change 트리거(외부 연동 포인트)
  function setHiddenVal($root, v) {
    var $hidden = $root.find(HIDDEN);
    if (!$hidden.length) return;

    $hidden.val(toStr(v));
    $hidden.trigger('change');
  }

  // hidden 값 반환
  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? toStr($hidden.val()) : '';
  }

  // placeholder/hidden/선택표시 초기화
  function resetToPlaceholder($root, clearOptions) {
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');

    setHiddenVal($root, '');

    var $list = findList($root);
    $list.find(OPT).removeClass(CLS_SELECTED).attr('aria-selected', 'false');

    if (clearOptions) $list.empty();
  }

  // placeholder/옵션 제거 후 비활성
  function disableAndClear($root) {
    resetToPlaceholder($root, true);
    setNoOption($root, false);
    setDisabled($root, true);
  }

  // 옵션 없음 상태로 비활성
  function disableAsNoOption($root) {
    resetToPlaceholder($root, true);
    setNoOption($root, true);
    setDisabled($root, true);
  }

  // 옵션 렌더링
  function renderOptions($root, items) {
    var $list = findList($root);
    if (!$list.length) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.value) continue;

      html +=
        '<li class="vits-select-option" role="option" tabindex="-1" data-value="' +
        toStr(it.value).replace(/"/g, '\\"') +
        '" aria-selected="false">' +
        toStr(it.text || '') +
        '</li>';
    }

    $list.html(html);
  }

  // 옵션 주입 후 활성
  function enableWithOptions($root, items) {
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  // 옵션 선택 처리(표시/hidden/a11y 동기화)
  function setSelected($root, $opt) {
    var $list = findList($root);

    $list.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass(CLS_SELECTED, sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });

    $root.find(VALUE).text($opt.text());
    setHiddenVal($root, $opt.attr('data-value') || $opt.text());
  }

  // hidden 값 기준 선택 복원
  function setSelectedByValue($root, value) {
    var v = toStr(value);
    if (!v) return false;

    var $list = findList($root);
    var $match = $list.find(OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]');
    if (!$match.length) return false;

    setSelected($root, $match.eq(0));
    return true;
  }

  // 카테고리 코드로 노드 탐색
  function findNodeByCode(list, code) {
    if (!code) return null;

    for (var i = 0; i < list.length; i++) {
      if (list[i] && toStr(list[i].categoryCode) === toStr(code)) return list[i];
    }
    return null;
  }

  // 노드 children을 options items로 변환
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

  // 브레드크럼 2/3뎁스 옵션/활성 갱신(그룹 캐시 기반)
  function applyBreadcrumb($changedRoot, changedDepth) {
    var cache = getGroupCache($changedRoot);
    if (!cache) return;

    var $d1 = cache.byDepth[1] || $();
    var $d2 = cache.byDepth[2] || $();
    var $d3 = cache.byDepth[3] || $();
    if (!$d2.length && !$d3.length) return;

    var tree = getTree();
    var d1Val = $d1.length ? getHiddenVal($d1) : '';
    var d1Node = d1Val ? findNodeByCode(tree, d1Val) : null;

    if (!d1Node) {
      if ($d2.length) disableAndClear($d2);
      if ($d3.length) disableAndClear($d3);
      return;
    }

    if ($d2.length) {
      var d2Items = mapChildren(d1Node);

      if (!d2Items.length) {
        disableAsNoOption($d2);
        if ($d3.length) disableAndClear($d3);
        return;
      }

      if (changedDepth === 1) resetToPlaceholder($d2, true);

      enableWithOptions($d2, d2Items);

      if (changedDepth !== 1) setSelectedByValue($d2, getHiddenVal($d2));

      if (!getHiddenVal($d2) && $d3.length) disableAndClear($d3);
    }

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

      if (changedDepth === 2) resetToPlaceholder($d3, true);

      enableWithOptions($d3, d3Items);

      if (changedDepth !== 2) setSelectedByValue($d3, getHiddenVal($d3));
    }
  }

  // 스코프 컨테이너에서만 타이틀 탐색
  function findTitleInScope(scope) {
    if (!scope || !scope.$container || !scope.$container.length) return $();
    return scope.$container.find(TITLE).first();
  }

  // depth별 마지막 선택값을 타이틀에 반영
  function setTitleFromDepth($title, byDepth) {
    if (!$title || !$title.length) return;

    var $d1 = byDepth[1] || $();
    var $d2 = byDepth[2] || $();
    var $d3 = byDepth[3] || $();

    var $d3Opt = $d3.length
      ? findList($d3)
          .find(OPT + '.' + CLS_SELECTED)
          .last()
      : $();
    var $d2Opt = $d2.length
      ? findList($d2)
          .find(OPT + '.' + CLS_SELECTED)
          .last()
      : $();
    var $d1Opt = $d1.length
      ? findList($d1)
          .find(OPT + '.' + CLS_SELECTED)
          .last()
      : $();

    var $pick = $d3Opt.length ? $d3Opt : $d2Opt.length ? $d2Opt : $d1Opt;
    if ($pick.length) $title.text($pick.text());
  }

  // 동일 스코프 내 group만 사용해 타이틀 갱신
  function updateCategoryTitle($root) {
    if (!$root || !$root.length) return;

    var scope = getScope(getRootScopeKey($root));
    if (!scope) return;

    var $title = findTitleInScope(scope);
    if (!$title.length) return;

    var titleGroup = toStr($title.attr('data-root')).trim();
    var group = titleGroup || getGroup($root);
    if (!group) return;

    var gCache = scope.groups[group];
    if (!gCache) return;

    setTitleFromDepth($title, gCache.byDepth);
  }

  // 스코프 캐시 구축(group 있는 셀렉트만)
  function buildScopeCache(scopeKey, $container) {
    var $rootsAll = $container.find(ROOT);
    var groups = {};

    $rootsAll.each(function () {
      var $r = $(this);
      $r.data(DATA_ROOT_KEY, scopeKey);

      var g = getGroup($r);
      if (!g) return;

      if (!groups[g]) groups[g] = {group: g, $roots: $(), byDepth: {}};
      groups[g].$roots = groups[g].$roots.add($r);
    });

    Object.keys(groups).forEach(function (g) {
      var $gRoots = groups[g].$roots;
      groups[g].byDepth[1] = findDepth($gRoots, 1);
      groups[g].byDepth[2] = findDepth($gRoots, 2);
      groups[g].byDepth[3] = findDepth($gRoots, 3);
    });

    scopes[scopeKey] = {$container: $container, groups: groups, openRoot: null};
  }

  // 스코프 캐시 제거
  function destroyScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope) return;

    closeOpenedInScope(scopeKey);

    if (scope.$container && scope.$container.length) {
      scope.$container.removeData(DATA_CONTAINER_KEY);
      scope.$container.find(ROOT).each(function () {
        $(this).removeData(DATA_ROOT_KEY);
      });
    }

    delete scopes[scopeKey];
  }

  // 특정 컨테이너 캐시 제거(키 기반)
  function destroy(root) {
    if (!root) return;

    var $container = $(root);
    var scopeKey = getContainerScopeKey($container);
    if (scopeKey == null) return;

    destroyScope(scopeKey);
  }

  // 전체 캐시 제거
  function destroyAll() {
    Object.keys(scopes).forEach(function (k) {
      destroyScope(parseInt(k, 10));
    });
  }

  // 이벤트 바인딩(1회)
  function bind() {
    // 외부 클릭 시 닫기
    $(document).on('mousedown' + NS, function (e) {
      var $target = $(e.target);
      // portal list 클릭도 예외 처리
      if (!$target.closest(ROOT).length && !$target.closest('.' + CLS_PORTAL_LIST).length) {
        closeAllOpened();
      }
    });

    // 트리거 클릭
    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();

      var $root = $(this).closest(ROOT);
      if ($root.hasClass(CLS_DISABLED)) return;

      var scopeKey = getRootScopeKey($root);

      if ($root.hasClass(CLS_OPEN)) {
        closeOpenedInScope(scopeKey);
        return;
      }

      openOne($root);
    });

    // 옵션 클릭 (일반 모드)
    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 옵션 클릭 (portal 모드 - body에 붙은 list)
    $(document).on('click' + NS, '.' + CLS_PORTAL_LIST + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 모든 스크롤 감지 (capture phase)
    document.addEventListener(
      'scroll',
      function () {
        Object.keys(scopes).forEach(function (k) {
          var scope = scopes[k];
          if (scope && scope.openRoot && isPortal(scope.openRoot)) {
            updatePortalPosition(scope.openRoot);
          }
        });
      },
      true
    );

    // 리사이즈
    $(window).on('resize' + NS, function () {
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          updatePortalPosition(scope.openRoot);
        }
      });
    });
  }

  // 옵션 클릭 공통 핸들러
  function handleOptionClick($opt) {
    if ($opt.hasClass(CLS_OPT_DISABLED)) return;

    // portal 모드면 origin에서 root 찾기
    var $list = $opt.closest(LIST);
    var $root = $list.data(DATA_PORTAL_ORIGIN) || $opt.closest(ROOT);

    var depth = getDepth($root);
    var scopeKey = getRootScopeKey($root);

    setSelected($root, $opt);
    closeOpenedInScope(scopeKey);

    var url = toStr($opt.attr('data-url')).trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    var group = getGroup($root);
    if (!group) return;

    applyBreadcrumb($root, depth);
    updateCategoryTitle($root);
  }

  // portal 위치 갱신 (스크롤/리사이즈 대응)
  function updatePortalPosition($root) {
    if (!$root || !$root.length) return;

    var $trigger = $root.find(TRIGGER);
    var $list = $('body')
      .children(LIST)
      .filter(function () {
        var $origin = $(this).data(DATA_PORTAL_ORIGIN);
        return $origin && $origin.is($root);
      });

    if (!$trigger.length || !$list.length) return;

    var rect = $trigger[0].getBoundingClientRect();
    var isDropUp = $root.hasClass(CLS_DROPUP);

    if (isDropUp) {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: '',
        bottom: window.innerHeight - rect.top + PORTAL_GAP + 'px'
      });
    } else {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: rect.bottom + PORTAL_GAP + 'px',
        bottom: ''
      });
    }
  }

  // 스코프 초기화(컨테이너 단위)
  function init(root) {
    var $container = root ? $(root) : $(document);

    // 전역 init은 항상 document 컨테이너로 통일
    if (!root) root = document;

    // 동일 컨테이너 재초기화는 기존 캐시 정리 후 재구축
    destroy(root);

    // 컨테이너 init은 순번 부여(전역도 동일 정책)
    var scopeKey = ++scopeSeq;

    $container = $(root);
    $container.data(DATA_CONTAINER_KEY, scopeKey);

    buildScopeCache(scopeKey, $container);

    $container.find(ROOT).find(TRIGGER).attr('aria-expanded', 'false');

    $container.find(ROOT).each(function () {
      var $r = $(this);
      if ($r.hasClass(CLS_DISABLED)) setDisabled($r, true);
    });

    var scope = getScope(scopeKey);
    if (scope) {
      Object.keys(scope.groups).forEach(function (g) {
        var gCache = scope.groups[g];
        var $d1 = gCache.byDepth[1] || $();
        if ($d1.length) applyBreadcrumb($d1.eq(0), 0);
      });

      var groups = Object.keys(scope.groups);
      if (groups.length) {
        var firstGroup = scope.groups[groups[0]];
        var $d1 = firstGroup && firstGroup.byDepth ? firstGroup.byDepth[1] : $();
        if ($d1 && $d1.length) updateCategoryTitle($d1.eq(0));
      }
    }
  }

  // 외부 init은 여러 번 호출될 수 있으나 이벤트는 1회만 바인딩
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };

  // 캐시 정리 API(동적 렌더링/페이지 전환 대응)
  window.UI.select.destroy = function (root) {
    destroy(root);
  };

  // 전체 캐시 정리 API(테스트/리셋용)
  window.UI.select.destroyAll = function () {
    destroyAll();
  };
})(window.jQuery, window, document);
