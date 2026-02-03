/**
 * @file scripts/ui/tab.js
 * @description data-속성 기반 탭 전환 공통
 * @scope [data-vits-tab] 내부에서만 동작
 * @mapping [data-tab-id] ↔ [data-tab-panel]
 * @state is-active 클래스 + aria-selected/aria-hidden 값으로 제어
 * @option
 *  - URL 해시(#tab=xxx) 지원
 *  - 키보드: 좌우 화살표, Home/End
 * @a11y
 *  - aria-selected, aria-hidden, tabindex, aria-controls 자동 관리
 *  - role은 마크업에서 선언
 * @events ui:tab-change - { selectedId, containerId, root, btn, panel }
 * @note data-tab-nav, data-tab-content는 CSS 셀렉터용 (JS 미참조)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiTab';
  var ACTIVE_CLS = 'is-active';
  var EVENT_CHANGE = 'ui:tab-change';
  var HASH_PARAM = 'tab';

  var SEL = {
    ROOT: '[data-vits-tab]',
    BTN: '[data-tab-id]',
    PANEL: '[data-tab-panel]'
  };

  var DATA = {
    TAB_ID: 'tab-id',
    TAB_PANEL: 'tab-panel',
    VITS_TAB: 'vits-tab'
  };

  var KEYS = {LEFT: 37, RIGHT: 39, HOME: 36, END: 35};

  // Selector Injection 방지용 data 속성 필터
  function filterByData($els, value, attrName) {
    return $els.filter(function () {
      return $(this).data(attrName) === value;
    });
  }

  // containerId로 루트 요소 반환
  function getRootById(containerId) {
    return filterByData($(SEL.ROOT), containerId, DATA.VITS_TAB);
  }

  // 가장 가까운 탭 루트 반환
  function getRoot($el) {
    return $el.closest(SEL.ROOT);
  }

  // 인덱스 순환 (처음↔끝 연결)
  function wrapIndex(current, total, delta) {
    return (current + delta + total) % total;
  }

  // 탭 선택 (opts.focus: 키보드 탐색 시 포커스 이동)
  function select($root, id, opts) {
    if (!$root.length || !id) return;

    opts = opts || {};

    var $btns = $root.find(SEL.BTN);
    var $currentActive = $btns.filter('.' + ACTIVE_CLS);

    // 이미 활성화된 탭이면 스킵
    if ($currentActive.length && $currentActive.data(DATA.TAB_ID) === id) return;

    var $panels = $root.find(SEL.PANEL);
    var $targetBtn = filterByData($btns, id, DATA.TAB_ID);
    var $targetPanel = filterByData($panels, id, DATA.TAB_PANEL);

    if (!$targetBtn.length) return;

    // 전체 비활성화
    $btns.removeClass(ACTIVE_CLS).attr({'aria-selected': 'false', tabindex: '-1'});
    $panels.removeClass(ACTIVE_CLS).attr('aria-hidden', 'true');

    // 대상 활성화
    $targetBtn.addClass(ACTIVE_CLS).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(ACTIVE_CLS).attr('aria-hidden', 'false');

    if (opts.focus) $targetBtn.focus();

    // 외부 연동용 이벤트 발행
    $(document).trigger(EVENT_CHANGE, {
      selectedId: id,
      containerId: $root.data(DATA.VITS_TAB),
      root: $root[0],
      btn: $targetBtn[0],
      panel: $targetPanel[0]
    });
  }

  // 인접 탭 선택 (delta: -1 이전, 1 다음)
  function selectAdjacent($root, $currentBtn, delta) {
    var $btns = $root.find(SEL.BTN);
    var nextIdx = wrapIndex($btns.index($currentBtn), $btns.length, delta);

    select($root, $btns.eq(nextIdx).data(DATA.TAB_ID), {focus: true});
  }

  // 처음/끝 탭 선택
  function selectEdge($root, isFirst) {
    var $btns = $root.find(SEL.BTN);
    var $target = isFirst ? $btns.first() : $btns.last();

    select($root, $target.data(DATA.TAB_ID), {focus: true});
  }

  function onClickTab(e) {
    select(getRoot($(e.currentTarget)), $(e.currentTarget).data(DATA.TAB_ID));
  }

  function onKeydownTab(e) {
    var $btn = $(e.currentTarget);
    var $root = getRoot($btn);
    var key = e.which || e.keyCode;

    switch (key) {
      case KEYS.LEFT:
        e.preventDefault();
        selectAdjacent($root, $btn, -1);
        break;
      case KEYS.RIGHT:
        e.preventDefault();
        selectAdjacent($root, $btn, 1);
        break;
      case KEYS.HOME:
        e.preventDefault();
        selectEdge($root, true);
        break;
      case KEYS.END:
        e.preventDefault();
        selectEdge($root, false);
        break;
    }
  }

  // URL 해시 파싱 후 탭 적용 (예: #tab=tab2)
  function applyHash() {
    var hash = location.hash.slice(1);
    if (!hash) return;

    var id = null;

    if (typeof URLSearchParams !== 'undefined') {
      id = new URLSearchParams(hash).get(HASH_PARAM);
    } else {
      var match = hash.match(new RegExp('(?:^|&)' + HASH_PARAM + '=([^&]+)'));
      id = match ? decodeURIComponent(match[1]) : null;
    }

    if (!id) return;

    var $btn = filterByData($(SEL.BTN), id, DATA.TAB_ID);
    if ($btn.length) select(getRoot($btn.first()), id);
  }

  //초기화 / 정리
  function initA11yForRoot($root) {
    if (!$root.length) return;

    var $btns = $root.find(SEL.BTN);
    var $panels = $root.find(SEL.PANEL);

    $btns.each(function () {
      var $btn = $(this);
      var id = $btn.data(DATA.TAB_ID);
      var $panel = filterByData($panels, id, DATA.TAB_PANEL);
      var panelId = $panel.attr('id');
      var isActive = $btn.hasClass(ACTIVE_CLS);

      if (!panelId && $panel.length) {
        panelId = 'tabpanel-' + id + '-' + Math.random().toString(36).slice(2, 8);
        $panel.attr('id', panelId);
      }

      var attrs = {
        'aria-selected': isActive ? 'true' : 'false',
        tabindex: isActive ? '0' : '-1'
      };
      if (panelId) attrs['aria-controls'] = panelId;

      $btn.attr(attrs);
      $panel.attr('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  function initA11y() {
    $(SEL.ROOT).each(function () {
      initA11yForRoot($(this));
    });
  }

  function bind() {
    $(document)
      .off('click' + NS, SEL.ROOT + ' ' + SEL.BTN)
      .off('keydown' + NS, SEL.ROOT + ' ' + SEL.BTN)
      .on('click' + NS, SEL.ROOT + ' ' + SEL.BTN, onClickTab)
      .on('keydown' + NS, SEL.ROOT + ' ' + SEL.BTN, onKeydownTab);

    $(window)
      .off('hashchange' + NS)
      .on('hashchange' + NS, applyHash);
  }

  function unbind() {
    $(document).off(NS);
    $(window).off(NS);
  }

  window.UI.tab = {
    init: function () {
      bind();
      initA11y();
      applyHash();
    },

    destroy: function () {
      unbind();
    },

    select: function (containerId, selectedId) {
      select(getRootById(containerId), selectedId);
    },

    getActiveId: function (containerId) {
      var $active = getRootById(containerId).find(SEL.BTN + '.' + ACTIVE_CLS);
      return $active.length ? $active.data(DATA.TAB_ID) : null;
    },

    refresh: function (containerId) {
      if (containerId) {
        initA11yForRoot(getRootById(containerId));
      } else {
        initA11y();
      }
    }
  };
})(window.jQuery, window, document);
