/**
 * @file scripts/ui/floating.js
 * @purpose 플로팅 최근 본 상품 + TOP 버튼
 * @description
 *  - 스코프: [data-floating-scope] 내부에서만 동작
 *  - 매핑: [data-floating-prev], [data-floating-next] → [data-floating-list]
 *  - 상태: is-scrollable(4개 이상), is-disabled(처음/마지막)
 * @option
 *  - data-floating-visible="3" : 한 번에 보이는 개수(기본 3)
 *  - data-floating-item-height="68" : 아이템 높이 + gap(기본 68)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[floating] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var STATE = {
    DISABLED: 'is-disabled',
    SCROLLABLE: 'is-scrollable'
  };

  var SELECTOR = {
    SCOPE: '[data-floating-scope]',
    RECENT: '[data-floating-recent]',
    LIST: '[data-floating-list]',
    ITEM: '[data-floating-item]',
    PREV: '[data-floating-prev]',
    NEXT: '[data-floating-next]',
    TOP: '[data-floating-top]'
  };

  var DATA_KEY = {
    INDEX: 'floatingIndex',
    BOUND: 'floatingBound'
  };

  var EVENT_NS = '.uiFloating';

  // 스코프에서 설정값 추출
  function getConfig($scope) {
    return {
      visibleCount: $scope.data('floatingVisible') || 3,
      itemHeight: $scope.data('floatingItemHeight') || 68
    };
  }

  // 현재 상태 조회
  function getState($scope, config) {
    var totalItems = $scope.find(SELECTOR.ITEM).length;
    var currentIndex = $scope.data(DATA_KEY.INDEX) || 0;
    var maxIndex = Math.max(0, totalItems - config.visibleCount);

    return {
      currentIndex: currentIndex,
      totalItems: totalItems,
      maxIndex: maxIndex,
      isScrollable: totalItems > config.visibleCount
    };
  }

  // 리스트 위치 이동
  function updatePosition($scope, currentIndex, itemHeight) {
    var $list = $scope.find(SELECTOR.LIST);
    if (!$list.length) return;

    var translateY = currentIndex * itemHeight;
    $list.css('transform', 'translateY(-' + translateY + 'px)');
  }

  // 화살표 상태 갱신
  function updateArrowState($scope, currentIndex, maxIndex) {
    var $prev = $scope.find(SELECTOR.PREV);
    var $next = $scope.find(SELECTOR.NEXT);
    var isPrevDisabled = currentIndex === 0;
    var isNextDisabled = currentIndex >= maxIndex;

    if ($prev.length) {
      $prev.toggleClass(STATE.DISABLED, isPrevDisabled).attr('aria-disabled', isPrevDisabled);
    }

    if ($next.length) {
      $next.toggleClass(STATE.DISABLED, isNextDisabled).attr('aria-disabled', isNextDisabled);
    }
  }

  // 이동 처리
  function move($scope, direction) {
    var config = getConfig($scope);
    var state = getState($scope, config);
    var newIndex = state.currentIndex;

    if (direction === 'prev' && newIndex > 0) {
      newIndex--;
    } else if (direction === 'next' && newIndex < state.maxIndex) {
      newIndex++;
    }

    if (newIndex === state.currentIndex) return;

    $scope.data(DATA_KEY.INDEX, newIndex);

    updatePosition($scope, newIndex, config.itemHeight);
    updateArrowState($scope, newIndex, state.maxIndex);
  }

  // 페이지 상단 이동
  function scrollToTop() {
    $('html, body').animate({scrollTop: 0}, 300);
  }

  // 스코프 초기화
  function initScope($scope) {
    var config = getConfig($scope);
    var $recent = $scope.find(SELECTOR.RECENT);
    var totalItems = $scope.find(SELECTOR.ITEM).length;
    var maxIndex = Math.max(0, totalItems - config.visibleCount);
    var isScrollable = totalItems > config.visibleCount;

    $scope.data(DATA_KEY.INDEX, 0);

    if ($recent.length) {
      $recent.toggleClass(STATE.SCROLLABLE, isScrollable);
    }

    updatePosition($scope, 0, config.itemHeight);
    updateArrowState($scope, 0, maxIndex);
  }

  // 스코프 상태 초기화
  function resetScope($scope) {
    var $recent = $scope.find(SELECTOR.RECENT);
    var $list = $scope.find(SELECTOR.LIST);
    var $prev = $scope.find(SELECTOR.PREV);
    var $next = $scope.find(SELECTOR.NEXT);

    $scope.removeData(DATA_KEY.INDEX);
    $scope.removeData(DATA_KEY.BOUND);

    if ($recent.length) {
      $recent.removeClass(STATE.SCROLLABLE);
    }

    if ($list.length) {
      $list.css('transform', '');
    }

    if ($prev.length) {
      $prev.removeClass(STATE.DISABLED).removeAttr('aria-disabled');
    }

    if ($next.length) {
      $next.removeClass(STATE.DISABLED).removeAttr('aria-disabled');
    }
  }

  // 이벤트 바인딩
  function bindScope($scope) {
    if ($scope.data(DATA_KEY.BOUND)) return;
    $scope.data(DATA_KEY.BOUND, true);

    $scope.on('click' + EVENT_NS, SELECTOR.PREV, function (e) {
      e.preventDefault();
      if ($(this).hasClass(STATE.DISABLED)) return;
      move($scope, 'prev');
    });

    $scope.on('click' + EVENT_NS, SELECTOR.NEXT, function (e) {
      e.preventDefault();
      if ($(this).hasClass(STATE.DISABLED)) return;
      move($scope, 'next');
    });

    $scope.on('click' + EVENT_NS, SELECTOR.TOP, function (e) {
      e.preventDefault();
      scrollToTop();
    });
  }

  // 이벤트 해제
  function unbindScope($scope) {
    $scope.off(EVENT_NS);
  }

  window.UI.floating = {
    // 초기화
    init: function () {
      $(SELECTOR.SCOPE).each(function () {
        var $scope = $(this);
        initScope($scope);
        bindScope($scope);
      });
      console.log('[floating] init');
    },

    // 상태 갱신
    refresh: function ($scope) {
      if (!$scope) {
        $(SELECTOR.SCOPE).each(function () {
          initScope($(this));
        });
        return;
      }
      initScope($scope);
    },

    // 해제
    destroy: function ($scope) {
      if (!$scope) {
        $(SELECTOR.SCOPE).each(function () {
          var $s = $(this);
          unbindScope($s);
          resetScope($s);
        });
        return;
      }
      unbindScope($scope);
      resetScope($scope);
    }
  };

  console.log('[floating] module loaded');
})(window.jQuery || window.$, window);
