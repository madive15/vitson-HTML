/**
 * @file scripts/ui/header-rank.js
 * @purpose 헤더 실시간 검색어 2줄 롤링(표시 전용)
 * @description
 *  - open/close는 toggle.js 담당(이 파일은 롤링/변동표시만)
 *  - 스코프: .header-main-search-rank[data-header-rank]
 *  - 데이터: [data-rank-item]의 data-prev-rank/data-curr-rank/data-word
 * @requires jQuery
 * @note data-rank-interval(ms)/data-rank-duration(ms)은 CSS transition 시간과 일치 권장
 *
 * @maintenance
 *  - 스코프 단위 인스턴스(data 저장)로 타이머/상태를 관리해 init 재호출에도 안전하게 동작
 *  - 콘솔 출력/불필요 전역 상태 없음
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'headerRank';

  var SCOPE_SEL = '.header-main-search-rank[data-header-rank]';

  var SEL = {
    LIST_ROW: '[data-rank-list] [data-rank-item]',
    CURRENT: '[data-rank-current]',
    MOVE: '[data-rank-item-move]'
  };

  var CLS = {
    ROLLING: 'is-rolling'
  };

  var MOVE_CLASS_LIST = 'rank-move-up rank-move-down rank-move-same rank-move-new';

  // 문자열→정수 변환(실패 시 null)
  function toInt(v) {
    var n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  }

  // 순위 변동 계산(up/down/same/new + delta)
  function calcMove(prev, curr) {
    if (prev === null || typeof prev === 'undefined') return {move: 'new', delta: null};
    if (curr === null || typeof curr === 'undefined') return {move: 'same', delta: null};
    if (prev > curr) return {move: 'up', delta: prev - curr};
    if (prev < curr) return {move: 'down', delta: curr - prev};
    return {move: 'same', delta: 0};
  }

  // 롤링 간격(ms) 읽기(비정상이면 기본값)
  function getInterval($scope) {
    var v = parseInt($scope.attr('data-rank-interval'), 10);
    if (Number.isNaN(v) || v < 300) v = 2500;
    return v;
  }

  // 롤링 애니메이션(ms) 읽기(비정상이면 기본값)
  function getDuration($scope) {
    var v = parseInt($scope.attr('data-rank-duration'), 10);
    if (Number.isNaN(v) || v < 80) v = 600;
    return v;
  }

  // DOM에서 랭킹 목록 수집(빈 word 제외)
  function readList($scope) {
    var items = [];

    $scope.find(SEL.LIST_ROW).each(function () {
      var $it = $(this);
      var prev = toInt($it.attr('data-prev-rank'));
      var curr = toInt($it.attr('data-curr-rank'));
      var word = ($it.attr('data-word') || '').trim();
      if (!word) return;

      var mv = calcMove(prev, curr);
      items.push({
        currRank: curr,
        prevRank: prev,
        word: word,
        move: mv.move,
        delta: mv.delta
      });
    });

    return items;
  }

  // 패널 리스트의 변동 표시만 갱신(텍스트/링크는 유지)
  function renderListMoves($scope, items) {
    var $rows = $scope.find(SEL.LIST_ROW);

    $rows.each(function (i) {
      var it = items[i];
      if (!it) return;

      var $move = $(this).find(SEL.MOVE).first();
      if (!$move.length) return;

      $move.removeClass(MOVE_CLASS_LIST);
      $move.addClass('rank-move-' + (it.move || 'same'));

      if (it.delta === null) $move.removeAttr('data-delta');
      else $move.attr('data-delta', String(it.delta));
    });
  }

  // 롤링 표시 1줄 DOM 생성(현재 표시용)
  function buildRow(it) {
    var data = it || {currRank: null, word: '', move: 'same', delta: null};

    var $row = $('<span/>', {class: 'header-rank-row'});
    $('<span/>', {class: 'header-rank-num', text: data.currRank !== null ? data.currRank : ''}).appendTo($row);
    $('<span/>', {class: 'header-rank-word', text: data.word || ''}).appendTo($row);

    var $mv = $('<span/>', {
      class: 'header-rank-move rank-move-' + (data.move || 'same'),
      'aria-hidden': 'true'
    });

    if (data.delta !== null) $mv.attr('data-delta', String(data.delta));
    $row.append($mv);

    return $row;
  }

  // 롤링 DOM 생성/재사용([data-rank-current] 내부를 롤링 뷰로 교체)
  function ensureRollingDom($scope, items) {
    var $link = $scope.find(SEL.CURRENT).first();
    if (!$link.length) return null;

    var $view = $link.find('.header-rank-view').first();
    if ($view.length) {
      return {
        $view: $view,
        $track: $view.find('.header-rank-track').first(),
        $rowA: $view.find('.header-rank-row').eq(0),
        $rowB: $view.find('.header-rank-row').eq(1)
      };
    }

    $view = $('<span/>', {class: 'header-rank-view'});
    var $track = $('<span/>', {class: 'header-rank-track'});

    var $rowA = buildRow(items[0]);
    var $rowB = buildRow(items[1] || items[0]);

    $track.append($rowA).append($rowB);
    $view.append($track);

    $link.empty().append($view);

    return {$view: $view, $track: $track, $rowA: $rowA, $rowB: $rowB};
  }

  // 롤링 row 내용/상태 덮어쓰기(번호/키워드/변동)
  function copyRow($toRow, it) {
    if (!$toRow || !$toRow.length || !it) return;

    $toRow.find('.header-rank-num').text(it.currRank !== null ? it.currRank : '');
    $toRow.find('.header-rank-word').text(it.word || '');

    var $mv = $toRow.find('.header-rank-move');
    $mv.removeClass(MOVE_CLASS_LIST);
    $mv.addClass('rank-move-' + (it.move || 'same'));

    if (it.delta === null) $mv.removeAttr('data-delta');
    else $mv.attr('data-delta', String(it.delta));
  }

  // transition 끄고 원위치 복귀(깜빡임/튐 방지)
  function resetTrackWithoutBounce(dom) {
    if (!dom || !dom.$track || !dom.$track.length) return;

    dom.$track.css('transition', 'none');
    dom.$view.removeClass(CLS.ROLLING);
    dom.$track[0].getBoundingClientRect(); // reflow
    dom.$track.css('transition', '');
  }

  // 인스턴스 생성(스코프 단위 타이머/상태 관리)
  function createInstance($scope) {
    var state = {
      $scope: $scope,
      items: [],
      dom: null,
      interval: 2500,
      duration: 600,
      timer: null,
      animating: false,
      idx: 0
    };

    function stop() {
      if (state.timer) {
        window.clearInterval(state.timer);
        state.timer = null;
      }
      state.animating = false;
    }

    function tick() {
      if (state.animating) return;
      if (!state.items.length || !state.dom) return;

      state.animating = true;

      var nextIdx = (state.idx + 1) % state.items.length;
      var nextItem = state.items[nextIdx];

      copyRow(state.dom.$rowB, nextItem);
      state.dom.$view.addClass(CLS.ROLLING);

      window.setTimeout(function () {
        copyRow(state.dom.$rowA, nextItem);
        resetTrackWithoutBounce(state.dom);
        state.idx = nextIdx;
        state.animating = false;
      }, state.duration);
    }

    function start() {
      stop();
      state.timer = window.setInterval(tick, state.interval);
    }

    function sync() {
      state.items = readList(state.$scope);

      if (state.items.length < 2) {
        stop();
        return;
      }

      state.interval = getInterval(state.$scope);
      state.duration = getDuration(state.$scope);

      renderListMoves(state.$scope, state.items);

      state.dom = ensureRollingDom(state.$scope, state.items);
      if (!state.dom) {
        stop();
        return;
      }

      state.idx = 0;
      copyRow(state.dom.$rowA, state.items[0]);
      copyRow(state.dom.$rowB, state.items[1] || state.items[0]);
      resetTrackWithoutBounce(state.dom);

      start();
    }

    return {
      sync: sync,
      destroy: function () {
        stop();
      }
    };
  }

  window.UI.headerRank = {
    // init: root 범위(또는 전체)에서 스코프별 인스턴스 동기화
    init: function (root) {
      var $root = root ? $(root) : $(document);

      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        var inst = $el.data(MODULE_KEY);

        if (!inst) {
          inst = createInstance($el);
          $el.data(MODULE_KEY, inst);
        }

        inst.sync();
      });
    },

    // destroy: root 범위(또는 전체)에서 인스턴스 타이머 정리
    destroy: function (root) {
      var $root = root ? $(root) : $(document);

      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        var inst = $el.data(MODULE_KEY);

        if (inst && typeof inst.destroy === 'function') inst.destroy();
        $el.removeData(MODULE_KEY);
      });
    }
  };
})(window.jQuery || window.$, window, document);
