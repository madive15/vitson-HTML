/**
 * @file scripts-mo/ui/common/bottom-tab-bar.js
 * @description 하단 탭바 액션 위임 + 카테고리 풀팝업 제어
 * @scope .bottom-tab-bar
 *
 * @mapping
 *  [data-action]  → 페이지 이동이 아닌 액션 트리거 버튼
 *
 * @events
 *  tabBar:{action명} (document) — 액션 버튼 클릭 시 발행
 *
 * @note
 *  - 카테고리 풀팝업 열기/닫기(토글) 직접 제어
 *  - 풀팝업 내부 탭 전환 시 팝업 헤더 타이틀 동기화
 *  - 카테고리 선택 시 해당 카테고리 페이지로 이동
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiBottomTabBar';
  var SCOPE = '.bottom-tab-bar';
  var FULL_POPUP = '.category-full-popup';
  var POPUP_ID = 'categoryFullPopup';
  var CAT_SCOPE = '[data-category-sheet]';
  var OPEN_DELAY = 300;
  var SEL_BREADCRUMB = '[data-ui="breadcrumb"]';

  // 풀팝업 내부 카테고리 상태
  var _state = {
    path: {depth1Id: '', depth2Id: '', depth3Id: ''},
    browseD1: ''
  };
  var _scopeBound = false;
  var _bound = false;

  // 풀팝업 열림 여부
  function isPopupOpen() {
    var $popup = $(FULL_POPUP);
    return $popup.length && $popup.closest('.k-window').is(':visible');
  }

  // 풀팝업 안의 카테고리 스코프
  function $catScope() {
    return $('#' + POPUP_ID).find(CAT_SCOPE);
  }

  // 카테고리 선택 확정 → 페이지 이동
  function onCommit(path) {
    // 브레드크럼 있으면 바텀시트와 동일하게 처리 (브레드크럼 갱신 + 팝업 닫기)
    if ($(SEL_BREADCRUMB).length) {
      if (window.CategorySheet && window.CategorySheet.commitFromPopup) {
        window.CategorySheet.commitFromPopup(path);
      }
      window.VmKendoWindow.close(POPUP_ID);
      return;
    }

    // 브레드크럼 없으면 페이지 이동
    var lastDepth = path.depth3Id || path.depth2Id || path.depth1Id;
    if (lastDepth) {
      window.location.href = '/category/' + lastDepth;
    }
  }

  // 풀팝업 카테고리 렌더 + 이벤트 바인딩
  function openCategoryPopup() {
    if (!window.VmKendoWindow || !window.CategoryRenderer) return;
    var R = window.CategoryRenderer;

    // 바텀시트 경로 동기화
    if (window.CategorySheet) {
      var sheetPath = window.CategorySheet.getPath();
      if (sheetPath.depth1Id) {
        _state.path = sheetPath;
        _state.browseD1 = sheetPath.depth1Id;
      }
    }

    // 팝업 먼저 열기 — 즉시 반응
    window.VmKendoWindow.open(POPUP_ID);

    // 콘텐츠는 팝업 안에서 비동기 렌더
    R.loadTree(function () {
      var $scope = $catScope();
      if (!$scope.length) return;

      if (!_scopeBound) {
        R.bindScopeEvents($scope, _state, onCommit);
        _scopeBound = true;
      }

      var tree = R.getTree();
      if (!_state.path.depth1Id && tree.length) {
        _state.browseD1 = tree[0].categoryCode;
      } else {
        _state.browseD1 = _state.path.depth1Id;
      }

      R.renderDepth1($scope, _state.path, _state.browseD1);

      if (!_state.path.depth1Id && tree.length) {
        $scope.find('[data-depth1-item]').first().addClass('is-current');
        R.renderSub($scope, _state.browseD1, _state.path);
      }

      if (window.UI && window.UI.tab) {
        var $tabScope = $('#' + POPUP_ID).find('[data-tab-scope]');
        if ($tabScope.length) {
          window.UI.tab.activate($tabScope, 'categoryTab');
        }
      }

      setTimeout(function () {
        if (_state.path.depth1Id) {
          R.scrollToActive($scope);
        } else {
          $scope.find('[data-depth1-panel]').scrollTop(0);
          $scope.find('[data-sub-panel]').scrollTop(0);
        }
      }, OPEN_DELAY);
    });
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    // 액션 버튼 클릭 → 풀팝업 열기/토글
    $(document).on('click' + NS, SCOPE + ' [data-action]', function (e) {
      e.preventDefault();

      var action = $(this).data('action');
      if (!action) return;
      // 카테고리 액션
      if (action === 'open-category-sheet') {
        if (!window.VmKendoWindow) return;
        // 바텀시트 열려있으면 닫고 풀팝업 열기
        var $sheet = $('#categorySheet');
        var sheetInst = $sheet.data('kendoWindow');
        if (sheetInst && $sheet.is(':visible')) {
          window.VmKendoWindow.close('categorySheet');
        }
        // 풀팝업 토글
        if (isPopupOpen()) {
          window.VmKendoWindow.close(POPUP_ID);
          return;
        }
        openCategoryPopup();
        return;
      }

      // 그 외 액션은 이벤트 발행
      $(document).trigger('tabBar:' + action);
    });

    // 풀팝업 내부 탭 전환 → 팝업 타이틀 갱신
    $(document).on('tab:change' + NS, FULL_POPUP + ' [data-tab-scope]', function (e, target, $btn) {
      var title = $btn.find('.text').text();
      $(this).closest(FULL_POPUP).find('.vm-modal-title').text(title);
    });

    // 바텀시트 카테고리 선택 → 풀팝업 상태 동기화
    $(document).on('category:change' + NS, function (e, data) {
      if (data && data.path) {
        _state.path = $.extend({}, data.path);
        _state.browseD1 = data.path.depth1Id;
      }
    });
  }

  function init() {
    bind();
  }

  function destroy() {
    $(document).off(NS);
    var $scope = $catScope();
    if ($scope.length && window.CategoryRenderer) {
      window.CategoryRenderer.unbindScopeEvents($scope);
    }
    _state = {path: {depth1Id: '', depth2Id: '', depth3Id: ''}, browseD1: ''};
    _scopeBound = false;
    _bound = false;
  }

  window.UI.bottomTabBar = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
