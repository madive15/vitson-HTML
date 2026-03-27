/**
 * @file scroll-overflow-gradient.js
 * @description 수평 스크롤 영역 오버플로우 시 우측 그라데이션 표시
 * @scope [data-scroll-overflow-gradient]
 * @option data-scroll-target {selector} 스크롤 대상 하위 요소 (생략 시 자기 자신)
 * @state .is-overflow — 스크롤 가능하고 끝에 도달하지 않은 상태
 * @note 그라데이션은 CSS ::after로 처리, 이 모듈은 클래스 토글만 담당
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  var DATA_KEY = 'scrollOverflowGradient';
  var THRESHOLD = 2;

  var Selector = {
    SCOPE: '[data-scroll-overflow-gradient]'
  };

  var ClassName = {
    OVERFLOW: 'is-overflow'
  };

  function init(el) {
    var $scope = $(el);
    if ($scope.data(DATA_KEY)) return;

    // 스크롤 대상 결정 — data-scroll-target 있으면 하위 요소, 없으면 자기 자신
    var targetSelector = $scope.attr('data-scroll-target');
    var $scrollEl = targetSelector ? $scope.find(targetSelector) : $scope;
    var scrollEl = $scrollEl[0];

    if (!scrollEl) return;

    // 인스턴스별 네임스페이스 (jQuery UI 미의존)
    var ns = DATA_KEY + '.' + Math.random().toString(36).slice(2, 8);

    // 스크롤 가능 여부 + 끝 도달 여부로 클래스 토글
    function update() {
      var hasOverflow = scrollEl.scrollWidth > scrollEl.clientWidth;
      var atEnd = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - THRESHOLD;

      $scope.toggleClass(ClassName.OVERFLOW, hasOverflow && !atEnd);
    }

    // scrollEl 내부 콘텐츠 크기 변화 감시 (비동기 데이터 로딩 대응)
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      // scrollEl 자체 + 첫 번째 자식(콘텐츠 래퍼) 감시
      ro.observe(scrollEl);
      if (scrollEl.firstElementChild) {
        ro.observe(scrollEl.firstElementChild);
      }
    }

    // 자식 요소 동적 추가/제거 감시 (비동기 데이터 렌더링 대응)
    var mo = new MutationObserver(function () {
      update();
      // 새로 생긴 첫 번째 자식을 ResizeObserver에 등록
      if (ro && scrollEl.firstElementChild && !scrollEl.firstElementChild._roObserved) {
        ro.observe(scrollEl.firstElementChild);
        scrollEl.firstElementChild._roObserved = true;
      }
    });
    mo.observe(scrollEl, {childList: true});

    $scrollEl.on('scroll.' + ns, update);
    $(window).on('resize.' + ns, update);

    // 초기 상태 반영
    update();

    var instance = {
      update: update,
      destroy: function () {
        $scrollEl.off('scroll.' + ns);
        $(window).off('resize.' + ns);

        if (ro) {
          ro.disconnect();
          ro = null;
        }

        if (mo) {
          mo.disconnect();
          mo = null;
        }

        $scope.removeClass(ClassName.OVERFLOW);
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

  window.scrollOverflowGradient = {
    init: init,
    initAll: initAll,
    getInstance: getInstance
  };

  $(function () {
    initAll();
  });
})(window);
