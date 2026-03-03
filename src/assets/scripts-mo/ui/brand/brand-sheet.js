/**
 * @file scripts-mo/ui/brand/brand-sheet.js
 * @description 브랜드 시트 — 필터 스크롤 + 검색 + 목록 필터링
 * @scope [data-brand-sheet]
 *
 * @state is-active (필터 버튼), is-disabled (화살표)
 * @events inputSearch:submit, inputSearch:clear
 *
 * @note
 *   - 필터 버튼: 전체 / ㄱ~ㅎ / A~Z 한 줄 스크롤
 *   - 화살표: 보이는 영역만큼 스냅 스크롤, 끝에서 is-disabled
 *   - 검색: 2자 이상 입력 후 엔터 → 목록 필터링
 *   - fitButtons: 뷰포트 너비에 맞춰 버튼 너비 역산 → 잘림 방지
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiBrandSheet';
  var SCOPE = '[data-brand-sheet]';

  var SEL = {
    filter: '[data-brand-filter]',
    prev: '[data-brand-prev]',
    next: '[data-brand-next]',
    scroll: '[data-brand-scroll]',
    filterBtn: '.brand-filter-btn',
    body: '[data-brand-body]',
    list: '[data-brand-list]',
    item: '[data-brand-item]',
    count: '[data-brand-count]',
    empty: '[data-brand-empty]',
    input: '[data-search-input]'
  };

  var CLS = {
    active: 'is-active',
    disabled: 'is-disabled'
  };

  var GAP = 8;
  var MIN_W = 38;

  var _bound = false;
  var _scrollTimer = null;
  var _btnCache = null;

  function $scope() {
    return $(SCOPE);
  }

  // 버튼 기본 정보 캐싱
  function cacheBtnWidths($root) {
    _btnCache = [];
    $root.find('.brand-filter-list > li').each(function () {
      var $btn = $(this).find(SEL.filterBtn);
      _btnCache.push({
        $btn: $btn,
        li: this,
        baseWidth: $btn.outerWidth()
      });
    });
  }

  // 뷰포트에 맞춰 버튼 너비 역산 — 잘림 방지 핵심
  function fitButtons($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el || !_btnCache || !_btnCache.length) return;

    var viewWidth = el.clientWidth;

    // 뷰포트에 온전히 들어가는 버튼 수
    var fitCount = Math.floor((viewWidth + GAP) / (MIN_W + GAP));
    if (fitCount < 1) fitCount = 1;

    // 역산: fitCount × btnW + (fitCount - 1) × GAP = viewWidth
    var btnW = (viewWidth - (fitCount - 1) * GAP) / fitCount;

    // 모든 버튼에 동일 너비 적용
    for (var i = 0; i < _btnCache.length; i++) {
      _btnCache[i].$btn.css('width', btnW + 'px');
    }

    // 스크롤 이동 계산용 캐싱
    $root.data('fitCount', fitCount);
    $root.data('unitW', btnW + GAP);
  }

  // 화살표 disabled 상태 갱신 (너비 분배 로직 제거 — fitButtons가 담당)
  function updateArrows($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el) return;

    var maxScroll = el.scrollWidth - el.clientWidth;

    $root.find(SEL.prev).toggleClass(CLS.disabled, el.scrollLeft <= 1);
    $root.find(SEL.next).toggleClass(CLS.disabled, el.scrollLeft >= maxScroll - 1);
  }

  // 화살표 클릭 → fitCount 단위 스냅 스크롤
  function scrollFilter($root, direction) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el || !_btnCache || !_btnCache.length) return;

    var fitCount = $root.data('fitCount') || 1;
    var unit = $root.data('unitW') || MIN_W + GAP;
    var scrollLeft = el.scrollLeft;
    var totalBtns = _btnCache.length;

    // 현재 시작 버튼 인덱스 (unit 단위 정렬)
    var currentIdx = Math.round(scrollLeft / unit);

    var targetIdx;
    if (direction === 'next') {
      targetIdx = currentIdx + fitCount;
    } else {
      targetIdx = currentIdx - fitCount;
    }

    // 마지막 그룹 시작 인덱스 = 전체 - 한 화면분
    var lastGroupIdx = totalBtns - fitCount;
    if (lastGroupIdx < 0) lastGroupIdx = 0;

    // 범위 보정
    if (targetIdx > lastGroupIdx) targetIdx = lastGroupIdx;
    if (targetIdx < 0) targetIdx = 0;

    var target = targetIdx * unit;

    $scroll.animate({scrollLeft: target}, 200, function () {
      updateArrows($root);
    });
  }

  // 자유 스크롤 후 가장 가까운 버튼 경계로 스냅
  function snapScroll($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el) return;

    var unit = $root.data('unitW') || MIN_W + GAP;
    var scrollLeft = el.scrollLeft;
    var maxScroll = el.scrollWidth - el.clientWidth;

    // 끝에 도달한 경우 스냅하지 않음
    if (scrollLeft <= 1 || scrollLeft >= maxScroll - 1) return;

    // 가장 가까운 unit 배수로 스냅
    var snapped = Math.round(scrollLeft / unit) * unit;
    snapped = Math.max(0, Math.min(snapped, maxScroll));

    // 이미 정렬돼 있으면 무시
    if (Math.abs(scrollLeft - snapped) < 1) return;

    $scroll.animate({scrollLeft: snapped}, 120, function () {
      updateArrows($root);
    });
  }

  // 초성 추출
  function getChosung(char) {
    var code = char.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return null;
    var list = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ'
    ];
    return list[Math.floor(code / 588)];
  }

  // 쌍자음 → 기본 자음
  function normalizeChosung(cho) {
    var map = {ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ'};
    return map[cho] || cho;
  }

  // 브랜드명이 필터 기준에 맞는지 판별
  function matchFilter(text, filter) {
    if (filter === 'all') return true;
    if (!text) return false;

    var first = text.charAt(0);

    if (/[ㄱ-ㅎ]/.test(filter)) {
      if (/[가-힣]/.test(first)) {
        return normalizeChosung(getChosung(first)) === filter;
      }
      return false;
    }

    if (/[A-Z]/.test(filter)) {
      return first.toUpperCase() === filter;
    }

    return false;
  }

  // 브랜드 캐시 생성
  function cacheBrands($root) {
    var items = [];
    $root.find(SEL.item).each(function () {
      var $el = $(this);
      items.push({
        $el: $el,
        text: $.trim($el.text())
      });
    });
    $root.data('brandCache', items);
  }

  // 목록 필터링
  function filterList($root, filter, keyword) {
    var items = $root.data('brandCache');
    if (!items) return;

    var count = 0;
    var kw = keyword ? keyword.toLowerCase() : '';

    items.forEach(function (item) {
      var filterMatch = matchFilter(item.text, filter);
      var kwMatch = !kw || item.text.toLowerCase().indexOf(kw) > -1;
      var show = filterMatch && kwMatch;

      if (show) {
        item.$el.removeClass('is-hidden');
        count++;
      } else {
        item.$el.addClass('is-hidden');
      }
    });

    $root.find(SEL.count).text(count);

    var $empty = $root.find(SEL.empty);
    var $list = $root.find(SEL.list);
    if (count === 0) {
      $list.addClass('is-hidden');
      $empty.removeClass('is-hidden');
    } else {
      $list.removeClass('is-hidden');
      $empty.addClass('is-hidden');
    }

    // 목록 스크롤 최상위로
    var $body = $root.find(SEL.body);
    if ($body[0]) $body[0].scrollTop = 0;
  }

  // 현재 활성 필터값
  function activeFilter($root) {
    return $root.find(SEL.filterBtn + '.' + CLS.active).data('filter') || 'all';
  }

  function bindEvents() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // 화살표 클릭
    $doc.on('click' + NS, SEL.prev, function () {
      scrollFilter($(this).closest(SCOPE), 'prev');
    });
    $doc.on('click' + NS, SEL.next, function () {
      scrollFilter($(this).closest(SCOPE), 'next');
    });

    // 스크롤 끝나면 버튼 경계로 스냅
    $(SCOPE)
      .find(SEL.scroll)
      .on('scroll' + NS, function () {
        var $el = $(this);
        var $root = $el.closest(SCOPE);

        updateArrows($root);

        // 스크롤 멈춤 감지 → 스냅 정렬
        clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(function () {
          snapScroll($root);
        }, 150);
      });

    // 필터 버튼 클릭
    $doc.on('click' + NS, SEL.filterBtn, function () {
      var $btn = $(this);
      var $root = $btn.closest(SCOPE);
      var filter = $btn.data('filter');

      $root.find(SEL.filterBtn).removeClass(CLS.active).attr({'aria-selected': 'false', tabindex: '-1'});
      $btn.addClass(CLS.active).attr({'aria-selected': 'true', tabindex: '0'});

      // 숨긴 필터 버튼 + 화살표 복원
      $root.find('.brand-filter-list > li').removeClass('is-hidden');
      $root.find(SEL.prev).removeClass('is-hidden');
      $root.find(SEL.next).removeClass('is-hidden');

      // 버튼 너비 재계산 + 화살표 상태 갱신
      fitButtons($root);
      updateArrows($root);

      filterList($root, filter, '');

      if (window.UI && window.UI.inputSearch) {
        window.UI.inputSearch.clear($root);
      }
    });

    // 검색 실행 — 전체만 보이고 나머지 필터 숨김
    $doc.on('inputSearch:submit' + NS, SEL.input, function (e, data) {
      var $root = $(this).closest(SCOPE);

      // 필터 전체로 전환
      $root.find(SEL.filterBtn).removeClass(CLS.active).attr({'aria-selected': 'false', tabindex: '-1'});
      $root
        .find(SEL.filterBtn + '[data-filter="all"]')
        .addClass(CLS.active)
        .attr({'aria-selected': 'true', tabindex: '0'});

      // 전체 외 필터 버튼 숨김 + 화살표 숨김
      $root.find('.brand-filter-list > li').each(function () {
        var $btn = $(this).find(SEL.filterBtn);
        if ($btn.data('filter') !== 'all') {
          $(this).addClass('is-hidden');
        }
      });
      $root.find(SEL.prev).addClass('is-hidden');
      $root.find(SEL.next).addClass('is-hidden');

      // 스크롤 초기화
      var $scroll = $root.find(SEL.scroll);
      if ($scroll[0]) $scroll[0].scrollLeft = 0;

      filterList($root, 'all', data.query);
    });

    // 검색 초기화 — 필터 메뉴 전부 복원
    $doc.on('inputSearch:clear' + NS, SEL.input, function () {
      var $root = $(this).closest(SCOPE);

      // 숨긴 필터 버튼 + 화살표 복원
      $root.find('.brand-filter-list > li').removeClass('is-hidden');
      $root.find(SEL.prev).removeClass('is-hidden');
      $root.find(SEL.next).removeClass('is-hidden');

      // 버튼 너비 재계산 + 화살표 상태 갱신
      fitButtons($root);
      updateArrows($root);

      filterList($root, activeFilter($root), '');
    });

    // 브랜드 탭 활성화 시 fitButtons + 화살표 갱신
    $doc.on('tab:change' + NS, function (e, data) {
      if (data === 'brandTab') {
        var $root = $scope();
        if ($root.length) {
          if (!_btnCache || !_btnCache.length) {
            cacheBtnWidths($root);
          }
          fitButtons($root);
          updateArrows($root);
          filterList($root, activeFilter($root), '');
        }
      }
    });
  }

  // init에 cacheBtnWidths + fitButtons + updateArrows 추가
  function init() {
    var $root = $scope();
    if (!$root.length) return;

    cacheBrands($root);
    cacheBtnWidths($root);
    fitButtons($root);
    bindEvents();
    updateArrows($root);
  }

  function destroy() {
    $(document).off(NS);
    clearTimeout(_scrollTimer);
    _scrollTimer = null;
    var $root = $scope();
    if ($root.length) {
      $root.removeData('brandCache');
      $root.removeData('fitCount');
      $root.removeData('unitW');
    }
    _bound = false;
    _btnCache = null;
  }

  window.brandSheet = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
