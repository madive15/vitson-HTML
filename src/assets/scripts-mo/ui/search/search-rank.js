/**
 * @file search-rank.js
 * @description 실시간 검색어 2열 순차 flip 롤링
 * @scope [data-ui="search-rank"]
 * @state .is-flipping — flip 전환 중
 * @option data-rank-interval — 롤링 간격 ms(기본 3000)
 * @note 순차 딜레이는 SCSS nth-child, JS는 마지막 아이템 transitionend로 정리
 * @note JS 셀렉터는 data- 속성 전용 — 클래스 변경에 영향 없음
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'searchRank';
  var SCOPE_SEL = '[data-ui="search-rank"]';
  var NS = '.searchRank';

  var SEL = {
    ITEM: '[data-rank-item]',
    FLIP: '[data-rank-flip]',
    CURRENT: '[data-rank-slot="current"]',
    NEXT: '[data-rank-slot="next"]',
    NUM: '[data-rank-num]',
    WORD: '[data-rank-word]',
    MOVE: '[data-rank-move]'
  };

  var MOVE_CLS = 'move-up move-down move-same move-new';

  function toInt(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function calcMove(prev, curr) {
    if (prev === null) return 'new';
    if (prev > curr) return 'up';
    if (prev < curr) return 'down';
    return 'same';
  }

  // DOM에서 현재 데이터 수집
  function readList($scope) {
    var items = [];
    $scope.find(SEL.ITEM).each(function () {
      var $it = $(this);
      var word = ($it.attr('data-word') || '').trim();
      if (!word) return;
      var prev = toInt($it.attr('data-prev-rank'));
      var curr = toInt($it.attr('data-curr-rank'));
      items.push({currRank: curr, word: word, move: calcMove(prev, curr)});
    });
    return items;
  }

  // 슬롯에 데이터 반영
  function renderSlot($slot, it) {
    if (!$slot.length || !it) return;
    $slot.find(SEL.NUM).text(it.currRank != null ? it.currRank : '');
    $slot.find(SEL.WORD).text(it.word);
    var $mv = $slot.find(SEL.MOVE);
    $mv.removeClass(MOVE_CLS).addClass('move-' + it.move);
  }

  // 트랜지션 끄고 원위치
  function resetFlip($item) {
    var flip = $item.find(SEL.FLIP)[0];
    if (!flip) return;
    flip.style.transition = 'none';
    $item.removeClass('is-flipping');
    void flip.offsetHeight; // reflow
    flip.style.transition = '';
  }

  function createInstance($scope) {
    var interval = parseInt($scope.attr('data-rank-interval'), 10) || 3000;
    var timer = null;
    var animating = false;

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      $scope.off(NS);
    }

    function start() {
      stop();
      timer = window.setInterval(tick, interval);
    }

    // flip 완료 처리
    function finalize(newItems) {
      var $items = $scope.find(SEL.ITEM);

      $items.each(function (i) {
        var $row = $(this);

        // current에 새 데이터 복사
        renderSlot($row.find(SEL.CURRENT), newItems[i]);

        // data 속성 갱신(다음 flip 변동 계산용)
        if (newItems[i]) {
          $row.attr('data-curr-rank', newItems[i].currRank);
          $row.attr('data-word', newItems[i].word);
        }

        resetFlip($row);
      });

      animating = false;
    }

    function flip(newItems) {
      if (animating) return;
      animating = true;

      var $items = $scope.find(SEL.ITEM);

      // next 슬롯에 새 데이터 세팅
      $items.each(function (i) {
        renderSlot($(this).find(SEL.NEXT), newItems[i]);
      });

      // flip 트리거
      $items.each(function () {
        $(this).addClass('is-flipping');
      });

      // 마지막 아이템(딜레이 가장 긴)의 transitionend 한 번만 감지
      var $lastInCol = $scope.find('[data-rank-item]:last-child').first();

      $lastInCol.one('transitionend' + NS, function (e) {
        if (e.originalEvent.propertyName !== 'transform') {
          // transform 아닌 이벤트면 다시 한 번 대기
          $lastInCol.one('transitionend' + NS, function () {
            finalize(newItems);
          });
          return;
        }
        finalize(newItems);
      });
    }

    function tick() {
      if (animating) return;
      // 퍼블 확인용 — 실서비스에서는 update()로 대체
      var list = readList($scope);
      if (list.length < 2) return;
      flip(list);
    }

    // 초기 current 슬롯 세팅
    var initialList = readList($scope);
    $scope.find(SEL.ITEM).each(function (i) {
      renderSlot($(this).find(SEL.CURRENT), initialList[i]);
    });

    var touchStartX = 0;
    var touchMoved = false;
    var SCROLL_THRESHOLD = 10;

    $scope
      .on('touchstart' + NS, SEL.ITEM, function (e) {
        touchStartX = e.originalEvent.touches[0].clientX;
        touchMoved = false;
      })
      .on('touchmove' + NS, SEL.ITEM, function (e) {
        var dx = Math.abs(e.originalEvent.touches[0].clientX - touchStartX);
        if (dx > SCROLL_THRESHOLD) touchMoved = true;
      })
      .on('click' + NS, SEL.ITEM, function (e) {
        if (touchMoved) e.preventDefault();
      });

    start();

    return {
      start: start,
      stop: stop,
      update: function (newItems) {
        flip(newItems);
      },
      destroy: function () {
        stop();
        animating = false;
      }
    };
  }

  window.UI.searchRank = {
    init: function (root) {
      var $root = root ? $(root) : $(document);

      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        if ($el.data(MODULE_KEY)) return;

        var inst = createInstance($el);
        $el.data(MODULE_KEY, inst);
      });
    },

    destroy: function (root) {
      var $root = root ? $(root) : $(document);

      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        var inst = $el.data(MODULE_KEY);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
        $el.removeData(MODULE_KEY);
      });
    },

    getInstance: function () {
      var $el = $(SCOPE_SEL).first();
      return $el.length ? $el.data(MODULE_KEY) : null;
    }
  };
})(window.jQuery || window.$, window, document);
