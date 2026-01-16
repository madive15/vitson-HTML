/**
 * @file scripts/ui/category/plp-titlebar-research.js
 * @purpose PLP 결과 내 재검색: submit 시 칩 생성 + 삭제(기존 UI.chipButton) + 좌/우(한 칩씩) + 연관검색어 노출
 * @assumption
 *  - root: .vits-plp-titlebar
 *  - search form: [data-search-form], input: [data-search-input]
 *  - chip ui: [data-chip-ui] 내부
 *    - scroller: [data-chip-scroller] (가로 스크롤 컨테이너)
 *    - group: .vits-chip-button-group (칩 컨테이너, UI.chipButton의 위임 대상)
 *    - nav: [data-chip-prev], [data-chip-next] (있으면 한 칩씩 이동)
 *  - related ui: [data-related-ui], list: [data-related-list]
 *  - remove: [data-chip-action="remove"] → UI.chipButton가 DOM 제거 + ui:chip-remove 트리거
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var ROOT_SEL = '.vits-plp-titlebar';
  var CLS_HIDDEN = 'is-hidden';

  function getEls($root) {
    var $form = $root.find('[data-search-form]').first();
    var $input = $root.find('[data-search-input]').first();

    var $chipUI = $root.find('[data-chip-ui]').first();
    var $relatedUI = $root.find('[data-related-ui]').first();

    // 칩 컨테이너(삭제 위임 대상)
    var $chipGroup = $chipUI.find('.vits-chip-button-group').first();

    // 스크롤 컨테이너(없으면 group을 스크롤 컨테이너로 사용)
    var $scroller = $chipUI.find('[data-chip-scroller]').first();
    if (!$scroller.length) $scroller = $chipGroup;

    var $btnPrev = $chipUI.find('[data-chip-prev]').first();
    var $btnNext = $chipUI.find('[data-chip-next]').first();

    var $relatedList = $relatedUI.find('[data-related-list]').first();

    return {
      $root: $root,

      $form: $form,
      $input: $input,

      $chipUI: $chipUI,
      $chipGroup: $chipGroup,
      $scroller: $scroller,
      $btnPrev: $btnPrev,
      $btnNext: $btnNext,

      $relatedUI: $relatedUI,
      $relatedList: $relatedList
    };
  }

  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }

  function setVisible($el, on) {
    if (!$el || !$el.length) return;
    $el.toggleClass(CLS_HIDDEN, !on);
  }

  function hasAnyChip(els) {
    return els.$chipGroup && els.$chipGroup.length && els.$chipGroup.find('.vits-chip-button').length > 0;
  }

  function hasChipValue(els, value) {
    if (!els.$chipGroup || !els.$chipGroup.length) return false;
    return els.$chipGroup.find('.vits-chip-button[data-chip-value="' + value + '"]').length > 0;
  }

  // 칩 DOM 추가(삭제는 UI.chipButton이 처리)
  function appendChip(els, text) {
    var v = trimText(text);
    if (!v) return false;

    // 중복 방지
    if (hasChipValue(els, v)) return false;

    // chip-button.ejs action='x' 형태에 맞춤(아이콘은 CSS로 처리 권장)
    var html =
      '' +
      '<div class="vits-chip-button type-outline" data-chip-value="' +
      v +
      '">' +
      '  <span class="text">' +
      v +
      '</span>' +
      '  <button type="button" class="remove" data-chip-action="remove" aria-label="' +
      v +
      ' 삭제">' +
      '    <span class="ic ic-x" aria-hidden="true"></span>' +
      '  </button>' +
      '</div>';

    els.$chipGroup.append(html);
    return true;
  }

  function getMaxScrollLeft(scrollerEl) {
    return Math.max(0, (scrollerEl.scrollWidth || 0) - (scrollerEl.clientWidth || 0));
  }

  function updateNav(els) {
    // 버튼이 없으면(마크업 미추가) 네비 기능 자체를 생략
    if (!els.$btnPrev.length || !els.$btnNext.length) return;

    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;

    var max = getMaxScrollLeft(scrollerEl);
    var x = scrollerEl.scrollLeft || 0;

    // 1px 오차 보정(모바일 관성 스크롤)
    els.$btnPrev.prop('disabled', x <= 1);
    els.$btnNext.prop('disabled', x >= max - 1);
  }

  function getChipItems(els) {
    if (!els.$chipGroup.length) return [];
    return els.$chipGroup[0].querySelectorAll('.vits-chip-button');
  }

  // 한 칩씩 이동(다음)
  function goNextChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;

    var items = getChipItems(els);
    if (!items || !items.length) return;

    var x = scrollerEl.scrollLeft || 0;

    for (var i = 0; i < items.length; i += 1) {
      var left = items[i].offsetLeft || 0;
      if (left > x + 1) {
        scrollerEl.scrollTo({left: left, behavior: 'smooth'});
        return;
      }
    }

    scrollerEl.scrollTo({left: getMaxScrollLeft(scrollerEl), behavior: 'smooth'});
  }

  // 한 칩씩 이동(이전)
  function goPrevChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;

    var items = getChipItems(els);
    if (!items || !items.length) return;

    var x = scrollerEl.scrollLeft || 0;

    for (var i = items.length - 1; i >= 0; i -= 1) {
      var left = items[i].offsetLeft || 0;
      if (left < x - 1) {
        scrollerEl.scrollTo({left: left, behavior: 'smooth'});
        return;
      }
    }

    scrollerEl.scrollTo({left: 0, behavior: 'smooth'});
  }

  function syncVisibility(els) {
    var show = hasAnyChip(els);
    setVisible(els.$chipUI, show);
    setVisible(els.$relatedUI, show);

    window.requestAnimationFrame(function () {
      updateNav(els);
    });
  }

  function bindEvents(els) {
    // 검색 submit: 페이지 이동 막고 칩 생성
    els.$form.on('submit.plpResearch', function (e) {
      e.preventDefault();

      var q = normalizeSpaces(els.$input.val());
      if (!q) return;

      var tokens = q.split(' ');
      var changed = false;

      for (var i = 0; i < tokens.length; i += 1) {
        if (appendChip(els, tokens[i])) changed = true;
      }

      if (!changed) return;

      syncVisibility(els);

      // 추가 성공 시 입력창 비우고 포커스 유지
      els.$input.val('');
      window.requestAnimationFrame(function () {
        els.$input.trigger('focus');
      });
    });

    // 좌/우 버튼(있을 때만)
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

    // 스크롤/리사이즈 시 버튼 상태 갱신
    els.$scroller.on('scroll.plpResearch', function () {
      updateNav(els);
    });

    $(window).on('resize.plpResearch', function () {
      updateNav(els);
    });

    // 연관검색어 클릭 → 칩 추가(원치 않으면 제거)
    if (els.$relatedList.length) {
      els.$relatedList.on('click.plpResearch', '[data-related-item]', function (e) {
        e.preventDefault();

        var kw = trimText($(this).text());
        if (!kw) return;

        if (appendChip(els, kw)) syncVisibility(els);
      });
    }

    // chip-button.js 삭제 후 커스텀 이벤트 수신 → 노출/네비 동기화
    $(document).on('ui:chip-remove.plpResearch', function () {
      window.requestAnimationFrame(function () {
        syncVisibility(els);
      });
    });
  }

  function initRoot($root) {
    var els = getEls($root);

    // 필수
    if (!els.$form.length || !els.$input.length) return;
    if (!els.$chipUI.length || !els.$relatedUI.length) return;
    if (!els.$chipGroup.length) return; // 현재 구조에서 가장 중요

    // 초기 숨김
    setVisible(els.$chipUI, false);
    setVisible(els.$relatedUI, false);

    syncVisibility(els);
    bindEvents(els);
  }

  window.UI.plpTitlebarResearch = {
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);
