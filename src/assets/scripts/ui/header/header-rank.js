/**
 * @file scripts/ui/header-rank.js
 * @purpose 헤더 실시간 검색어 2줄 롤링(표시 전용)
 * @description
 *  - open/close는 toggle.js 담당(이 파일은 롤링/변동표시만)
 *  - 스코프: .header-main-search-rank[data-header-rank]
 *  - 데이터: [data-rank-item]의 data-prev-rank/data-curr-rank/data-word
 * @requires jQuery
 * @note data-rank-interval(ms)/data-rank-duration(ms)은 CSS transition 시간과 일치 권장
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[header-rank] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var SCOPE_SEL = '.header-main-search-rank[data-header-rank]';

  // toInt: 문자열→정수 변환(실패 시 null)
  function toInt(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  // calcMove: 순위 변동 계산(up/down/same/new + delta)
  function calcMove(prev, curr) {
    if (prev === null || typeof prev === 'undefined') return {move: 'new', delta: null};
    if (curr === null || typeof curr === 'undefined') return {move: 'same', delta: null};
    if (prev > curr) return {move: 'up', delta: prev - curr};
    if (prev < curr) return {move: 'down', delta: curr - prev};
    return {move: 'same', delta: 0};
  }

  // getInterval: 롤링 간격(ms) 읽기(비정상이면 기본값)
  function getInterval($scope) {
    var v = parseInt($scope.attr('data-rank-interval'), 10);
    if (isNaN(v) || v < 300) v = 2500;
    return v;
  }

  // getDuration: 롤링 애니메이션(ms) 읽기(비정상이면 기본값)
  function getDuration($scope) {
    var v = parseInt($scope.attr('data-rank-duration'), 10);
    if (isNaN(v) || v < 80) v = 600;
    return v;
  }

  // readList: DOM에서 랭킹 목록 수집(빈 word 제외)
  function readList($scope) {
    var items = [];
    $scope.find('[data-rank-list] [data-rank-item]').each(function () {
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

  // renderListMoves: 패널 리스트의 변동 표시만 갱신(텍스트/링크는 유지)
  function renderListMoves($scope, items) {
    var $rows = $scope.find('[data-rank-list] [data-rank-item]');
    $rows.each(function (i) {
      var it = items[i];
      if (!it) return;

      var $move = $(this).find('[data-rank-item-move]').first();
      if (!$move.length) return;

      $move.removeClass('rank-move-up rank-move-down rank-move-same rank-move-new');
      $move.addClass('rank-move-' + (it.move || 'same'));

      if (it.delta === null) $move.removeAttr('data-delta');
      else $move.attr('data-delta', String(it.delta));
    });
  }

  // buildRow: 롤링 표시 1줄 DOM 생성(현재 표시용)
  function buildRow(it) {
    var $row = $('<span class="header-rank-row"></span>');
    $row.append('<span class="header-rank-num">' + (it.currRank !== null ? it.currRank : '') + '</span>');
    $row.append('<span class="header-rank-word">' + (it.word || '') + '</span>');

    var moveClass = 'rank-move-' + (it.move || 'same');
    var deltaAttr = it.delta === null ? '' : ' data-delta="' + it.delta + '"';
    $row.append('<span class="header-rank-move  ' + moveClass + '"' + deltaAttr + ' aria-hidden="true"></span>');

    return $row;
  }

  // ensureRollingDom: 롤링 DOM이 없으면 생성 후 주입([data-rank-current] 내용 교체)
  function ensureRollingDom($scope, items) {
    var $link = $scope.find('[data-rank-current]').first();
    if (!$link.length) return null;

    var $existingView = $link.find('.header-rank-view').first();
    if ($existingView.length) {
      return {
        $view: $existingView,
        $track: $existingView.find('.header-rank-track').first(),
        $rowA: $existingView.find('.header-rank-row').eq(0),
        $rowB: $existingView.find('.header-rank-row').eq(1)
      };
    }

    var $view = $('<span class="header-rank-view"></span>');
    var $track = $('<span class="header-rank-track"></span>');

    var $rowA = buildRow(items[0]);
    var $rowB = buildRow(items[1] || items[0]);

    $track.append($rowA).append($rowB);
    $view.append($track);

    // [data-rank-current]는 롤링 뷰로 교체됨(기존 텍스트 제거)
    $link.empty().append($view);

    return {$view: $view, $track: $track, $rowA: $rowA, $rowB: $rowB};
  }

  // copyRow: 롤링 row 내용/상태 덮어쓰기(번호/키워드/변동)
  function copyRow($toRow, it) {
    $toRow.find('.header-rank-num').text(it.currRank !== null ? it.currRank : '');
    $toRow.find('.header-rank-word').text(it.word || '');

    var $mv = $toRow.find('.header-rank-move');
    $mv.removeClass('rank-move-up rank-move-down rank-move-same rank-move-new');
    $mv.addClass('rank-move-' + (it.move || 'same'));

    if (it.delta === null) $mv.removeAttr('data-delta');
    else $mv.attr('data-delta', String(it.delta));
  }

  // bindRolling: 롤링 타이머 시작(중복 타이머 방지)
  function bindRolling($scope, items, dom) {
    var interval = getInterval($scope);
    var duration = getDuration($scope);

    var timer = null;
    var animating = false;
    var idx = 0;

    // stop: 기존 타이머 정리
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // resetTrackWithoutBounce: transition 끄고 원위치 복귀(깜빡임/튐 방지)
    function resetTrackWithoutBounce() {
      dom.$track.css('transition', 'none');
      dom.$view.removeClass('is-rolling');
      dom.$track[0].getBoundingClientRect();
      dom.$track.css('transition', '');
    }

    // tick: rowB에 다음 데이터 주입 → 롤링 → rowA 동기화 후 리셋
    function tick() {
      if (animating) return;
      if (!items.length) return;

      animating = true;

      var nextIdx = (idx + 1) % items.length;
      var nextItem = items[nextIdx];

      copyRow(dom.$rowB, nextItem);
      dom.$view.addClass('is-rolling');

      window.setTimeout(function () {
        copyRow(dom.$rowA, nextItem);
        resetTrackWithoutBounce();
        idx = nextIdx;
        animating = false;
      }, duration);
    }

    stop();
    timer = setInterval(tick, interval);
  }

  // initScope: 스코프 1개 초기화(최소 2개 이상일 때만 롤링)
  function initScope($scope) {
    var items = readList($scope);
    if (items.length < 2) return;

    renderListMoves($scope, items);

    var dom = ensureRollingDom($scope, items);
    if (!dom) return;

    bindRolling($scope, items, dom);
  }

  window.UI.headerRank = {
    // init: 스코프별로 롤링 바인딩
    init: function () {
      $(SCOPE_SEL).each(function () {
        initScope($(this));
      });
      console.log('[header-rank] init');
    }
  };

  console.log('[header-rank] module loaded');
})(window.jQuery || window.$, window);
