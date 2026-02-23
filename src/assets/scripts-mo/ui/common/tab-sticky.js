/**
 * @file scripts-mo/ui/common/tab-sticky.js
 * @description 스크롤 연동 탭 active 전환 (CSS sticky, JS는 active + 클릭 스크롤만)
 * @scope [data-ui="tab-sticky"]
 * @mapping data-tab="nav" 탭 네비, data-tab="bar" 언더바, data-tab-target 탭 버튼, data-tab-section 섹션
 * @state .is-active — 현재 활성 탭 버튼
 * @a11y aria-label 탭 네비, aria-hidden 언더바
 * @events click(탭 버튼), scroll/resize/orientationchange(window)
 * @note CSS sticky 기반, baseline 판정 + 마지막 섹션 뷰포트 중간선 보정
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiTabSticky';
  var DATA_KEY = 'tabSticky';
  var ROOT = '[data-ui="tab-sticky"]';
  var NAV = '[data-tab="nav"]';
  var BAR = '[data-tab="bar"]';
  var BTN = '[data-tab-target]';
  var SECTION = '[data-tab-section]';

  var CLS = {active: 'is-active'};
  var DEFAULTS = {gap: 0};

  function getNavH(state) {
    return state.$nav.outerHeight() || 0;
  }

  // 기준선 — CSS sticky top + nav 높이
  function getBaseline(state) {
    return state.stickyTop + getNavH(state) + state.opt.gap;
  }

  function updateBar(state) {
    var $active = state.$tabs.filter('.' + CLS.active);
    if (!$active.length) {
      state.$bar.css({opacity: 0, width: 0});
      return;
    }
    var nav = state.$nav[0];
    var navLeft = nav.getBoundingClientRect().left;
    var aRect = $active[0].getBoundingClientRect();
    state.$bar.css({
      opacity: 1,
      width: aRect.width,
      transform: 'translateX(' + (aRect.left - navLeft + nav.scrollLeft) + 'px)'
    });
  }

  // 활성 탭이 nav 밖으로 잘릴 때 보이도록 스크롤
  function scrollActiveIntoView(state) {
    var $active = state.$tabs.filter('.' + CLS.active);
    if (!$active.length) return;

    var nav = state.$nav[0];
    var btn = $active[0];
    var btnLeft = btn.offsetLeft;
    var btnRight = btnLeft + btn.offsetWidth;
    var navScroll = nav.scrollLeft;
    var navVisible = nav.offsetWidth;

    if (btnLeft < navScroll) {
      // 왼쪽으로 잘림
      nav.scrollTo({left: btnLeft, behavior: 'smooth'});
    } else if (btnRight > navScroll + navVisible) {
      // 오른쪽으로 잘림
      nav.scrollTo({left: btnRight - navVisible, behavior: 'smooth'});
    }
  }

  function setActive(state, id) {
    state.$tabs.each(function () {
      $(this).toggleClass(CLS.active, $(this).data('tab-target') === id);
    });
    updateBar(state);
    scrollActiveIntoView(state);
  }

  function updateActiveByScroll(state) {
    // 클릭 이동 직후 보호
    if (state.clickLock) return;

    var baseline = getBaseline(state);
    var winH = $(window).height();
    var len = state.$sections.length;

    // 마지막 섹션 먼저 — 90% 이상 보이면 활성화
    var lastEl = state.$sections.last()[0];
    var lastRect = lastEl.getBoundingClientRect();
    var lastH = lastRect.height || 1;
    var lastVisTop = Math.max(lastRect.top, 0);
    var lastVisBottom = Math.min(lastRect.bottom, winH);
    var lastVisH = Math.max(lastVisBottom - lastVisTop, 0);

    if (lastVisH / lastH >= 0.9) {
      setActive(state, state.$sections.last().data('tab-section'));
      return;
    }

    // 나머지 섹션
    var activeId = state.$sections.first().data('tab-section');

    for (var i = 0; i < len - 1; i++) {
      var el = state.$sections[i];
      var rect = el.getBoundingClientRect();
      var id = $(el).data('tab-section');
      var sectionH = rect.height || 1;
      var scrolled = baseline - rect.top;
      var scrolledRatio = scrolled / sectionH;

      if (scrolledRatio < 0) break;

      if (scrolledRatio >= 0.7 && i + 1 < len) {
        // 다음 섹션이 뷰포트 상단 2/3 지점 이상 들어와야 전환
        var nextRect = state.$sections[i + 1].getBoundingClientRect();
        if (nextRect.top < winH * 0.66) {
          activeId = $(state.$sections[i + 1]).data('tab-section');
        } else {
          activeId = id;
          break;
        }
      } else {
        activeId = id;
        break;
      }
    }

    setActive(state, activeId);
  }

  function scrollToSection($root, state, targetId) {
    var $target = $root.find('[data-tab-section="' + targetId + '"]');
    if (!$target.length) return;

    var baseline = getBaseline(state);
    var sectionTop = $target[0].getBoundingClientRect().top + window.pageYOffset;
    var targetY = Math.max(sectionTop - baseline, 0);

    // 클릭 보호
    state.clickLock = true;

    window.scrollTo({top: targetY, behavior: 'auto'});
    setActive(state, targetId);

    setTimeout(function () {
      state.clickLock = false;
    }, 200);
  }

  function bind($root, state) {
    var ticking = false;

    // nav 가로 스크롤 시 언더바 위치 보정
    state.$nav.on('scroll' + NS, function () {
      updateBar(state);
    });

    $root.on('click' + NS, BTN, function () {
      scrollToSection($root, state, $(this).data('tab-target'));
    });

    $(window).on('scroll' + NS, function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateActiveByScroll(state);
        ticking = false;
      });
    });

    $(window).on('resize' + NS, function () {
      updateBar(state);
    });

    $(window).on('orientationchange' + NS, function () {
      setTimeout(function () {
        updateBar(state);
      }, 300);
    });

    if (window.visualViewport) {
      $(window.visualViewport).on('resize' + NS, function () {
        updateBar(state);
      });
    }
  }

  function init(scope, options) {
    var $root = $(scope || ROOT);
    if (!$root.length || $root.data(DATA_KEY)) return;

    var opt = $.extend({}, DEFAULTS, options);
    var $nav = $root.find(NAV);
    var $bar = $root.find(BAR);
    var $tabs = $root.find(BTN);
    var $sections = $root.find(SECTION);

    if (!$nav.length || !$tabs.length || !$sections.length) return;

    // CSS sticky top 값 읽기
    var rawTop = $nav.css('top');
    var stickyTop = rawTop === 'auto' ? 0 : parseInt(rawTop, 10) || 0;

    var state = {
      opt: opt,
      stickyTop: stickyTop,
      clickLock: false,
      $nav: $nav,
      $bar: $bar,
      $tabs: $tabs,
      $sections: $sections
    };

    $root.data(DATA_KEY, state);

    bind($root, state);
    updateActiveByScroll(state);
  }

  function destroy(scope) {
    var $root = $(scope || ROOT);
    var state = $root.data(DATA_KEY);
    if (!state) return;

    $root.off(NS);
    $(window).off(NS);
    if (window.visualViewport) {
      $(window.visualViewport).off(NS);
    }

    state.$tabs.removeClass(CLS.active);
    $root.removeData(DATA_KEY);
  }

  window.UI.tabSticky = {
    init: init,
    destroy: destroy,
    goTo: function (scope, targetId) {
      var $root = $(scope || ROOT);
      var state = $root.data(DATA_KEY);
      if (state) scrollToSection($root, state, targetId);
    },
    getActive: function (scope) {
      var $root = $(scope || ROOT);
      var state = $root.data(DATA_KEY);
      if (!state) return null;
      var $active = state.$tabs.filter('.' + CLS.active);
      return $active.length ? $active.data('tab-target') : null;
    }
  };
})(window.jQuery, window);
