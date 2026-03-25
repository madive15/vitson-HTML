/**
 * @file kendo-window.js
 * @description Kendo Window 자동 초기화 모듈
 * @note 컨텐츠 DOM 변화 시 자동으로 스크롤 체크 + 센터 정렬
 *
 * VitsKendoWindow.open('myWindow');
 * VitsKendoWindow.close('myWindow');
 * VitsKendoWindow.refresh('myWindow');
 * VitsKendoWindow.initAll();
 */

(function (window) {
  'use strict';

  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var scrollY = 0;
  var openedWindows = [];

  // 컨텐츠 변화 감지용 Observer 저장 (id → observer)
  var contentObservers = {};

  // 디바운스 타이머 저장 (id → timerId)
  var debounceTimers = {};
  var DEBOUNCE_DELAY = 80;

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function lockBody() {
    var $ = window.jQuery;
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;

    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    scrollY = window.pageYOffset || 0;
    $('body')
      .addClass(BODY_LOCK_CLASS)
      .css({
        position: 'fixed',
        top: -scrollY + 'px',
        left: 0,
        right: 0,
        overflow: 'hidden',
        paddingRight: scrollbarWidth + 'px'
      });
  }

  function unlockBody() {
    var $ = window.jQuery;
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;

    $('body').removeClass(BODY_LOCK_CLASS).css({
      position: '',
      top: '',
      left: '',
      right: '',
      overflow: '',
      paddingRight: ''
    });
    window.scrollTo(0, scrollY);
  }

  function checkScroll(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);

    $el.find('[data-scroll-check], .vits-modal-content').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }

  /**
   * 스크롤 체크 + 센터 정렬 (디바운스 적용)
   * - 컨텐츠 DOM 변화, 수동 호출 모두 이 함수로 통일
   */
  function refresh(id) {
    var $ = window.jQuery;

    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;

      checkScroll(id);

      var $kWindow = $el.closest('.k-window');
      var prevTop = $kWindow.position().top;

      inst.center();

      var nextTop = $kWindow.position().top;

      if (prevTop === nextTop) return;

      // 이전 위치로 되돌린 뒤 다음 프레임에서 transition 이동
      $kWindow.css({
        top: prevTop,
        transition: 'none'
      });

      requestAnimationFrame(function () {
        $kWindow.css({
          top: nextTop,
          transition: 'top 0.2s ease'
        });

        $kWindow.one('transitionend', function () {
          $kWindow.css('transition', '');
        });
      });
    }, DEBOUNCE_DELAY);
  }

  /**
   * 컨텐츠 영역 MutationObserver 시작
   * - open 시 호출, close 시 해제
   */
  function observeContent(id) {
    if (!window.MutationObserver) return;
    if (contentObservers[id]) return; // 중복 방지

    var $ = window.jQuery;
    var $el = $('#' + id);
    var $content = $el.find('.vits-modal-content');
    if (!$content.length) return;

    var obs = new MutationObserver(function (mutations) {
      // 비밀번호 눈 토글(.vits-btn-eyes) 변경 시 center 재계산 방지
      var relevant = mutations.some(function (m) {
        return !m.target.closest('.vits-btn-eyes');
      });
      if (!relevant) return;

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

  /**
   * 컨텐츠 영역 MutationObserver 해제
   */
  function disconnectContent(id) {
    if (contentObservers[id]) {
      contentObservers[id].disconnect();
      delete contentObservers[id];
    }

    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  // 모달 스크롤 시 DatePicker 닫힘 방지 — 인스턴스 _blur/_resize 오버라이드
  function preventScrollClose(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);

    $el.find('[data-role="datepicker"]').each(function () {
      var $input = $(this);
      var dp = $input.data('kendoDatePicker');
      if (!dp || !dp.dateView || !dp.dateView.popup || $input.data('__dpScrollFixed')) return;

      var popup = dp.dateView.popup;

      // _blur 오버라이드 — 팝업 열려있으면 무시
      var origBlur = dp._blur;
      dp._blur = function () {
        if (popup.visible()) return;
        return origBlur.apply(dp, arguments);
      };

      // popup._resize 오버라이드 — 팝업 열려있으면 무시
      if (popup._resize) {
        var origResize = popup._resize;
        popup._resize = function () {
          if (popup.visible()) return;
          return origResize.apply(popup, arguments);
        };
      }

      // 닫힐 때 k-animation-container 숨김 — input 위 겹침 방지
      dp.bind('close', function () {
        setTimeout(function () {
          var $container = dp.dateView.div.closest('.k-animation-container');
          if ($container.length) {
            $container.css('display', 'none');
          }
        }, 0);
      });

      // 열릴 때 dropup 계산 — 아래 공간 부족 시 위로 열기
      dp.bind('open', function () {
        var $scrollParent = $input.closest('.vits-modal-content');
        if (!$scrollParent.length) return;

        var $dpWrapper = $input.closest('.vits-datepicker-single');
        if (!$dpWrapper.length) return;

        setTimeout(function () {
          var $animContainer = dp.dateView.div.closest('.k-animation-container');
          if (!$animContainer.length) return;

          // 깜빡임 방지 — 위치 계산 전 투명 처리
          $animContainer.css({opacity: '0', transition: 'none'});

          var calendarH = dp.dateView.div.outerHeight();
          if (!calendarH) {
            $animContainer.css({opacity: '', transition: ''});
            return;
          }

          var scrollRect = $scrollParent[0].getBoundingClientRect();
          var wrapperRect = $dpWrapper[0].getBoundingClientRect();

          var spaceBelow = scrollRect.bottom - wrapperRect.bottom;
          var spaceAbove = wrapperRect.top - scrollRect.top;

          if (spaceBelow < calendarH && spaceAbove > spaceBelow) {
            var hasAppendTo = dp.options.popup && dp.options.popup.appendTo;
            var newTop;
            var newLeft;

            if (hasAppendTo) {
              newTop = $dpWrapper[0].offsetTop - calendarH;
              newLeft = parseFloat($animContainer.css('left'));
            } else {
              newTop = wrapperRect.top + window.pageYOffset - calendarH;
              newLeft = wrapperRect.left + window.pageXOffset;
            }

            $animContainer[0].style.cssText =
              'display: block; position: absolute; top: ' +
              newTop +
              'px !important; left: ' +
              newLeft +
              'px; z-index: 10014;';
          }

          // 위치 확정 후 복원
          requestAnimationFrame(function () {
            $animContainer.css({opacity: '', transition: ''});
          });
        }, 0);
      });

      $input.data('__dpScrollFixed', true);
    });
  }

  function initOne(el) {
    var $ = window.jQuery;
    var $el = $(el);

    if ($el.data('kendoWindow')) return;

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var id = $el.attr('id');

    var defaultOpts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
      },
      close: function () {
        disconnectContent(id);

        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }
      }
    };

    var finalOpts = $.extend({}, defaultOpts, opts);

    // draggable: true면 헤더를 드래그 핸들로 자동 지정
    if (finalOpts.draggable === true) {
      finalOpts.draggable = {
        dragHandle: '.vits-modal-header'
      };
    }

    $el.kendoWindow(finalOpts);

    // draggable일 때 클래스 추가
    if (finalOpts.draggable) {
      $el.closest('.k-window').addClass('is-draggable');
    }
  }

  function initAll(root) {
    var $ = window.jQuery;
    var $root = root ? $(root) : $(document);

    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }

  function autoBindStart(container) {
    if (!window.MutationObserver) return null;

    var target = container || document.body;
    initAll(target);

    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (!node || node.nodeType !== 1) continue;
          initAll(node);
        }
      }
    });

    obs.observe(target, {childList: true, subtree: true});
    return obs;
  }

  function open(id, options) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    if (!$el.length) return;

    var inst = $el.data('kendoWindow');

    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }

    if (options && typeof options.onOpen === 'function') {
      inst.unbind('open').bind('open', function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
        options.onOpen.call(inst);
      });
    }

    if (inst) {
      inst.center().open();

      setTimeout(function () {
        checkScroll(id);
        preventScrollClose(id);
      }, 0);
    }
  }

  function close(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');

    if (inst) {
      $el.find('.vits-modal-content').removeClass('has-scroll');
      inst.close();
    }
  }

  // 리사이즈 시 열린 윈도우 중앙 재정렬 + 스크롤 체크
  window.jQuery(window).on('resize', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var inst = $('#' + id).data('kendoWindow');
      if (inst) {
        inst.center();
        checkScroll(id);
      }
    });
  });

  //  dimClose 옵션으로 딤 클릭 닫기 제어
  window.jQuery(document).on('click', '.k-overlay', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var $el = $('#' + id);
      if ($el.attr('data-dim-close') === 'false') return;

      var inst = $el.data('kendoWindow');
      if (inst) inst.close();
    });
  });

  window.VitsKendoWindow = {
    initAll: initAll,
    autoBindStart: autoBindStart,
    open: open,
    close: close,
    refresh: refresh
  };
})(window);
