/**
 * @file scripts/ui/floating.js
 * @purpose 플로팅 최근 본 상품 + TOP 버튼
 * @description
 *  - 썸네일: 최대 3개 표시 (CSS max-height로 제한)
 *  - 패널: recent 클릭 시 토글, 썸네일/외부/닫기 클릭 시 닫힘
 *  - TOP 버튼: threshold 이상에서 스크롤 올릴 때 표시
 * @policy
 *  - init(): 멱등성 보장, 기존 스코프는 UI 갱신
 *  - refresh($scope): 특정 스코프 갱신 (미바인딩 시 init)
 *  - refresh(): 전체 재스캔 + 신규 바인딩 + 기존 갱신
 *  - destroy(): DOM 제거 전 호출 권장 (미호출 시 자동 cleanup)
 *  - 자동 cleanup: DOM 분리 시 다음 init/refresh/스크롤/클릭 시점에 정리
 *  - window scroll: TOP 버튼 있는 스코프가 있을 때만 바인딩
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var STATE = {
    VISIBLE: 'is-visible',
    EMPTY: 'is-empty',
    OPEN: 'is-open',
    SCROLLABLE: 'is-scrollable'
  };

  var SELECTOR = {
    SCOPE: '[data-floating-scope]',
    RECENT: '[data-floating-recent]',
    ITEM: '[data-floating-item]',
    TOP: '[data-floating-top]',
    PANEL: '[data-floating-panel]',
    PANEL_CLOSE: '[data-floating-panel-close]',
    DELETE: '[data-floating-delete]',
    DELETE_ALL: '[data-floating-delete-all]',
    PANEL_ITEM: '[data-floating-panel-item]',
    COUNT_NUM: '[data-floating-count-num]'
  };

  var REMOVE_TARGETS = [SELECTOR.ITEM, SELECTOR.PANEL_ITEM];

  var DATA_KEY = {
    BOUND: 'floatingBound',
    LAST_SCROLL_Y: 'floatingLastScrollY',
    ELS: 'floatingEls'
  };

  var INTERNAL = {
    THROTTLE_DELAY: 100,
    THRESHOLD_RATIO: 0.12,
    TOP_SCROLL_DURATION: 300
  };

  var EVENT_NS = '.uiFloating';

  var isWindowScrollBound = false;
  var isDocumentClickBound = false;
  var scrollThrottleTimer = null;
  var activeScopes = [];

  // 스코프가 DOM에 연결되어 있는지 확인
  function isConnected($scope) {
    if (!$scope || !$scope[0]) return false;
    return $.contains(document.documentElement, $scope[0]);
  }

  // 스코프 내 주요 요소들을 캐싱
  function cacheEls($scope) {
    var els = {
      $recent: $scope.find(SELECTOR.RECENT),
      $top: $scope.find(SELECTOR.TOP),
      $panel: $scope.find(SELECTOR.PANEL),
      $countNum: $scope.find(SELECTOR.COUNT_NUM)
    };
    $scope.data(DATA_KEY.ELS, els);
    return els;
  }

  // 캐싱된 요소 객체 반환
  function getEls($scope) {
    return $scope.data(DATA_KEY.ELS) || null;
  }

  // 썸네일 아이템 목록 반환
  function getItems($scope) {
    return $scope.find(SELECTOR.ITEM);
  }

  // activeScopes 배열에서 스코프 인덱스 찾기
  function findScopeIndex($scope) {
    var el = $scope[0];
    for (var i = 0; i < activeScopes.length; i++) {
      if (activeScopes[i][0] === el) return i;
    }
    return -1;
  }

  // activeScopes 배열에서 스코프 제거
  function removeFromActiveScopes($scope) {
    var idx = findScopeIndex($scope);
    if (idx !== -1) {
      activeScopes.splice(idx, 1);
    }
  }

  // activeScopes 배열에 스코프 추가 (중복 방지)
  function addToActiveScopes($scope) {
    if (findScopeIndex($scope) === -1) {
      activeScopes.push($scope);
    }
  }

  // 스코프에 저장된 데이터 및 이벤트 제거
  function clearScopeData($scope) {
    $scope.off(EVENT_NS);
    $scope.removeData(DATA_KEY.BOUND);
    $scope.removeData(DATA_KEY.LAST_SCROLL_Y);
    $scope.removeData(DATA_KEY.ELS);
  }

  // DOM에서 분리된 스코프 자동 정리
  function cleanupDisconnectedScopes() {
    for (var i = activeScopes.length - 1; i >= 0; i--) {
      if (!isConnected(activeScopes[i])) {
        clearScopeData(activeScopes[i]);
        activeScopes.splice(i, 1);
      }
    }
  }

  // TOP 버튼이 있는 스코프 존재 여부 확인 (실제 DOM 연결 확인)
  function hasTopButtonScope() {
    for (var i = 0; i < activeScopes.length; i++) {
      var els = getEls(activeScopes[i]);
      if (els && els.$top && els.$top.length && $.contains(document.documentElement, els.$top[0])) {
        return true;
      }
    }
    return false;
  }

  // 빈 상태(is-empty) 및 스크롤 가능 상태(is-scrollable) 클래스 토글
  function updateEmptyState($scope) {
    var els = getEls($scope);
    if (!els || !els.$recent.length) return;

    var itemCount = getItems($scope).length;
    els.$recent.toggleClass(STATE.EMPTY, itemCount === 0);
    els.$recent.toggleClass(STATE.SCROLLABLE, itemCount > 3);
  }

  // 상품 개수 텍스트 업데이트
  function updateCount($scope) {
    var els = getEls($scope);
    if (!els || !els.$countNum.length) return;
    els.$countNum.text(getItems($scope).length);
  }

  // 모든 UI 상태 일괄 업데이트
  function updateAllStates($scope) {
    updateEmptyState($scope);
    updateCount($scope);
  }

  // 패널 열기 (빈 상태면 무시)
  function openPanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;
    if (els.$recent.hasClass(STATE.EMPTY)) return;

    els.$panel.addClass(STATE.OPEN);
  }

  // 패널 닫기
  function closePanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;

    els.$panel.removeClass(STATE.OPEN);
  }

  // 패널 토글 (열림 ↔ 닫힘)
  function togglePanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;

    if (els.$panel.hasClass(STATE.OPEN)) {
      closePanel($scope);
    } else {
      openPanel($scope);
    }
  }

  // 모든 스코프의 패널 닫기
  function closeAllPanels() {
    for (var i = 0; i < activeScopes.length; i++) {
      closePanel(activeScopes[i]);
    }
  }

  // 개별 상품 삭제 (썸네일 + 패널 동시 제거)
  function deleteItem($scope, $item) {
    if (!$item || !$item.length) return;

    var itemId = $item.data('itemId');
    if (itemId == null) return;

    for (var i = 0; i < REMOVE_TARGETS.length; i++) {
      $scope.find(REMOVE_TARGETS[i] + '[data-item-id="' + itemId + '"]').remove();
    }
    updateAllStates($scope);
  }

  // 전체 상품 삭제 후 패널 닫기
  function deleteAll($scope) {
    for (var i = 0; i < REMOVE_TARGETS.length; i++) {
      $scope.find(REMOVE_TARGETS[i]).remove();
    }
    closePanel($scope);
    updateAllStates($scope);
  }

  // 페이지 최상단으로 스크롤
  function scrollToTop() {
    $('html, body').animate({scrollTop: 0}, INTERNAL.TOP_SCROLL_DURATION);
  }

  // TOP 버튼 표시/숨김 상태 업데이트 (스크롤 방향 기반)
  function updateTopButtonState() {
    cleanupDisconnectedScopes();

    if (!hasTopButtonScope()) {
      unbindWindowScroll();
      return;
    }

    var scrollY = $(window).scrollTop();
    var threshold = $(window).height() * INTERNAL.THRESHOLD_RATIO;

    for (var i = 0; i < activeScopes.length; i++) {
      var $scope = activeScopes[i];
      var els = getEls($scope);
      if (!els || !els.$top.length) continue;

      var lastY = $scope.data(DATA_KEY.LAST_SCROLL_Y) || 0;

      if (scrollY <= threshold) {
        els.$top.removeClass(STATE.VISIBLE);
      } else if (scrollY < lastY) {
        els.$top.addClass(STATE.VISIBLE);
      } else if (scrollY > lastY) {
        els.$top.removeClass(STATE.VISIBLE);
      }

      $scope.data(DATA_KEY.LAST_SCROLL_Y, scrollY);
    }
  }

  // 스크롤 이벤트 throttle 처리
  function throttledScrollHandler() {
    if (scrollThrottleTimer) return;
    scrollThrottleTimer = setTimeout(function () {
      updateTopButtonState();
      scrollThrottleTimer = null;
    }, INTERNAL.THROTTLE_DELAY);
  }

  // 스코프에 이벤트 바인딩 및 초기화
  function bindScope($scope) {
    if (!isConnected($scope)) return;

    if ($scope.data(DATA_KEY.BOUND)) {
      cacheEls($scope);
      addToActiveScopes($scope);
      updateAllStates($scope);
      return;
    }

    cacheEls($scope);
    $scope.data(DATA_KEY.BOUND, true);
    $scope.data(DATA_KEY.LAST_SCROLL_Y, $(window).scrollTop());

    // recent 영역 클릭 → 패널 토글 (a 링크, 패널 내부 제외)
    $scope.on('click' + EVENT_NS, SELECTOR.RECENT, function (e) {
      var $target = $(e.target);

      if ($target.closest('a').length) return;
      if ($target.closest(SELECTOR.PANEL).length) return;

      e.preventDefault();
      togglePanel($scope);
    });

    // 썸네일 클릭 → 이벤트 전파 방지 (링크 이동 허용)
    $scope.on('click' + EVENT_NS, SELECTOR.ITEM, function (e) {
      e.stopPropagation();
    });

    // 패널 클릭 → 이벤트 전파 방지
    $scope.on('click' + EVENT_NS, SELECTOR.PANEL, function (e) {
      e.stopPropagation();
    });

    // 패널 닫기 버튼 클릭 → 패널 닫기
    $scope.on('click' + EVENT_NS, SELECTOR.PANEL_CLOSE, function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel($scope);
    });

    // TOP 버튼 클릭 → 최상단 이동
    $scope.on('click' + EVENT_NS, SELECTOR.TOP, function (e) {
      e.preventDefault();
      scrollToTop();
    });

    // 개별 삭제 버튼 클릭 → 해당 상품 삭제
    $scope.on('click' + EVENT_NS, SELECTOR.DELETE, function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteItem($scope, $(this).closest(SELECTOR.PANEL_ITEM));
    });

    // 전체 삭제 버튼 클릭 → 모든 상품 삭제
    $scope.on('click' + EVENT_NS, SELECTOR.DELETE_ALL, function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteAll($scope);
    });

    addToActiveScopes($scope);
    updateAllStates($scope);
  }

  // 스코프 이벤트 해제 및 데이터 정리
  function unbindScope($scope) {
    clearScopeData($scope);
    removeFromActiveScopes($scope);
  }

  // window scroll 이벤트 바인딩
  function bindWindowScroll() {
    if (isWindowScrollBound) return;
    isWindowScrollBound = true;
    $(window).on('scroll' + EVENT_NS, throttledScrollHandler);
  }

  // window scroll 이벤트 해제
  function unbindWindowScroll() {
    if (!isWindowScrollBound) return;
    isWindowScrollBound = false;
    $(window).off('scroll' + EVENT_NS);
    if (scrollThrottleTimer) {
      clearTimeout(scrollThrottleTimer);
      scrollThrottleTimer = null;
    }
  }

  // document click 이벤트 바인딩 (외부 클릭 시 패널 닫기)
  function bindDocumentClick() {
    if (isDocumentClickBound) return;
    isDocumentClickBound = true;
    $(document).on('click' + EVENT_NS, function (e) {
      cleanupDisconnectedScopes();

      if (activeScopes.length === 0) {
        unbindDocumentClick();
        return;
      }

      var $target = $(e.target);
      if (!$target.closest(SELECTOR.PANEL).length && !$target.closest(SELECTOR.RECENT).length) {
        closeAllPanels();
      }
    });
  }

  // document click 이벤트 해제
  function unbindDocumentClick() {
    if (!isDocumentClickBound) return;
    isDocumentClickBound = false;
    $(document).off('click' + EVENT_NS);
  }

  window.UI.floating = {
    // 초기화: 모든 스코프 바인딩
    init: function () {
      cleanupDisconnectedScopes();

      $(SELECTOR.SCOPE).each(function () {
        bindScope($(this));
      });

      if (activeScopes.length > 0) {
        bindDocumentClick();
      } else {
        unbindDocumentClick();
      }

      if (hasTopButtonScope()) {
        bindWindowScroll();
      } else {
        unbindWindowScroll();
      }
    },

    // 갱신: 특정 스코프 또는 전체 재스캔
    refresh: function ($scope) {
      cleanupDisconnectedScopes();

      if ($scope) {
        bindScope($scope);
      } else {
        $(SELECTOR.SCOPE).each(function () {
          bindScope($(this));
        });
      }

      if (activeScopes.length > 0) {
        bindDocumentClick();
      } else {
        unbindDocumentClick();
      }

      if (hasTopButtonScope()) {
        bindWindowScroll();
      } else {
        unbindWindowScroll();
      }
    },

    // 해제: 특정 스코프 또는 전체 정리
    destroy: function ($scope) {
      if ($scope) {
        unbindScope($scope);
      } else {
        while (activeScopes.length) {
          unbindScope(activeScopes[0]);
        }
      }

      if (activeScopes.length === 0) {
        unbindDocumentClick();
      }

      if (!hasTopButtonScope()) {
        unbindWindowScroll();
      }
    }
  };
})(window.jQuery, window);
