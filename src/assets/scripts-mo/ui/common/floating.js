/**
 * @file scripts-mo/ui/common/floating.js
 * @description 모바일 플로팅 TOP 버튼
 * @scope [data-floating-scope]
 * @mapping .vm-content-wrap (내부 스크롤 컨테이너)
 * @state is-visible: TOP 버튼 표시
 * @a11y aria-label="위로 이동" (마크업 측 명시)
 * @note
 *  - 스크롤 대상: .vm-content-wrap (body scroll 아님)
 *  - init(): 멱등성 보장
 *  - destroy(): DOM 제거 전 호출 권장 (미호출 시 자동 cleanup)
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var STATE = {
    VISIBLE: 'is-visible'
  };

  var SELECTOR = {
    SCOPE: '[data-floating-scope]',
    TOP: '[data-floating-top]',
    SCROLL_CONTAINER: '.vm-content-wrap'
  };

  var DATA_KEY = {
    BOUND: 'moFloatingBound'
  };

  var INTERNAL = {
    THROTTLE_DELAY: 100,
    TOP_THRESHOLD: 100,
    TOP_SCROLL_DURATION: 300
  };

  var EVENT_NS = '.uiMoFloating';

  var activeScopes = [];
  var $scrollContainer = null;
  var isScrollBound = false;
  var scrollThrottleTimer = null;

  // 스코프가 DOM에 연결되어 있는지 확인
  function isConnected($el) {
    if (!$el || !$el[0]) return false;
    return $.contains(document.documentElement, $el[0]);
  }

  // activeScopes에서 인덱스 찾기
  function findScopeIndex($scope) {
    var el = $scope[0];
    for (var i = 0; i < activeScopes.length; i++) {
      if (activeScopes[i].$scope[0] === el) return i;
    }
    return -1;
  }

  // activeScopes에 추가 (중복 방지)
  function addScope($scope, $top) {
    if (findScopeIndex($scope) === -1) {
      activeScopes.push({$scope: $scope, $top: $top});
    }
  }

  // activeScopes에서 제거
  function removeScope($scope) {
    var idx = findScopeIndex($scope);
    if (idx !== -1) {
      activeScopes.splice(idx, 1);
    }
  }

  // DOM 분리된 스코프 정리
  function cleanupDisconnected() {
    for (var i = activeScopes.length - 1; i >= 0; i--) {
      if (!isConnected(activeScopes[i].$scope)) {
        activeScopes[i].$scope.removeData(DATA_KEY.BOUND);
        activeScopes.splice(i, 1);
      }
    }
  }

  // 스크롤 컨테이너 캐싱
  function getScrollContainer() {
    if (!$scrollContainer || !$scrollContainer.length || !isConnected($scrollContainer)) {
      // 검색 오버레이(.vm-search-overlay) 내부 컨테이너 제외
      $scrollContainer = $(SELECTOR.SCROLL_CONTAINER)
        .not(function () {
          return this.closest('.vm-search-overlay');
        })
        .first();
    }
    return $scrollContainer;
  }

  // TOP 버튼 표시/숨김 갱신
  function updateTopState() {
    cleanupDisconnected();

    if (activeScopes.length === 0) {
      unbindScroll();
      return;
    }

    var $container = getScrollContainer();
    if (!$container.length) return;

    var scrollY = $container.scrollTop();
    var visible = scrollY > INTERNAL.TOP_THRESHOLD;

    for (var i = 0; i < activeScopes.length; i++) {
      activeScopes[i].$top.toggleClass(STATE.VISIBLE, visible);
    }
  }

  // throttle 처리된 스크롤 핸들러
  function throttledScrollHandler() {
    if (scrollThrottleTimer) return;
    scrollThrottleTimer = setTimeout(function () {
      updateTopState();
      scrollThrottleTimer = null;
    }, INTERNAL.THROTTLE_DELAY);
  }

  // 스크롤 이벤트 바인딩
  function bindScroll() {
    if (isScrollBound) return;

    var $container = getScrollContainer();
    if (!$container.length) return;

    isScrollBound = true;
    $container.on('scroll' + EVENT_NS, throttledScrollHandler);
  }

  // 스크롤 이벤트 해제
  function unbindScroll() {
    if (!isScrollBound) return;
    isScrollBound = false;

    var $container = getScrollContainer();
    if ($container.length) {
      $container.off('scroll' + EVENT_NS);
    }

    if (scrollThrottleTimer) {
      clearTimeout(scrollThrottleTimer);
      scrollThrottleTimer = null;
    }
  }

  // 최상단 스크롤
  function scrollToTop() {
    var $container = getScrollContainer();
    if (!$container.length) return;
    $container.animate({scrollTop: 0}, INTERNAL.TOP_SCROLL_DURATION);
  }

  // 스코프 바인딩
  function bindScope($scope) {
    if (!isConnected($scope)) return;

    var $top = $scope.find(SELECTOR.TOP);
    if (!$top.length) return;

    // 이미 바인딩된 스코프면 activeScopes만 갱신
    if ($scope.data(DATA_KEY.BOUND)) {
      addScope($scope, $top);
      return;
    }

    $scope.data(DATA_KEY.BOUND, true);

    // TOP 버튼 클릭
    $scope.on('click' + EVENT_NS, SELECTOR.TOP, function (e) {
      e.preventDefault();
      scrollToTop();
    });

    addScope($scope, $top);
  }

  // 스코프 해제
  function unbindScope($scope) {
    $scope.off(EVENT_NS);
    $scope.removeData(DATA_KEY.BOUND);
    removeScope($scope);
  }

  window.UI.floating = {
    // 초기화
    init: function () {
      cleanupDisconnected();

      $(SELECTOR.SCOPE).each(function () {
        bindScope($(this));
      });

      if (activeScopes.length > 0) {
        bindScroll();
        // 초기 상태 반영
        updateTopState();
      } else {
        unbindScroll();
      }
    },

    // 갱신
    refresh: function ($scope) {
      cleanupDisconnected();

      if ($scope) {
        bindScope($scope);
      } else {
        $(SELECTOR.SCOPE).each(function () {
          bindScope($(this));
        });
      }

      if (activeScopes.length > 0) {
        bindScroll();
        updateTopState();
      } else {
        unbindScroll();
      }
    },

    // 해제
    destroy: function ($scope) {
      if ($scope) {
        unbindScope($scope);
      } else {
        while (activeScopes.length) {
          unbindScope(activeScopes[0].$scope);
        }
      }

      if (activeScopes.length === 0) {
        unbindScroll();
        $scrollContainer = null;
      }
    }
  };
})(window.jQuery, window);
