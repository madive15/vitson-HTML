/**
 * @file scripts/ui/layer.js
 * @purpose data-속성 기반 레이어(모달/바텀시트/토스트) 공통 + 열림/닫힘 애니메이션(등장/퇴장)
 * @description
 *  - 매핑: [data-layer-btn][data-layer-target] ↔ [data-layer-box="target"]
 *  - 상태:
 *    - is-open    : display 제어(렌더링 on/off)
 *    - is-active  : 실제 노출 상태(등장 완료)
 *    - is-closing : 퇴장 애니메이션 중
 *  - aria-expanded는 즉시 동기화(접근성), 화면 전환은 CSS transition으로 처리
 * @option
 *  - data-layer-group="true"    : 동일 scope(또는 문서) 내 1개만 오픈
 *  - data-layer-outside="true"  : 바깥 클릭 시 close
 *  - data-layer-esc="true"      : ESC 닫기
 *  - data-layer-lock="true"     : body 스크롤 락(모달/바텀 권장)
 * @a11y
 *  - 버튼 aria-expanded만 제어(aria-controls는 마크업 선택)
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[layer] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var OPEN = 'is-open'; // display on
  var ACTIVE = 'is-active'; // visible on
  var CLOSING = 'is-closing';
  var BODY_ACTIVE = 'is-layer-open';
  var CLOSE_FALLBACK_MS = 450; // CSS transition 0.35s 기준 여유 포함

  // syncAriaLabel: aria-expanded(true/false)에 맞춰 aria-label("... 열기/닫기") 동기화(옵션)
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;

    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }

  // getPair: 버튼 기준으로 대상 레이어 박스 찾기
  function getPair($btn) {
    var target = $btn.data('layerTarget');
    if (!target) return null;

    var $box = $('[data-layer-box="' + target + '"]').first();
    if (!$box.length) return null;

    return {target: target, $box: $box};
  }

  // lockScroll: body 스크롤 락(옵션)
  function lockScroll(shouldLock) {
    if (shouldLock) $('body').addClass(BODY_ACTIVE);
    else $('body').removeClass(BODY_ACTIVE);
  }

  // 내부 상태 플래그(중복 close 방지)
  function setClosingFlag($box, v) {
    $box.data('layerClosing', v === true);
  }
  function isClosing($box) {
    return $box.data('layerClosing') === true;
  }

  // open: display 켠 뒤 다음 프레임에 is-active를 붙여 transition 확실히 실행
  function open($btn, $box) {
    var shouldLock = $btn.data('layerLock') === true;

    // 닫힘 진행 중 상태 정리
    setClosingFlag($box, false);
    $box.removeClass(CLOSING);

    // 렌더링 on
    $box.addClass(OPEN);

    // a11y 즉시 동기화
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);

    if (shouldLock) lockScroll(true);

    // 다음 프레임에 visible on
    window.requestAnimationFrame(function () {
      $box.addClass(ACTIVE);
    });
  }

  // close: is-active 제거 + is-closing 추가로 퇴장 transition 실행 후, 끝나면 is-open 제거(display off)
  function close($btn, $box) {
    var shouldLock = $btn.data('layerLock') === true;

    if (!$box.hasClass(OPEN)) return;
    if (isClosing($box)) return;
    setClosingFlag($box, true);

    // a11y 즉시 동기화(사용자 입력 기준으로 닫힘 확정)
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);

    // 퇴장 애니메이션 시작
    $box.removeClass(ACTIVE).addClass(CLOSING);

    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;

      // display off
      $box.removeClass(CLOSING).removeClass(OPEN);
      setClosingFlag($box, false);

      if (shouldLock) lockScroll(false);
    };

    // transitionend는 여러 번 올 수 있으니 opacity 1회만 사용
    $box.off('transitionend.uiLayerClose').on('transitionend.uiLayerClose', function (e) {
      if (e.target !== $box[0]) return;
      if (e.originalEvent && e.originalEvent.propertyName && e.originalEvent.propertyName !== 'opacity') return;

      $box.off('transitionend.uiLayerClose');
      finish();
    });

    // fallback(transitionend 미발생 대비)
    window.setTimeout(function () {
      $box.off('transitionend.uiLayerClose');
      finish();
    }, CLOSE_FALLBACK_MS);
  }

  // closeAll: 열린 레이어 전부 닫기(그룹/전역 정리)
  function closeAll() {
    $('[data-layer-box].' + OPEN).each(function () {
      var $box = $(this);
      var target = $box.attr('data-layer-box');

      var $btn = $('[data-layer-btn][data-layer-target="' + target + '"]').first();
      if (!$btn.length) return;

      close($btn, $box);
    });
  }

  // outside close: 바깥 클릭 닫기(옵션)
  function bindOutsideClose() {
    $(document).on('click.uiLayerOutside', function (e) {
      $('[data-layer-box].' + OPEN).each(function () {
        var $box = $(this);

        var target = $box.attr('data-layer-box');
        var $btn = $('[data-layer-btn][data-layer-target="' + target + '"]').first();
        if (!$btn.length) return;

        var outside = $btn.data('layerOutside') === true;
        if (!outside) return;

        // 레이어 내부 클릭은 무시
        if ($box.has(e.target).length) return;

        // 버튼 자체 클릭으로 들어온 이벤트는 무시(토글 핸들러가 처리)
        if ($btn.is(e.target) || $btn.has(e.target).length) return;

        close($btn, $box);
      });
    });
  }

  // esc close: ESC 닫기(옵션)
  function bindEscClose() {
    $(document).on('keydown.uiLayerEsc', function (e) {
      if (e.key !== 'Escape') return;

      $('[data-layer-box].' + OPEN).each(function () {
        var $box = $(this);
        var target = $box.attr('data-layer-box');
        var $btn = $('[data-layer-btn][data-layer-target="' + target + '"]').first();
        if (!$btn.length) return;

        var esc = $btn.data('layerEsc') === true;
        if (!esc) return;

        close($btn, $box);
      });
    });
  }

  // init
  function bind() {
    // 트리거
    $(document).on('click.uiLayer', '[data-layer-btn]', function (e) {
      e.preventDefault();

      var $btn = $(this);
      var pair = getPair($btn);
      if (!pair) return;

      var $box = pair.$box;
      var isOpen = $box.hasClass(OPEN);

      var isGroup = $btn.data('layerGroup') === true;
      if (!isOpen && isGroup) closeAll();

      if (isOpen) close($btn, $box);
      else open($btn, $box);
    });

    // 레이어 내부 닫기 버튼
    $(document).on('click.uiLayerClose', '[data-layer-close]', function (e) {
      e.preventDefault();

      var $box = $(this).closest('[data-layer-box]');
      if (!$box.length) return;

      var target = $box.attr('data-layer-box');
      var $btn = $('[data-layer-btn][data-layer-target="' + target + '"]').first();
      if (!$btn.length) return;

      close($btn, $box);
    });

    bindOutsideClose();
    bindEscClose();
  }

  window.UI.layer = {
    init: function () {
      bind();
      console.log('[layer] init');
    },
    closeAll: closeAll
  };

  console.log('[layer] module loaded');
})(window.jQuery || window.$, window, document);
