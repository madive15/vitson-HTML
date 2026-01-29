/**
 * @file scripts/ui/category/plp-titlebar-research.js
 * @purpose PLP 결과 내 재검색: submit 시 칩 생성/삭제(UI.chipButton) + 좌/우(한 칩씩) + 연관검색어 노출
 * @assumption
 *  - root: .vits-plp-titlebar
 *  - search form: [data-search-form], input: [data-search-input]
 *  - chip ui: [data-chip-ui]
 *    - scroller: [data-chip-scroller]
 *    - group: .vits-chip-button-group
 *    - nav: [data-chip-prev], [data-chip-next]
 *  - related ui: [data-related-ui], list: [data-related-list], item: [data-keyword]
 *  - remove: [data-chip-action="remove"] → UI.chipButton가 DOM 제거 + ui:chip-remove 트리거
 *
 * @dependency
 *  - scripts/ui/form/input-search.js (정규화/validation 처리)
 *
 * @maintenance
 *  - ui:chip-remove는 "모든 칩" 이벤트이므로, 삭제된 칩이 현재 root 내부일 때만 동기화한다(페이지/영역 혼재 대비).
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var ROOT_SEL = '.vits-plp-titlebar';
  var CLS_HIDDEN = 'is-hidden';

  var NAV_OFFSET = 45;
  var THRESHOLD = 8;

  // PLP titlebar 하위 요소들을 1회에 수집
  function getEls($root) {
    var $form = $root.find('[data-search-form]').first();
    var $input = $root.find('[data-search-input]').first();

    var $validation = $input.closest('.vits-input-search.vits-validation').find('.input-validation').first();

    var $chipUI = $root.find('[data-chip-ui]').first();
    var $relatedUI = $root.find('[data-related-ui]').first();

    var $chipGroup = $chipUI.find('.vits-chip-button-group').first();

    var $scroller = $chipUI.find('[data-chip-scroller]').first();
    if (!$scroller.length) $scroller = $chipGroup;

    var $btnPrev = $chipUI.find('[data-chip-prev]').first();
    var $btnNext = $chipUI.find('[data-chip-next]').first();

    var $relatedList = $relatedUI.find('[data-related-list]').first();

    return {
      $root: $root,
      $form: $form,
      $input: $input,
      $validation: $validation,
      $chipUI: $chipUI,
      $chipGroup: $chipGroup,
      $scroller: $scroller,
      $btnPrev: $btnPrev,
      $btnNext: $btnNext,
      $relatedUI: $relatedUI,
      $relatedList: $relatedList
    };
  }

  // 검색어 정규화를 공통(inputSearch.normalize)으로 일원화
  function normalizeQuery(str) {
    if (window.UI && window.UI.inputSearch && typeof window.UI.inputSearch.normalize === 'function') {
      return window.UI.inputSearch.normalize(str);
    }
    return String(str || '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s+/g, ' ');
  }

  // is-hidden 토글로 노출을 제어
  function setVisible($el, on) {
    if (!$el || !$el.length) return;
    $el.toggleClass(CLS_HIDDEN, !on);
  }

  // 현재 칩이 1개라도 있는지 확인
  function hasAnyChip(els) {
    return !!(els.$chipGroup && els.$chipGroup.length && els.$chipGroup.find('.vits-chip-button').length);
  }

  // data-chip-value 비교로 중복을 판정
  function hasChipValue(els, value) {
    if (!els.$chipGroup || !els.$chipGroup.length) return false;

    var v = String(value || '');
    if (!v) return false;

    var found = false;
    els.$chipGroup.find('.vits-chip-button').each(function () {
      if (String($(this).attr('data-chip-value') || '') === v) found = true;
    });

    return found;
  }

  // 칩 DOM을 생성해 추가(중복이면 false)
  function appendChip(els, text) {
    var v = normalizeQuery(text);
    if (!v) return false;

    if (hasChipValue(els, v)) return false;

    var $chip = $('<button/>', {
      type: 'button',
      class: 'vits-chip-button type-outline',
      'data-chip-action': 'remove',
      'data-chip-value': v,
      'aria-label': v + ' 삭제'
    });

    $('<span/>', {class: 'text', text: v}).appendTo($chip);
    $('<span/>', {class: 'icon ic ic-x', 'aria-hidden': 'true'}).appendTo($chip);

    els.$chipGroup.append($chip);
    return true;
  }

  // 스크롤 가능한 최대 값을 계산
  function getMaxScrollLeft(scrollerEl) {
    return Math.max(0, (scrollerEl.scrollWidth || 0) - (scrollerEl.clientWidth || 0));
  }

  // 좌/우 버튼의 노출/disabled 상태를 갱신
  function updateNav(els) {
    if (!els.$btnPrev.length || !els.$btnNext.length) return;

    var scrollerEl = els.$scroller[0];
    var groupEl = els.$chipGroup[0];
    if (!scrollerEl || !groupEl) return;

    var x = scrollerEl.scrollLeft || 0;

    // overflow 판정: group 콘텐츠 폭이 scroller 가시폭을 넘는지
    var groupWidth = groupEl.scrollWidth || 0;
    var scrollerWidth = scrollerEl.clientWidth || 0;
    var hasOverflow = groupWidth - scrollerWidth > THRESHOLD;

    // 버튼은 overflow일 때만 노출
    setVisible(els.$btnPrev, hasOverflow);
    setVisible(els.$btnNext, hasOverflow);

    if (!hasOverflow) return;

    var max = getMaxScrollLeft(scrollerEl);

    els.$btnPrev.prop('disabled', x <= 1);
    els.$btnNext.prop('disabled', x >= max - 1);
  }

  // 칩 엘리먼트 목록을 가져옴
  function getChipItems(els) {
    if (!els.$chipGroup.length) return [];
    return els.$chipGroup[0].querySelectorAll('.vits-chip-button');
  }

  // 다음 칩 위치로 스크롤 이동
  function goNextChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;

    var items = getChipItems(els);
    if (!items || !items.length) return;

    var x = scrollerEl.scrollLeft || 0;

    for (var i = 0; i < items.length; i += 1) {
      var left = (items[i].offsetLeft || 0) - NAV_OFFSET;
      if (left > x + 1) {
        scrollerEl.scrollTo({left: left, behavior: 'smooth'});
        return;
      }
    }

    scrollerEl.scrollTo({left: getMaxScrollLeft(scrollerEl), behavior: 'smooth'});
  }

  // 이전 칩 위치로 스크롤 이동
  function goPrevChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;

    var items = getChipItems(els);
    if (!items || !items.length) return;

    var x = scrollerEl.scrollLeft || 0;

    for (var i = items.length - 1; i >= 0; i -= 1) {
      var left = (items[i].offsetLeft || 0) - NAV_OFFSET;
      if (left < x - 1) {
        scrollerEl.scrollTo({left: left, behavior: 'smooth'});
        return;
      }
    }

    scrollerEl.scrollTo({left: 0, behavior: 'smooth'});
  }

  // 칩 존재 여부에 따라 칩/연관검색어 영역을 동기화
  function syncVisibility(els) {
    var show = hasAnyChip(els);

    setVisible(els.$chipUI, show);

    // 연관검색어는 초기 표시 상태거나 칩이 있을 때만 표시
    var initialShowRelated = els.$relatedUI.data('initial-show') === true;
    setVisible(els.$relatedUI, show || initialShowRelated);

    window.requestAnimationFrame(function () {
      updateNav(els);
    });
  }

  // input-search 공통 JS를 해당 폼/인풋에 연결
  function bindInputSearch(els) {
    if (!window.UI || !window.UI.inputSearch || typeof window.UI.inputSearch.init !== 'function') return;

    window.UI.inputSearch.init(
      {$form: els.$form, $input: els.$input, $validation: els.$validation},
      {
        onSubmit: function (query) {
          var q = normalizeQuery(query);
          if (!q) return false;

          // 중복이면 false 반환 → input-search가 invalid 처리
          if (hasChipValue(els, q)) return false;

          if (!appendChip(els, q)) return false;

          syncVisibility(els);

          els.$input.val('');
          window.requestAnimationFrame(function () {
            els.$input.trigger('focus');
          });

          return true;
        }
      }
    );
  }

  // PLP titlebar 내 이벤트들을 바인딩
  function bindEvents(els) {
    // 좌/우 버튼이 있으면 한 칩씩 이동
    if (els.$btnNext.length && els.$btnPrev.length) {
      els.$btnNext.on('click.plpResearch', function () {
        goNextChip(els);
        window.setTimeout(function () {
          updateNav(els);
        }, 0);
      });

      els.$btnPrev.on('click.plpResearch', function () {
        goPrevChip(els);
        window.setTimeout(function () {
          updateNav(els);
        }, 0);
      });
    }

    // 스크롤/리사이즈 시 네비 상태 갱신
    els.$scroller.on('scroll.plpResearch', function () {
      updateNav(els);
    });

    $(window).on('resize.plpResearch', function () {
      updateNav(els);
    });

    // 연관검색어 클릭 → 칩 추가(중복이면 invalid 표시)
    if (els.$relatedList.length) {
      els.$relatedList.on('click.plpResearch', '[data-keyword]', function (e) {
        e.preventDefault();

        var kw = normalizeQuery($(this).attr('data-keyword') || $(this).text());
        if (!kw) return;

        if (hasChipValue(els, kw)) {
          if (window.UI && window.UI.inputSearch && typeof window.UI.inputSearch.setInvalid === 'function') {
            window.UI.inputSearch.setInvalid({$input: els.$input, $validation: els.$validation}, true);
          }
          return;
        }

        if (appendChip(els, kw)) syncVisibility(els);

        if (window.UI && window.UI.inputSearch && typeof window.UI.inputSearch.setInvalid === 'function') {
          window.UI.inputSearch.setInvalid({$input: els.$input, $validation: els.$validation}, false);
        }
      });
    }

    // chip-button.js 삭제 이벤트 수신 → "현재 root 내부 칩 삭제"일 때만 동기화
    $(document).on('ui:chip-remove.plpResearch', function (e, payload) {
      var chipEl = payload && payload.chipEl ? payload.chipEl : null;
      if (!chipEl) {
        // payload가 없는 구버전이라면, 페이지가 분리된 전제에서만 동기화(최소 유지)
        window.requestAnimationFrame(function () {
          syncVisibility(els);
        });
        return;
      }

      if (!els.$root.length) return;
      if (!els.$root[0].contains(chipEl)) return;

      window.requestAnimationFrame(function () {
        syncVisibility(els);
      });
    });
  }

  function initRoot($root) {
    var els = getEls($root);

    if (!els.$form.length || !els.$input.length) return;
    if (!els.$chipUI.length || !els.$relatedUI.length) return;
    if (!els.$chipGroup.length) return;

    // 연관검색어가 초기에 표시되어야 하는지 확인하고 data에 저장
    var initialShowRelated = !els.$relatedUI.hasClass(CLS_HIDDEN);
    if (initialShowRelated) {
      els.$relatedUI.data('initial-show', true);
    }

    // 초기 숨김(칩 0개면 UI를 숨김)
    setVisible(els.$chipUI, false);

    // 초기 validation off
    if (window.UI && window.UI.inputSearch && typeof window.UI.inputSearch.setInvalid === 'function') {
      window.UI.inputSearch.setInvalid({$input: els.$input, $validation: els.$validation}, false);
    }

    syncVisibility(els);
    bindInputSearch(els);
    bindEvents(els);
  }

  window.UI.plpTitlebarResearch = {
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window, document);
