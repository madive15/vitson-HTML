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
 * @rule
 *  - 여러 버튼이 1개 레이어를 열 수 있음(동일 data-layer-target 공유 가능)
 *  - 옵션(lock/outside/esc/group)은 data-layer-box(박스) 우선, 없으면 버튼 값으로 판정
 * @option
 *  - data-layer-group="true"    : 동일 scope(또는 문서) 내 1개만 오픈
 *  - data-layer-outside="true"  : 바깥 클릭 시 close
 *  - data-layer-esc="true"      : ESC 닫기
 *  - data-layer-lock="true"     : body 스크롤 락(모달/바텀 권장)
 * @a11y
 *  - 동일 target의 모든 버튼 aria-expanded/aria-label 동기화
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[layer] jQuery not found');
    return;
  }

  window.UI = window.UI || {};
  window.UI.layer = window.UI.layer || {};

  var OPEN = 'is-open';
  var ACTIVE = 'is-active';
  var CLOSING = 'is-closing';
  var BODY_ACTIVE = 'is-layer-open';
  var CLOSE_FALLBACK_MS = 450;

  var SEL_BTN = '[data-layer-btn]';
  var SEL_BOX = '[data-layer-box]';
  var SEL_OPEN_BOX = SEL_BOX + '.' + OPEN;
  var SEL_CLOSE = '[data-layer-close]';

  var NS = '.uiLayer';

  // data-layer-box/target가 셀렉터로 안전하게 쓰이도록 최소 이스케이프 처리
  function escAttr(v) {
    var s = String(v == null ? '' : v);
    if (!s) return s;

    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s);
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  // camelCase 키를 data-xxxx로 변환
  function toDataAttrName(key) {
    return (
      'data-' +
      String(key || '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
    );
  }

  // data()/attr() 값들을 안전하게 boolean으로 변환
  function toBool(v) {
    if (v === true) return true;
    if (v === false) return false;
    if (v == null) return false;
    if (v === '') return true;

    var s = String(v).toLowerCase();
    return s === 'true' || s === '1';
  }

  // 옵션 값 읽기(박스 우선 → 없으면 버튼), 값이 없어도 "속성 존재"면 true 처리
  function readOptBool($box, $btn, key) {
    var attrName = toDataAttrName(key);

    if ($box && $box.length) {
      var boxData = $box.data(key);
      if (boxData !== undefined) return toBool(boxData);

      var boxAttr = $box.attr(attrName);
      if (boxAttr !== undefined) return toBool(boxAttr);
    }

    if ($btn && $btn.length) {
      var btnData = $btn.data(key);
      if (btnData !== undefined) return toBool(btnData);

      var btnAttr = $btn.attr(attrName);
      if (btnAttr !== undefined) return toBool(btnAttr);
    }

    return false;
  }

  // 동일 target 버튼 전체 조회
  function findBtnsByTarget(target) {
    if (!target) return $();
    return $('[data-layer-btn][data-layer-target="' + escAttr(target) + '"]');
  }

  // target 기준 레이어 박스 조회
  function findBoxByTarget(target) {
    if (!target) return $();
    return $('[data-layer-box="' + escAttr(target) + '"]').first();
  }

  // aria-expanded 기준으로 aria-label("... 열기/닫기") 동기화(옵션)
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;

    var expanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (expanded ? '닫기' : '열기'));
  }

  // 동일 target의 모든 버튼 aria 상태 동기화
  function syncBtnsA11y($btns, expanded) {
    if (!$btns || !$btns.length) return;

    $btns.each(function () {
      var $b = $(this);
      $b.attr('aria-expanded', expanded ? 'true' : 'false');
      syncAriaLabel($b);
    });
  }

  // body 스크롤 락 + 레이어 상태 클래스 동기화
  function syncBodyLock() {
    // 열려있는 박스 중 lock 옵션이 true인 게 하나라도 있으면 유지
    var needLock = false;

    $(SEL_OPEN_BOX).each(function () {
      var $box = $(this);
      var target = $box.attr('data-layer-box');
      var $btns = findBtnsByTarget(target);
      if (readOptBool($box, $btns.eq(0), 'layerLock')) needLock = true;
    });

    $('body').toggleClass(BODY_ACTIVE, needLock);
  }

  // 중복 close 방지 플래그
  function setClosingFlag($box, on) {
    $box.data('layerClosing', on === true);
  }
  function isClosing($box) {
    return $box.data('layerClosing') === true;
  }

  // 열기: display on → 다음 프레임에 is-active로 transition 실행
  function openLayer(target, $btn, $box) {
    var $btns = findBtnsByTarget(target);

    setClosingFlag($box, false);
    $box.removeClass(CLOSING).addClass(OPEN);

    syncBtnsA11y($btns, true);

    if (readOptBool($box, $btn, 'layerLock')) syncBodyLock();

    window.requestAnimationFrame(function () {
      $box.addClass(ACTIVE);
    });
  }

  // 닫기: is-active 제거 + is-closing 추가 → transition 후 display off
  function closeLayer(target, $btn, $box) {
    var $btns = findBtnsByTarget(target);

    if (!$box.hasClass(OPEN)) return;
    if (isClosing($box)) return;

    setClosingFlag($box, true);

    syncBtnsA11y($btns, false);

    $box.removeClass(ACTIVE).addClass(CLOSING);

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;

      $box.off('transitionend' + NS + 'Close');
      $box.removeClass(CLOSING).removeClass(OPEN);

      setClosingFlag($box, false);

      syncBodyLock();
    }

    // transitionend는 여러 번 올 수 있으니 opacity 1회만 처리
    $box.off('transitionend' + NS + 'Close').on('transitionend' + NS + 'Close', function (e) {
      if (e.target !== $box[0]) return;

      var pn = e.originalEvent && e.originalEvent.propertyName;
      if (pn && pn !== 'opacity') return;

      finish();
    });

    window.setTimeout(function () {
      finish();
    }, CLOSE_FALLBACK_MS);
  }

  // group 옵션이면 열린 레이어를 전부 닫음
  function closeAll() {
    $(SEL_OPEN_BOX).each(function () {
      var $box = $(this);
      var target = $box.attr('data-layer-box');
      if (!target) return;

      // 버튼 하나를 대표로 넘기되, 내부에서 버튼 전체 동기화 처리
      var $btn = findBtnsByTarget(target).first();
      closeLayer(target, $btn, $box);
    });
  }

  // 바깥 클릭 닫기(옵션): 열려있는 박스만 순회
  function onOutsideClick(e) {
    var $t = $(e.target);

    $(SEL_OPEN_BOX).each(function () {
      var $box = $(this);
      var target = $box.attr('data-layer-box');
      if (!target) return;

      var $btns = findBtnsByTarget(target);
      var $btn = $btns.first();
      if (!$btn.length) return;

      if (!readOptBool($box, $btn, 'layerOutside')) return;

      // 레이어 내부 클릭은 무시
      if ($box.has($t).length) return;

      // 어떤 트리거 버튼 클릭은 토글 핸들러가 처리
      if ($btns.is($t) || $btns.has($t).length) return;

      closeLayer(target, $btn, $box);
    });
  }

  // ESC 닫기(옵션): 열려있는 박스만 순회
  function onEsc(e) {
    if (e.key !== 'Escape') return;

    $(SEL_OPEN_BOX).each(function () {
      var $box = $(this);
      var target = $box.attr('data-layer-box');
      if (!target) return;

      var $btns = findBtnsByTarget(target);
      var $btn = $btns.first();
      if (!$btn.length) return;

      if (!readOptBool($box, $btn, 'layerEsc')) return;

      closeLayer(target, $btn, $box);
    });
  }

  // 트리거 토글
  function onToggle(e) {
    e.preventDefault();

    var $btn = $(this);
    var target = $btn.data('layerTarget');
    if (!target) return;

    var $box = findBoxByTarget(target);
    if (!$box.length) return;

    var isOpen = $box.hasClass(OPEN);

    // group 옵션은 열기 전에만 전체 닫기
    if (!isOpen && readOptBool($box, $btn, 'layerGroup')) closeAll();

    if (isOpen) closeLayer(target, $btn, $box);
    else openLayer(target, $btn, $box);
  }

  // 레이어 내부 닫기 버튼
  function onInnerClose(e) {
    e.preventDefault();

    var $box = $(this).closest(SEL_BOX);
    if (!$box.length) return;

    var target = $box.attr('data-layer-box');
    if (!target) return;

    var $btn = findBtnsByTarget(target).first();
    closeLayer(target, $btn, $box);
  }

  // 이벤트 바인딩(1회)
  function bind() {
    $(document)
      .off('click' + NS, SEL_BTN)
      .on('click' + NS, SEL_BTN, onToggle);

    $(document)
      .off('click' + NS + 'InnerClose', SEL_CLOSE)
      .on('click' + NS + 'InnerClose', SEL_CLOSE, onInnerClose);

    $(document)
      .off('click' + NS + 'Outside')
      .on('click' + NS + 'Outside', onOutsideClick);

    $(document)
      .off('keydown' + NS + 'Esc')
      .on('keydown' + NS + 'Esc', onEsc);
  }

  // 이벤트 언바인딩(페이지 전환/테스트용)
  function unbind() {
    $(document).off(NS);
    $(document).off(NS + 'InnerClose');
    $(document).off(NS + 'Outside');
    $(document).off(NS + 'Esc');
  }

  window.UI.layer.init = function () {
    if (window.UI.layer.__bound) return;

    bind();
    window.UI.layer.__bound = true;

    // 초기 상태에 열린 레이어가 있으면 body lock 동기화
    syncBodyLock();

    console.log('[layer] init');
  };

  window.UI.layer.destroy = function () {
    if (!window.UI.layer.__bound) return;

    unbind();
    window.UI.layer.__bound = false;

    console.log('[layer] destroy');
  };

  window.UI.layer.closeAll = closeAll;

  console.log('[layer] module loaded');
})(window.jQuery || window.$, window, document);
