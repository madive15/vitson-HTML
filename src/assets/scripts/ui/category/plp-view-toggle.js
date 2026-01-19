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
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var SECTION = '.vits-product-section';

  var TOGGLE_BTN = '[data-plp-view-toggle]';
  var TARGET = '[data-plp-view-list]';

  // 버튼/타겟 공통 타입 클래스(요구사항: view-list <-> view-thumb)
  var TYPE_LIST = 'view-list';
  var TYPE_THUMB = 'view-thumb';

  // 타입 클래스가 없으면 기본값(list) 부여 + 중복 방지(항상 1개만 유지)
  function ensureInitialType($el) {
    if (!$el || !$el.length) return;

    var hasList = $el.hasClass(TYPE_LIST);
    var hasThumb = $el.hasClass(TYPE_THUMB);

    if (!hasList && !hasThumb) $el.addClass(TYPE_LIST);
    if (hasList && hasThumb) $el.removeClass(TYPE_THUMB);
  }

  // 현재 thumb 여부 반환
  function isThumb($el) {
    return $el && $el.length ? $el.hasClass(TYPE_THUMB) : false;
  }

  // 해당 엘리먼트의 타입 클래스 교체 후 현재 thumb 여부 반환
  function toggleType($el) {
    if (!$el || !$el.length) return false;

    if ($el.hasClass(TYPE_THUMB)) {
      $el.removeClass(TYPE_THUMB).addClass(TYPE_LIST); // view-thumb -> view-list
      return false;
    }

    $el.removeClass(TYPE_LIST).addClass(TYPE_THUMB); // view-list -> view-thumb
    return true;
  }

  // 버튼 aria/상태 동기화 + 버튼 타입 클래스 교체
  function syncBtnState($btn, thumb) {
    if (!$btn || !$btn.length) return;

    // 토글 버튼 접근성: 현재 상태를 pressed로 표현
    $btn.attr('aria-pressed', thumb ? 'true' : 'false');

    // 라벨은 "다음 동작" 기준(리스트 상태면 썸네일 전환, 썸네일 상태면 리스트 전환)
    $btn.attr('aria-label', thumb ? '리스트형 전환' : '썸네일형 전환');

    // 요구사항: 버튼도 view-list <-> view-thumb로 직접 교체
    $btn.toggleClass(TYPE_THUMB, !!thumb);
    $btn.toggleClass(TYPE_LIST, !thumb);
  }

  // 섹션 단위로 타겟 찾기(복수 PLP 대응)
  function getTargetByBtn($btn) {
    var $section = $btn.closest(SECTION);
    return ($section.length ? $section : $(document)).find(TARGET).first();
  }

  // 이벤트 바인딩
  function bind() {
    // 문서 델리게이션(동적 렌더/재바인딩 이슈 방지)
    $(document).on('click.plpViewToggle', TOGGLE_BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $target = getTargetByBtn($btn);

      // 버튼/타겟 모두 타입 클래스 보정(마크업 누락 대비)
      ensureInitialType($btn);
      ensureInitialType($target);

      // 타겟 기준으로 토글(상태의 단일 기준)
      var nowThumb = toggleType($target);

      // 버튼도 동일 상태로 맞춤
      syncBtnState($btn, nowThumb);
    });

    // 초기 상태 동기화(타겟 기준으로 버튼 클래스/aria 맞춤)
    $(TOGGLE_BTN).each(function () {
      var $btn = $(this);
      var $target = getTargetByBtn($btn);

      ensureInitialType($btn);
      ensureInitialType($target);

      syncBtnState($btn, isThumb($target));
    });
  }

  window.UI.plpViewToggle = {
    init: function () {
      bind();
    }
  };
})(window.jQuery || window.$, window, document);
