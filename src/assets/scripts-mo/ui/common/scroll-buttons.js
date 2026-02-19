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
        // 왼쪽으로 잘린 경우만 이동
        $scope.animate({scrollLeft: btnLeft - peek}, 200);
      } else if (btnRight > wrapRight) {
        // 오른쪽으로 잘린 경우만 이동
        $scope.animate({scrollLeft: btnRight - wrap.offsetWidth + peek}, 200);
      }
    }

    function setActive($btn) {
      $btns.removeClass(ClassName.ACTIVE);
      $btn.addClass(ClassName.ACTIVE);
      scrollToBtn($btn);
      $scope.trigger('scrollbuttons:change', [{$btn: $btn}]);
    }

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

    // 모든 버튼 바인딩 — datepicker 토글 버튼은 preventDefault 제외
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
