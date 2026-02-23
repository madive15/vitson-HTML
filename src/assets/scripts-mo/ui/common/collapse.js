/**
 * @file scripts-mo/ui/common/collapse.js
 * @description data-속성 기반 더보기/접기 공통 (모바일)
 * @scope [data-collapse]
 *
 * @mapping [data-collapse-btn] ↔ [data-collapse-content]
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @option
 *  - data-visible-count="N"       : N개까지만 노출 (개수 기반, dt+dd 쌍 대응)
 *  - data-visible-height="N"      : Npx까지만 노출 (높이 기반, 인라인 스타일)
 *  - data-visible-hidden           : 콘텐츠 전체 숨김 → 버튼으로 노출 (CSS 트랜지션)
 *  - data-aria-label-base="..."   : aria-label 접두어 (예: "혜택")
 *  - data-aria-label-pair="A,B"   : 닫힘/열림 라벨 (기본: "열기,닫기")
 *
 * @a11y aria-expanded 제어, aria-label 상태별 동기화
 *
 * @note
 *  - 콘텐츠가 기준 이하면 버튼 자동 숨김 (hidden)
 *  - 개수 모드: is-hidden 클래스로 개별 아이템 숨김
 *  - 높이 모드: data 속성값 기반 인라인 max-height 제어
 *  - 숨김 모드: is-open 클래스만 토글, CSS 트랜지션 전담 (_collapse.scss)
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiCollapse';
  var ROOT = '[data-collapse]';
  var CONTENT = '[data-collapse-content]';
  var BTN = '[data-collapse-btn]';
  var ACTIVE = 'is-open';
  var HIDDEN = 'is-hidden';
  var DEFAULT_PAIR = '열기,닫기';

  var _bound = false;

  // 모드 판별
  function getMode($content) {
    if ($content.is('[data-visible-count]')) return 'count';
    if ($content.is('[data-visible-height]')) return 'height';
    if ($content.is('[data-visible-hidden]')) return 'hidden';
    return null;
  }

  // 개수 기반: 자식 아이템 조회 (dt+dd 쌍 대응)
  function getCountItems($content) {
    var hasDt = $content.children('dt').length > 0;
    return {
      $items: hasDt ? $content.children('dt') : $content.children(),
      hasDt: hasDt
    };
  }

  // aria-label 동기화
  function syncAriaLabel($btn, isOpen) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;

    var pairStr = $btn.attr('data-aria-label-pair') || DEFAULT_PAIR;
    var pair = pairStr.split(',').map(function (s) {
      return s.trim();
    });
    $btn.attr('aria-label', base + ' ' + (isOpen ? pair[1] : pair[0]));
  }

  // 개수 기반: N번째 이후 아이템 is-hidden 토글
  function applyCount($content, isOpen) {
    var count = parseInt($content.data('visibleCount'), 10);
    var result = getCountItems($content);

    result.$items.each(function (i) {
      if (i < count) return;

      var $item = $(this);
      var $pair = result.hasDt ? $item.add($item.next('dd')) : $item;
      $pair.toggleClass(HIDDEN, !isOpen);
    });
  }

  // 높이 기반: data 속성값으로 max-height 제어
  function applyHeight($content, isOpen) {
    if (isOpen) {
      $content.css({maxHeight: 'none', overflow: 'visible'});
    } else {
      $content.css({maxHeight: $content.data('visibleHeight'), overflow: 'hidden'});
    }
  }

  function open($btn, $content, $root) {
    var mode = getMode($content);

    $root.addClass(ACTIVE);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn, true);

    if (mode === 'count') applyCount($content, true);
    else if (mode === 'height') applyHeight($content, true);
    // hidden 모드는 is-open 클래스만으로 CSS가 트랜지션 처리
  }

  function close($btn, $content, $root) {
    var mode = getMode($content);

    $root.removeClass(ACTIVE);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn, false);

    if (mode === 'count') applyCount($content, false);
    else if (mode === 'height') applyHeight($content, false);
  }

  // 높이 모드 버튼 판별 (이미지 로드 완료 후 scrollHeight 재측정)
  function checkHeightNeedBtn($content, $btn) {
    var visibleH = parseInt($content.data('visibleHeight'), 10);

    function evaluate() {
      // 팝업 등 비가시 영역은 scrollHeight가 0 → 버튼 숨기지 않음
      if ($content[0].scrollHeight === 0) return;
      $btn.prop('hidden', $content[0].scrollHeight <= visibleH);
    }

    var $imgs = $content.find('img');
    var total = $imgs.length;

    // 이미지 없으면 즉시 판별
    if (!total) {
      evaluate();
      return;
    }

    var loaded = 0;

    function onLoad() {
      loaded++;
      if (loaded >= total) evaluate();
    }

    $imgs.each(function () {
      if (this.complete) {
        onLoad();
      } else {
        $(this).one('load error', onLoad);
      }
    });
  }

  // 콘텐츠가 기준 이하면 버튼 숨김
  function checkNeedBtn($content, $btn) {
    var mode = getMode($content);

    if (mode === 'count') {
      var result = getCountItems($content);
      var count = parseInt($content.data('visibleCount'), 10);
      $btn.prop('hidden', result.$items.length <= count);
    } else if (mode === 'height') {
      checkHeightNeedBtn($content, $btn);
    }
    // hidden 모드는 항상 버튼 필요
  }

  // 초기 상태 세팅
  function setupAll() {
    $(ROOT).each(function () {
      var $root = $(this);
      var $content = $root.find(CONTENT);
      var $btn = $root.find(BTN);
      if (!$content.length || !$btn.length) return;

      var mode = getMode($content);
      if (!mode) return;

      // 초기 aria-expanded 명시
      $btn.attr('aria-expanded', 'false');

      // 접힌 초기 상태 적용
      if (mode === 'count') applyCount($content, false);
      else if (mode === 'height') applyHeight($content, false);
      // hidden 모드는 CSS 기본 상태가 접힌 상태

      syncAriaLabel($btn, false);
      checkNeedBtn($content, $btn);
    });
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $root = $btn.closest(ROOT);
      if (!$root.length) return;

      var $content = $root.find(CONTENT);
      if (!$content.length) return;

      var isOpen = $root.hasClass(ACTIVE);

      if (isOpen) {
        close($btn, $content, $root);
      } else {
        open($btn, $content, $root);
      }
    });
  }

  function init() {
    setupAll();
    bind();
  }

  function destroy() {
    $(document).off(NS);
    _bound = false;

    // 상태 복원
    $(CONTENT).each(function () {
      $(this).removeAttr('style').children().removeClass(HIDDEN);
    });
    $(ROOT).removeClass(ACTIVE);
  }

  // 외부에서 가시 상태 변경 후 재판별 호출용
  function refresh($scope) {
    var $target = $scope ? $($scope).find(ROOT) : $(ROOT);

    $target.each(function () {
      var $root = $(this);
      var $content = $root.find(CONTENT);
      var $btn = $root.find(BTN);
      if (!$content.length || !$btn.length) return;

      checkNeedBtn($content, $btn);
    });
  }

  window.UI.collapse = {
    init: init,
    destroy: destroy,
    refresh: refresh
  };
})(window.jQuery, window);
