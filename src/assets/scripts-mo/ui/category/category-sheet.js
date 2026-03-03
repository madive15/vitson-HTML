/**
 * @file scripts-mo/ui/category/category-sheet.js
 * @description 카테고리 바텀시트 — CategoryRenderer 기반 렌더 + 브레드크럼 갱신
 * @scope [data-category-sheet]
 *
 * @events
 *  category:change (document) — 선택 확정 시 발행 { path, names, depth4 }
 *
 * @a11y role="option", aria-selected, aria-expanded, Enter/Space 키보드 지원
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiCategorySheet';
  var SCOPE = '[data-category-sheet]';
  var POPUP_ID = 'categorySheet';
  var OPEN_DELAY = 300;

  var SEL = {
    breadcrumbBtn: '[data-ui="breadcrumb"] button.vm-breadcrumb-btn',
    breadcrumbItems: '[data-ui="breadcrumb"] .vm-breadcrumb-items'
  };

  // 내부 상태
  var _state = {
    path: {depth1Id: '', depth2Id: '', depth3Id: ''},
    browseD1: ''
  };
  var _savedPath = null;
  var _bound = false;

  // 카테고리 시트 열림 여부
  function isSheetOpen() {
    var $el = $('#' + POPUP_ID);
    var inst = $el.data('kendoWindow');
    return inst && inst.element.is(':visible');
  }

  // 바텀시트 안의 스코프
  function $sheetScope() {
    return $('#' + POPUP_ID).find(SCOPE);
  }

  // 브레드크럼 갱신
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
  function onCommit(path) {
    _state.path = $.extend({}, path);
    _state.browseD1 = path.depth1Id;
    _savedPath = null;

    var R = window.CategoryRenderer;
    var names = R.pathNames(path);
    var d4 = R.depth4Items(path);

    updateBreadcrumb(names);
    $('[data-header-title]').text(names[names.length - 1] || '');

    $(document).trigger('category:change', [
      {
        path: $.extend({}, path),
        names: names,
        depth4: d4
      }
    ]);

    if (window.VmKendoWindow) {
      window.VmKendoWindow.close(POPUP_ID);
    }
  }

  // 시트 열기
  function openSheet() {
    if (!window.VmKendoWindow || !window.CategoryRenderer) return;
    var R = window.CategoryRenderer;
    var $scope = $sheetScope();
    if (!$scope.length) return;

    // 열기 전 경로 백업
    _savedPath = $.extend({}, _state.path);

    _state.browseD1 = _state.path.depth1Id;
    R.renderDepth1($scope, _state.path, _state.browseD1);

    window.VmKendoWindow.open(POPUP_ID);

    setTimeout(function () {
      R.scrollToActive($scope);
    }, OPEN_DELAY);
  }

  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 브레드크럼 클릭 → 바텀시트 오픈
    $doc.on('click' + NS, SEL.breadcrumbBtn, function () {
      if (isSheetOpen()) return;
      openSheet();
    });

    // 바텀시트 닫힘 → 선택 안 했으면 탐색 상태 복원
    $(document).on('kendo:close' + NS, function (e, id) {
      if (id !== POPUP_ID) return;
      if (_savedPath) {
        _state.path = $.extend({}, _savedPath);
        _state.browseD1 = _savedPath.depth1Id;
        _savedPath = null;
      }
    });
  }

  function init() {
    if (!window.CategoryRenderer) return;
    var R = window.CategoryRenderer;

    // 바텀시트 내부 스코프에서 경로 읽기
    var $scope = $sheetScope();
    if ($scope.length) {
      _state.path = {
        depth1Id: $scope.data('depth1') || '',
        depth2Id: $scope.data('depth2') || '',
        depth3Id: $scope.data('depth3') || ''
      };
      _state.browseD1 = _state.path.depth1Id;
    }

    bindEvents();

    // tree 로드 후 스코프 이벤트 바인딩 + 브레드크럼 초기화
    R.loadTree(function () {
      var $scope = $sheetScope();
      if ($scope.length) {
        R.bindScopeEvents($scope, _state, onCommit);
      }
      updateBreadcrumb(R.pathNames(_state.path));
    });
  }

  function destroy() {
    $(document).off(NS);
    var $scope = $sheetScope();
    if ($scope.length && window.CategoryRenderer) {
      window.CategoryRenderer.unbindScopeEvents($scope);
    }
    _state = {path: {depth1Id: '', depth2Id: '', depth3Id: ''}, browseD1: ''};
    _bound = false;
  }

  window.CategorySheet = {
    init: init,
    destroy: destroy,
    getPath: function () {
      return $.extend({}, _state.path);
    },
    commitFromPopup: function (path) {
      _state.path = $.extend({}, path);
      _state.browseD1 = path.depth1Id;
      var R = window.CategoryRenderer;
      var names = R.pathNames(path);
      var d4 = R.depth4Items(path);
      updateBreadcrumb(names);
      $('[data-header-title]').text(names[names.length - 1] || '');
      $(document).trigger('category:change', [
        {
          path: $.extend({}, path),
          names: names,
          depth4: d4
        }
      ]);
    }
  };
})(window.jQuery, window);
