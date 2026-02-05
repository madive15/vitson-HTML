/**
 * @file scripts/ui/header/header-brand.js
 * @description 브랜드 탭 + 검색 필터링
 * @requires jQuery, UI.inputSearch
 *
 * @scope [data-brand-tab]
 * @mapping inputSearch:submit / inputSearch:clear → 필터링 + 탭 제어
 * @state is-search-mode, has-scroll
 *
 * @option onSearch(keyword, $root) — API 연동 시 filterBrands 대체
 * @option onClear($root)          — API 연동 시 필터 해제 대체
 *
 * @events brand:tabChange, brand:subChange, brand:search, brand:searchClear
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var SEL = {
    ROOT: '[data-brand-tab]',
    PANEL: '.gnb-panel-brand',
    SCROLL_AREA: '.tab-panels',

    TAB_TRIGGER: '[data-tab-trigger]',
    TAB_PANEL: '[data-tab-panel]',
    TAB_GROUP: '[data-tab-group]',
    SUB_TRIGGER: '[data-sub-trigger]',
    SUB_PANEL: '[data-sub-panel]',

    INPUT: '[data-search-input]',

    BRAND_LINK: '[data-brand-item]',
    COUNT: '[data-brand-count]'
  };

  var CLS = {
    ACTIVE: 'is-active',
    OPEN: 'is-open',
    SEARCH_MODE: 'is-search-mode',
    HAS_SCROLL: 'has-scroll'
  };

  var TAB = {ALL: 'all', EMPTY: 'empty', DEFAULT: 'korean'};

  // init 시 브랜드 링크 캐싱 — 검색마다 DOM 재탐색 제거
  function cacheBrandData($root) {
    var $panelAll = findByData($root, SEL.TAB_PANEL, 'tabPanel', TAB.ALL);
    var links = [];

    $panelAll.find(SEL.BRAND_LINK).each(function () {
      var $el = $(this);
      links.push({$el: $el, text: $el.text().toLowerCase()});
    });

    $root.data('brandCache', {
      $panelAll: $panelAll,
      $panelEmpty: findByData($root, SEL.TAB_PANEL, 'tabPanel', TAB.EMPTY),
      $count: $panelAll.find(SEL.COUNT),
      links: links
    });
  }

  // $root → .gnb-panel-brand
  function getBrandPanel($root) {
    return $root.closest(SEL.PANEL);
  }

  // 저장된 옵션 반환
  function getOpt($root) {
    return $root.data('brandOpt') || {};
  }

  // 스크롤 유무 → 클래스 토글
  function checkScroll($root) {
    var el = $root.find(SEL.SCROLL_AREA)[0];
    if (!el) return;
    $root.toggleClass(CLS.HAS_SCROLL, el.scrollHeight > el.clientHeight);
  }

  // 셀렉터 인젝션 방지 — data 값 비교로 검색
  function findByData($scope, sel, key, val) {
    return $scope.find(sel).filter(function () {
      return $(this).data(key) === val;
    });
  }

  // 1차 탭 활성화
  function activateTab($root, tabId) {
    var $target = findByData($root, SEL.TAB_TRIGGER, 'tabTrigger', tabId);
    var $targetPanel = findByData($root, SEL.TAB_PANEL, 'tabPanel', tabId);

    if (!$targetPanel.length) return;

    $root.find(SEL.TAB_TRIGGER).removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $root.find(SEL.TAB_PANEL).removeClass(CLS.ACTIVE).attr('hidden', '');
    $root.find(SEL.TAB_GROUP).removeClass(CLS.OPEN);

    $target.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    var $group = $target.closest(SEL.TAB_GROUP);
    if ($group.length) $group.addClass(CLS.OPEN);

    $root.trigger('brand:tabChange', {tabId: tabId});
  }

  // 2차 서브탭 활성화
  function activateSubTab($root, $group, subId) {
    var groupId = $group.data('tabGroup');
    var $parentPanel = findByData($root, SEL.TAB_PANEL, 'tabPanel', groupId);
    var $target = findByData($group, SEL.SUB_TRIGGER, 'subTrigger', subId);
    var $targetPanel = findByData($parentPanel, SEL.SUB_PANEL, 'subPanel', subId);

    if (!$targetPanel.length) return;

    $group.find(SEL.SUB_TRIGGER).removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $parentPanel.find(SEL.SUB_PANEL).removeClass(CLS.ACTIVE).attr('hidden', '');

    $target.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    $root.trigger('brand:subChange', {groupId: groupId, subId: subId});
  }

  // 기본 탭 + 첫 서브탭으로 복원
  function restoreDefaultTab($root) {
    var defaultTab = $root.data('defaultTab') || TAB.DEFAULT;

    $root.removeClass(CLS.SEARCH_MODE);
    activateTab($root, defaultTab);

    var $group = findByData($root, SEL.TAB_GROUP, 'tabGroup', defaultTab);
    if (!$group.length) return;

    var firstSubId = $group.find(SEL.SUB_TRIGGER).first().data('subTrigger');
    if (firstSubId != null) activateSubTab($root, $group, firstSubId);
  }

  // destroy용 — 이벤트 없이 DOM 초기 상태로 리셋
  function resetDomState($root) {
    $root.find(SEL.TAB_TRIGGER).removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $root.find(SEL.TAB_PANEL).removeClass(CLS.ACTIVE).attr('hidden', '');
    $root.find(SEL.TAB_GROUP).removeClass(CLS.OPEN);
    $root.find(SEL.SUB_TRIGGER).removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $root.find(SEL.SUB_PANEL).removeClass(CLS.ACTIVE).attr('hidden', '');

    // 캐시 기반 복원
    var cache = $root.data('brandCache');
    if (cache) {
      cache.links.forEach(function (item) {
        item.$el.removeAttr('hidden');
      });
      cache.$count.text(cache.links.length);
    }
  }

  // 키워드로 전체 패널 필터링 (캐시 사용)
  function filterBrands($root, keyword) {
    var cache = $root.data('brandCache');
    if (!cache) return;

    if (!keyword) {
      cache.links.forEach(function (item) {
        item.$el.removeAttr('hidden');
      });
      cache.$count.text(cache.links.length);
      cache.$panelAll.removeAttr('hidden');
      cache.$panelEmpty.attr('hidden', '');
      return;
    }

    var matchCount = 0;

    cache.links.forEach(function (item) {
      if (item.text.indexOf(keyword) > -1) {
        item.$el.removeAttr('hidden');
        matchCount++;
      } else {
        item.$el.attr('hidden', '');
      }
    });

    cache.$count.text(matchCount);

    if (matchCount === 0) {
      cache.$panelAll.attr('hidden', '');
      cache.$panelEmpty.removeAttr('hidden');
    } else {
      cache.$panelAll.removeAttr('hidden');
      cache.$panelEmpty.attr('hidden', '');
    }
  }

  // 검색 모드 진입 → 전체 탭 고정 + 필터링
  function enterSearchMode($root, keyword) {
    var opt = getOpt($root);

    $root.addClass(CLS.SEARCH_MODE);
    activateTab($root, TAB.ALL);
    $root.find(SEL.TAB_GROUP).removeClass(CLS.OPEN);

    if (typeof opt.onSearch === 'function') {
      opt.onSearch(keyword, $root);
    } else {
      filterBrands($root, keyword);
    }

    checkScroll($root);
    $root.trigger('brand:search', {keyword: keyword});
  }

  // 검색 모드 해제 → 필터 초기화 + 기본 탭 복원
  function exitSearchMode($root) {
    var opt = getOpt($root);

    if (typeof opt.onClear === 'function') {
      opt.onClear($root);
    } else {
      filterBrands($root, '');
    }

    restoreDefaultTab($root);
    checkScroll($root);
    $root.trigger('brand:searchClear');
  }

  function bindEvents($root) {
    var $panel = getBrandPanel($root);

    // 1차 탭 클릭 — 검색 모드 잠금
    $root.on('click.brand', SEL.TAB_TRIGGER, function (e) {
      e.preventDefault();
      if ($root.hasClass(CLS.SEARCH_MODE)) return;

      activateTab($root, $(this).data('tabTrigger'));
      checkScroll($root);
    });

    // 2차 서브탭 클릭
    $root.on('click.brand', SEL.SUB_TRIGGER, function (e) {
      e.preventDefault();

      var $btn = $(this);
      activateSubTab($root, $btn.closest(SEL.TAB_GROUP), $btn.data('subTrigger'));
      checkScroll($root);
    });

    // inputSearch 검색 완료 → 필터링
    $panel.on('inputSearch:submit.brand', SEL.INPUT, function (e, data) {
      enterSearchMode($root, data.query);
    });

    // inputSearch 클리어 → 탭 복원
    $panel.on('inputSearch:clear.brand', SEL.INPUT, function () {
      exitSearchMode($root);
    });

    cacheBrandData($root);
    checkScroll($root);
  }

  window.UI.Brand = {
    init: function ($scope, opt) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if ($root.data('brandInit')) return;

        $root.data('brandInit', true);
        $root.data('brandOpt', opt || {});
        bindEvents($root);
      });
    },

    destroy: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if (!$root.data('brandInit')) return;

        $root.off('.brand');
        getBrandPanel($root).off('.brand');

        resetDomState($root);
        $root.removeClass(CLS.SEARCH_MODE + ' ' + CLS.HAS_SCROLL).removeData('brandInit brandOpt brandCache');
      });
    },

    // 외부에서 검색 — inputSearch.setValue로 인풋 위임
    search: function ($root, keyword) {
      if (!keyword) return;

      var $r = $($root);
      var normalized = window.UI.inputSearch
        ? window.UI.inputSearch.normalize(keyword).toLowerCase()
        : String(keyword).toLowerCase();

      if (!normalized) return;

      if (window.UI.inputSearch) {
        window.UI.inputSearch.setValue(getBrandPanel($r), keyword);
      }

      enterSearchMode($r, normalized);
    },

    // 외부에서 초기화 — inputSearch.clear → 이벤트 → exitSearchMode
    clear: function ($root) {
      if (window.UI.inputSearch) {
        window.UI.inputSearch.clear(getBrandPanel($($root)));
      }
    },

    // 탭 전환 — 검색 모드면 조용히 해제 후 직행
    showTab: function ($root, tabId) {
      var $r = $($root);

      if ($r.hasClass(CLS.SEARCH_MODE)) {
        if (window.UI.inputSearch) window.UI.inputSearch.setValue(getBrandPanel($r), '');

        var opt = getOpt($r);
        if (typeof opt.onClear === 'function') {
          opt.onClear($r);
        } else {
          filterBrands($r, '');
        }
        $r.removeClass(CLS.SEARCH_MODE);
      }

      activateTab($r, tabId);
      checkScroll($r);
    }
  };
})(window.jQuery || window.$, window);
