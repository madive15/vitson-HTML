/**
 * @file scripts-mo/ui/product/bottom-product-bar.js
 * @description 상품 하단 고정 바 — 옵션 확장/접힘 + 드래그 닫기
 * @scope [data-ui="product-bar"]
 *
 * @mapping
 *   [data-bar-handle]  — 드래그 핸들
 *   [data-bar-option]  — 옵션 영역 (접힘/확장 대상)
 *   [data-bar-actions] — 하단 버튼 영역
 *   [data-bar-cart]    — 장바구니 담기
 *   [data-bar-buy]     — 바로구매
 *
 * @state
 *   is-open — 옵션 영역 열림
 *   is-dragging — 드래그 중
 *
 * @events
 *   product-bar:open  — 옵션 열림
 *   product-bar:close — 옵션 닫힘
 *   product-bar:cart  — 장바구니 담기
 *   product-bar:buy   — 바로구매
 *
 * @note Kendo Window 미사용
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiProductBar';
  var DRAG_THRESHOLD = 10;
  var CLOSE_RATIO = 0.3;
  var VELOCITY_THRESHOLD = 0.5;
  var TRANSITION_HEIGHT = 'height 0.3s ease';
  var TRANSITION_DELAY = 300;

  var uid = 0;
  var instances = {};

  // CSS 전환 트리거용 리플로우
  function forceReflow(el) {
    return el.offsetHeight;
  }

  // 터치/마우스 이벤트에서 좌표 추출
  function getClientY(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
    return e.clientY;
  }

  function init(el) {
    var $root = typeof el === 'string' ? $('#' + el) : $(el);
    if (!$root.length) return;

    var id = $root.attr('id');
    if (!id) {
      id = 'product-bar-' + ++uid;
      $root.attr('id', id);
    }

    if (instances[id]) return;

    var $handle = $root.find('[data-bar-handle]');
    var $option = $root.find('[data-bar-option]');
    var $cartBtn = $root.find('[data-bar-cart]');
    var $buyBtn = $root.find('[data-bar-buy]');
    var $inner = $option.find('.bar-option-inner');
    var handleEl = $handle[0];

    var state = {
      isOpen: $root.hasClass('is-open'),
      isDragging: false,
      startY: 0,
      currentY: 0,
      startTime: 0,
      optionHeight: 0,
      timerId: null
    };

    // 진행 중 타이머 정리
    function clearPendingTimer() {
      if (state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
    }

    // 접근성 상태 갱신
    function updateExpanded(isOpen) {
      $handle.attr({
        'aria-expanded': String(isOpen),
        'aria-label': isOpen ? '옵션 영역 닫기' : '옵션 영역 열기'
      });
    }

    // 옵션 열기
    function open() {
      if (state.isOpen) return;
      clearPendingTimer();

      $option.css('display', 'block');
      state.optionHeight = $option[0].scrollHeight;

      $option.css({
        height: 0,
        overflow: 'hidden',
        transition: TRANSITION_HEIGHT
      });

      forceReflow($option[0]);
      $option.css('height', state.optionHeight + 'px');

      state.isOpen = true;
      $root.addClass('is-open');
      updateExpanded(true);
      $root.trigger('product-bar:open');

      state.timerId = setTimeout(function () {
        $option.css({height: '', overflow: '', transition: ''});
        state.timerId = null;
      }, TRANSITION_DELAY);
    }

    // 옵션 닫기
    function close() {
      if (!state.isOpen) return;
      clearPendingTimer();

      // 상태 즉시 갱신
      state.isOpen = false;

      $inner.css('height', $inner[0].scrollHeight + 'px');
      state.optionHeight = $option[0].scrollHeight;

      $option.css({
        height: state.optionHeight + 'px',
        overflow: 'hidden',
        transition: TRANSITION_HEIGHT
      });

      forceReflow($option[0]);
      $option.css('height', 0);

      state.timerId = setTimeout(function () {
        $root.removeClass('is-open');
        updateExpanded(false);
        $inner.css('height', '');
        $option.css({height: '', overflow: '', display: '', transition: ''});
        $root.trigger('product-bar:close');
        state.timerId = null;
      }, TRANSITION_DELAY);
    }

    // 액션 버튼
    function onActionClick(e) {
      var $btn = $(e.currentTarget);
      if ($btn.hasClass('is-disabled')) return;

      var eventName = $btn.is('[data-bar-cart]') ? 'product-bar:cart' : 'product-bar:buy';
      $root.trigger(eventName);
    }

    // 드래그 시작 (터치 + 마우스 공용)
    function onDragStart(e) {
      state.startY = getClientY(e);
      state.currentY = state.startY;
      state.startTime = Date.now();
      state.isDragging = false;

      if (state.isOpen) {
        state.optionHeight = $option.outerHeight();
      } else {
        // 드래그 열기 준비 — 높이 측정
        $option.css('display', 'block');
        state.optionHeight = $option[0].scrollHeight;
        $option.css({height: 0, overflow: 'hidden'});
      }

      if (e.type === 'mousedown') {
        $(document)
          .on('mousemove' + NS, onDragMove)
          .on('mouseup' + NS, onDragEnd);
      }
    }

    // 드래그 이동
    function onDragMove(e) {
      var clientY = getClientY(e);
      var deltaY = clientY - state.startY;

      state.currentY = clientY;

      if (!state.isDragging) {
        if (Math.abs(deltaY) < DRAG_THRESHOLD) return;
        state.isDragging = true;
        $root.addClass('is-dragging');

        if (state.isOpen) {
          $inner.css('height', $inner[0].scrollHeight + 'px');
          $option.css({
            height: state.optionHeight + 'px',
            overflow: 'hidden',
            transition: 'none'
          });
        } else {
          $option.css({transition: 'none'});
        }
      }

      if (state.isOpen) {
        // 열린 상태 — 아래로 드래그해서 닫기
        if (deltaY < 0) return;
        $option.css('height', Math.max(0, state.optionHeight - deltaY) + 'px');
      } else {
        // 닫힌 상태 — 위로 드래그해서 열기
        if (deltaY > 0) return;
        $option.css('height', Math.min(state.optionHeight, Math.abs(deltaY)) + 'px');
      }

      if (e.cancelable) e.preventDefault();
    }

    // 드래그 종료
    function onDragEnd() {
      $(document).off('mousemove' + NS + ' mouseup' + NS);

      if (!state.isDragging) {
        // 드래그 안 했는데 닫힌 상태로 준비만 했으면 원복
        if (!state.isOpen) {
          $option.css({height: '', overflow: '', display: ''});
        }
        return;
      }

      var deltaY = state.currentY - state.startY;
      var elapsed = Date.now() - state.startTime;
      var velocity = Math.abs(deltaY) / (elapsed || 1);

      $root.removeClass('is-dragging');

      if (state.isOpen) {
        // 열린 상태 → 닫기 판정
        if (deltaY > 0) {
          var shouldClose = velocity > VELOCITY_THRESHOLD || deltaY > state.optionHeight * CLOSE_RATIO;

          if (shouldClose) {
            state.isOpen = false;
            $option.css('transition', TRANSITION_HEIGHT);
            forceReflow($option[0]);
            $option.css('height', 0);

            state.timerId = setTimeout(function () {
              $root.removeClass('is-open');
              updateExpanded(false);
              $inner.css('height', '');
              $option.css({height: '', overflow: '', display: '', transition: ''});
              $root.trigger('product-bar:close');
              state.timerId = null;
            }, TRANSITION_DELAY);
            return;
          }
        }

        // snap back — 열린 상태 유지
        $option.css('transition', TRANSITION_HEIGHT);
        forceReflow($option[0]);
        $option.css('height', state.optionHeight + 'px');

        state.timerId = setTimeout(function () {
          $inner.css('height', '');
          $option.css({height: '', overflow: '', transition: ''});
          state.timerId = null;
        }, TRANSITION_DELAY);
      } else {
        // 닫힌 상태 → 열기 판정
        var absDelta = Math.abs(deltaY);

        if (deltaY < 0) {
          var shouldOpen = velocity > VELOCITY_THRESHOLD || absDelta > state.optionHeight * CLOSE_RATIO;

          if (shouldOpen) {
            $option.css('transition', TRANSITION_HEIGHT);
            forceReflow($option[0]);
            $option.css('height', state.optionHeight + 'px');

            state.isOpen = true;
            $root.addClass('is-open');
            updateExpanded(true);
            $root.trigger('product-bar:open');

            state.timerId = setTimeout(function () {
              $option.css({height: '', overflow: '', transition: ''});
              state.timerId = null;
            }, TRANSITION_DELAY);
            return;
          }
        }

        // snap back — 닫힌 상태 유지
        $option.css('transition', TRANSITION_HEIGHT);
        forceReflow($option[0]);
        $option.css('height', 0);

        state.timerId = setTimeout(function () {
          $option.css({height: '', overflow: '', display: '', transition: ''});
          state.timerId = null;
        }, TRANSITION_DELAY);
      }
    }

    // 이벤트 바인딩 — 클릭
    $cartBtn.on('click' + NS, onActionClick);
    $buyBtn.on('click' + NS, onActionClick);
    $handle.on('click' + NS, function () {
      // 드래그 직후 click 이벤트 무시
      if (state.isDragging) {
        state.isDragging = false;
        return;
      }
      if (state.isOpen) {
        close();
      } else {
        open();
      }
    });

    // 드래그 — 터치 (native, passive: false)
    if (handleEl) {
      handleEl.addEventListener('touchstart', onDragStart, {passive: true});
      handleEl.addEventListener('touchmove', onDragMove, {passive: false});
      handleEl.addEventListener('touchend', onDragEnd);
      handleEl.addEventListener('touchcancel', onDragEnd);

      // 드래그 — 마우스 (데스크탑 호환)
      $handle.on('mousedown' + NS, function (e) {
        onDragStart(e.originalEvent);
        // e.preventDefault();
      });
    }

    updateExpanded(false);

    instances[id] = {
      open: open,
      close: close,
      handleEl: handleEl,
      onDragStart: onDragStart,
      onDragMove: onDragMove,
      onDragEnd: onDragEnd
    };
  }

  function destroy(id) {
    var inst = instances[id];
    if (!inst) return;

    var $root = $('#' + id);

    $root.find('[data-bar-cart], [data-bar-buy]').off(NS);
    $root.find('[data-bar-handle]').off(NS);
    $(document).off('mousemove' + NS + ' mouseup' + NS);

    if (inst.handleEl) {
      inst.handleEl.removeEventListener('touchstart', inst.onDragStart);
      inst.handleEl.removeEventListener('touchmove', inst.onDragMove);
      inst.handleEl.removeEventListener('touchend', inst.onDragEnd);
      inst.handleEl.removeEventListener('touchcancel', inst.onDragEnd);
    }

    $root.removeClass('is-open is-dragging');
    $root.find('[data-bar-option]').css({
      height: '',
      overflow: '',
      display: '',
      transition: ''
    });

    delete instances[id];
  }

  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="product-bar"]').each(function () {
      init(this);
    });
  }

  window.UI.bottomProductBar = {
    init: init,
    destroy: destroy,
    initAll: initAll,
    open: function (id) {
      if (instances[id]) instances[id].open();
    },
    close: function (id) {
      if (instances[id]) instances[id].close();
    }
  };
})(window.jQuery, window);
