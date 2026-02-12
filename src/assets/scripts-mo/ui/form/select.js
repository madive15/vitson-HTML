/**
 * @file scripts-mo/ui/form/select.js
 * @description 커스텀 셀렉트 (모바일) — 단일 셀렉트 UI + 동적 데이터 바인딩
 * @scope init(root) 컨테이너 범위 내에서 이벤트는 closest(ROOT) 기반으로 동작
 * @maintenance
 *  - 초기화: core/ui.js에서 UI.form.init() → UI.select.init(document) 1회 호출
 *  - 부분 렌더링: UI.select.destroy(root) 후 UI.select.init(root)로 재초기화
 *
 * @api 동적 셀렉트
 *  - UI.select.setOptions($root, items)  — 옵션 동적 주입 (빈 배열 시 자동 disabled)
 *  - UI.select.setValue($root, value)    — 값 세팅
 *  - UI.select.getValue($root)           — 값 조회
 *  - UI.select.setDisabled($root, bool)  — 활성/비활성 토글
 *  - $root 지정: $('[data-select-id="아이디"]')
 *  - items 형식: [{ value: string, text: string }]
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  // 셀렉터
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var PORTAL = '[data-vits-select-portal]';

  // 클래스
  var CLS_OPEN = 'vits-select-open';
  var CLS_DROPUP = 'vits-select-dropup';
  var CLS_DISABLED = 'vits-select-disabled';
  var CLS_NO_OPTION = 'is-no-option';
  var CLS_SELECTED = 'vits-select-selected';
  var CLS_OPT_DISABLED = 'vits-select-option-disabled';
  var CLS_PORTAL_LIST = 'vits-select-list-portal';

  var NS = '.uiSelect';

  var GUTTER = 8;
  var MIN_H = 120;
  var PORTAL_GAP = 4;
  var Z_INDEX_PORTAL = 99999;

  var DATA_CONTAINER_KEY = 'uiSelectContainerKey';
  var DATA_ROOT_KEY = 'uiSelectRootKey';
  var DATA_PORTAL_ORIGIN = 'uiSelectPortalOrigin';

  // 스코프 저장소
  var scopes = {};
  var scopeSeq = 0;

  function toStr(v) {
    return String(v == null ? '' : v);
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isPortal($root) {
    return $root.is(PORTAL);
  }

  function getRootScopeKey($root) {
    var v = $root && $root.length ? $root.data(DATA_ROOT_KEY) : null;
    return v != null ? v : 0;
  }

  function getContainerScopeKey($container) {
    var v = $container && $container.length ? $container.data(DATA_CONTAINER_KEY) : null;
    return v != null ? v : null;
  }

  function getScope(scopeKey) {
    return scopes[scopeKey] || null;
  }

  // portal list 필터 공통
  function findPortalList($root) {
    return $('body')
      .children(LIST)
      .filter(function () {
        var $origin = $(this).data(DATA_PORTAL_ORIGIN);
        return $origin && $origin.is($root);
      });
  }

  // root에 연결된 list 찾기 (portal 대응)
  function findList($root) {
    var $list = $root.find(LIST);
    if ($list.length) return $list;
    return findPortalList($root);
  }

  // portal list 닫기
  function closePortal($root) {
    var $list = findPortalList($root);
    if (!$list.length) return;

    $list
      .removeData(DATA_PORTAL_ORIGIN)
      .removeClass(CLS_PORTAL_LIST)
      .css({position: '', top: '', left: '', minWidth: '', maxHeight: '', zIndex: ''})
      .appendTo($root);
  }

  // 특정 루트 닫기
  function closeOne($root) {
    if (!$root || !$root.length) return;

    $root.removeClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'false');

    if (isPortal($root)) {
      closePortal($root);
    } else {
      $root.find(LIST).each(function () {
        this.style.maxHeight = '0px';
      });
    }
  }

  // 스코프 단위 닫기
  function closeOpenedInScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope || !scope.openRoot || !scope.openRoot.length) return;

    closeOne(scope.openRoot);
    scope.openRoot = null;
  }

  // 전체 닫기
  function closeAllOpened() {
    Object.keys(scopes).forEach(function (k) {
      closeOpenedInScope(parseInt(k, 10));
    });
  }

  // 스크롤 컨테이너 탐색
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

  // dropup/최대높이 계산 (일반 모드)
  function applyDropDirection($root) {
    if (!$root || !$root.length) return;

    $root.removeClass(CLS_DROPUP);

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

    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;

    $root.toggleClass(CLS_DROPUP, shouldDropUp);

    var calcMaxH = (shouldDropUp ? spaceAbove : spaceBelow) - GUTTER;
    if (calcMaxH < MIN_H) calcMaxH = MIN_H;

    var customMaxH = $root.attr('data-max-height');
    if (customMaxH && /^\d+$/.test(customMaxH)) customMaxH = customMaxH + 'px';

    var maxH = customMaxH || calcMaxH + 'px';

    listEl.style.maxHeight = maxH;
    listEl.style.overflowY = 'auto';
  }

  // portal 모드 열기
  function openPortal($root) {
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;

    var rect = $trigger[0].getBoundingClientRect();
    var customMaxH = $root.attr('data-max-height');

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
        zIndex: Z_INDEX_PORTAL
      })
      .appendTo('body');

    var listH = $list.outerHeight();
    var spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    var spaceAbove = rect.top - GUTTER;
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    var calcMaxH;
    var maxH;

    if (shouldDropUp) {
      calcMaxH = Math.max(spaceAbove, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: '',
        bottom: window.innerHeight - rect.top + PORTAL_GAP + 'px',
        maxHeight: maxH
      });
      $root.addClass(CLS_DROPUP);
    } else {
      calcMaxH = Math.max(spaceBelow, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: rect.bottom + PORTAL_GAP + 'px',
        bottom: '',
        maxHeight: maxH
      });
      $root.removeClass(CLS_DROPUP);
    }
  }

  // 특정 루트 오픈
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

  function setNoOption($root, on) {
    $root.toggleClass(CLS_NO_OPTION, !!on);
  }

  // hidden 값 세팅 + change 트리거
  function setHiddenVal($root, v) {
    var $hidden = $root.find(HIDDEN);
    if (!$hidden.length) return;

    $hidden.val(toStr(v));
    $hidden.trigger('change');
  }

  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? toStr($hidden.val()) : '';
  }

  // placeholder 초기화
  function resetToPlaceholder($root, clearOptions) {
    $root.removeClass('is-selected');
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');

    setHiddenVal($root, '');

    var $list = findList($root);
    $list.find(OPT).removeClass(CLS_SELECTED).attr('aria-selected', 'false');

    if (clearOptions) $list.empty();
  }

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
        escHtml(toStr(it.value)) +
        '" aria-selected="false">' +
        escHtml(toStr(it.text || '')) +
        '</li>';
    }

    $list.html(html);
  }

  function enableWithOptions($root, items) {
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  // 옵션 선택 처리
  function setSelected($root, $opt) {
    var $list = findList($root);

    $list.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass(CLS_SELECTED, sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });

    $root.addClass('is-selected');
    $root.find(VALUE).text($opt.text());
    setHiddenVal($root, $opt.attr('data-value') || '');
  }

  function setSelectedByValue($root, value) {
    var v = toStr(value);
    if (!v) return false;

    var $list = findList($root);
    var $match = $list.find(OPT).filter(function () {
      return $(this).attr('data-value') === v;
    });
    if (!$match.length) return false;

    setSelected($root, $match.eq(0));
    return true;
  }

  // 옵션 클릭 공통 핸들러
  function handleOptionClick($opt) {
    if ($opt.hasClass(CLS_OPT_DISABLED)) return;

    var $list = $opt.closest(LIST);
    var $root = $list.data(DATA_PORTAL_ORIGIN) || $opt.closest(ROOT);
    var scopeKey = getRootScopeKey($root);

    setSelected($root, $opt);
    closeOpenedInScope(scopeKey);

    var url = toStr($opt.attr('data-url')).trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // portal 위치 갱신
  function updatePortalPosition($root) {
    if (!$root || !$root.length) return;

    var $trigger = $root.find(TRIGGER);
    var $list = findPortalList($root);

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

  // 스코프 캐시 구축
  function buildScopeCache(scopeKey, $container) {
    $container.find(ROOT).each(function () {
      $(this).data(DATA_ROOT_KEY, scopeKey);
    });

    scopes[scopeKey] = {$container: $container, openRoot: null};
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

  function destroy(root) {
    if (!root) return;

    var $container = $(root);
    var scopeKey = getContainerScopeKey($container);
    if (scopeKey == null) return;

    destroyScope(scopeKey);
  }

  function destroyAll() {
    Object.keys(scopes).forEach(function (k) {
      destroyScope(parseInt(k, 10));
    });
  }

  // 이벤트 바인딩 (1회)
  function bind() {
    // 외부 탭/클릭 시 닫기
    $(document).on('mousedown' + NS + ' touchstart' + NS, function (e) {
      var $target = $(e.target);
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

    // 옵션 클릭 (portal 모드)
    $(document).on('click' + NS, '.' + CLS_PORTAL_LIST + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 스크롤 감지 (capture phase)
    document.addEventListener(
      'scroll',
      function (e) {
        var $scrolled = $(e.target);
        if ($scrolled.closest(LIST).length || $scrolled.hasClass(CLS_PORTAL_LIST)) return;

        Object.keys(scopes).forEach(function (k) {
          var scope = scopes[k];
          if (scope && scope.openRoot && isPortal(scope.openRoot)) {
            if (
              scope.openRoot.closest('.k-window').length ||
              scope.openRoot.closest('[data-scroll-auto-hidden]').length
            ) {
              closeOpenedInScope(k);
            } else {
              updatePortalPosition(scope.openRoot);
            }
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

  // 스코프 초기화
  function init(root) {
    if (!root) root = document;

    destroy(root);

    var scopeKey = ++scopeSeq;
    var $container = $(root);
    $container.data(DATA_CONTAINER_KEY, scopeKey);

    buildScopeCache(scopeKey, $container);

    $container.find(ROOT).find(TRIGGER).attr('aria-expanded', 'false');

    $container.find(ROOT).each(function () {
      var $r = $(this);
      if ($r.hasClass(CLS_DISABLED)) setDisabled($r, true);
    });
  }

  // Public API
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };

  window.UI.select.destroy = function (root) {
    destroy(root);
  };

  window.UI.select.destroyAll = function () {
    destroyAll();
  };

  // 동적 옵션 주입
  window.UI.select.setOptions = function ($root, items) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return;

    if (!items || !items.length) {
      disableAsNoOption($root);
      return;
    }

    resetToPlaceholder($root, true);
    enableWithOptions($root, items);
  };

  // 선택 초기화
  window.UI.select.reset = function ($root) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return;

    resetToPlaceholder($root, true);
  };

  // 값 세팅
  window.UI.select.setValue = function ($root, value) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return false;
    return setSelectedByValue($root, value);
  };

  // 값 조회
  window.UI.select.getValue = function ($root) {
    $root = $($root).closest(ROOT);
    return $root.length ? getHiddenVal($root) : '';
  };

  // disabled 토글
  window.UI.select.setDisabled = function ($root, disabled) {
    $root = $($root).closest(ROOT);
    if ($root.length) setDisabled($root, disabled);
  };
})(window.jQuery, window, document);
