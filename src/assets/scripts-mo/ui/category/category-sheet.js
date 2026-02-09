/**
 * @file scripts-mo/ui/category/category-sheet.js
 * @description 카테고리 바텀시트 — depth1/2/3 렌더 + 선택 → 브레드크럼 갱신
 * @scope [data-category-sheet]
 *
 * @mapping
 *  [data-depth1-list]  → 좌측 depth1 목록
 *  [data-sub-list]     → 우측 전체보기 + depth2/3 목록
 *  [data-depth2-item]  → div.depth2-header([data-depth2-select] + [data-toggle-btn]) + ul[data-depth3-list]
 *
 * @state .is-active     — 확정된 선택 항목 (commitSelection 이후)
 * @state .is-current    — 탐색 중인 depth1 (좌측 패널 클릭 시)
 * @state .is-open       — depth2 아코디언 펼침
 * @state .has-children  — depth2 하위(depth3) 존재
 *
 * @events
 *  category:change (document) — 선택 확정 시 발행 { path, names, depth4 }
 *
 * @a11y role="option", aria-selected, aria-expanded, Enter/Space 키보드 지원
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  // 상수

  var NS = '.uiCategorySheet';
  var SCOPE = '[data-category-sheet]';
  var POPUP_ID = 'categorySheet';
  var SLIDE_DURATION = 200;

  var CLS = {
    active: 'is-active',
    current: 'is-current',
    open: 'is-open',
    hasChildren: 'has-children'
  };

  var SEL = {
    depth1List: '[data-depth1-list]',
    depth1Panel: '[data-depth1-panel]',
    depth1Item: '[data-depth1-item]',
    subList: '[data-sub-list]',
    subPanel: '[data-sub-panel]',
    depth2Item: '[data-depth2-item]',
    depth2Select: '[data-depth2-select]',
    depth3List: '[data-depth3-list]',
    depth3Item: '[data-depth3-item]',
    toggleBtn: '[data-toggle-btn]',
    viewAll: '[data-view-all]',
    breadcrumb: '[data-ui="breadcrumb"]',
    breadcrumbBtn: '[data-ui="breadcrumb"] button.vm-breadcrumb-btn',
    breadcrumbItems: '[data-ui="breadcrumb"] .vm-breadcrumb-items'
  };

  var ESC_MAP = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

  // 내부 상태

  var _tree = [];
  var _path = {depth1Id: '', depth2Id: '', depth3Id: ''}; // 확정된 선택
  var _browseD1 = ''; // 탐색 중인 depth1
  var _bound = false;

  // 유틸

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (ch) {
      return ESC_MAP[ch];
    });
  }

  function findNode(list, code) {
    if (!code || !list) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].categoryCode === code) return list[i];
    }
    return null;
  }

  // null 제거한 유효 자식 목록
  function validChildren(node) {
    if (!node || !Array.isArray(node.categoryList)) return [];
    return node.categoryList.filter(function (c) {
      return c && c.categoryCode;
    });
  }

  // 확정 경로 기준 d1→d2→d3 노드 조회
  function resolvePath() {
    var d1 = findNode(_tree, _path.depth1Id);
    if (!d1) return {d1: null, d2: null, d3: null};
    var d2 = findNode(validChildren(d1), _path.depth2Id);
    var d3 = d2 ? findNode(validChildren(d2), _path.depth3Id) : null;
    return {d1: d1, d2: d2, d3: d3};
  }

  function pathNames() {
    var p = resolvePath();
    if (!p.d1) return [];
    var names = [p.d1.categoryNm];
    if (p.d2) names.push(p.d2.categoryNm);
    if (p.d3) names.push(p.d3.categoryNm);
    return names;
  }

  function depth4Items() {
    var p = resolvePath();
    return p.d3 ? validChildren(p.d3) : [];
  }

  function scrollToCenter(panel, item) {
    if (!panel || !item) return;
    var h = panel.clientHeight;
    panel.scrollTop = Math.max(0, item.offsetTop - (h - item.offsetHeight) / 2);
  }

  // 브레드크럼

  function updateBreadcrumb(names) {
    if (!names || !names.length) return;

    var $list = $(SEL.breadcrumbItems);
    if (!$list.length) return;

    var $home = $list.children().first();
    $list.children().not($home).remove();

    for (var i = 0; i < names.length; i++) {
      var isCurrent = i === names.length - 1;
      var $btn = $('<button>', {
        type: 'button',
        class: 'vm-breadcrumb-btn' + (isCurrent ? ' is-current' : '')
      }).append($('<span>', {class: 'text', text: names[i]}));

      $list.append($('<li>').append($btn));
    }

    var el = $list[0];
    if (el) el.scrollLeft = el.scrollWidth;
  }

  // 선택 확정 → 브레드크럼 갱신 → 이벤트 발행 → 팝업 닫기

  function commitSelection() {
    _path.depth1Id = _browseD1;

    var names = pathNames();
    var d4 = depth4Items();

    updateBreadcrumb(names);

    // 헤더 타이틀 갱신 — 마지막 뎁스 이름
    $('[data-header-title]').text(names[names.length - 1] || '');

    $(document).trigger('category:change', [
      {
        path: $.extend({}, _path),
        names: names,
        depth4: d4
      }
    ]);

    if (window.VmKendoWindow) {
      window.VmKendoWindow.close(POPUP_ID);
    }
  }

  // 렌더: depth1 (좌측 패널)

  function renderDepth1() {
    var $scope = $(SCOPE);
    var $list = $scope.find(SEL.depth1List);
    if (!$list.length || !_tree.length) return;

    // 팝업 열 때 탐색 위치를 확정 위치로 초기화
    _browseD1 = _path.depth1Id;

    var html = [];
    for (var i = 0; i < _tree.length; i++) {
      var node = _tree[i];
      if (!node || !node.categoryCode) continue;

      var code = node.categoryCode;
      var isActive = code === _path.depth1Id;
      var isCurrent = code === _browseD1;

      html.push(
        '<li class="depth1-item' +
          (isActive ? ' ' + CLS.active : '') +
          (isCurrent ? ' ' + CLS.current : '') +
          '"' +
          ' data-depth1-item role="option" tabindex="0"' +
          ' aria-selected="' +
          isActive +
          '"' +
          ' data-code="' +
          esc(code) +
          '">' +
          esc(node.categoryNm) +
          '</li>'
      );
    }

    $list.html(html.join(''));

    if (_browseD1) {
      renderSub(_browseD1);
    }
  }

  // 렌더: 우측 패널 (전체보기 + depth2/3)

  function renderSub(d1Code) {
    var $scope = $(SCOPE);
    var $list = $scope.find(SEL.subList);
    if (!$list.length) return;

    var d1 = findNode(_tree, d1Code);
    if (!d1) {
      $list.empty();
      return;
    }

    // 확정된 depth1을 보고 있을 때만 active 표시
    var isConfirmed = d1Code === _path.depth1Id;
    var isViewAllActive = isConfirmed && !_path.depth2Id;

    var d2List = validChildren(d1);
    var html = [
      '<li class="view-all' +
        (isViewAllActive ? ' ' + CLS.active : '') +
        '" data-view-all>' +
        '<button type="button" class="text">전체보기</button>' +
        '</li>'
    ];

    for (var i = 0; i < d2List.length; i++) {
      html.push(buildDepth2Html(d2List[i], isConfirmed));
    }

    $list.html(html.join(''));
  }

  function buildDepth2Html(d2, isConfirmed) {
    var children = validChildren(d2);
    var hasChild = children.length > 0;
    var code = esc(d2.categoryCode);
    var name = esc(d2.categoryNm);
    var d3Id = 'depth3-' + code;

    // 확정 depth1을 보고 있을 때만 active/open 판정
    var hasActiveD3 = false;
    var isOpen = false;
    var isD2Active = false;

    if (isConfirmed) {
      hasActiveD3 =
        hasChild &&
        _path.depth3Id &&
        children.some(function (c) {
          return c.categoryCode === _path.depth3Id;
        });
      isOpen = hasActiveD3;
      isD2Active = hasActiveD3 || (!_path.depth3Id && d2.categoryCode === _path.depth2Id);
    }

    var p = [];

    // depth2 래퍼
    p.push(
      '<li class="depth2-item' +
        (hasChild ? ' ' + CLS.hasChildren : '') +
        (isOpen ? ' ' + CLS.open : '') +
        (isD2Active ? ' ' + CLS.active : '') +
        '" data-depth2-item data-code="' +
        code +
        '">'
    );

    // 헤더: 타이틀 + 토글
    p.push('<div class="depth2-header">');
    p.push('<button type="button" class="text" data-depth2-select>' + name + '</button>');

    if (hasChild) {
      p.push(
        '<button type="button" class="toggle-btn" data-toggle-btn' +
          ' aria-expanded="' +
          !!isOpen +
          '"' +
          ' aria-controls="' +
          d3Id +
          '"' +
          ' aria-label="' +
          name +
          ' 하위 카테고리 펼치기">' +
          '<i class="ic ic-arrow-right"></i>' +
          '</button>'
      );
    }
    p.push('</div>');

    // depth3 목록
    if (hasChild) {
      p.push(
        '<ul class="depth3-list" data-depth3-list' +
          ' id="' +
          d3Id +
          '" role="listbox"' +
          (isOpen ? '' : ' style="display:none"') +
          '>'
      );

      for (var j = 0; j < children.length; j++) {
        var d3 = children[j];
        var isD3Active = isConfirmed && d3.categoryCode === _path.depth3Id;
        p.push(
          '<li class="depth3-item' +
            (isD3Active ? ' ' + CLS.active : '') +
            '"' +
            ' data-depth3-item role="option" tabindex="0"' +
            ' data-code="' +
            esc(d3.categoryCode) +
            '"' +
            ' data-depth2="' +
            code +
            '">' +
            esc(d3.categoryNm) +
            '</li>'
        );
      }
      p.push('</ul>');
    }

    p.push('</li>');
    return p.join('');
  }

  // 스크롤: 활성 항목 중앙 정렬

  function scrollToActive() {
    var $scope = $(SCOPE);

    requestAnimationFrame(function () {
      // 좌측: 확정 depth1 or 탐색 depth1
      var d1Panel = $scope.find(SEL.depth1Panel)[0];
      var d1Target =
        d1Panel &&
        (d1Panel.querySelector(SEL.depth1Item + '.' + CLS.active) ||
          d1Panel.querySelector(SEL.depth1Item + '.' + CLS.current));
      scrollToCenter(d1Panel, d1Target);

      // 우측: depth3 > depth2 > 전체보기 순으로 탐색
      var subPanel = $scope.find(SEL.subPanel)[0];
      var subTarget =
        subPanel &&
        (subPanel.querySelector(SEL.depth3Item + '.' + CLS.active) ||
          subPanel.querySelector(SEL.depth2Item + '.' + CLS.active) ||
          subPanel.querySelector(SEL.viewAll + '.' + CLS.active));
      scrollToCenter(subPanel, subTarget);
    });
  }

  // 이벤트 바인딩

  function bindEvents() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // depth1 클릭 → 탐색만 (확정 안 함)
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth1Item, function () {
      var $item = $(this);
      var code = $item.attr('data-code');

      // is-current만 이동, is-active는 유지
      $item.addClass(CLS.current).siblings().removeClass(CLS.current);

      _browseD1 = code;
      _path.depth2Id = '';
      _path.depth3Id = '';
      renderSub(code);
    });

    // 전체보기 → 탐색 중인 depth1로 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.viewAll, function () {
      _path.depth2Id = '';
      _path.depth3Id = '';
      commitSelection();
    });

    // depth2 타이틀 → 해당 depth2 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth2Select, function () {
      var $d2 = $(this).closest(SEL.depth2Item);
      _path.depth2Id = $d2.attr('data-code');
      _path.depth3Id = '';
      commitSelection();
    });

    // depth2 토글 → depth3 아코디언
    $doc.on('click' + NS, SCOPE + ' ' + SEL.toggleBtn, function (e) {
      e.stopPropagation();
      var $btn = $(this);
      var $d2 = $btn.closest(SEL.depth2Item);
      var $list = $d2.find(SEL.depth3List);
      var isOpen = $d2.hasClass(CLS.open);

      $d2.toggleClass(CLS.open);
      $btn.attr('aria-expanded', String(!isOpen));
      $list.slideToggle(SLIDE_DURATION);
    });

    // depth3 선택 → 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth3Item, function () {
      var $item = $(this);
      _path.depth2Id = $item.attr('data-depth2');
      _path.depth3Id = $item.attr('data-code');
      commitSelection();
    });

    // 키보드: Enter/Space → click
    $doc.on('keydown' + NS, SCOPE + ' ' + SEL.depth1Item + ',' + SCOPE + ' ' + SEL.depth3Item, function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(e.target).trigger('click');
      }
    });

    // 브레드크럼 클릭 → 팝업 오픈
    $doc.on('click' + NS, SEL.breadcrumbBtn, function () {
      if (!window.VmKendoWindow) return;
      renderDepth1();
      scrollToActive(); // 팝업 열기 전 즉시 스크롤 (안 보이는 상태)
      window.VmKendoWindow.open(POPUP_ID);
    });
  }

  /**
   * @param {object} [config]
   * @param {string} config.treeUrl  — category JSON 경로
   * @param {object} config.path     — { depth1Id, depth2Id, depth3Id }
   */
  function init(config) {
    // data-attribute 폴백
    if (!config) {
      var $scope = $(SCOPE);
      if (!$scope.length) return;

      config = {
        treeUrl: $scope.data('treeUrl'),
        path: {
          depth1Id: $scope.data('depth1') || '',
          depth2Id: $scope.data('depth2') || '',
          depth3Id: $scope.data('depth3') || ''
        }
      };
    }

    if (!config || !config.path) return;

    _path = $.extend({depth1Id: '', depth2Id: '', depth3Id: ''}, config.path);
    _browseD1 = _path.depth1Id;
    bindEvents();

    $.getJSON(config.treeUrl)
      .done(function (data) {
        _tree = Array.isArray(data) ? data : data.tree || [];
        renderDepth1();
        updateBreadcrumb(pathNames());
      })
      .fail(function () {
        console.warn('[CategorySheet] tree 로드 실패:', config.treeUrl);
      });
  }

  function destroy() {
    $(document).off(NS);
    _tree = [];
    _path = {depth1Id: '', depth2Id: '', depth3Id: ''};
    _browseD1 = '';
    _bound = false;
  }

  window.CategorySheet = {
    init: init,
    destroy: destroy,
    scrollToActive: scrollToActive
  };
})(window.jQuery, window);
