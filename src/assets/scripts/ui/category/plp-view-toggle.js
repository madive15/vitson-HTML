/**
 * @file scripts/ui/category/plp-view-toggle.js
 * @purpose PLP 상품목록 뷰 타입 토글(리스트/썸네일): 버튼/목록 컨테이너 클래스(view-list/view-thumb) 전환 + aria 동기화
 * @scope [data-plp-view-toggle] / [data-plp-view-list] 주변(가까운 .vits-product-section)만 제어
 *
 * @assumption
 *  - 토글 버튼: [data-plp-view-toggle] (1개 버튼 토글 방식)
 *  - 변경 대상: [data-plp-view-list] (ex. .product-list)
 *  - 타입 클래스: view-list / view-thumb (둘 중 하나만 유지, 버튼/타겟 동일 규칙)
 *
 * @event
 *  - click.plpViewToggle: 버튼 클릭 시 타입 전환
 *
 * @maintenance
 *  - 페이지 내 PLP 섹션이 여러 개일 수 있어 closest('.vits-product-section') 기준으로 타겟을 찾음
 *  - 초기 타입 클래스가 없으면 view-list로 보정(마크업 누락 대비)
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'plpViewToggle';
  var NS = '.' + MODULE_KEY;

  var SECTION = '.vits-product-section';
  var TOGGLE_BTN = '[data-plp-view-toggle]';
  var TARGET = '[data-plp-view-list]';

  var TYPE_LIST = 'view-list';
  var TYPE_THUMB = 'view-thumb';

  // 타입 클래스 보정(누락 대비) + 중복 방지(항상 1개만 유지)
  function normalizeTypeClass($el) {
    if (!$el || !$el.length) return;

    var hasList = $el.hasClass(TYPE_LIST);
    var hasThumb = $el.hasClass(TYPE_THUMB);

    // 아무 것도 없으면 list 기본
    if (!hasList && !hasThumb) {
      $el.addClass(TYPE_LIST);
      return;
    }

    // 둘 다 있으면 list만 유지(정책: 1개만)
    if (hasList && hasThumb) $el.removeClass(TYPE_THUMB);
  }

  // thumb 여부
  function isThumb($el) {
    return $el && $el.length ? $el.hasClass(TYPE_THUMB) : false;
  }

  // 타입을 thumb 기준으로 강제 적용
  function applyType($el, thumb) {
    if (!$el || !$el.length) return;

    $el.toggleClass(TYPE_THUMB, !!thumb);
    $el.toggleClass(TYPE_LIST, !thumb);
  }

  // 타겟의 타입 토글 후 결과(thumb 여부) 반환
  function toggleTargetType($target) {
    if (!$target || !$target.length) return false;

    var nowThumb = !$target.hasClass(TYPE_THUMB);
    applyType($target, nowThumb);
    return nowThumb;
  }

  // 버튼 aria/상태 동기화(요구사항: 버튼도 타입 클래스 동일 규칙)
  function syncBtnState($btn, thumb) {
    if (!$btn || !$btn.length) return;

    $btn.attr('aria-pressed', thumb ? 'true' : 'false');
    $btn.attr('aria-label', thumb ? '리스트형 전환' : '썸네일형 전환');

    applyType($btn, thumb);
  }

  // 섹션 단위로 타겟 찾기(복수 PLP 대응)
  function getTargetByBtn($btn) {
    var $section = $btn.closest(SECTION);
    return ($section.length ? $section : $(document)).find(TARGET).first();
  }

  // 클릭 1회 처리(타겟 기준 단일 소스)
  function handleToggle($btn) {
    var $target = getTargetByBtn($btn);

    // 마크업 누락 대비 보정(버튼/타겟)
    normalizeTypeClass($btn);
    normalizeTypeClass($target);

    // 타겟 토글 → 버튼 동기화
    var nowThumb = toggleTargetType($target);
    syncBtnState($btn, nowThumb);
  }

  // 초기 상태 동기화(타겟 기준으로 버튼 클래스/aria 맞춤)
  function syncInitialState() {
    $(TOGGLE_BTN).each(function () {
      var $btn = $(this);
      var $target = getTargetByBtn($btn);

      normalizeTypeClass($btn);
      normalizeTypeClass($target);

      syncBtnState($btn, isThumb($target));
    });
  }

  // 이벤트 바인딩(init 재호출 대비)
  function bind() {
    $(document)
      .off('click' + NS, TOGGLE_BTN)
      .on('click' + NS, TOGGLE_BTN, function (e) {
        e.preventDefault();
        handleToggle($(this));
      });
  }

  window.UI.plpViewToggle = {
    init: function () {
      bind();
      syncInitialState();
    },
    destroy: function () {
      $(document).off(NS);
    }
  };
})(window.jQuery || window.$, window, document);
