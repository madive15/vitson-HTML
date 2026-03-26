/**
 * @file scripts-mo/ui/kendo/kendo-window.js
 * @description 모바일 Kendo Window 초기화 모듈
 * @variant 'bottomsheet' — 하단에서 슬라이드 업 (CSS 애니메이션)
 * @variant 'slide-right' — 오른쪽에서 슬라이드 인 (풀스크린)
 * @variant 'slide-left'  — 왼쪽에서 슬라이드 인 (풀스크린)
 *
 * VmKendoWindow.open('myWindow');
 * VmKendoWindow.close('myWindow');
 * VmKendoWindow.refresh('myWindow');
 * VmKendoWindow.initAll();
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiKendoWindow';
  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var DEBOUNCE_DELAY = 80;
  var ANIMATION_TIMEOUT = 500;

  var savedScrollTop = 0;
  var openedWindows = [];
  var contentObservers = {};
  var debounceTimers = {};

  // vm-content-wrap 내부 스크롤 구조에서는 body fixed 불필요
  // 스크롤 위치만 저장하고 overflow 잠금
  function lockBody() {
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;

    var $scroll = $('.vm-content-wrap');
    savedScrollTop = $scroll.length ? $scroll[0].scrollTop : 0;

    $('body').addClass(BODY_LOCK_CLASS);
    $scroll.css('overflow-y', 'hidden');
  }

  function unlockBody() {
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;

    var $scroll = $('.vm-content-wrap');

    $('body').removeClass(BODY_LOCK_CLASS);
    $scroll.css('overflow-y', '');

    // 스크롤 위치 복원
    if ($scroll.length) {
      $scroll[0].scrollTop = savedScrollTop;
    }
  }

  function checkScroll(id) {
    var $el = $('#' + id);

    $el.find('[data-scroll-check]').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }

  // collapse 높이 모드 재판별
  function refreshCollapse(id) {
    if (window.UI && window.UI.collapse && window.UI.collapse.refresh) {
      window.UI.collapse.refresh('#' + id);
    }
  }

  function refresh(id) {
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;

      checkScroll(id);

      var $kw = $el.closest('.k-window');
      if (!$kw.hasClass('is-bottomsheet') && !$kw.hasClass('is-slideright') && !$kw.hasClass('is-slideleft')) {
        inst.center();
      }
    }, DEBOUNCE_DELAY);
  }

  function observeContent(id) {
    if (!window.MutationObserver) return;
    if (contentObservers[id]) return;

    var $el = $('#' + id);
    var $content = $el.find('.vm-modal-content');
    if (!$content.length) return;

    var obs = new MutationObserver(function () {
      refresh(id);
    });

    obs.observe($content[0], {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });

    contentObservers[id] = obs;
  }

  function disconnectContent(id) {
    if (contentObservers[id]) {
      contentObservers[id].disconnect();
      delete contentObservers[id];
    }

    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  // 슬라이드 닫힘 애니메이션 + 안전장치
  function closeWithAnimation($kw, inst) {
    $kw.addClass('is-closing');
    var closed = false;

    function done() {
      if (closed) return;
      closed = true;
      $kw.removeClass('is-closing');
      inst.close();
    }

    $kw.one('animationend', done);
    setTimeout(done, ANIMATION_TIMEOUT);
  }

  function initOne(el) {
    var $el = $(el);

    if ($el.data('kendoWindow')) return;

    var id = $el.attr('id');
    var variant = $el.attr('data-variant');
    var isBottom = variant === 'bottomsheet';
    var isSlide = variant === 'slide-right' || variant === 'slide-left';
    var isSlideLeft = variant === 'slide-left';
    var noAnimation = isBottom || isSlide;

    var opts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      animation: noAnimation ? false : undefined,
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
        $(document).trigger('kendo:open', [id]);
      },
      close: function () {
        disconnectContent(id);

        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }

        // 닫힘 이벤트 발행
        $(document).trigger('kendo:close', [id]);
      }
    };

    $el.kendoWindow(opts);

    var $kw = $el.closest('.k-window');

    if (isBottom) {
      $kw.addClass('is-bottomsheet');
    }

    if (isSlide) {
      $kw.addClass(isSlideLeft ? 'is-slideleft' : 'is-slideright');
    }
  }

  function initAll(root) {
    var $root = root ? $(root) : $(document);

    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }

  // open 함수 밖 (모듈 스코프)
  function playOpenAnimation($kw, id) {
    $kw.addClass('is-opening');
    var done = false;

    var onEnd = function () {
      if (done) return;
      done = true;
      $kw.removeClass('is-opening');
      refreshCollapse(id);
    };

    $kw.one('animationend', onEnd);
    setTimeout(onEnd, ANIMATION_TIMEOUT);
  }

  function open(id) {
    var $el = $('#' + id);
    if (!$el.length) return;

    var inst = $el.data('kendoWindow');

    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }

    if (inst) {
      var $kw = $el.closest('.k-window');
      var isBottom = $kw.hasClass('is-bottomsheet');
      var isSlide = $kw.hasClass('is-slideright') || $kw.hasClass('is-slideleft');

      if (!isBottom && !isSlide) inst.center();

      inst.open();

      // 바텀시트: 하단 고정 + 슬라이드 업
      if (isBottom) {
        $kw.css({
          top: 'auto',
          left: '0',
          bottom: '0',
          width: '100%',
          position: 'fixed'
        });

        playOpenAnimation($kw, id);
      }

      // 슬라이드: 풀스크린 + 스택 z-index
      if (isSlide) {
        // 열린 슬라이드 중 최상위 z-index 산출
        var maxZ = 10010;
        openedWindows.forEach(function (winId) {
          if (winId === id) return;
          var $w = $('#' + winId).closest('.k-window');
          if ($w.hasClass('is-slideright') || $w.hasClass('is-slideleft')) {
            var z = parseInt($w.css('z-index'), 10) || 0;
            if (z >= maxZ) maxZ = z + 1;
          }
        });

        $kw.css({
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100%',
          height: '100%',
          position: 'fixed'
        });
        $kw[0].style.setProperty('z-index', String(maxZ), 'important');

        playOpenAnimation($kw, id);
      }

      // 렌더 후 스크롤 체크 (다음 프레임)
      setTimeout(function () {
        checkScroll(id);
      }, 0);
    }
  }

  function close(id) {
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');

    if (inst) {
      var $kw = $el.closest('.k-window');
      var isSlide = $kw.hasClass('is-slideright') || $kw.hasClass('is-slideleft');
      var isBottom = $kw.hasClass('is-bottomsheet');

      $el.find('.vm-modal-content').removeClass('has-scroll');

      // 슬라이드만 애니메이션 후 close
      if (isSlide || isBottom) {
        closeWithAnimation($kw, inst);
        return;
      }

      inst.close();
    }
  }

  // dimClose 옵션으로 딤 클릭 닫기 제어
  $(document).on('click' + NS, '.k-overlay', function () {
    var ids = openedWindows.slice();

    // 최상위가 슬라이드인지 판별
    var topId = ids[ids.length - 1];
    var $topW = topId ? $('#' + topId).closest('.k-window') : $();
    var isTopSlide = $topW.hasClass('is-slideright') || $topW.hasClass('is-slideleft');

    if (isTopSlide) {
      // 슬라이드: 최상위 하나만 닫기
      if ($('#' + topId).attr('data-dim-close') !== 'false') {
        close(topId);
      }
    } else {
      // 기존 동작 (슬라이드는 제외)
      ids.forEach(function (winId) {
        if ($('#' + winId).attr('data-dim-close') === 'false') return;
        var $w = $('#' + winId).closest('.k-window');
        if ($w.hasClass('is-slideright') || $w.hasClass('is-slideleft')) return;
        close(winId);
      });
    }
  });

  window.VmKendoWindow = {
    initAll: initAll,
    open: open,
    close: close,
    refresh: refresh
  };
})(window.jQuery, window);
