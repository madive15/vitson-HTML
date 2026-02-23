/**
 * @file scroll-buttons.js
 * @description 수평 스크롤 버튼 그룹 — 활성 버튼 자동 스크롤 및 상태 관리
 * @scope [data-scroll-buttons]
 * @option data-peek {number} 잘린 버튼 노출 여백 (기본 40px)
 * @state .is-active — 선택된 버튼
 * @events scrollbuttons:change — 버튼 변경 시 발생, detail: {$btn}
 * @note SKIP 셀렉터([data-range-picker-toggle])는 preventDefault 제외
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  var DATA_KEY = 'scrollButtons';
  var TOUCH_SUPPORTED = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var clickEvent = TOUCH_SUPPORTED ? 'touchend' : 'click';

  var Selector = {
    SCOPE: '[data-scroll-buttons]',
    BTN: 'button',
    SKIP: '[data-range-picker-toggle]'
  };

  var ClassName = {
    ACTIVE: 'is-active'
  };

  function init(el) {
    var $scope = $(el);
    if ($scope.data(DATA_KEY)) return;

    var peek = parseInt($scope.attr('data-peek') || 40, 10);
    var $btns = $scope.find(Selector.BTN);
    var handlers = [];

    // 활성 버튼이 보이도록 스크롤 위치 보정
    function scrollToBtn($btn) {
      var wrap = $scope[0];
      var btn = $btn[0];
      var btnLeft = btn.offsetLeft;
      var btnRight = btnLeft + btn.offsetWidth;
      var wrapLeft = wrap.scrollLeft;
      var wrapRight = wrapLeft + wrap.offsetWidth;

      if (btn === $btns.last()[0]) {
        // 마지막 버튼은 끝까지
        $scope.animate({scrollLeft: wrap.scrollWidth}, 200);
      } else if (btn === $btns.first()[0]) {
        // 첫 번째 버튼은 처음으로
        $scope.animate({scrollLeft: 0}, 200);
      } else if (btnLeft < wrapLeft) {
        // 왼쪽으로 잘린 경우
        $scope.animate({scrollLeft: btnLeft - peek}, 200);
      } else if (btnRight > wrapRight) {
        // 오른쪽으로 잘린 경우
        $scope.animate({scrollLeft: btnRight - wrap.offsetWidth + peek}, 200);
      }
    }

    // 버튼 활성 상태 전환 및 이벤트 발행
    function setActive($btn) {
      $btns.removeClass(ClassName.ACTIVE);
      $btn.addClass(ClassName.ACTIVE);
      scrollToBtn($btn);
      $scope.trigger('scrollbuttons:change', [{$btn: $btn}]);
    }

    // 터치 스크롤과 탭을 구분하는 핸들러 생성
    function createHandler(btn) {
      var isSkip = $(btn).is(Selector.SKIP);
      var touchStartX = 0;
      var moved = false;

      btn.addEventListener(
        'touchstart',
        function (e) {
          touchStartX = e.touches[0].clientX;
          moved = false;
        },
        {passive: true}
      );

      btn.addEventListener(
        'touchmove',
        function (e) {
          if (Math.abs(e.touches[0].clientX - touchStartX) > 5) {
            moved = true;
          }
        },
        {passive: true}
      );

      return function (e) {
        // 수평 스크롤 중 touchend 무시
        if (moved) return;
        if (!isSkip) {
          e.preventDefault();
        }
        setActive($(btn));
      };
    }

    // 모든 버튼 바인딩 — SKIP 대상은 preventDefault 제외
    $btns.each(function () {
      var handler = createHandler(this);
      this.addEventListener(clickEvent, handler, {passive: false});
      handlers.push({el: this, handler: handler});
    });

    var instance = {
      setActive: setActive,
      destroy: function () {
        handlers.forEach(function (item) {
          item.el.removeEventListener(clickEvent, item.handler);
        });
        handlers = [];
        $scope.removeData(DATA_KEY);
      }
    };

    $scope.data(DATA_KEY, instance);
  }

  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find(Selector.SCOPE).each(function () {
      init(this);
    });
  }

  function getInstance(selector) {
    return $(selector).data(DATA_KEY) || null;
  }

  window.scrollButtons = {
    init: init,
    initAll: initAll,
    getInstance: getInstance
  };

  $(function () {
    initAll();
  });
})(window);
