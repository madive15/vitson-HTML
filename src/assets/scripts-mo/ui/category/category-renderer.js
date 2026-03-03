/**
 * @file scripts-mo/ui/category/category-renderer.js
 * @description 카테고리 depth1/2/3 렌더 공통 모듈
 * @note 바텀시트, 풀팝업 등에서 스코프($scope)를 넘겨 재사용
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var TREE_URL = '/public/resources/mock/category.json';
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
    viewAll: '[data-view-all]'
  };

  var ESC_MAP = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

  // 공유 tree 데이터 — 한 번만 fetch
  var _tree = [];
  var _treeLoaded = false;
  var _treeCallbacks = [];

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

  function validChildren(node) {
    if (!node || !Array.isArray(node.categoryList)) return [];
    return node.categoryList.filter(function (c) {
      return c && c.categoryCode;
    });
  }

  // tree 로드 — 캐싱, 중복 요청 방지
  function loadTree(callback) {
    if (_treeLoaded) {
      callback(_tree);
      return;
    }
    _treeCallbacks.push(callback);
    // 첫 번째 요청만 fetch
    if (_treeCallbacks.length > 1) return;

    var base = window.location.pathname.indexOf('/vitson-HTML') === 0 ? '/vitson-HTML' : '';
    $.getJSON(base + TREE_URL)
      .done(function (data) {
        _tree = Array.isArray(data) ? data : data.tree || [];
        _treeLoaded = true;
        for (var i = 0; i < _treeCallbacks.length; i++) {
          _treeCallbacks[i](_tree);
        }
        _treeCallbacks = [];
      })
      .fail(function () {
        console.warn('[CategoryRenderer] tree 로드 실패');
        _treeCallbacks = [];
      });
  }

  function getTree() {
    return _tree;
  }

  // 경로 기준 노드 조회
  function resolvePath(path) {
    var d1 = findNode(_tree, path.depth1Id);
    if (!d1) return {d1: null, d2: null, d3: null};
    var d2 = findNode(validChildren(d1), path.depth2Id);
    var d3 = d2 ? findNode(validChildren(d2), path.depth3Id) : null;
    return {d1: d1, d2: d2, d3: d3};
  }

  function pathNames(path) {
    var p = resolvePath(path);
    if (!p.d1) return [];
    var names = [p.d1.categoryNm];
    if (p.d2) names.push(p.d2.categoryNm);
    if (p.d3) names.push(p.d3.categoryNm);
    return names;
  }

  function depth4Items(path) {
    var p = resolvePath(path);
    return p.d3 ? validChildren(p.d3) : [];
  }

  function scrollToCenter(panel, item) {
    if (!panel || !item) return;
    var h = panel.clientHeight;
    panel.scrollTop = Math.max(0, item.offsetTop - (h - item.offsetHeight) / 2);
  }

  // 스크롤: 활성 항목 중앙 정렬
  function scrollToActive($scope) {
    requestAnimationFrame(function () {
      var d1Panel = $scope.find(SEL.depth1Panel)[0];
      var d1Target =
        d1Panel &&
        (d1Panel.querySelector(SEL.depth1Item + '.' + CLS.active) ||
          d1Panel.querySelector(SEL.depth1Item + '.' + CLS.current));
      scrollToCenter(d1Panel, d1Target);

      var subPanel = $scope.find(SEL.subPanel)[0];
      var subTarget =
        subPanel &&
        (subPanel.querySelector(SEL.depth3Item + '.' + CLS.active) ||
          subPanel.querySelector(SEL.depth2Item + '.' + CLS.active) ||
          subPanel.querySelector(SEL.viewAll + '.' + CLS.active));
      scrollToCenter(subPanel, subTarget);
    });
  }

  // 렌더: depth1 (좌측 패널)
  function renderDepth1($scope, path, browseD1) {
    var $list = $scope.find(SEL.depth1List);
    if (!$list.length || !_tree.length) return;

    var html = [];
    for (var i = 0; i < _tree.length; i++) {
      var node = _tree[i];
      if (!node || !node.categoryCode) continue;

      var code = node.categoryCode;
      var isActive = code === path.depth1Id;
      var isCurrent = code === browseD1;

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

    if (browseD1) {
      renderSub($scope, browseD1, path);
    }
  }

  // 렌더: 우측 패널 (전체보기 + depth2/3)
  function renderSub($scope, d1Code, path) {
    var $list = $scope.find(SEL.subList);
    if (!$list.length) return;

    var d1 = findNode(_tree, d1Code);
    if (!d1) {
      $list.empty();
      return;
    }

    var isConfirmed = d1Code === path.depth1Id;
    var isViewAllActive = isConfirmed && !path.depth2Id;

    var d2List = validChildren(d1);
    var html = [
      '<li class="view-all' +
        (isViewAllActive ? ' ' + CLS.active : '') +
        '" data-view-all>' +
        '<button type="button" class="text">전체보기</button>' +
        '</li>'
    ];

    for (var i = 0; i < d2List.length; i++) {
      html.push(buildDepth2Html(d2List[i], isConfirmed, path));
    }

    $list.html(html.join(''));
  }

  function buildDepth2Html(d2, isConfirmed, path) {
    var children = validChildren(d2);
    var hasChild = children.length > 0;
    var code = esc(d2.categoryCode);
    var name = esc(d2.categoryNm);
    var d3Id = 'depth3-' + code;

    var hasActiveD3 = false;
    var isOpen = false;
    var isD2Active = false;

    if (isConfirmed) {
      hasActiveD3 =
        hasChild &&
        path.depth3Id &&
        children.some(function (c) {
          return c.categoryCode === path.depth3Id;
        });
      isOpen = hasActiveD3;
      isD2Active = hasActiveD3 || (!path.depth3Id && d2.categoryCode === path.depth2Id);
    }

    var p = [];

    p.push(
      '<li class="depth2-item' +
        (hasChild ? ' ' + CLS.hasChildren : '') +
        (isOpen ? ' ' + CLS.open : '') +
        (isD2Active ? ' ' + CLS.active : '') +
        '" data-depth2-item data-code="' +
        code +
        '">'
    );

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
        var isD3Active = isConfirmed && d3.categoryCode === path.depth3Id;
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

  // 이벤트 바인딩 — 스코프 내부 클릭 처리 (콜백 방식)
  function bindScopeEvents($scope, state, onCommit) {
    var ns = '.uiCatRenderer' + $scope.attr('id');
    // 중복 바인딩 방지
    $scope.off(ns);

    // depth1 클릭
    $scope.on('click' + ns, SEL.depth1Item, function () {
      var $item = $(this);
      var code = $item.attr('data-code');
      $item.addClass(CLS.current).siblings().removeClass(CLS.current);
      state.browseD1 = code;
      state.path.depth2Id = '';
      state.path.depth3Id = '';
      renderSub($scope, code, state.path);
    });

    // 전체보기
    $scope.on('click' + ns, SEL.viewAll, function () {
      state.path.depth2Id = '';
      state.path.depth3Id = '';
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // depth2 선택
    $scope.on('click' + ns, SEL.depth2Select, function () {
      var $d2 = $(this).closest(SEL.depth2Item);
      state.path.depth2Id = $d2.attr('data-code');
      state.path.depth3Id = '';
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // depth2 토글
    $scope.on('click' + ns, SEL.toggleBtn, function (e) {
      e.stopPropagation();
      var $btn = $(this);
      var $d2 = $btn.closest(SEL.depth2Item);
      var $list = $d2.find(SEL.depth3List);
      var isOpen = $d2.hasClass(CLS.open);
      $d2.toggleClass(CLS.open);
      $btn.attr('aria-expanded', String(!isOpen));
      $list.slideToggle(SLIDE_DURATION);
    });

    // depth3 선택
    $scope.on('click' + ns, SEL.depth3Item, function () {
      var $item = $(this);
      state.path.depth2Id = $item.attr('data-depth2');
      state.path.depth3Id = $item.attr('data-code');
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // 키보드
    $scope.on('keydown' + ns, SEL.depth1Item + ',' + SEL.depth3Item, function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(e.target).trigger('click');
      }
    });
  }

  // 이벤트 해제
  function unbindScopeEvents($scope) {
    var ns = '.uiCatRenderer' + $scope.attr('id');
    $scope.off(ns);
  }

  window.CategoryRenderer = {
    loadTree: loadTree,
    getTree: getTree,
    renderDepth1: renderDepth1,
    renderSub: renderSub,
    scrollToActive: scrollToActive,
    pathNames: pathNames,
    depth4Items: depth4Items,
    bindScopeEvents: bindScopeEvents,
    unbindScopeEvents: unbindScopeEvents,
    SEL: SEL,
    CLS: CLS
  };
})(window.jQuery, window);
