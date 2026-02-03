/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 19:
/***/ (function() {

/**
 * @file scripts/ui/filter-expand.js
 * @purpose 필터 항목 펼치기/접기(아이템 단위 토글)
 * @scope .filter-box-item 내부에서만 동작, 이벤트는 document 위임
 * @rule 버튼 클릭 → 해당 아이템의 chip-group is-open 토글 + aria-expanded/텍스트 갱신
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.filterExpand = window.UI.filterExpand || {};
  var NS = '.uiFilterExpand';
  var ITEM = '.filter-box-item';
  var BTN = '.vits-filter-more';
  var GROUP = '.filter-chip-group';
  var ACTIVE = 'is-open';
  var TEXT = '.text';
  var CHIP = '.filter-chip';
  var CHIP_ACTIVE = 'is-active';
  var RESET_BTN = '.filter-box-buttons [type="reset"]';
  var MODAL = '[data-toggle-box="vits-options-modal"]';
  var MODAL_BTN = '[data-toggle-btn][data-toggle-target="vits-options-modal"]';
  var MODAL_DIM = '[data-toggle-dim="vits-options-modal"]';
  var BODY_SCOPE = 'body.vits-scope';
  function setButtonState($btn, isOpen) {
    $btn.attr('aria-expanded', isOpen ? 'true' : 'false');
    var $text = $btn.find(TEXT).first();
    if ($text.length) {
      $text.text(isOpen ? '접기' : '더보기');
    }
  }
  function toggleItem($item, $btn) {
    var $group = $item.find(GROUP).first();
    if (!$group.length) return;
    var isOpen = $group.hasClass(ACTIVE);
    $group.toggleClass(ACTIVE, !isOpen);
    setButtonState($btn, !isOpen);
  }
  function syncModalScrollLock() {
    var isOpen = $(MODAL).first().hasClass(ACTIVE);
    $(BODY_SCOPE).css('overflow', isOpen ? 'hidden' : '');
  }
  function closeModal() {
    var $box = $(MODAL).first();
    if (!$box.length) return;
    $box.removeClass(ACTIVE);
    $(MODAL_BTN).attr('aria-expanded', 'false');
    syncModalScrollLock();
  }
  function bind() {
    $(document).off('click' + NS, BTN).on('click' + NS, BTN, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $item = $btn.closest(ITEM);
      if (!$item.length) return;
      toggleItem($item, $btn);
    });
    $(document).off('click' + NS, CHIP).on('click' + NS, CHIP, function (e) {
      e.preventDefault();
      var $chip = $(this);
      if ($chip.is(':disabled')) return;
      var isActive = $chip.hasClass(CHIP_ACTIVE);
      $chip.toggleClass(CHIP_ACTIVE, !isActive);
      $chip.attr('aria-pressed', !isActive ? 'true' : 'false');
    });
    $(document).off('click' + NS, RESET_BTN).on('click' + NS, RESET_BTN, function () {
      var $scope = $(this).closest('[data-toggle-box="filter-box"]');
      var $chips = $scope.length ? $scope.find(CHIP) : $(CHIP);
      $chips.removeClass(CHIP_ACTIVE).attr('aria-pressed', 'false');
    });
    $(document).off('click' + NS, MODAL_BTN).on('click' + NS, MODAL_BTN, function () {
      // toggle.js 처리 이후 상태 반영
      window.requestAnimationFrame(syncModalScrollLock);
    });
    $(document).off('click' + NS, MODAL_DIM).on('click' + NS, MODAL_DIM, function (e) {
      e.preventDefault();
      closeModal();
    });
  }
  window.UI.filterExpand.init = function () {
    // 필터 아이템 토글 이벤트(문서 위임) 바인딩
    bind();
    syncModalScrollLock();
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 47:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-dropdown.js
 * @description
 * Kendo DropDownList 자동 초기화 모듈.
 * - select[data-ui="kendo-dropdown"]를 찾아 data-opt(JSON)로 초기화한다.
 * - 상위 래퍼(.vits-dropdown)의 vits- 클래스를 Kendo wrapper/popup에도 복사한다.
 * - appendTo 미지정 시 래퍼로 기본 설정해 팝업 스코프를 제한한다.
 *
 * placeholder 정책(중요)
 * - optionLabel은 사용하지 않는다(리스트 상단 고정 렌더링/스크롤 고정 이슈).
 * - placeholder는 dataSource[0]에 "빈 값 아이템"으로 주입한다.
 *   -> 리스트 아이템으로 렌더링되어 스크롤 시 함께 이동(네이티브 셀렉트와 동일 UX).
 *
 * cascader 정책(중요)
 * - 부모가 placeholder(빈 값)이면 자식은 disable + 값 '' 유지.
 * - 부모가 실제 값이면:
 *   - 자식 후보가 있으면 enable(true) + 자식은 placeholder('') 상태 유지(자동 첫번째 선택 금지)
 *   - 자식 후보가 없으면 disable(false 유지) + 값 '' 유지
 */

(function (window) {
  'use strict';

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDropDownList);
  }
  function applyVitsClassToWrapper($wrap, inst) {
    if (!$wrap || !$wrap.length || !inst) return;
    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);
    if (inst.wrapper) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) inst.wrapper.addClass(classList[i]);
      }
    }
    if (inst.popup && inst.popup.element) {
      for (var j = 0; j < classList.length; j++) {
        if (classList[j].indexOf('vits-') === 0) {
          inst.popup.element.addClass(classList[j]);
          var $ac = inst.popup.element.closest('.k-animation-container');
          if ($ac && $ac.length) $ac.addClass(classList[j]);
        }
      }
    }
  }
  function getPlaceholder($wrap, $el) {
    var ph = '';
    if ($wrap && $wrap.length) ph = ($wrap.attr('data-placeholder') || '').trim();
    if (!ph && $el && $el.length) ph = ($el.attr('data-placeholder') || '').trim();
    return ph;
  }
  function isEmptyValue(v) {
    return v === null || v === undefined || v === '';
  }
  function removeOptionLabelAlways(opts) {
    if (!opts) return;
    if (opts.optionLabel !== undefined) delete opts.optionLabel; // 상단 고정 트리거 제거
  }
  function ensureValueEmpty(opts) {
    if (!opts) return;
    if (opts.value === null || typeof opts.value === 'undefined') opts.value = '';
  }
  function injectPlaceholderItem(opts, placeholderText) {
    if (!opts || !placeholderText) return;
    if (!Array.isArray(opts.dataSource)) return;
    var textField = opts.dataTextField || 'text';
    var valueField = opts.dataValueField || 'value';
    var ds = opts.dataSource;

    // 이미 빈 값 아이템이 있으면 중복 주입 금지
    for (var i = 0; i < ds.length; i++) {
      var it = ds[i];
      if (!it) continue;
      if (String(it[valueField] ?? '') === '') return;
    }
    var phItem = {};
    phItem[textField] = placeholderText;
    phItem[valueField] = '';
    ds.unshift(phItem);
  }
  function getInstById(id) {
    if (!id) return null;
    var $el = window.jQuery('#' + id);
    if (!$el.length) return null;
    return $el.data('kendoDropDownList') || null;
  }
  function hasChildCandidates(childInst, parentVal) {
    // 목적: "부모가 선택되었어도 실제 자식이 없으면 계속 비활성화"
    // 조건: childInst.options.cascadeFromField 값이 parentVal인 항목이 1개라도 있는지(placeholder 제외)
    if (!childInst || !childInst.options) return false;
    var field = childInst.options.cascadeFromField || '';
    if (!field) return true; // 필드가 없으면 판단 불가 -> enable 로직은 부모 값 기준만 따름(기본)

    var ds = childInst.dataSource;
    if (!ds) return false;
    var view = [];
    try {
      // array dataSource면 fetch 없이도 view가 잡히는 편
      view = typeof ds.view === 'function' ? ds.view() : [];
    } catch (e) {
      console.error(e);
      view = [];
    }
    if (!view || !view.length) {
      // view가 비어있어도, 원본이 배열이면 options.dataSource로 판단
      if (Array.isArray(childInst.options.dataSource)) view = childInst.options.dataSource;
    }
    for (var i = 0; i < view.length; i++) {
      var item = view[i];
      if (!item) continue;
      // placeholder는 valueField가 ''라서 제외
      var vField = childInst.options.dataValueField || 'value';
      var v = String(item[vField] ?? '');
      if (v === '') continue;
      if (String(item[field] ?? '') === String(parentVal)) return true;
    }
    return false;
  }
  function forcePlaceholderSelected(inst) {
    // 목적: 자동으로 첫 번째 "실제 항목" 선택되는 버그 방지
    if (!inst) return;
    try {
      // placeholder는 dataSource[0]로 주입되어 있어야 함
      if (typeof inst.select === 'function') inst.select(0);
      if (typeof inst.value === 'function') inst.value('');
    } catch (e) {
      console.error(e);
    }
  }
  function syncEnableByParent(childInst) {
    // 목적: cascadeFrom 기반 enable/disable을 "부모 값 + 자식 후보 존재 여부"로 동기화
    if (!childInst || !childInst.options) return;
    var parentId = childInst.options.cascadeFrom;
    if (!parentId) return;
    var parentInst = getInstById(parentId);
    if (!parentInst) return;
    var parentVal = '';
    try {
      parentVal = parentInst.value();
    } catch (e) {
      console.error(e);
      parentVal = '';
    }

    // 1) 부모가 placeholder면: 무조건 disable
    if (isEmptyValue(parentVal)) {
      if (typeof childInst.enable === 'function') childInst.enable(false);
      forcePlaceholderSelected(childInst);
      return;
    }

    // 2) 부모가 선택되었더라도, 실제 자식 후보가 없으면 disable 유지
    if (!hasChildCandidates(childInst, parentVal)) {
      if (typeof childInst.enable === 'function') childInst.enable(false);
      forcePlaceholderSelected(childInst);
      return;
    }

    // 3) 자식 후보가 있으면 enable + 값은 placeholder 유지(자동 선택 금지)
    if (typeof childInst.enable === 'function') childInst.enable(true);
    forcePlaceholderSelected(childInst);
  }
  function syncChildrenByParent(parentInst) {
    if (!parentInst || !parentInst.element) return;
    var parentId = parentInst.element.attr('id');
    if (!parentId) return;
    window.jQuery('select[data-ui="kendo-dropdown"]').each(function () {
      var child = window.jQuery(this).data('kendoDropDownList');
      if (!child || !child.options) return;
      if (child.options.cascadeFrom === parentId) syncEnableByParent(child);
    });
  }
  function initOne(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDropDownList')) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var $wrap = $el.closest('.vits-dropdown');
    if ($wrap.length && opts.appendTo === undefined) opts.appendTo = $wrap[0];

    // optionLabel 제거(상단 고정 이슈 차단)
    removeOptionLabelAlways(opts);

    // placeholder 주입(리스트 상단 고정 없이, 스크롤과 함께 이동)
    var ph = getPlaceholder($wrap, $el);
    if (ph) injectPlaceholderItem(opts, ph);

    // value는 ''로 통일(placeholder 선택 상태)
    ensureValueEmpty(opts);

    // array dataSource면 autoBind:false로 두면 초기 표시가 비는 케이스가 있어 강제로 true로 맞춤(표시 안정화)
    // - placeholder 아이템이 0번이라 자동선택이 일어나도 "placeholder"가 선택되므로 문제 없음
    if (Array.isArray(opts.dataSource) && opts.autoBind === false) opts.autoBind = true;
    $el.kendoDropDownList(opts);
    var inst = $el.data('kendoDropDownList');
    if (inst && inst.bind) {
      inst.bind('open', function () {
        applyVitsClassToWrapper($wrap, inst);
      });
      inst.bind('dataBound', function () {
        // 항상 placeholder 고정(자동 첫 항목 선택 방지) + enable 동기화
        forcePlaceholderSelected(inst);
        syncEnableByParent(inst);
      });
      inst.bind('change', function () {
        window.setTimeout(function () {
          // 본인 값이 placeholder인지 여부에 따라 자식 enable 동기화
          syncChildrenByParent(inst);

          // 본인이 자식이면, 부모 상태에 따라 enable 재동기화(안전망)
          syncEnableByParent(inst);
        }, 0);
      });
    }
    applyVitsClassToWrapper($wrap, inst);

    // 초기 상태 확정
    forcePlaceholderSelected(inst);
    syncEnableByParent(inst);
    syncChildrenByParent(inst);
  }
  function initAll(root) {
    if (!ensureKendoAvailable()) return;
    var $root = root ? window.jQuery(root) : window.jQuery(document);
    $root.find('select[data-ui="kendo-dropdown"]').each(function () {
      initOne(this);
    });
  }
  function autoBindStart(container) {
    if (!window.MutationObserver) return null;
    var target = container || document.body;
    initAll(target);
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (!node || node.nodeType !== 1) continue;
          initAll(node);
        }
      }
    });
    obs.observe(target, {
      childList: true,
      subtree: true
    });
    return obs;
  }
  window.VitsKendoDropdown = {
    initAll: initAll,
    autoBindStart: autoBindStart
  };
})(window);

/***/ }),

/***/ 95:
/***/ (function() {

/**
 * @file scripts/ui/modal.js
 * @purpose data-속성 기반 레이어(모달/바텀시트/토스트) 공통 + 열림/닫힘 애니메이션(등장/퇴장)
 * @description
 *  - 매핑: [data-modal-btn][data-modal-target] ↔ [data-modal-box="target"]
 *  - 상태:
 *    - is-open    : display 제어(렌더링 on/off)
 *    - is-active  : 실제 노출 상태(등장 완료)
 *    - is-closing : 퇴장 애니메이션 중
 *  - aria-expanded는 즉시 동기화(접근성), 화면 전환은 CSS transition으로 처리
 * @rule
 *  - 여러 버튼이 1개 레이어를 열 수 있음(동일 data-modal-target 공유 가능)
 *  - 옵션(lock/outside/esc/group)은 data-modal-box(박스) 우선, 없으면 버튼 값으로 판정
 * @option
 *  - data-modal-group="true"    : 동일 scope(또는 문서) 내 1개만 오픈
 *  - data-modal-outside="true"  : 바깥 클릭 시 close
 *  - data-modal-esc="true"      : ESC 닫기
 *  - data-modal-lock="true"     : body 스크롤 락(모달/바텀 권장)
 * @a11y
 *  - 동일 target의 모든 버튼 aria-expanded/aria-label 동기화
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[modal] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  window.UI.modal = window.UI.modal || {};
  var OPEN = 'is-open';
  var ACTIVE = 'is-active';
  var CLOSING = 'is-closing';
  var BODY_ACTIVE = 'is-layer-open';
  var CLOSE_FALLBACK_MS = 450;
  var SEL_BTN = '[data-modal-btn]';
  var SEL_BOX = '[data-modal-box]';
  var SEL_OPEN_BOX = SEL_BOX + '.' + OPEN;
  var SEL_CLOSE = '[data-modal-close]';
  var NS = '.uiModal';

  // [width] 현재 렌더링된 모달 inner width를 CSS 변수로 주입
  function syncModalInnerWidth($box) {
    if (!$box || !$box.length) return;
    var $inner = $box.find('.vits-modal-inner').first();
    if (!$inner.length) return;

    // transform 영향 없음(레이아웃 width)
    var w = parseFloat(window.getComputedStyle($inner[0]).width);
    $box[0].style.setProperty('--modal-inner-w', w + 'px');
  }

  // [width] 열린 모달들만 일괄 갱신(리사이즈 대응)
  function syncOpenModalsInnerWidth() {
    $(SEL_OPEN_BOX).each(function () {
      syncModalInnerWidth($(this));
    });
  }

  // ---------------------------------------------------------------------------
  // [vh] iOS 주소창/툴바 가변 대응: 실제 innerHeight 기반 1vh 값을 --vh로 저장
  // - CSS에서 calc(var(--vh, 1vh) * N) 형태로 사용
  // - 전역 변수는 :root(html)에 1개만 저장(다른 곳 영향 최소)
  // ---------------------------------------------------------------------------
  function setVhVar() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  var _vhRaf = 0;
  function onResizeVh() {
    if (_vhRaf) window.cancelAnimationFrame(_vhRaf);
    _vhRaf = window.requestAnimationFrame(function () {
      _vhRaf = 0;
      setVhVar();
    });
  }
  // ---------------------------------------------------------------------------

  // data-modal-box/target가 셀렉터로 안전하게 쓰이도록 최소 이스케이프 처리
  function escAttr(v) {
    var s = String(v == null ? '' : v);
    if (!s) return s;
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s);
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  // camelCase 키를 data-xxxx로 변환
  function toDataAttrName(key) {
    return 'data-modal-' + String(key || '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^modal-/, '');
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
    return $('[data-modal-btn][data-modal-target="' + escAttr(target) + '"]');
  }

  // target 기준 레이어 박스 조회
  function findBoxByTarget(target) {
    if (!target) return $();
    return $('[data-modal-box="' + escAttr(target) + '"]').first();
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
      var target = $box.attr('data-modal-box');
      var $btns = findBtnsByTarget(target);
      if (readOptBool($box, $btns.eq(0), 'modalLock')) needLock = true;
    });
    var $body = $('body');
    if (needLock) {
      // 현재 스크롤 위치 저장
      var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

      // 스크롤이 실제로 있는지 확인
      var hasScroll = document.documentElement.scrollHeight > window.innerHeight;

      // body에 position fixed + top으로 스크롤 위치 고정
      $body.css({
        position: 'fixed',
        top: -currentScrollY + 'px',
        left: '0',
        right: '0',
        'overflow-y': hasScroll ? 'scroll' : 'hidden' // 스크롤 있을 때만 scroll
      });

      // 나중에 복원하기 위해 스크롤 위치 저장
      $body.data('scroll-position', currentScrollY);
      $body.addClass(BODY_ACTIVE);
    } else {
      // 스크롤 위치 복원
      var savedScrollY = $body.data('scroll-position') || 0;
      $body.css({
        position: '',
        top: '',
        left: '',
        right: '',
        'overflow-y': ''
      });
      window.scrollTo(0, savedScrollY);
      $body.removeData('scroll-position');
      $body.removeClass(BODY_ACTIVE);
    }
  }

  // 중복 close 방지 플래그
  function setClosingFlag($box, on) {
    $box.data('modalClosing', on === true);
  }
  function isClosing($box) {
    return $box.data('modalClosing') === true;
  }

  // 열기: display on → 다음 프레임에 is-active로 transition 실행
  function openLayer(target, $btn, $box) {
    var $btns = findBtnsByTarget(target);
    var $dim = $('[data-modal-dim="' + escAttr(target) + '"]');

    // [vh] 열림 시점에 한번 더 갱신(모바일에서 주소창 상태 변화 대응)
    setVhVar();
    setClosingFlag($box, false);
    $box.removeClass(CLOSING).addClass(OPEN);

    // [width] display 켠 직후 측정(처음 렌더링 폭 확보)
    syncModalInnerWidth($box);

    // 딤도 같이 열기 (딤이 있을 때만)
    if ($dim.length) {
      $dim.removeClass(CLOSING).addClass(OPEN);
    }
    syncBtnsA11y($btns, true);
    if (readOptBool($box, $btn, 'modalLock')) syncBodyLock();
    window.requestAnimationFrame(function () {
      $box.addClass(ACTIVE);
      if ($dim.length) {
        $dim.addClass(ACTIVE);
      }

      // [width] active 반영 후 1회 더 동기화(레이아웃 안정화)
      syncModalInnerWidth($box);
    });
  }

  // 닫기: is-active 제거 + is-closing 추가 → transition 후 display off
  function closeLayer(target, $btn, $box) {
    var $btns = findBtnsByTarget(target);
    var $dim = $('[data-modal-dim="' + escAttr(target) + '"]');
    if (!$box.hasClass(OPEN)) return;
    if (isClosing($box)) return;
    setClosingFlag($box, true);
    syncBtnsA11y($btns, false);
    $box.removeClass(ACTIVE).addClass(CLOSING);

    // 딤도 같이 닫기 (딤이 있을 때만)
    if ($dim.length) {
      $dim.removeClass(ACTIVE).addClass(CLOSING);
    }
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      $box.off('transitionend' + NS + 'Close');
      $box.removeClass(CLOSING).removeClass(OPEN);
      if ($dim.length) {
        $dim.removeClass(CLOSING).removeClass(OPEN);
      }
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
      var target = $box.attr('data-modal-box');
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
      var target = $box.attr('data-modal-box');
      if (!target) return;
      var $btns = findBtnsByTarget(target);
      var $btn = $btns.first();
      if (!$btn.length) return;
      if (!readOptBool($box, $btn, 'modalOutside')) return;
      // 딤 클릭은 "outside 닫기"로 처리 (딤이 박스 내부에 있어도 닫히게)
      var $dim = $('[data-modal-dim="' + escAttr(target) + '"]');
      if ($dim.length && ($t.is($dim) || $t.closest($dim).length)) {
        closeLayer(target, $btn, $box);
        return;
      }

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
      var target = $box.attr('data-modal-box');
      if (!target) return;
      var $btns = findBtnsByTarget(target);
      var $btn = $btns.first();
      if (!$btn.length) return;
      if (!readOptBool($box, $btn, 'modalEsc')) return;
      closeLayer(target, $btn, $box);
    });
  }

  // 트리거 토글
  function onToggle(e) {
    e.preventDefault();
    var $btn = $(this);
    var target = $btn.data('modalTarget');
    if (!target) return;
    var $box = findBoxByTarget(target);
    if (!$box.length) return;
    var isOpen = $box.hasClass(OPEN);

    // group 옵션은 열기 전에만 전체 닫기
    if (!isOpen && readOptBool($box, $btn, 'modalGroup')) closeAll();
    if (isOpen) closeLayer(target, $btn, $box);else openLayer(target, $btn, $box);
  }

  // 레이어 내부 닫기 버튼
  function onInnerClose(e) {
    e.preventDefault();
    var $box = $(this).closest(SEL_BOX);
    if (!$box.length) return;
    var target = $box.attr('data-modal-box');
    if (!target) return;
    var $btn = findBtnsByTarget(target).first();
    closeLayer(target, $btn, $box);
  }

  // 이벤트 바인딩(1회)
  function bind() {
    $(document).off('click' + NS, SEL_BTN).on('click' + NS, SEL_BTN, onToggle);
    $(document).off('click' + NS + 'InnerClose', SEL_CLOSE).on('click' + NS + 'InnerClose', SEL_CLOSE, onInnerClose);
    $(document).off('click' + NS + 'Outside').on('click' + NS + 'Outside', onOutsideClick);
    $(document).off('keydown' + NS + 'Esc').on('keydown' + NS + 'Esc', onEsc);
  }

  // 이벤트 언바인딩(페이지 전환/테스트용)
  function unbind() {
    $(document).off(NS);
    $(document).off(NS + 'InnerClose');
    $(document).off(NS + 'Outside');
    $(document).off(NS + 'Esc');
  }
  window.UI.modal.init = function () {
    if (window.UI.modal.__bound) return;
    bind();
    window.UI.modal.__bound = true;

    // [vh] 초기 1회 세팅 + 리사이즈/방향전환 갱신 바인딩
    // - 모바일(iOS) 주소창/툴바로 innerHeight가 변할 수 있어 1vh 기준값을 변수로 보정
    setVhVar();
    $(window).off('resize' + NS + 'Vh orientationchange' + NS + 'Vh').on('resize' + NS + 'Vh orientationchange' + NS + 'Vh', onResizeVh);

    // [width] 리사이즈/방향전환 시 "열려있는" 모달만 폭 재측정 → CSS 변수 갱신
    // - transform 영향 없는 computed width 기준으로 --modal-inner-w 업데이트
    $(window).off('resize' + NS + 'W orientationchange' + NS + 'W').on('resize' + NS + 'W orientationchange' + NS + 'W', syncOpenModalsInnerWidth);

    // 초기 상태에 열린 레이어가 있으면 body lock 동기화
    syncBodyLock();
    console.log('[modal] init');
  };
  window.UI.modal.destroy = function () {
    if (!window.UI.modal.__bound) return;
    unbind();
    window.UI.modal.__bound = false;

    // [vh] viewport 높이 보정 이벤트 해제
    $(window).off('resize' + NS + 'Vh orientationchange' + NS + 'Vh');

    // [width] 모달 폭 동기화 이벤트 해제
    $(window).off('resize' + NS + 'W orientationchange' + NS + 'W');

    // (선택) 변수 자체는 남겨도 무방하지만, 테스트/페이지 전환에서 흔적 제거가 필요하면 해제
    // document.documentElement.style.removeProperty('--vh');

    console.log('[modal] destroy');
  };
  window.UI.modal.closeAll = closeAll;
  console.log('[modal] module loaded');
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 105:
/***/ (function() {

/**
 * @file scripts/ui/header/header-gnb.js
 * @purpose GNB 프로모션 클리핑 + more 패널 동기화 + (카테/브랜드) dim 동기화 + (전체카테고리) 1→2→3 hover 연동 + is-current 표시 + 추천영역 겹침 방지
 * @assumption
 *  - 클리핑 대상: .gnb-item-promo-list .gnb-promo-list > a.gnb-link
 *  - more/카테/브랜드 패널 open/close는 toggle.js가 담당(본 파일은 상태/리스트/hover 동기화만)
 *  - 전체카테고리 마크업은 box 구조(data-d2-box / data-d3-box)로 고정
 *  - 1뎁스/2뎁스는 a 태그이며 hover는 "옆 컬럼 내용 교체"만 수행(클릭 이동 유지)
 *  - 현재 포커스 표시는 is-current 클래스로만 제어(시각 효과는 CSS에서 관리)
 *  - 2/3뎁스 열림 시 추천영역 밀림으로 인한 잘림 항목 자동 숨김 처리
 * @markup-control
 *  - [data-toggle-box="gnb-more"][data-gnb-more-mode="all"] : 패널에 전체 메뉴 노출
 *  - (default) data-gnb-more-mode 미지정                : 패널에 접힌 메뉴만 노출
 * @state
 *  - root.is-more-visible           : more(+) 버튼 노출
 *  - root.is-dim-on                 : dim 노출
 *  - .gnb-category-box.is-active    : 해당 depth box 노출
 *  - .gnb-category.is-col2-open     : 2뎁스 컬럼 표시(영역 차지)
 *  - .gnb-category.is-col3-open     : 3뎁스 컬럼 표시(영역 차지)
 *  - .gnb-category-item.is-current  : 현재 포커스(마우스 기준) 표시
 *  - .gnb-reco-item.is-hidden       : 추천 항목 잘림으로 인한 숨김 처리
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var ROOT_SEL = '[data-header-gnb]';
  var CLS_MORE_VISIBLE = 'is-more-visible';
  var CLS_DIM_ON = 'is-dim-on';
  var CLS_COL2_OPEN = 'is-col2-open';
  var CLS_COL3_OPEN = 'is-col3-open';
  var CLS_CURRENT = 'is-current';

  // root 하위 필수 요소 캐시
  function getEls($root) {
    var $navList = $root.find('[data-gnb-nav-list]').first();
    var $promoItem = $navList.find('.gnb-item-promo-list').first();
    var $promoList = $promoItem.find('.gnb-promo-list').first();
    var $morePanel = $root.find('[data-toggle-box="gnb-more"]').first();
    var $panelScope = $root.find('[data-gnb-panel-scope]').first();
    var $dim = $root.closest('.vits-header').find('[data-gnb-dim]').first();
    var $catRoot = $root.find('[data-gnb-category]').first();
    return {
      $root: $root,
      $promoItem: $promoItem,
      $promoList: $promoList,
      $promoLinks: $promoList.children('a.gnb-link'),
      $moreBtn: $promoItem.find('[data-gnb-more]').first(),
      $moreBox: $promoItem.find('.gnb-more-box').first(),
      $morePanel: $morePanel,
      $moreList: $morePanel.find('[data-gnb-more-list]').first(),
      $panelScope: $panelScope,
      $dim: $dim,
      $catRoot: $catRoot
    };
  }

  // catRoot 재조회(패널 DOM 교체 대비)
  function getCatRoot(els) {
    if (els && els.$catRoot && els.$catRoot.length) return els.$catRoot;
    if (!els || !els.$root || !els.$root.length) return $();
    return els.$root.find('[data-gnb-category]').first();
  }

  // more 버튼 노출 상태 토글
  function setMoreVisible($root, on) {
    $root.toggleClass(CLS_MORE_VISIBLE, !!on);
  }

  // more 패널 리스트 비우기
  function clearMoreList(els) {
    if (els.$moreList.length) els.$moreList.empty();
  }

  // [2026-01-29 삭제] resetPromoHidden, applyPromoClip, getMoreMode - 클리핑 관련 함수 제거

  // 프로모션 링크를 more 패널용 li로 복제 추가
  // [2026-01-29 수정] 메인 타이틀(text)만 표시, 최대 26자 제한
  var PROMO_TEXT_MAX = 26;
  function appendMoreItem(fragment, $a) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.className = 'vits-gnb-promo-button';
    a.href = $a.attr('href') || '#';
    var text = $.trim($a.attr('data-full-text') || $a.text());
    if (text.length > PROMO_TEXT_MAX) {
      text = text.substring(0, PROMO_TEXT_MAX);
    }
    var span = document.createElement('span');
    span.className = 'text';
    span.textContent = text;
    a.appendChild(span);
    li.appendChild(a);
    fragment.appendChild(li);
  }

  // more 패널 리스트 채우기
  // [2026-01-29 수정] DocumentFragment 적용, 초기화 시 1회 실행
  function fillMoreList(els) {
    if (!els.$moreList.length) return;
    clearMoreList(els);
    var fragment = document.createDocumentFragment();
    els.$promoLinks.each(function () {
      appendMoreItem(fragment, $(this));
    });
    els.$moreList[0].appendChild(fragment);
  }

  // more 필요 여부 판단(overflow 체크)
  function getNeedMore(els) {
    if (!els.$promoList.length) return false;
    var el = els.$promoList[0];
    return (el.scrollWidth || 0) > (el.clientWidth || 0) + 1;
  }

  // more 버튼 노출 + 패널 리스트 동기화
  // [2026-01-29 수정] 클리핑 로직 제거, overflow 체크만 수행
  function updatePromoMore(els) {
    if (!els.$promoList.length || !els.$moreBtn.length) return;
    var needMore = getNeedMore(els);
    setMoreVisible(els.$root, needMore);
    if (els.$moreBox.length) els.$moreBox.toggleClass('is-active', needMore);
  }

  // 리사이즈 이벤트 바인딩(디바운스)
  function bindResize(els) {
    var t = null;
    $(window).on('resize.headerGnb', function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(function () {
        updatePromoMore(els);
      }, 80);
    });
  }

  // 초기 렌더/폰트 로드 대비 재측정
  function scheduleInitialMeasure(els) {
    var delays = [0, 120, 300];
    for (var i = 0; i < delays.length; i += 1) {
      (function (d) {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, d);
      })(delays[i]);
    }
  }

  // 카테고리/브랜드 패널 열림 상태에 따라 dim 동기화
  function updateDim(els) {
    if (!els.$panelScope.length || !els.$dim.length) return;
    var hasOpen = els.$panelScope.find('[data-toggle-box="gnb-category"].is-open, [data-toggle-box="gnb-brand"].is-open').length > 0;
    els.$root.toggleClass(CLS_DIM_ON, hasOpen);
    els.$dim.attr('aria-hidden', hasOpen ? 'false' : 'true');
  }

  // dim 클릭 시 카테고리/브랜드 패널 닫기
  function closePanelsLocal(els) {
    if (!els.$panelScope.length) return;
    els.$panelScope.find('[data-toggle-box="gnb-category"].is-open, [data-toggle-box="gnb-brand"].is-open').each(function () {
      var target = $(this).attr('data-toggle-box');
      var $btn = els.$panelScope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
      if ($btn.length) $btn.trigger('click');else $(this).removeClass('is-open');
    });
  }

  // dim 클릭 이벤트 바인딩
  function bindDimClose(els) {
    if (!els.$dim.length) return;
    els.$dim.off('click.headerGnbDim').on('click.headerGnbDim', function (e) {
      e.preventDefault();
      closePanelsLocal(els);
      window.setTimeout(function () {
        updateDim(els);
      }, 0);
    });
  }

  // 카테고리/브랜드 패널 open 상태 변화 감지해 dim 자동 동기화
  function bindPanelObserver(els) {
    if (!els.$panelScope.length) return;
    var $cat = els.$panelScope.find('[data-toggle-box="gnb-category"]').first();
    var $brand = els.$panelScope.find('[data-toggle-box="gnb-brand"]').first();
    if (window.MutationObserver && ($cat.length || $brand.length)) {
      var obs = new MutationObserver(function () {
        updateDim(els);
      });
      if ($cat.length) obs.observe($cat[0], {
        attributes: true,
        attributeFilter: ['class']
      });
      if ($brand.length) obs.observe($brand[0], {
        attributes: true,
        attributeFilter: ['class']
      });
      return;
    }
    els.$panelScope.on('click', '[data-toggle-btn]', function () {
      window.setTimeout(function () {
        updateDim(els);
      }, 0);
    });
  }

  // viewport 밖으로 밀려난 추천 항목 숨김 처리
  function updateRecoVisibility(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    var $recoItems = $catRoot.find('.gnb-reco-item');
    if (!$recoItems.length) return;
    $recoItems.removeClass('is-hidden');
    var isCol2Open = $catRoot.hasClass(CLS_COL2_OPEN);
    var isCol3Open = $catRoot.hasClass(CLS_COL3_OPEN);
    if (!isCol2Open && !isCol3Open) return;
    var viewportRight = window.innerWidth || document.documentElement.clientWidth;
    $recoItems.each(function () {
      var itemRect = this.getBoundingClientRect();
      if (itemRect.right > viewportRight) {
        $(this).addClass('is-hidden');
      }
    });
  }

  // 2뎁스 컬럼 열림 상태 토글
  function setCol2Open(els, on) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.toggleClass(CLS_COL2_OPEN, !!on);
    var $col2 = $catRoot.find('[data-gnb-d2-col]').first();
    if ($col2.length) $col2.toggleClass(CLS_COL2_OPEN, !!on);
    if (!on) setCol3Open(els, false);
    updateRecoVisibility(els);
  }

  // 3뎁스 컬럼 열림 상태 토글
  function setCol3Open(els, on) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.toggleClass(CLS_COL3_OPEN, !!on);
    var $col3 = $catRoot.find('[data-gnb-d3-col]').first();
    if ($col3.length) $col3.toggleClass(CLS_COL3_OPEN, !!on);
    updateRecoVisibility(els);
  }

  // 1뎁스 current 초기화
  function clearCurrentD1(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass(CLS_CURRENT);
  }

  // 2뎁스 current 초기화
  function clearCurrentD2(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass(CLS_CURRENT);
  }

  // 3뎁스 current 초기화
  function clearCurrentD3(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('.gnb-category-list-3 .gnb-category-item').removeClass(CLS_CURRENT);
  }

  // 1뎁스 current 설정
  function setCurrentD1(els, $item) {
    clearCurrentD1(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 2뎁스 current 설정
  function setCurrentD2(els, $item) {
    clearCurrentD2(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 3뎁스 current 설정
  function setCurrentD3(els, $item) {
    clearCurrentD3(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 2/3뎁스 박스 및 상태 전체 닫기
  function hideDepth2And3(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');
    $catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');
    setCol2Open(els, false);
  }

  // 3뎁스만 닫기
  function hideDepth3Only(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    clearCurrentD3(els);
    setCol3Open(els, false);
  }

  // 카테고리 패널 초기 상태 리셋
  function resetCategoryInitial(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');
    $catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');
    setCol2Open(els, false);
    clearCurrentD1(els);
    clearCurrentD2(els);
    clearCurrentD3(els);
  }

  // 2뎁스 하위 항목 존재 여부 체크
  function hasDepth2(els, d1Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d1Key) return false;
    var $box = $catRoot.find('[data-d2-box="' + d1Key + '"]').first();
    if (!$box.length) return false;
    return $box.find('[data-d2]').length > 0;
  }

  // 1뎁스만 활성화(2/3뎁스 닫기)
  function setDepth12Only(els, $d1Item) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    if ($d1Item && $d1Item.length) $d1Item.addClass('is-active');
    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');
    hideDepth2And3(els);
    setCol3Open(els, false);
  }

  // 2뎁스 박스 활성화
  function showDepth2(els, d1Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d1Key) return;
    var $d2Boxes = $catRoot.find('[data-d2-box]');
    var $target = $d2Boxes.filter('[data-d2-box="' + d1Key + '"]');
    $d2Boxes.removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    if (!$target.length || $target.find('[data-d2]').length === 0) {
      setCol2Open(els, false);
      hideDepth3Only(els);
      return;
    }
    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol2Open(els, true);
    hideDepth3Only(els);
  }

  // 3뎁스 박스 활성화
  function showDepth3(els, d2Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d2Key) return;
    var $d3Boxes = $catRoot.find('[data-d3-box]');
    var $target = $d3Boxes.filter('[data-d3-box="' + d2Key + '"]');
    $d3Boxes.removeClass('is-active').attr('aria-hidden', 'true');
    if (!$target.length || $target.find('li').length === 0) {
      setCol3Open(els, false);
      return;
    }
    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol3Open(els, true);
  }

  // 카테고리 hover 이벤트 바인딩(1→2→3 연동)
  function bindCategoryHover(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    var $col1 = $catRoot.find('.gnb-category-col-1').first();
    var $col2 = $catRoot.find('[data-gnb-d2-col]').first();
    var $col3 = $catRoot.find('[data-gnb-d3-col]').first();
    var activeD2Key = null;
    var closeAllT = null;
    var close3T = null;
    var lastPt = {
      x: 0,
      y: 0
    };

    // 마우스 좌표 추적(relatedTarget 불안정 보정)
    function trackPt(e) {
      if (!e) return;
      if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
      lastPt.x = e.clientX;
      lastPt.y = e.clientY;
    }
    $catRoot.off('mousemove.headerCatTrack').on('mousemove.headerCatTrack', trackPt);

    // 좌표가 rect 안에 있는지 판정
    function rectContainsPt(rect) {
      if (!rect) return false;
      return lastPt.x >= rect.left && lastPt.x <= rect.right && lastPt.y >= rect.top && lastPt.y <= rect.bottom;
    }

    // 전체 닫기 타이머 해제
    function clearCloseAllTimer() {
      if (closeAllT) {
        window.clearTimeout(closeAllT);
        closeAllT = null;
      }
    }

    // 3뎁스 닫기 타이머 해제
    function clearClose3Timer() {
      if (close3T) {
        window.clearTimeout(close3T);
        close3T = null;
      }
    }

    // 포인터가 카테고리 패널 내부인지 체크
    function isPointerInCatRoot() {
      return rectContainsPt($catRoot[0].getBoundingClientRect());
    }

    // 포인터가 col3 영역인지 체크
    function isPointerInCol3() {
      if (!$col3.length) return false;
      return rectContainsPt($col3[0].getBoundingClientRect());
    }

    // 포인터가 col2 영역인지 체크
    function isPointerInCol2() {
      if (!$col2.length) return false;
      return rectContainsPt($col2[0].getBoundingClientRect());
    }

    // 전체 닫기 예약(패널 밖으로 나간 경우만 실행)
    function scheduleCloseAll(delay) {
      clearCloseAllTimer();
      closeAllT = window.setTimeout(function () {
        if (isPointerInCatRoot()) {
          closeAllT = null;
          return;
        }
        hideDepth2And3(els);
        clearCurrentD1(els);
        clearCurrentD2(els);
        clearCurrentD3(els);
        activeD2Key = null;
        closeAllT = null;
      }, delay || 170);
    }

    // 3뎁스 닫기 예약(col2 벗어난 경우)
    function scheduleClose3(delay) {
      clearClose3Timer();
      close3T = window.setTimeout(function () {
        if (isPointerInCol3()) {
          close3T = null;
          return;
        }
        if (isPointerInCatRoot()) {
          hideDepth3Only(els);
          clearCurrentD2(els); // 2뎁스 선택 상태도 해제
          clearCurrentD3(els);
          activeD2Key = null;
          close3T = null;
          return;
        }
        scheduleCloseAll(0);
        close3T = null;
      }, delay || 200);
    }

    // 패널 진입 시 닫기 타이머 해제
    $catRoot.off('mouseenter.headerCatEnter').on('mouseenter.headerCatEnter', function () {
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // 1뎁스 hover → 2뎁스 교체
    $catRoot.find('[data-gnb-d1] [data-d1]').off('mouseenter.headerCatD1 mouseleave.headerCatD1').on('mouseenter.headerCatD1', function (e) {
      trackPt(e);
      var $item = $(this);
      var key = $item.attr('data-d1');
      if (!key) return;
      clearCloseAllTimer();
      clearClose3Timer();
      setCurrentD1(els, $item);
      clearCurrentD2(els);
      clearCurrentD3(els);
      activeD2Key = null;
      if (!hasDepth2(els, key)) {
        setDepth12Only(els, $item);
        return;
      }
      $item.addClass('is-active').siblings().removeClass('is-active');
      $item.find('> a[aria-expanded]').attr('aria-expanded', 'true');
      $item.siblings().find('> a[aria-expanded]').attr('aria-expanded', 'false');
      showDepth2(els, key);
    }).on('mouseleave.headerCatD1', function (e) {
      trackPt(e);
      scheduleCloseAll(180);
    });

    // col1 leave 시 닫기 예약
    $col1.off('mouseleave.headerCatCol1').on('mouseleave.headerCatCol1', function (e) {
      trackPt(e);
      scheduleCloseAll(180);
    });

    // col2 진입 시 닫기 타이머 해제
    $col2.off('mouseenter.headerCatCol2Enter').on('mouseenter.headerCatCol2Enter', function (e) {
      trackPt(e);
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // 2뎁스 hover → 3뎁스 교체
    $catRoot.find('[data-gnb-d2-col]').off('mouseenter.headerCatD2 mouseleave.headerCatD2', '[data-d2]').on('mouseenter.headerCatD2', '[data-d2]', function (e) {
      trackPt(e);
      var $item = $(this);
      var key = $item.attr('data-d2');
      if (!key) return;
      if (!$item.closest('[data-d2-box]').hasClass('is-active')) return;
      clearCloseAllTimer();
      clearClose3Timer();
      setCurrentD2(els, $item);
      clearCurrentD3(els);
      activeD2Key = key;
      $item.addClass('is-active').siblings().removeClass('is-active');
      $item.find('> a[aria-expanded]').attr('aria-expanded', 'true');
      $item.siblings().find('> a[aria-expanded]').attr('aria-expanded', 'false');
      showDepth3(els, key);
    }).on('mouseleave.headerCatD2', '[data-d2]', function (e) {
      trackPt(e);

      // 3뎁스로 이동하는 경우 타이머만 예약하고 col3 진입 시 취소됨
      scheduleClose3(200);
    });

    // col2 leave 시 좌표 기반 판정(2→3 이동/스크롤바 오판 보정)
    $col2.off('mouseleave.headerCatCol2').on('mouseleave.headerCatCol2', function (e) {
      trackPt(e);
      if (isPointerInCol3()) {
        clearCloseAllTimer();
        clearClose3Timer();
        return;
      }
      if (isPointerInCol2()) {
        clearCloseAllTimer();
        clearClose3Timer();
        return;
      }
      scheduleClose3(160);
    });

    // col2 스크롤 중 닫기 타이머 해제
    $col2.off('scroll.headerCatCol2Scroll').on('scroll.headerCatCol2Scroll', function () {
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // col3 진입 시 2뎁스 current 유지
    $col3.off('mouseenter.headerCatCol3Enter').on('mouseenter.headerCatCol3Enter', function (e) {
      trackPt(e);
      clearCloseAllTimer();
      clearClose3Timer();
      if (!activeD2Key) return;
      var $d2Item = $catRoot.find('[data-gnb-d2] [data-d2="' + activeD2Key + '"]').first();
      if ($d2Item.length) setCurrentD2(els, $d2Item);
    });

    // 3뎁스 항목 hover 시 current 표시
    $col3.off('mouseenter.headerCatD3Item mouseleave.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item').on('mouseenter.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item', function (e) {
      trackPt(e);
      setCurrentD3(els, $(this));
    }).on('mouseleave.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item', function (e) {
      trackPt(e);
      clearCurrentD3(els); // 3뎁스 선택 상태 해제
    });

    // col3 leave 시 처리
    $col3.off('mouseleave.headerCatCol3').on('mouseleave.headerCatCol3', function (e) {
      trackPt(e);
      if (isPointerInCol2()) {
        scheduleClose3(130);
        return;
      }
      activeD2Key = null;
      clearCurrentD2(els);
      clearCurrentD3(els);
      scheduleCloseAll(200);
    });

    // 패널 leave 시 초기화
    $catRoot.off('mouseleave.headerCatLeave').on('mouseleave.headerCatLeave', function () {
      clearCloseAllTimer();
      clearClose3Timer();
      resetCategoryInitial(els);
      activeD2Key = null;
    });
  }

  // 카테고리 패널 open 시 상태 초기화 바인딩
  function bindCategoryPanelOpenReset(els) {
    if (!els.$panelScope.length) return;
    var $catPanel = els.$panelScope.find('[data-toggle-box="gnb-category"]').first();
    if (!$catPanel.length) return;
    if (window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if ($catPanel.hasClass('is-open')) resetCategoryInitial(els);
      });
      obs.observe($catPanel[0], {
        attributes: true,
        attributeFilter: ['class']
      });
      return;
    }
    els.$panelScope.off('click.headerCatOpenReset').on('click.headerCatOpenReset', '[data-toggle-btn][data-toggle-target="gnb-category"]', function () {
      window.setTimeout(function () {
        if ($catPanel.hasClass('is-open')) resetCategoryInitial(els);
      }, 0);
    });
  }

  // root 단위 초기화
  function initRoot($root) {
    var els = getEls($root);
    if (els.$promoList.length && els.$moreBtn.length) {
      fillMoreList(els); // [2026-01-29 추가] 초기화 시 1회만 리스트 채우기
      scheduleInitialMeasure(els);
      bindResize(els);
      $root.off('click.headerGnbMore').on('click.headerGnbMore', '[data-gnb-more]', function () {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, 0);
      });
    }
    if (els.$panelScope.length && els.$dim.length) {
      updateDim(els);
      bindDimClose(els);
      bindPanelObserver(els);
    }
    if (getCatRoot(els).length) {
      resetCategoryInitial(els);
      bindCategoryHover(els);
      bindCategoryPanelOpenReset(els);
    }
  }
  window.UI.headerGnb = {
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 146:
/***/ (function() {

/**
 * @file scripts/ui/more-expand.js
 * @purpose 공통 더보기: 스코프 내 숨김 항목 일괄 노출(단방향)
 * @scope [data-more-scope] 내부만, 이벤트는 document 위임
 * @rule [data-more-btn] 클릭 → [data-more-hidden="true"] 해제 + .filter-more 제거
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.moreExpand = window.UI.moreExpand || {};
  var NS = '.uiMoreExpand';
  var BTN = '[data-more-btn]';
  var SCOPE = '[data-more-scope]';
  var HIDDEN = '[data-more-hidden="true"]';
  function bind() {
    // 더보기 클릭: 스코프 내 숨김 항목 노출 후 버튼 영역 제거(접기 없음)
    $(document).off('click' + NS, BTN).on('click' + NS, BTN, function () {
      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;
      $scope.find(HIDDEN).removeAttr('data-more-hidden');
      $btn.closest('.filter-more').remove();
    });
  }
  window.UI.moreExpand.init = function () {
    // 공통 더보기 이벤트(문서 위임) 바인딩
    bind();
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 160:
/***/ (function() {

/**
 * @file scripts/ui/scroll-boundary.js
 * @purpose 스크롤 overflow 감지 후 경계 라인 표시 클래스 제어
 * @description
 *  - 대상: [data-scroll-boundary] (특정 영역만 적용)
 *  - 기준: scrollHeight > clientHeight (세로 스크롤 기준)
 *  - 표시: is-scrollable 클래스가 있을 때만 경계 라인(::after 등) 노출(CSS 담당)
 * @option
 *  - data-scroll-axis="y|x|both" : 감지 축(기본 y)
 *  - data-scroll-class="className" : 토글 클래스 커스텀(기본 is-scrollable)
 * @event
 *  - window resize 시 refresh 수행
 *  - (지원 시) ResizeObserver로 컨테이너 크기 변화 감지 후 갱신
 * @maintenance
 *  - 페이지별 분기 금지(대상은 data-로만 지정)
 *  - 스타일 표현은 CSS에서만 처리(여기서는 클래스 토글만)
 *  - init은 1회 호출 전제(중복 바인딩 방지)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[scroll-boundary] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var DEFAULT_SELECTOR = '[data-scroll-boundary]';
  var DEFAULT_CLASS = 'is-scrollable';
  var BOUND_KEY = 'scrollBoundaryBound';

  // hasOverflow: 지정 축 기준 overflow 여부 판정
  function hasOverflow(el, axis) {
    if (axis === 'x') return el.scrollWidth > el.clientWidth;
    if (axis === 'both') return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    return el.scrollHeight > el.clientHeight; // 기본 y
  }

  // updateOne: overflow 여부에 따라 클래스 토글
  function updateOne($el) {
    var el = $el.get(0);
    if (!el) return;
    var axis = $el.attr('data-scroll-axis') || 'y';
    var className = $el.attr('data-scroll-class') || DEFAULT_CLASS;
    $el.toggleClass(className, hasOverflow(el, axis));
  }

  // bindResizeObserver: 요소 크기 변경 감지(지원 브라우저)
  function bindResizeObserver($targets) {
    if (!('ResizeObserver' in window)) return null;
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        updateOne($(entry.target));
      });
    });
    $targets.each(function () {
      ro.observe(this);
    });
    return ro;
  }
  window.UI.scrollBoundary = {
    // init: [data-scroll-boundary] 대상 수집 후 감지/바인딩
    init: function () {
      // 중복 초기화 방지(공통 init이 여러 번 호출되는 사고 대응)
      if ($('body').data(BOUND_KEY) === true) return;
      $('body').data(BOUND_KEY, true);
      var $targets = $(DEFAULT_SELECTOR);
      if (!$targets.length) return;

      // 최초 1회 판정
      $targets.each(function () {
        updateOne($(this));
      });

      // 리사이즈 시 재판정
      $(window).on('resize.uiScrollBoundary', function () {
        $targets.each(function () {
          updateOne($(this));
        });
      });

      // 요소 자체 리사이즈(컨텐츠/레이아웃 변화) 대응
      bindResizeObserver($targets);
      console.log('[scroll-boundary] init');
    },
    // refresh: 필요 시 외부에서 강제 갱신(동적 렌더링 대응)
    refresh: function () {
      var $targets = $(DEFAULT_SELECTOR);
      if (!$targets.length) return;
      $targets.each(function () {
        updateOne($(this));
      });
      console.log('[scroll-boundary] refresh');
    }
  };
  console.log('[scroll-boundary] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 203:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./src/assets/scripts/core/utils.js
var utils = __webpack_require__(918);
// EXTERNAL MODULE: ./src/assets/scripts/ui/toggle.js
var toggle = __webpack_require__(344);
// EXTERNAL MODULE: ./src/assets/scripts/ui/step-tab.js
var step_tab = __webpack_require__(572);
// EXTERNAL MODULE: ./src/assets/scripts/ui/period-btn.js
var period_btn = __webpack_require__(864);
// EXTERNAL MODULE: ./src/assets/scripts/ui/scroll-boundary.js
var scroll_boundary = __webpack_require__(160);
// EXTERNAL MODULE: ./src/assets/scripts/ui/layer.js
var ui_layer = __webpack_require__(847);
// EXTERNAL MODULE: ./src/assets/scripts/ui/modal.js
var modal = __webpack_require__(95);
// EXTERNAL MODULE: ./src/assets/scripts/ui/tooltip.js
var tooltip = __webpack_require__(265);
// EXTERNAL MODULE: ./src/assets/scripts/ui/tab.js
var tab = __webpack_require__(369);
// EXTERNAL MODULE: ./node_modules/.pnpm/swiper@11.2.8/node_modules/swiper/swiper-bundle.mjs + 32 modules
var swiper_bundle = __webpack_require__(111);
;// ./src/assets/scripts/ui/swiper.js
/* s: 메인 썸네일(큰 이미지)에서 좌우 화살표 사용 안 할 떄, 아래 삭제
  - <button ... data-main-prev></button>
  - <button ... data-main-next></button>
  - var mainPrev = root.querySelector("[data-main-prev]");
  - var mainNext = root.querySelector("[data-main-next]");
  - mainPrev.addEventListener("click", ...);
  - mainNext.addEventListener("click", ...);
  - mainPrev.classList.add("swiper-button-disabled");
  - mainNext.classList.add("swiper-button-disabled");
  - mainPrev.classList.remove("swiper-button-disabled");
  - mainNext.classList.remove("swiper-button-disabled");
  - if (currentIndex <= 0) mainPrev... else ...
  - if (currentIndex >= last) mainNext... else ...
*/


(function () {
  'use strict';

  if (typeof swiper_bundle/* default */.A === 'undefined') return;
  var root = document.querySelector('[data-test-gallery]');
  if (!root) return;
  var mainEl = root.querySelector('[data-main-swiper]');
  var thumbsEl = root.querySelector('[data-thumbs-swiper]');
  var mainWrapper = root.querySelector('[data-main-wrapper]');
  var thumbsWrapper = root.querySelector('[data-thumbs-wrapper]');
  if (!mainEl || !thumbsEl || !mainWrapper || !thumbsWrapper) return;
  var mainPrev = root.querySelector('[data-main-prev]');
  var mainNext = root.querySelector('[data-main-next]');
  var thumbsPrev = root.querySelector('[data-thumbs-prev]');
  var thumbsNext = root.querySelector('[data-thumbs-next]');
  if (!thumbsPrev || !thumbsNext) return;
  var zoomBox = root.querySelector('[data-zoom]');
  var zoomImg = root.querySelector('[data-zoom-img]');
  var ZOOM_RATIO = 3;

  // EJS 템플릿에서 렌더링된 슬라이드 기준으로 아이템 구성
  var mainSlides = Array.prototype.slice.call(mainWrapper.querySelectorAll('.swiper-slide'));
  var items = mainSlides.map(function (slide) {
    var img = slide.querySelector('[data-main-img]');
    if (img) {
      return {
        type: 'image',
        src: img.src,
        alt: img.alt || ''
      };
    }
    return {
      type: 'iframe',
      src: '',
      alt: ''
    };
  });
  var thumbBtns = Array.prototype.slice.call(root.querySelectorAll('[data-thumb]'));
  var thumbsSwiper = new swiper_bundle/* default */.A(thumbsEl, {
    loop: false,
    slidesPerView: 'auto',
    spaceBetween: 7,
    centeredSlides: false,
    centeredSlidesBounds: false,
    centerInsufficientSlides: false,
    watchSlidesProgress: true,
    allowTouchMove: false
  });
  var mainSwiper = new swiper_bundle/* default */.A(mainEl, {
    loop: false,
    slidesPerView: 1,
    allowTouchMove: true
  });
  var currentIndex = 0;
  function clampIndex(i) {
    var last = items.length - 1;
    if (i < 0) return 0;
    if (i > last) return last;
    return i;
  }
  function setIndex(nextIndex) {
    currentIndex = clampIndex(nextIndex);
    if (mainSwiper.activeIndex !== currentIndex) mainSwiper.slideTo(currentIndex);
    if (thumbsSwiper.activeIndex !== currentIndex) thumbsSwiper.slideTo(currentIndex);
    thumbBtns.forEach(function (btn, i) {
      if (i === currentIndex) btn.classList.add('is-active');else btn.classList.remove('is-active');
    });
    var last = items.length - 1;
    if (items.length <= 1) {
      thumbsPrev.classList.add('is-hidden');
      thumbsNext.classList.add('is-hidden');
    } else {
      thumbsPrev.classList.remove('is-hidden');
      thumbsNext.classList.remove('is-hidden');
    }
    if (currentIndex <= 0) thumbsPrev.classList.add('is-disabled');else thumbsPrev.classList.remove('is-disabled');
    if (currentIndex >= last) thumbsNext.classList.add('is-disabled');else thumbsNext.classList.remove('is-disabled');
    if (mainPrev) {
      if (currentIndex <= 0) mainPrev.classList.add('swiper-button-disabled');else mainPrev.classList.remove('swiper-button-disabled');
    }
    if (mainNext) {
      if (currentIndex >= last) mainNext.classList.add('swiper-button-disabled');else mainNext.classList.remove('swiper-button-disabled');
    }
    if (zoomImg) {
      if (items[currentIndex].src) zoomImg.src = items[currentIndex].src;else zoomImg.removeAttribute('src');
    }
    if (!items[currentIndex].src) hideZoom();
  }
  if (mainPrev) {
    mainPrev.addEventListener('click', function () {
      setIndex(currentIndex - 1);
    });
  }
  if (mainNext) {
    mainNext.addEventListener('click', function () {
      setIndex(currentIndex + 1);
    });
  }
  thumbsPrev.addEventListener('click', function () {
    setIndex(currentIndex - 1);
  });
  thumbsNext.addEventListener('click', function () {
    setIndex(currentIndex + 1);
  });
  thumbBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      setIndex(idx);
    });
  });
  mainSwiper.on('slideChange', function () {
    setIndex(mainSwiper.realIndex);
  });
  thumbsSwiper.on('slideChange', function () {
    setIndex(thumbsSwiper.realIndex);
  });
  function hideZoom() {
    if (!zoomBox) return;
    zoomBox.classList.remove('is-on');
    zoomBox.setAttribute('aria-hidden', 'true');
  }
  function showZoom() {
    if (!zoomBox) return;
    zoomBox.classList.add('is-on');
    zoomBox.setAttribute('aria-hidden', 'false');
  }
  function ensureNatural(img, cb) {
    if (!img) return;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      cb(img.naturalWidth, img.naturalHeight);
      return;
    }
    img.addEventListener('load', function onLoad() {
      img.removeEventListener('load', onLoad);
      cb(img.naturalWidth, img.naturalHeight);
    });
  }
  function getContainRect(containerW, containerH, naturalW, naturalH) {
    var scale = Math.min(containerW / naturalW, containerH / naturalH);
    var drawW = naturalW * scale;
    var drawH = naturalH * scale;
    var offsetX = (containerW - drawW) / 2;
    var offsetY = (containerH - drawH) / 2;
    return {
      x: offsetX,
      y: offsetY,
      w: drawW,
      h: drawH
    };
  }
  function getActiveImgEl() {
    return mainEl.querySelector('.swiper-slide-active [data-main-img]');
  }
  if (zoomBox && zoomImg) {
    mainEl.addEventListener('mouseenter', function () {
      var img = getActiveImgEl();
      if (!img) {
        hideZoom();
        return;
      }
      showZoom();
    });
    mainEl.addEventListener('mouseleave', function () {
      hideZoom();
    });
    mainEl.addEventListener('mousemove', function (e) {
      if (!zoomBox.classList.contains('is-on')) return;
      var img = getActiveImgEl();
      if (!img) {
        hideZoom();
        return;
      }
      var contRect = mainEl.getBoundingClientRect();
      var cx = e.clientX - contRect.left;
      var cy = e.clientY - contRect.top;
      ensureNatural(img, function (nw, nh) {
        var cr = getContainRect(contRect.width, contRect.height, nw, nh);
        if (cx < cr.x || cy < cr.y || cx > cr.x + cr.w || cy > cr.y + cr.h) {
          hideZoom();
          return;
        } else {
          showZoom();
        }
        var rx = (cx - cr.x) / cr.w;
        var ry = (cy - cr.y) / cr.h;
        var baseRatio = Math.max(nw / cr.w, nh / cr.h);
        var ratio = baseRatio * ZOOM_RATIO;
        var zoomW = nw * ratio;
        var zoomH = nh * ratio;
        zoomImg.style.width = zoomW + 'px';
        zoomImg.style.height = zoomH + 'px';
        var zw = zoomBox.clientWidth;
        var zh = zoomBox.clientHeight;
        var left = -(rx * (zoomW - zw));
        var top = -(ry * (zoomH - zh));
        if (left > 0) left = 0;
        if (top > 0) top = 0;
        if (left < -(zoomW - zw)) left = -(zoomW - zw);
        if (top < -(zoomH - zh)) top = -(zoomH - zh);
        zoomImg.style.left = left + 'px';
        zoomImg.style.top = top + 'px';
      });
    });
  }
  setIndex(0);
})();

/**
 * Swiper 타입별 기본 옵션 정의
 * - 여기만 수정하면 전체 Swiper에 반영됨
 */
(function () {
  'use strict';

  if (typeof swiper_bundle/* default */.A === 'undefined') return;
  const DEFAULT_OFFSET = {
    before: 0,
    after: 0
  };
  const SWIPER_PRESETS = {
    test: {
      spaceBetween: 32.5,
      speed: 400,
      breakpoints: {
        1024: {
          slidesPerView: 2
        },
        1280: {
          slidesPerView: 2
        }
      }
    },
    card: {
      slidesPerView: 5,
      spaceBetween: 27.5,
      speed: 400,
      breakpoints: {
        0: {
          slidesPerView: 4
        },
        1024: {
          slidesPerView: 4
        },
        1280: {
          slidesPerView: 5
        }
      }
    },
    slim: {
      spaceBetween: 20,
      speed: 400,
      breakpoints: {
        0: {
          slidesPerView: 4
        },
        1024: {
          slidesPerView: 5
        },
        1280: {
          slidesPerView: 6
        }
      }
    },
    boxed: {
      slidesPerView: 4,
      spaceBetween: 13,
      speed: 400,
      breakpoints: {
        0: {
          slidesPerView: 3
        },
        1024: {
          slidesPerView: 3
        },
        1200: {
          slidesPerView: 4
        }
      }
    },
    payment: {
      slidesPerView: 2.5,
      spaceBetween: 12,
      speed: 400,
      slidesOffsetAfter: 300,
      breakpoints: {
        0: {
          slidesPerView: 2.5,
          slidesOffsetAfter: 250
        },
        1024: {
          slidesPerView: 2.5,
          slidesOffsetAfter: 250
        }
      }
    }
  };
  function initSwipers() {
    if (typeof swiper_bundle/* default */.A === 'undefined') {
      setTimeout(initSwipers, 100);
      return;
    }
    document.querySelectorAll('.js-swiper').forEach(function (el) {
      const type = el.dataset.swiperType;
      if (!SWIPER_PRESETS[type]) return;

      // 프리셋 객체를 깊은 복사하여 각 인스턴스가 독립적으로 동작하도록 함
      const preset = JSON.parse(JSON.stringify(SWIPER_PRESETS[type]));

      // offset 개별 제어 (data 속성 > preset.slidesOffset* > 기본값)
      const offsetBeforeAttr = el.getAttribute('data-offset-before');
      const offsetAfterAttr = el.getAttribute('data-offset-after');
      const offsetBefore = offsetBeforeAttr !== null ? Number(offsetBeforeAttr) : preset.slidesOffsetBefore ?? DEFAULT_OFFSET.before;
      const offsetAfter = offsetAfterAttr !== null ? Number(offsetAfterAttr) : preset.slidesOffsetAfter ?? DEFAULT_OFFSET.after;

      // desktop slidesPerView 오버라이드 (복사된 객체를 수정하므로 원본에 영향 없음)
      const desktopView = el.dataset.desktop;
      if (desktopView && preset.breakpoints && preset.breakpoints[1280]) {
        preset.breakpoints[1280].slidesPerView = Number(desktopView);
      }

      // breakpoints에도 offset 적용 (사용자가 명시적으로 설정한 경우)
      if (preset.breakpoints && (offsetBefore !== DEFAULT_OFFSET.before || offsetAfter !== DEFAULT_OFFSET.after)) {
        Object.keys(preset.breakpoints).forEach(function (breakpoint) {
          // breakpoint에 이미 offset이 설정되어 있지 않은 경우에만 적용
          if (offsetBefore !== DEFAULT_OFFSET.before && !('slidesOffsetBefore' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetBefore = offsetBefore;
          }
          if (offsetAfter !== DEFAULT_OFFSET.after && !('slidesOffsetAfter' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetAfter = offsetAfter;
          }
        });
      }

      // navigation 버튼 찾기: container 내부 또는 외부의 vits-swiper-navs에서 찾기
      var nextEl = el.querySelector('.swiper-button-next');
      var prevEl = el.querySelector('.swiper-button-prev');

      // container 내부에서 찾지 못한 경우, container 밖의 vits-swiper-navs에서 찾기
      if (!nextEl || !prevEl) {
        // container의 부모 요소에서 vits-swiper-navs 찾기
        const parent = el.parentElement;
        if (parent) {
          const navsContainer = parent.querySelector('.vits-swiper-navs');
          if (navsContainer) {
            if (!nextEl) nextEl = navsContainer.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = navsContainer.querySelector('.swiper-button-prev');
          }
        }

        // 부모에서 찾지 못한 경우, 형제 요소에서 찾기
        if ((!nextEl || !prevEl) && el.nextElementSibling) {
          const nextSibling = el.nextElementSibling;
          if (nextSibling.classList.contains('vits-swiper-navs')) {
            if (!nextEl) nextEl = nextSibling.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = nextSibling.querySelector('.swiper-button-prev');
          }
        }
      }
      const config = {
        slidesPerView: 5,
        spaceBetween: preset.spaceBetween,
        speed: preset.speed,
        slidesOffsetBefore: offsetBefore,
        slidesOffsetAfter: offsetAfter,
        centeredSlides: false,
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true
        },
        breakpoints: preset.breakpoints
      };
      ['centeredSlides', 'centeredSlidesBounds', 'centerInsufficientSlides', 'watchSlidesProgress'].forEach(function (key) {
        if (preset[key] !== undefined) config[key] = preset[key];
      });
      const swiperInstance = new swiper_bundle/* default */.A(el, config);

      // payment 타입인 경우 슬라이드 클릭 시 선택 처리
      if (type === 'payment') {
        const slides = el.querySelectorAll('.swiper-slide');
        slides.forEach(function (slide, index) {
          slide.addEventListener('click', function () {
            // 클릭된 슬라이드의 인덱스로 이동하여 swiper-slide-active 클래스가 자동으로 적용되도록 함
            swiperInstance.slideTo(index);
          });
        });
      }
    });
  }
  function waitForDependencies() {
    if (typeof swiper_bundle/* default */.A === 'undefined') {
      setTimeout(waitForDependencies, 100);
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSwipers);
    } else {
      initSwipers();
    }
  }
  waitForDependencies();
})();

// window.UI.swiper로 등록 (선택적)
(function (window) {
  'use strict';

  window.UI = window.UI || {};
  window.UI.swiper = {
    init: function () {
      // 이미 자동 실행되므로 빈 함수로 유지
      // 필요시 여기에 추가 초기화 로직 작성
    }
  };
})(window);
;// ./src/assets/scripts/ui/swiper-test.js
/**
 * @file scripts/ui/swiper-test.js
 * @purpose data-속성 기반 Swiper Boxed 초기화 (정석 마크업 기준)
 * @description
 *  - 컨테이너: [data-swiper-options] 요소 자체가 Swiper 컨테이너
 *  - 구조(정석): [data-swiper-options] > .swiper-wrapper > .swiper-slide
 *  - 초기화: 각 컨테이너마다 별도 Swiper 인스턴스 생성
 *  - 파괴: destroy 메서드로 인스턴스 정리 가능
 * @option (data-swiper-options JSON 내부)
 *  - slidesPerView: 보여질 슬라이드 개수 (number | 'auto')
 *  - spaceBetween: 슬라이드 간격 (px)
 *  - slidesOffsetBefore: 첫 슬라이드 왼쪽 여백 (px)
 *  - slidesOffsetAfter: 마지막 슬라이드 오른쪽 여백 (px)
 *  - slidesPerGroup: 한 번에 이동할 슬라이드 개수
 *  - navigation: 화살표 버튼 사용 여부 (boolean) // false면 비활성
 *  - pagination: 페이지네이션 사용 여부 (boolean) // true면 활성
 *  - centerWhenSingle: 슬라이드 1개일 때 중앙 정렬 (boolean)
 *  - hideNavWhenSingle: 슬라이드 1개일 때 화살표 숨김 (boolean, 기본 true)
 *  - speed: 전환 속도 (ms, 기본 300)
 *  - loop: 무한 루프 (boolean)
 *  - autoplay: 자동 재생 설정 (object | boolean)
 * @a11y
 *  - 키보드 제어 기본 활성화
 * @maintenance
 *  - Swiper 번들 의존 (swiper/bundle)
 *  - 인스턴스는 DOM 요소에 data로 저장 (재초기화 방지)
 */


(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[swiper-test] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var SWIPER_INSTANCE_KEY = 'swiperInstance';

  /**
   * 단일 Swiper 초기화
   * @param {jQuery} $wrapper - Swiper 컨테이너([data-swiper-options]) 요소
   */
  function initSwiper($wrapper) {
    // 이미 초기화된 경우 중복 방지
    if ($wrapper.data(SWIPER_INSTANCE_KEY)) {
      return;
    }

    // [정석] 컨테이너는 래퍼 자체
    var $container = $wrapper;

    // [정석] 컨테이너 바로 아래 wrapper 필수
    var $swiperWrapper = $container.children('.swiper-wrapper').first();
    if (!$swiperWrapper.length) {
      console.warn('[swiper-test] .swiper-wrapper not found in', $wrapper[0]);
      return;
    }

    // data-swiper-options에서 설정 파싱
    var optionsStr = $wrapper.attr('data-swiper-options');
    var userOptions = {};
    try {
      userOptions = optionsStr ? JSON.parse(optionsStr) : {};
    } catch (e) {
      console.error('[swiper-test] Invalid JSON in data-swiper-options', e);
      return;
    }

    // [정석] 직계 slide 기준
    var slideCount = $swiperWrapper.children('.swiper-slide').length;

    // navigation/pagination 플래그는 미리 보존 (병합 시 덮어쓰기 방지용)
    var navEnabled = userOptions.navigation !== false;
    var paginationEnabled = userOptions.pagination === true;

    // navigation/pagination은 아래에서 엘리먼트 바인딩 객체로 세팅하므로, boolean 덮어쓰기 방지
    delete userOptions.navigation;
    delete userOptions.pagination;

    // 기본 설정
    var defaultOptions = {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 300,
      keyboard: {
        enabled: true,
        onlyInViewport: true
      },
      a11y: {
        enabled: true,
        prevSlideMessage: '이전 슬라이드',
        nextSlideMessage: '다음 슬라이드',
        firstSlideMessage: '첫 번째 슬라이드',
        lastSlideMessage: '마지막 슬라이드'
      }
    };

    // Navigation 설정
    if (navEnabled) {
      var $prevBtn = $wrapper.children('.swiper-button-prev');
      var $nextBtn = $wrapper.children('.swiper-button-next');
      if ($prevBtn.length && $nextBtn.length) {
        defaultOptions.navigation = {
          prevEl: $prevBtn[0],
          nextEl: $nextBtn[0]
        };

        // 슬라이드 1개일 때 버튼 숨김 옵션(기본 true)
        if (slideCount === 1 && userOptions.hideNavWhenSingle !== false) {
          $prevBtn.hide();
          $nextBtn.hide();
        }
      }
    }

    // Pagination 설정
    if (paginationEnabled) {
      var $pagination = $wrapper.children('.swiper-pagination');
      if ($pagination.length) {
        defaultOptions.pagination = {
          el: $pagination[0],
          clickable: true,
          type: 'bullets'
        };
      }
    }

    // 슬라이드 1개일 때 중앙 정렬 옵션
    if (slideCount === 1 && userOptions.centerWhenSingle === true) {
      defaultOptions.centeredSlides = true;
    }

    // 사용자 옵션 병합
    var finalOptions = $.extend(true, {}, defaultOptions, userOptions);
    delete finalOptions.centerWhenSingle;
    delete finalOptions.hideNavWhenSingle;

    // Swiper 인스턴스 생성
    try {
      var swiperInstance = new swiper_bundle/* default */.A($container[0], finalOptions);
      $wrapper.data(SWIPER_INSTANCE_KEY, swiperInstance);
      console.log('[swiper-test] initialized:', $wrapper.attr('class'));
    } catch (e) {
      console.error('[swiper-test] Initialization failed', e);
    }
  }

  /**
   * 단일 Swiper 파괴
   * @param {jQuery} $wrapper - Swiper 컨테이너([data-swiper-options]) 요소
   */
  function destroySwiper($wrapper) {
    var instance = $wrapper.data(SWIPER_INSTANCE_KEY);
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy(true, true);
      $wrapper.removeData(SWIPER_INSTANCE_KEY);
      console.log('[swiper-test] destroyed:', $wrapper.attr('class'));
    }
  }
  window.UI.swiperTest = {
    init: function () {
      $('[data-swiper-options]').each(function () {
        initSwiper($(this));
      });
      console.log('[swiper-test] init');
    },
    destroy: function () {
      $('[data-swiper-options]').each(function () {
        destroySwiper($(this));
      });
      console.log('[swiper-test] destroy');
    },
    reinit: function (selector) {
      var $target = typeof selector === 'string' ? $(selector) : selector;
      $target.each(function () {
        var $wrapper = $(this);
        destroySwiper($wrapper);
        initSwiper($wrapper);
      });
    }
  };
  console.log('[swiper-test] module loaded');
})(window.jQuery || window.$, window);
// EXTERNAL MODULE: ./src/assets/scripts/ui/chip-button.js
var chip_button = __webpack_require__(755);
// EXTERNAL MODULE: ./src/assets/scripts/ui/quantity-stepper.js
var quantity_stepper = __webpack_require__(397);
// EXTERNAL MODULE: ./src/assets/scripts/ui/floating.js
var floating = __webpack_require__(478);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/textarea.js
var form_textarea = __webpack_require__(803);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/checkbox-total.js
var checkbox_total = __webpack_require__(379);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-gnb.js
var header_gnb = __webpack_require__(105);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-rank.js
var header_rank = __webpack_require__(596);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-search.js
var header_search = __webpack_require__(978);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-brand.js
var header_brand = __webpack_require__(697);
;// ./src/assets/scripts/ui/header/header.js
/**
 * scripts/ui/kendo/kendo.js
 * @purpose Kendo UI 관련 모듈 통합 관리
 */




(function (window) {
  'use strict';

  window.UI = window.UI || {};
  window.UI.header = {
    init: function () {
      if (window.UI.headerRank && window.UI.headerRank.init) window.UI.headerRank.init();
      if (window.UI.headerSearch && window.UI.headerSearch.init) window.UI.headerSearch.init();
      if (window.UI.headerGnb && window.UI.headerGnb.init) window.UI.headerGnb.init();
      if (window.UI.Brand && window.UI.Brand.init) window.UI.Brand.init();
      console.log('[header] all modules initialized');
    }
  };
  console.log('[header] loaded');
})(window);
// EXTERNAL MODULE: ./src/assets/scripts/ui/footer.js
var footer = __webpack_require__(795);
// EXTERNAL MODULE: ./src/assets/scripts/ui/product/tab-scrollbar.js
var tab_scrollbar = __webpack_require__(986);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/select.js
var form_select = __webpack_require__(865);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/input-search.js
var input_search = __webpack_require__(882);
// EXTERNAL MODULE: ./src/assets/scripts/ui/category/plp-titlebar-research.js
var plp_titlebar_research = __webpack_require__(809);
// EXTERNAL MODULE: ./src/assets/scripts/ui/category/category-tree.js
var category_tree = __webpack_require__(508);
// EXTERNAL MODULE: ./src/assets/scripts/ui/category/plp-chip-sync.js
var plp_chip_sync = __webpack_require__(504);
// EXTERNAL MODULE: ./src/assets/scripts/ui/category/plp-view-toggle.js
var plp_view_toggle = __webpack_require__(342);
// EXTERNAL MODULE: ./src/assets/scripts/ui/more-expand.js
var more_expand = __webpack_require__(146);
// EXTERNAL MODULE: ./src/assets/scripts/ui/filter-expand.js
var filter_expand = __webpack_require__(19);
// EXTERNAL MODULE: ./src/assets/scripts/ui/cart-order/cart-order.js
var cart_order = __webpack_require__(421);
// EXTERNAL MODULE: ./src/assets/scripts/ui/kendo/kendo-dropdown.js
var kendo_dropdown = __webpack_require__(47);
// EXTERNAL MODULE: ./src/assets/scripts/ui/kendo/kendo-datepicker.js
var kendo_datepicker = __webpack_require__(952);
// EXTERNAL MODULE: ./src/assets/scripts/ui/kendo/kendo-datepicker-single.js
var kendo_datepicker_single = __webpack_require__(405);
// EXTERNAL MODULE: ./src/assets/scripts/ui/kendo/kendo-window.js
var kendo_window = __webpack_require__(238);
;// ./src/assets/scripts/ui/kendo/kendo.js
/**
 * scripts/ui/kendo/kendo.js
 * @purpose Kendo UI 관련 모듈 통합 관리
 */




(function (window) {
  'use strict';

  window.UI = window.UI || {};
  window.UI.kendo = {
    init: function () {
      if (window.VitsKendoDropdown) {
        window.VitsKendoDropdown.initAll(document);
        window.VitsKendoDropdown.autoBindStart(document.body);
      }
      if (window.VitsSingleRangePicker) {
        window.VitsSingleRangePicker.initAll(document);
        window.VitsSingleRangePicker.autoBindStart(document.body);
      }
      if (window.VitsKendoWindow) {
        window.VitsKendoWindow.initAll(document);
        window.VitsKendoWindow.autoBindStart(document.body);
      }
      console.log('[kendo] all modules initialized');
    }
  };
  console.log('[kendo] loaded');
})(window);
// EXTERNAL MODULE: ./src/assets/scripts/ui/auth-ui.js
var auth_ui = __webpack_require__(593);
;// ./src/assets/scripts/core/ui.js
/**
 * scripts/core/ui.js
 * @purpose UI 기능 모음
 * @assumption
 *  - 기능별 UI는 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함한다
 *  - 각 UI 모듈은 window.UI.{name}.init 형태로 초기화 함수를 제공한다
 * @maintenance
 *  - index.js를 길게 만들지 않기 위해 UI import는 여기서만 관리한다
 *  - UI.init에는 “초기화 호출”만 둔다(기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */





























(function (window) {
  'use strict';

  window.UI = window.UI || {};

  /**
   * 공통 UI 초기화 진입점
   * @returns {void}
   * @example
   * // scripts/core/common.js에서 DOMReady 시점에 호출
   * UI.init();
   */
  window.UI.init = function () {
    if (window.UI.kendo && window.UI.kendo.init) window.UI.kendo.init();
    if (window.UI.toggle && window.UI.toggle.init) window.UI.toggle.init();
    if (window.UI.stepTab && window.UI.stepTab.init) window.UI.stepTab.init();
    if (window.UI.PeriodBtn && window.UI.PeriodBtn.init) window.UI.PeriodBtn.init();
    if (window.UI.scrollBoundary && window.UI.scrollBoundary.init) window.UI.scrollBoundary.init();
    if (window.UI.layer && window.UI.layer.init) window.UI.layer.init();
    if (window.UI.modal && window.UI.modal.init) window.UI.modal.init();
    if (window.UI.tooltip && window.UI.tooltip.init) window.UI.tooltip.init();
    if (window.UI.tab && window.UI.tab.init) window.UI.tab.init();
    if (window.UI.swiper && window.UI.swiper.init) window.UI.swiper.init();
    if (window.UI.swiperTest && window.UI.swiperTest.init) window.UI.swiperTest.init();
    if (window.UI.chipButton && window.UI.chipButton.init) window.UI.chipButton.init();
    if (window.UI.floating && window.UI.floating.init) window.UI.floating.init();
    if (window.UI.textarea && window.UI.textarea.init) window.UI.textarea.init();
    if (window.UI.checkboxTotal && window.UI.checkboxTotal.init) window.UI.checkboxTotal.init();
    if (window.UI.quantityStepper && window.UI.quantityStepper.init) window.UI.quantityStepper.init();
    if (window.UI.header && window.UI.header.init) window.UI.header.init();
    if (window.UI.footerBizInfo && window.UI.footerBizInfo.init) window.UI.footerBizInfo.init();
    if (window.UI.initDealGallery && window.UI.initDealGallery.init) window.UI.initDealGallery.init();
    if (window.UI.tabScrollbar && window.UI.tabScrollbar.init) window.UI.tabScrollbar.init();
    if (window.UI.select && window.UI.select.init) window.UI.select.init(document);
    if (window.UI.inputSearch && window.UI.inputSearch.init) window.UI.inputSearch.init();
    if (window.UI.plpTitlebarResearch && window.UI.plpTitlebarResearch.init) window.UI.plpTitlebarResearch.init();
    if (window.UI.categoryTree && window.UI.categoryTree.init) window.UI.categoryTree.init();
    if (window.UI.chipSync && window.UI.chipSync.init) window.UI.chipSync.init();
    if (window.UI.plpViewToggle && window.UI.plpViewToggle.init) window.UI.plpViewToggle.init();
    if (window.UI.moreExpand && window.UI.moreExpand.init) window.UI.moreExpand.init();
    if (window.UI.filterExpand && window.UI.filterExpand.init) window.UI.filterExpand.init();
    if (window.UI.cartOrder && window.UI.cartOrder.init) window.UI.cartOrder.init();
    if (window.UI.authUi && window.UI.authUi.init) window.UI.authUi.init();
  };
  console.log('[core/ui] loaded');
})(window);
// EXTERNAL MODULE: ./src/assets/scripts/core/common.js
var common = __webpack_require__(538);
;// ./src/assets/scripts/index.js
/**
 * scripts/index.js
 * @purpose 번들 엔트리(진입점)
 * @assumption
 *  - 빌드 결과(app.bundle.js)가 페이지에 자동 주입됨
 *  - core 모듈은 utils → ui → common 순서로 포함되어야 함
 * @maintenance
 *  - index.js는 짧게 유지한다(엔트리 역할만)
 *  - 기능 추가/삭제는 core/ui.js에서만 관리한다
 *  - 페이지 전용 스크립트가 필요하면 별도 모듈로 분리하고, 공통 초기화와 섞지 않는다
 */




console.log('[index] entry 실행');
;// ./src/app.js







if (document.body?.dataset?.guide === 'true') {
  // 가이드 페이지 전용 스타일(정렬/린트 영향 최소화하려면 이 파일에만 예외 설정을 몰아넣기 좋음)
  Promise.all(/* import() */[__webpack_require__.e(237), __webpack_require__.e(395)]).then(__webpack_require__.bind(__webpack_require__, 395));
}

// console.log(`%c ==== ${APP_ENV_ROOT}.${APP_ENV_TYPE} run ====`, 'color: green');
// console.log('%c APP_ENV_URL :', 'color: green', APP_ENV_URL);
// console.log('%c APP_ENV_TYPE :', 'color: green', APP_ENV_TYPE);
// console.log('%c ====================', 'color: green');

/***/ }),

/***/ 238:
/***/ (function() {

/**
 * @file kendo-window.js
 * @description Kendo Window 자동 초기화 모듈
 *
 * VitsKendoWindow.open('myWindow');
 * VitsKendoWindow.close('myWindow');
 * VitsKendoWindow.initAll();
 */

(function (window) {
  'use strict';

  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var scrollY = 0;
  var openedWindows = [];
  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  function lockBody() {
    var $ = window.jQuery;
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    scrollY = window.pageYOffset || 0;
    $('body').addClass(BODY_LOCK_CLASS).css({
      position: 'fixed',
      top: -scrollY + 'px',
      left: 0,
      right: 0,
      overflow: 'hidden',
      paddingRight: scrollbarWidth + 'px'
    });
  }
  function unlockBody() {
    var $ = window.jQuery;
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;
    $('body').removeClass(BODY_LOCK_CLASS).css({
      position: '',
      top: '',
      left: '',
      right: '',
      overflow: '',
      paddingRight: ''
    });
    window.scrollTo(0, scrollY);
  }
  function checkScroll(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    var $content = $el.find('.vits-modal-content');
    if ($content.length) {
      if ($content[0].scrollHeight > $content[0].clientHeight) {
        $content.addClass('has-scroll');
      } else {
        $content.removeClass('has-scroll');
      }
    }
  }
  function initOne(el) {
    var $ = window.jQuery;
    var $el = $(el);
    if ($el.data('kendoWindow')) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var id = $el.attr('id');
    var defaultOpts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
      },
      close: function () {
        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }
      }
    };
    var finalOpts = $.extend({}, defaultOpts, opts);

    // draggable: true면 헤더를 드래그 핸들로 자동 지정
    if (finalOpts.draggable === true) {
      finalOpts.draggable = {
        dragHandle: '.vits-modal-header'
      };
    }
    $el.kendoWindow(finalOpts);

    // draggable일 때 클래스 추가
    if (finalOpts.draggable) {
      $el.closest('.k-window').addClass('is-draggable');
    }
  }
  function initAll(root) {
    var $ = window.jQuery;
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }
  function autoBindStart(container) {
    if (!window.MutationObserver) return null;
    var target = container || document.body;
    initAll(target);
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (!node || node.nodeType !== 1) continue;
          initAll(node);
        }
      }
    });
    obs.observe(target, {
      childList: true,
      subtree: true
    });
    return obs;
  }
  function open(id, options) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    if (!$el.length) return;
    var inst = $el.data('kendoWindow');
    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }
    if (options && typeof options.onOpen === 'function') {
      inst.unbind('open').bind('open', function () {
        lockBody();
        options.onOpen.call(inst);
      });
    }
    if (inst) {
      inst.center().open();

      // 스크롤 여부 체크
      setTimeout(function () {
        checkScroll(id);
      }, 0);
    }
  }
  function close(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');
    if (inst) {
      $el.find('.vits-modal-content').removeClass('has-scroll');
      inst.close();
    }
  }

  // 리사이즈 시 열린 윈도우 중앙 재정렬 + 스크롤 체크
  window.jQuery(window).on('resize', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var inst = $('#' + id).data('kendoWindow');
      if (inst) {
        inst.center();
        checkScroll(id);
      }
    });
  });

  // 딤 클릭 시 닫기
  window.jQuery(document).on('click', '.k-overlay', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var inst = $('#' + id).data('kendoWindow');
      if (inst) inst.close();
    });
  });
  window.VitsKendoWindow = {
    initAll: initAll,
    autoBindStart: autoBindStart,
    open: open,
    close: close
  };
})(window);

/***/ }),

/***/ 265:
/***/ (function() {

/**
 * @file scripts/ui/tooltip.js
 * @purpose data-tooltip 기반 툴팁 공통
 * @description
 *  - 버튼 클릭 시 툴팁 토글
 *  - 외부 클릭 시 자동 닫기
 *  - ESC 키로 닫기
 *  - 툴팁 내부 닫기 버튼 지원
 * @option
 *  - data-tooltip="right|left|top|bottom" : 툴팁 위치 (CSS에서 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[tooltip] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var ACTIVE = 'is-open';

  // 툴팁 열기
  function openTooltip($trigger, $content) {
    $content.addClass(ACTIVE).attr('aria-hidden', 'false');
    $trigger.attr('aria-expanded', 'true');
  }

  // 툴팁 닫기
  function closeTooltip($trigger, $content) {
    $content.removeClass(ACTIVE).attr('aria-hidden', 'true');
    $trigger.attr('aria-expanded', 'false');
  }

  // 모든 열린 툴팁 닫기
  function closeAllTooltips() {
    $('.vits-tooltip-content.' + ACTIVE).each(function () {
      var $content = $(this);
      var $tooltip = $content.closest('[data-tooltip]');
      var $trigger = $tooltip.find('.vits-tooltip-trigger');
      closeTooltip($trigger, $content);
    });
  }

  // 툴팁 초기화
  function bindTooltip($tooltip) {
    var $trigger = $tooltip.find('.vits-tooltip-trigger');
    var $content = $tooltip.find('.vits-tooltip-content');
    var $closeBtn = $content.find('.vits-tooltip-heading .button');
    if (!$trigger.length || !$content.length) return;

    // 트리거 버튼 클릭
    $trigger.on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = $content.hasClass(ACTIVE);

      // 다른 툴팁 모두 닫기
      closeAllTooltips();

      // 현재 툴팁 토글
      if (isOpen) {
        closeTooltip($trigger, $content);
      } else {
        openTooltip($trigger, $content);
      }
    });

    // 툴팁 내부 닫기 버튼
    if ($closeBtn.length) {
      $closeBtn.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeTooltip($trigger, $content);
        $trigger.focus();
      });
    }

    // 툴팁 내부 클릭 시 전파 방지 (툴팁이 닫히지 않도록)
    $content.on('click', function (e) {
      e.stopPropagation();
    });
  }

  // 외부 클릭 시 모든 툴팁 닫기
  function bindOutsideClick() {
    $(document).on('click.uiTooltip', function (e) {
      if (!$(e.target).closest('[data-tooltip]').length) {
        closeAllTooltips();
      }
    });
  }

  // ESC 키로 툴팁 닫기
  function bindEscKey() {
    $(document).on('keydown.uiTooltip', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var $openContent = $('.vits-tooltip-content.' + ACTIVE);
        if ($openContent.length) {
          var $tooltip = $openContent.closest('[data-tooltip]');
          var $trigger = $tooltip.find('.vits-tooltip-trigger');
          closeTooltip($trigger, $openContent);
          $trigger.focus();
        }
      }
    });
  }
  window.UI.tooltip = {
    init: function () {
      $('[data-tooltip]').each(function () {
        bindTooltip($(this));
      });
      bindOutsideClick();
      bindEscKey();
      console.log('[tooltip] init');
    }
  };
  console.log('[tooltip] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 342:
/***/ (function() {

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
    $(document).off('click' + NS, TOGGLE_BTN).on('click' + NS, TOGGLE_BTN, function (e) {
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

/***/ }),

/***/ 344:
/***/ (function() {

/**
 * @file scripts/ui/toggle.js
 * @purpose data-속성 기반 토글/아코디언 공통
 * @description
 *  - 스코프: [data-toggle-scope] 내부에서만 동작
 *  - 매핑: [data-toggle-btn][data-toggle-target] ↔ [data-toggle-box="target"]
 *  - 상태: is-open 클래스 + aria-expanded 값으로만 제어
 * @option
 *  - data-toggle-group="true"   : 스코프 내 1개만 오픈(아코디언)
 *  - data-toggle-outside="true" : 스코프 외 클릭 시 closeAll 실행(document 이벤트)
 * @a11y
 *  - aria-expanded만 제어(aria-controls는 마크업 선택)
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일, 표현/스타일은 CSS에서만 처리)
 *  - closeAll은 스코프 내부만 정리(외부 클릭/그룹 전환에 공용)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[toggle] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var ACTIVE = 'is-open';
  var GROUP_EXCEPT_KEY = 'toggleGroupExceptActive';
  var OUTSIDE_ACTIVE_KEY = 'toggleOutsideActive';

  // syncAriaLabel: aria-expanded(true/false)에 맞춰 aria-label("... 열기/닫기") 동기화(옵션)
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;
    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }

  // open: 패널 오픈 + 버튼 aria-expanded(true) 갱신
  function open($btn, $box) {
    var shouldCloseOnOutside = $btn.data('toggleOutside') === true;
    var isGroupExcept = $btn.data('toggleGroupExcept') === true;
    $box.addClass(ACTIVE);
    $box.data(OUTSIDE_ACTIVE_KEY, shouldCloseOnOutside);
    $box.data(GROUP_EXCEPT_KEY, isGroupExcept);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);
  }

  // close: 패널 닫기 + 버튼 aria-expanded(false) 갱신
  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $box.removeData(OUTSIDE_ACTIVE_KEY);
    $box.removeData(GROUP_EXCEPT_KEY);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);
  }

  // closeAll: 스코프 내 열린 패널/버튼을 일괄 닫기(그룹/외부클릭)
  function closeAll($scope) {
    // 패널: 예외로 표시된 패널은 닫지 않음
    $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
      var $box = $(this);
      if ($box.data(GROUP_EXCEPT_KEY) === true) return; // 그룹 제외 패널 유지

      $box.removeClass(ACTIVE);
      $box.removeData(OUTSIDE_ACTIVE_KEY);
      $box.removeData(GROUP_EXCEPT_KEY);
    });

    // 버튼: 열린 버튼 중 "유지되는 패널(예외)"에 연결된 버튼은 aria-expanded를 false로 내리지 않음
    var $openBtns = $scope.find('[data-toggle-btn][aria-expanded="true"]');
    $openBtns.each(function () {
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;
      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if ($box.length && $box.hasClass(ACTIVE) && $box.data(GROUP_EXCEPT_KEY) === true) {
        return; // 예외 패널이 유지 중이면 버튼도 열린 상태 유지
      }
      $btn.attr('aria-expanded', 'false');
      syncAriaLabel($btn);
    });
  }

  // bindOutsideClose: 스코프 밖 클릭 시, outside=true로 열린 패널만 닫기
  function bindOutsideClose($scope) {
    // 같은 스코프에 중복 바인딩 방지
    if ($scope.data('toggleOutsideBound') === true) return;
    $scope.data('toggleOutsideBound', true);
    $(document).on('click.uiToggleOutside', function (e) {
      // 스코프 내부 클릭은 무시(패널 유지)
      if ($scope.has(e.target).length) return;

      // outside=true 버튼으로 열린 패널만 닫기
      $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
        var $box = $(this);
        if ($box.data(OUTSIDE_ACTIVE_KEY) !== true) return;
        var target = $box.attr('data-toggle-box');
        var $btn = $scope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
        if (!$btn.length) return;
        close($btn, $box);
      });
    });
  }

  // bindScope: 스코프 내부에서 버튼 클릭 위임 처리(그룹이면 closeAll 후 open)
  function bindScope($scope) {
    $scope.on('click', '[data-toggle-btn]', function (e) {
      e.preventDefault();
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;
      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if (!$box.length) return;
      var isOpen = $box.hasClass(ACTIVE);
      var isGroup = $scope.data('toggleGroup') === true;
      var isGroupExcept = $btn.data('toggleGroupExcept') === true;
      if (isOpen) {
        close($btn, $box);
        return;
      }
      if (isGroup && !isGroupExcept) closeAll($scope);
      open($btn, $box);
    });

    // data-toggle-outside="true"가 있는 버튼이 이 스코프에 존재하면 바인딩
    if ($scope.find('[data-toggle-btn][data-toggle-outside="true"]').length) {
      bindOutsideClose($scope);
    }
  }
  window.UI.toggle = {
    // init: [data-toggle-scope]별로 이벤트 위임 바인딩
    init: function () {
      $('[data-toggle-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[toggle] init');
    }
  };
  console.log('[toggle] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 369:
/***/ (function() {

/**
 * @file scripts/ui/tab.js
 * @description data-속성 기반 탭 전환 공통
 * @scope [data-vits-tab] 내부에서만 동작
 * @mapping [data-tab-id] ↔ [data-tab-panel]
 * @state is-active 클래스 + aria-selected/aria-hidden 값으로 제어
 * @option
 *  - URL 해시(#tab=xxx) 지원
 *  - 키보드: 좌우 화살표, Home/End
 * @a11y
 *  - aria-selected, aria-hidden, tabindex, aria-controls 자동 관리
 *  - role은 마크업에서 선언
 * @events ui:tab-change - { selectedId, containerId, root, btn, panel }
 * @note data-tab-nav, data-tab-content는 CSS 셀렉터용 (JS 미참조)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiTab';
  var ACTIVE_CLS = 'is-active';
  var EVENT_CHANGE = 'ui:tab-change';
  var HASH_PARAM = 'tab';
  var SEL = {
    ROOT: '[data-vits-tab]',
    BTN: '[data-tab-id]',
    PANEL: '[data-tab-panel]'
  };
  var DATA = {
    TAB_ID: 'tab-id',
    TAB_PANEL: 'tab-panel',
    VITS_TAB: 'vits-tab'
  };
  var KEYS = {
    LEFT: 37,
    RIGHT: 39,
    HOME: 36,
    END: 35
  };

  // Selector Injection 방지용 data 속성 필터
  function filterByData($els, value, attrName) {
    return $els.filter(function () {
      return $(this).data(attrName) === value;
    });
  }

  // containerId로 루트 요소 반환
  function getRootById(containerId) {
    return filterByData($(SEL.ROOT), containerId, DATA.VITS_TAB);
  }

  // 가장 가까운 탭 루트 반환
  function getRoot($el) {
    return $el.closest(SEL.ROOT);
  }

  // 인덱스 순환 (처음↔끝 연결)
  function wrapIndex(current, total, delta) {
    return (current + delta + total) % total;
  }

  // 탭 선택 (opts.focus: 키보드 탐색 시 포커스 이동)
  function select($root, id, opts) {
    if (!$root.length || !id) return;
    opts = opts || {};
    var $btns = $root.find(SEL.BTN);
    var $currentActive = $btns.filter('.' + ACTIVE_CLS);

    // 이미 활성화된 탭이면 스킵
    if ($currentActive.length && $currentActive.data(DATA.TAB_ID) === id) return;
    var $panels = $root.find(SEL.PANEL);
    var $targetBtn = filterByData($btns, id, DATA.TAB_ID);
    var $targetPanel = filterByData($panels, id, DATA.TAB_PANEL);
    if (!$targetBtn.length) return;

    // 전체 비활성화
    $btns.removeClass(ACTIVE_CLS).attr({
      'aria-selected': 'false',
      tabindex: '-1'
    });
    $panels.removeClass(ACTIVE_CLS).attr('aria-hidden', 'true');

    // 대상 활성화
    $targetBtn.addClass(ACTIVE_CLS).attr({
      'aria-selected': 'true',
      tabindex: '0'
    });
    $targetPanel.addClass(ACTIVE_CLS).attr('aria-hidden', 'false');
    if (opts.focus) $targetBtn.focus();

    // 외부 연동용 이벤트 발행
    $(document).trigger(EVENT_CHANGE, {
      selectedId: id,
      containerId: $root.data(DATA.VITS_TAB),
      root: $root[0],
      btn: $targetBtn[0],
      panel: $targetPanel[0]
    });
  }

  // 인접 탭 선택 (delta: -1 이전, 1 다음)
  function selectAdjacent($root, $currentBtn, delta) {
    var $btns = $root.find(SEL.BTN);
    var nextIdx = wrapIndex($btns.index($currentBtn), $btns.length, delta);
    select($root, $btns.eq(nextIdx).data(DATA.TAB_ID), {
      focus: true
    });
  }

  // 처음/끝 탭 선택
  function selectEdge($root, isFirst) {
    var $btns = $root.find(SEL.BTN);
    var $target = isFirst ? $btns.first() : $btns.last();
    select($root, $target.data(DATA.TAB_ID), {
      focus: true
    });
  }
  function onClickTab(e) {
    select(getRoot($(e.currentTarget)), $(e.currentTarget).data(DATA.TAB_ID));
  }
  function onKeydownTab(e) {
    var $btn = $(e.currentTarget);
    var $root = getRoot($btn);
    var key = e.which || e.keyCode;
    switch (key) {
      case KEYS.LEFT:
        e.preventDefault();
        selectAdjacent($root, $btn, -1);
        break;
      case KEYS.RIGHT:
        e.preventDefault();
        selectAdjacent($root, $btn, 1);
        break;
      case KEYS.HOME:
        e.preventDefault();
        selectEdge($root, true);
        break;
      case KEYS.END:
        e.preventDefault();
        selectEdge($root, false);
        break;
    }
  }

  // URL 해시 파싱 후 탭 적용 (예: #tab=tab2)
  function applyHash() {
    var hash = location.hash.slice(1);
    if (!hash) return;
    var id = null;
    if (typeof URLSearchParams !== 'undefined') {
      id = new URLSearchParams(hash).get(HASH_PARAM);
    } else {
      var match = hash.match(new RegExp('(?:^|&)' + HASH_PARAM + '=([^&]+)'));
      id = match ? decodeURIComponent(match[1]) : null;
    }
    if (!id) return;
    var $btn = filterByData($(SEL.BTN), id, DATA.TAB_ID);
    if ($btn.length) select(getRoot($btn.first()), id);
  }

  //초기화 / 정리
  function initA11yForRoot($root) {
    if (!$root.length) return;
    var $btns = $root.find(SEL.BTN);
    var $panels = $root.find(SEL.PANEL);
    $btns.each(function () {
      var $btn = $(this);
      var id = $btn.data(DATA.TAB_ID);
      var $panel = filterByData($panels, id, DATA.TAB_PANEL);
      var panelId = $panel.attr('id');
      var isActive = $btn.hasClass(ACTIVE_CLS);
      if (!panelId && $panel.length) {
        panelId = 'tabpanel-' + id + '-' + Math.random().toString(36).slice(2, 8);
        $panel.attr('id', panelId);
      }
      var attrs = {
        'aria-selected': isActive ? 'true' : 'false',
        tabindex: isActive ? '0' : '-1'
      };
      if (panelId) attrs['aria-controls'] = panelId;
      $btn.attr(attrs);
      $panel.attr('aria-hidden', isActive ? 'false' : 'true');
    });
  }
  function initA11y() {
    $(SEL.ROOT).each(function () {
      initA11yForRoot($(this));
    });
  }
  function bind() {
    $(document).off('click' + NS, SEL.ROOT + ' ' + SEL.BTN).off('keydown' + NS, SEL.ROOT + ' ' + SEL.BTN).on('click' + NS, SEL.ROOT + ' ' + SEL.BTN, onClickTab).on('keydown' + NS, SEL.ROOT + ' ' + SEL.BTN, onKeydownTab);
    $(window).off('hashchange' + NS).on('hashchange' + NS, applyHash);
  }
  function unbind() {
    $(document).off(NS);
    $(window).off(NS);
  }
  window.UI.tab = {
    init: function () {
      bind();
      initA11y();
      applyHash();
    },
    destroy: function () {
      unbind();
    },
    select: function (containerId, selectedId) {
      select(getRootById(containerId), selectedId);
    },
    getActiveId: function (containerId) {
      var $active = getRootById(containerId).find(SEL.BTN + '.' + ACTIVE_CLS);
      return $active.length ? $active.data(DATA.TAB_ID) : null;
    },
    refresh: function (containerId) {
      if (containerId) {
        initA11yForRoot(getRootById(containerId));
      } else {
        initA11y();
      }
    }
  };
})(window.jQuery, window, document);

/***/ }),

/***/ 379:
/***/ (function() {

/**
 * @file scripts/ui/checkbox-total.js
 * @purpose data-속성 기반 체크박스 전체선택/해제
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[checkbox-total] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var CHECKED = 'is-checked';
  function updateCheckAllState($scope) {
    var $allCheckbox = $scope.find('[data-checkbox-all]');
    if (!$allCheckbox.length) return;
    var $items = $scope.find('[data-checkbox-item]');
    var totalCount = $items.length;
    var checkedCount = $items.filter(':checked').length;
    var isAllChecked = totalCount === checkedCount && totalCount > 0;
    $allCheckbox.prop('checked', isAllChecked);
    $allCheckbox.toggleClass(CHECKED, isAllChecked);
  }
  function bindScope($scope) {
    $scope.on('change', '[data-checkbox-all]', function () {
      var $allCheckbox = $(this);
      var isChecked = $allCheckbox.is(':checked');
      var $items = $scope.find('[data-checkbox-item]');
      $items.prop('checked', isChecked);
      $items.toggleClass(CHECKED, isChecked);
      $allCheckbox.toggleClass(CHECKED, isChecked);
    });
    $scope.on('change', '[data-checkbox-item]', function () {
      var $checkbox = $(this);
      $checkbox.toggleClass(CHECKED, $checkbox.is(':checked'));
      updateCheckAllState($scope);
    });
  }
  window.UI.checkboxTotal = {
    init: function () {
      $('[data-checkbox-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[checkbox-total] init');
    }
  };
  console.log('[checkbox-total] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 397:
/***/ (function() {

/**
 * @file scripts/ui/quantity-stepper.js
 * @purpose
 * @description
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[quantity-stepper] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var EVENT_NS = '.uiQuantityStepper';
  var ROOT_SEL = '.quantity-control';
  var INPUT_SEL = '.quantity-input';
  var MEASURE_SEL = '.quantity-input-measure';
  var BTN_MINUS_SEL = '.btn-step.vits-minus-icon';
  var BTN_PLUS_SEL = '.btn-step.vits-plus-icon';
  var INIT_KEY = 'uiQuantityStepperInit';
  function toNumber(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function onlyDigits(str) {
    return String(str || '').replace(/\D+/g, '');
  }
  function clamp(n, min, max) {
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }
  function getOptions($input) {
    return {
      step: toNumber($input.data('step'), 1),
      min: toNumber($input.data('min'), 1),
      max: toNumber($input.data('max'), Infinity),
      minW: 40
    };
  }
  function syncMeasureFont($input, $measure) {
    if (!$measure || !$measure.length) return;
    var font = $input.css('font');
    $measure.css({
      font: font,
      letterSpacing: $input.css('letter-spacing')
    });
  }
  function resizeInput($input, $measure, minW) {
    if (!$measure || !$measure.length) return;
    var v = $input.val();
    var text = v && String(v).length ? String(v) : '0';
    $measure.text(text);

    // 커서 여유
    var extra = 16;
    var w = $measure[0].offsetWidth + extra;
    if (w < minW) w = minW;
    $input.css('width', w + 'px');
  }
  function getValue($input, min, max) {
    var digits = onlyDigits($input.val());
    if ($input.val() !== digits) $input.val(digits);
    var n = digits === '' ? 0 : toNumber(digits, 0);
    return clamp(n, min, max);
  }
  function setValue($input, n, min, max) {
    $input.val(String(clamp(n, min, max)));
  }
  function syncDisabled($root, v, step, min, max, isDisabled) {
    var disabled = !!isDisabled;
    $root.find(BTN_MINUS_SEL).prop('disabled', disabled || v - step < min);
    $root.find(BTN_PLUS_SEL).prop('disabled', disabled || v + step > max);
  }
  function refresh($root) {
    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;
    var opts = getOptions($input);
    var v = getValue($input, opts.min, opts.max);
    setValue($input, v, opts.min, opts.max);
    resizeInput($input, $measure, opts.minW);
    syncDisabled($root, v, opts.step, opts.min, opts.max, $input.prop('disabled'));
  }
  function bindRoot($root) {
    if ($root.data(INIT_KEY)) return;
    $root.data(INIT_KEY, true);
    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;
    syncMeasureFont($input, $measure);
    $root.off('click' + EVENT_NS, BTN_MINUS_SEL);
    $root.off('click' + EVENT_NS, BTN_PLUS_SEL);
    $root.off('input' + EVENT_NS, INPUT_SEL);
    $root.on('click' + EVENT_NS, BTN_MINUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v - opts.step, opts.min, opts.max);
      refresh($root);
    });
    $root.on('click' + EVENT_NS, BTN_PLUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v + opts.step, opts.min, opts.max);
      refresh($root);
    });
    $root.on('input' + EVENT_NS, INPUT_SEL, function () {
      refresh($root);
    });
    refresh($root);
  }
  function bindResize() {
    $(window).off('resize' + EVENT_NS);
    $(window).on('resize' + EVENT_NS, function () {
      $(ROOT_SEL).each(function () {
        var $root = $(this);
        if (!$root.data(INIT_KEY)) return;
        var $input = $root.find(INPUT_SEL);
        var $measure = $root.find(MEASURE_SEL);
        if (!$input.length) return;
        syncMeasureFont($input, $measure);
        resizeInput($input, $measure, getOptions($input).minW);
      });
    });
  }
  window.UI.quantityStepper = {
    init: function (root) {
      var $scope = root ? $(root) : $(document);
      $scope.find(ROOT_SEL).each(function () {
        bindRoot($(this));
      });
      bindResize();
      console.log('[quantity-stepper] init');
    }
  };
  console.log('[quantity-stepper] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 405:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-datepicker-single.js
 * @description
 * 단일 DatePicker 초기화 모듈
 * - 월 이동 애니메이션 제거
 * - 요일명(Sun~Sat) 완전 고정 (왕복 이동 포함)
 * - ESLint no-unused-vars 완전 대응
 */

(function (window) {
  'use strict';

  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var YEARVIEW_MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  function parseJsonSafe(str) {
    if (!str) return null;
    try {
      return JSON.parse(str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    } catch {
      return null;
    }
  }
  function parseBool(val) {
    if (val === undefined || val === null) return null;
    if (typeof val === 'boolean') return val;
    var v = String(val).toLowerCase().trim();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return null;
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDatePicker);
  }
  function initDatePicker(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDatePicker')) return;
    var opts = parseJsonSafe($el.attr('data-opt') || '{}') || {};
    var $calendarWrap = null;
    var $wrapper = $el.closest('[data-ui="kendo-datepicker-single"]'); // 2026-02-03 추가

    function getCalendar() {
      var inst = $el.data('kendoDatePicker');
      return inst && inst.dateView && inst.dateView.calendar;
    }
    function resolveCalendarWrap() {
      if ($calendarWrap && $calendarWrap.length) return $calendarWrap;
      var cal = getCalendar();
      if (cal) $calendarWrap = cal.element;
      return $calendarWrap;
    }
    function applyCalendarClasses() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      var $outer = $el.closest('.vits-datepicker-single');
      if (!$outer.length) return;
      var classes = ($outer.attr('class') || '').split(/\s+/);
      classes.forEach(function (cls) {
        if (cls.indexOf('vits-') === 0) $wrap.addClass(cls);
      });
    }
    var dayNameObserver = null;
    var dayNameObserverTarget = null;
    var dayNameApplyScheduled = false;
    var headerMonthApplyScheduled = false;
    var yearViewMonthApplyScheduled = false;
    function pad2(num) {
      return num < 10 ? '0' + num : String(num);
    }
    function formatHeaderMonthParts(date) {
      if (!date) return null;
      return {
        year: String(date.getFullYear()),
        month: pad2(date.getMonth() + 1)
      };
    }
    function applyDayNamesImmediate() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      $wrap.find('th').each(function (i) {
        var $th = window.jQuery(this);
        var $link = $th.find('.k-link');
        var nextText = DAY_NAMES[i];
        if ($link.length) {
          if ($link.text() !== nextText) $link.text(nextText);
        } else if ($th.text() !== nextText) {
          $th.text(nextText);
        }
      });
      applyCalendarClasses();
    }
    function scheduleDayNameApply() {
      if (dayNameApplyScheduled) return;
      dayNameApplyScheduled = true;
      window.requestAnimationFrame(function () {
        dayNameApplyScheduled = false;
        applyDayNamesImmediate();
      });
    }
    function applyHeaderMonthImmediate() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      var cal = getCalendar();
      var current = cal && typeof cal.current === 'function' ? cal.current() : null;
      var parts = formatHeaderMonthParts(current);
      if (!parts) return;
      var nextText = parts.year + '.' + parts.month;
      var $header = $wrap.find('.k-header, .k-calendar-header').first();
      var $headerLink = $wrap.find('.k-nav-fast, .k-calendar-header .k-link, .k-header .k-link, .k-calendar-header .k-title, .k-header .k-title').first();
      if (!$headerLink.length && $header.length) $headerLink = $header;
      if (!$headerLink.length) return;
      var $buttonText = $headerLink.find('.k-button-text').first();
      var useDot = $header.hasClass('k-hstack');
      var nextHtml = parts.year + '<span class="nav-dot">.</span>' + parts.month;
      if ($buttonText.length) {
        if (useDot) {
          if ($buttonText.html() !== nextHtml) $buttonText.html(nextHtml);
        } else if ($buttonText.text() !== nextText) {
          $buttonText.text(nextText);
        }
      } else if (useDot) {
        if ($headerLink.html() !== nextHtml) $headerLink.html(nextHtml);
      } else if ($headerLink.text() !== nextText) {
        $headerLink.text(nextText);
      }
    }
    function scheduleHeaderMonthApply() {
      if (headerMonthApplyScheduled) return;
      headerMonthApplyScheduled = true;
      window.requestAnimationFrame(function () {
        headerMonthApplyScheduled = false;
        applyHeaderMonthImmediate();
      });
    }
    function applyYearViewMonthNamesImmediate() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      var $yearView = $wrap.find('.k-calendar-yearview').first();
      if (!$yearView.length) return;
      var $monthLinks = $yearView.find('td .k-link');
      if (!$monthLinks.length) return;
      $monthLinks.each(function (i) {
        var nextText = YEARVIEW_MONTH_NAMES[i];
        if (!nextText) return;
        var $link = window.jQuery(this);
        if ($link.text() !== nextText) $link.text(nextText);
      });
    }
    function scheduleYearViewMonthApply() {
      if (yearViewMonthApplyScheduled) return;
      yearViewMonthApplyScheduled = true;
      window.requestAnimationFrame(function () {
        yearViewMonthApplyScheduled = false;
        applyYearViewMonthNamesImmediate();
      });
    }

    /**
     * 🔥 핵심 함수
     * Calendar DOM 재렌더링이 끝난 "뒤"에
     * 요일명을 무조건 다시 적용
     */
    function forceApplyDayNames() {
      scheduleDayNameApply();
      window.setTimeout(scheduleDayNameApply, 0);
    }
    function forceApplyHeaderMonth() {
      scheduleHeaderMonthApply();
      window.setTimeout(scheduleHeaderMonthApply, 0);
    }
    function forceApplyYearViewMonthNames() {
      scheduleYearViewMonthApply();
      window.setTimeout(scheduleYearViewMonthApply, 0);
    }
    function ensureDayNameObserver() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap || !window.MutationObserver) return;
      var target = $wrap[0];
      if (dayNameObserver && dayNameObserverTarget === target) return;
      if (dayNameObserver) {
        dayNameObserver.disconnect();
      }
      dayNameObserverTarget = target;
      dayNameObserver = new window.MutationObserver(function () {
        scheduleDayNameApply();
        scheduleHeaderMonthApply();
        scheduleYearViewMonthApply();
      });
      dayNameObserver.observe(target, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    function disableCalendarAnimation() {
      var cal = getCalendar();
      if (!cal) return;
      try {
        cal.setOptions({
          animation: false
        });
      } catch {
        cal.options.animation = false;
      }
    }
    function updatePrevNavState() {
      var cal = getCalendar();
      var $wrap = resolveCalendarWrap();
      if (!cal || !$wrap) return;
      var minDate = opts.min instanceof Date ? opts.min : null;
      if (!minDate) return;
      var current = typeof cal.current === 'function' ? cal.current() : null;
      if (!current) return;
      var currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
      var minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      var isPrevBlocked = currentMonth <= minMonth;
      var $prev = $wrap.find('.k-nav-prev').first();
      if (!$prev.length) return;
      if (isPrevBlocked) {
        $prev.addClass('k-state-disabled').attr('aria-disabled', 'true');
      } else {
        $prev.removeClass('k-state-disabled').removeAttr('aria-disabled');
      }
    }

    // 2026-02-03 추가 - 값 선택 시 래퍼에 is-selected 클래스 토글
    function updateSelectedState() {
      if (!$wrapper.length) return;
      var inst = $el.data('kendoDatePicker');
      $wrapper.toggleClass('is-selected', !!(inst && inst.value()));
    }

    /* 옵션 */
    opts.format = opts.format || 'yyyy.MM.dd';
    opts.culture = opts.culture || 'ko-KR';
    opts.footer = false;
    opts.parseFormats = ['yyyy.MM.dd', 'yyyyMMdd', 'yyyy-MM-dd'];
    opts.animation = false;
    opts.calendar = opts.calendar || {};
    opts.calendar.culture = opts.calendar.culture || 'en-US';
    opts.calendar.animation = false;
    opts.calendar.navigate = function () {
      disableCalendarAnimation();
      forceApplyDayNames();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
    };
    opts.calendar.change = function () {
      forceApplyDayNames();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
    };
    if (!opts.min) {
      var today = new Date();
      opts.min = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    $el.kendoDatePicker(opts);
    var inst = $el.data('kendoDatePicker');
    if (inst) {
      disableCalendarAnimation();
      ensureDayNameObserver();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
      if (inst.popup && inst.popup.setOptions) {
        try {
          inst.popup.setOptions({
            animation: false
          });
        } catch {
          // eslint-disable-next-line no-unused-vars
          // no-op
        }
      }
      inst.bind('open', function () {
        disableCalendarAnimation();
        ensureDayNameObserver();
        forceApplyDayNames();
        forceApplyHeaderMonth();
        forceApplyYearViewMonthNames();
        updatePrevNavState();
      });

      // 2026-02-03 추가 - 날짜 선택/변경 시 is-selected 토글
      inst.bind('change', function () {
        updateSelectedState();
      });
      updateSelectedState(); // 2026-02-03 추가 - 초기값 대응
    }
    if (parseBool($el.attr('data-open')) && inst) {
      window.setTimeout(function () {
        inst.open();
      }, 0);
    }
  }
  function initAll() {
    if (!ensureKendoAvailable()) return;
    var targets = document.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]');
    for (var i = 0; i < targets.length; i++) {
      initDatePicker(targets[i]);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})(window);

/***/ }),

/***/ 421:
/***/ (function() {

/**
 * @file scripts/ui/cart-order/cart-order.js
 * @purpose 장바구니 , 배송정보 , 결제 페이지에 대한 공통 UI 처리
 * @description
 *  - 할인금액 토글 처리 (클릭 시 할인금액 상세 표시/숨김)
 *  - 배송방법 탭과 패널 매칭 처리 (data-method/data-panel 기반)
 *  - 결제수단 탭과 패널 매칭 처리 (vits-payment-tab)
 *  - 결제수단 라디오 버튼과 패널 매칭 처리 (vits-payment-item)
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[cart-order] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  window.UI.cartOrder = {
    init: function () {
      //vits-cart-body 영역
      var discountItemSelector = '.vits-cart-summary-item.has-discount';
      var shippingWrapSelector = '.vits-shipping';
      var shippingBtnSelector = '.vits-shipping-method-btn[data-method]';
      var shippingPanelSelector = '.vits-shipping-panel[data-panel]';
      var addressWrapSelector = '.vits-address-modify-form';
      var addressTypeSelector = '.vits-address-type input[type="radio"][name="shippingType"]';
      var addressPanelSelector = '.vits-address-fields[data-address-panel]';
      function setDiscountState($item, isActive) {
        var $toggle = $item.find('.discount-toggle').first();
        var $info = $item.find('.discount-info').first();
        var $detail = $item.find('.discount-info-detail').first();
        var $icon = $toggle.find('.ic').first();
        var nextActive = !!isActive;
        if (!$toggle.length || !$info.length || !$detail.length) return;
        $info.toggleClass('is-active', nextActive);
        $toggle.attr('aria-expanded', nextActive ? 'true' : 'false');
        $detail.attr('aria-hidden', nextActive ? 'true' : 'false');
        if ($icon.length) {
          $icon.toggleClass('ic-arrow-down', !nextActive);
          $icon.toggleClass('ic-arrow-up', nextActive);
        }
      }
      function setShippingState($wrap, method) {
        if (!$wrap.length || !method) return;
        var $buttons = $wrap.find(shippingBtnSelector);
        var $panels = $wrap.find(shippingPanelSelector);
        var methodValue = String(method);
        var hasPanel = $panels.filter('[data-panel="' + methodValue + '"]').length > 0;
        if (!hasPanel) return;
        $buttons.each(function () {
          var $btn = $(this);
          var isActive = $btn.attr('data-method') === methodValue;
          $btn.toggleClass('is-active', isActive);
        });
        $panels.each(function () {
          var $panel = $(this);
          var isActive = $panel.attr('data-panel') === methodValue;
          $panel.toggleClass('is-active', isActive);
        });
      }
      function setAddressTypeState($wrap, typeValue, radioId) {
        if (!$wrap.length || !typeValue) return;
        var $radios = $wrap.find(addressTypeSelector);
        var $panels = $wrap.find(addressPanelSelector);
        var value = String(typeValue);
        var $targetPanel = $panels.filter('[data-address-panel="' + value + '"]').first();
        if (!$targetPanel.length) return;
        $radios.each(function () {
          var $radio = $(this);
          var isExpanded = $radio.val() === value;
          $radio.attr('aria-expanded', isExpanded ? 'true' : 'false');
        });
        $panels.each(function () {
          var $panel = $(this);
          var isActive = $panel.attr('data-address-panel') === value;
          $panel.toggleClass('is-active', isActive);
          $panel.attr('aria-hidden', isActive ? 'false' : 'true');
          if (isActive && radioId) {
            $panel.attr('aria-labelledby', radioId);
          }
        });
      }
      $(discountItemSelector).each(function () {
        var $item = $(this);
        var isActive = $item.find('.discount-info').first().hasClass('is-active');
        setDiscountState($item, isActive);
      });
      $(shippingWrapSelector).each(function () {
        var $wrap = $(this);
        var $activeBtn = $wrap.find(shippingBtnSelector + '.is-active').first();
        var activeMethod = $activeBtn.attr('data-method');
        if (!activeMethod) {
          activeMethod = $wrap.find(shippingBtnSelector).first().attr('data-method');
        }
        if (activeMethod) {
          setShippingState($wrap, activeMethod);
        }
      });
      $(addressWrapSelector).each(function () {
        var $wrap = $(this);
        var $checked = $wrap.find(addressTypeSelector + ':checked').first();
        var $fallback = $wrap.find(addressTypeSelector).first();
        var $current = $checked.length ? $checked : $fallback;
        var typeValue = $current.val();
        if (typeValue) {
          setAddressTypeState($wrap, typeValue, $current.attr('id'));
        }
      });
      $(document).off('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle').on('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle', function () {
        var $toggle = $(this);
        var $item = $toggle.closest(discountItemSelector);
        var isActive = $item.find('.discount-info').first().hasClass('is-active');
        setDiscountState($item, !isActive);
      });
      $(document).off('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector).on('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector, function () {
        var $btn = $(this);
        var $wrap = $btn.closest(shippingWrapSelector);
        var method = $btn.attr('data-method');
        setShippingState($wrap, method);
      });
      $(document).off('change.cartOrderAddressType', addressTypeSelector).on('change.cartOrderAddressType', addressTypeSelector, function () {
        var $radio = $(this);
        var $wrap = $radio.closest(addressWrapSelector);
        var typeValue = $radio.val();
        setAddressTypeState($wrap, typeValue, $radio.attr('id'));
      });

      // 결제수단 탭 처리
      var paymentTabSelector = '.vits-payment-tab[role="tab"]';
      var paymentTabPanelSelector = '.vits-payment-tab-panel[role="tabpanel"]';
      function setPaymentTabState($tab) {
        if (!$tab.length) return;
        var tabId = $tab.attr('id');
        var controlsId = $tab.attr('aria-controls');
        var $tablist = $tab.closest('[role="tablist"]');
        var $tabs = $tablist.find(paymentTabSelector);
        var $parentPanel = $tablist.closest('.vits-payment-panel');
        var $panels = $parentPanel.find(paymentTabPanelSelector);

        // 모든 탭 비활성화
        $tabs.each(function () {
          var $t = $(this);
          $t.removeClass('is-active');
          $t.attr('aria-selected', 'false');
          $t.attr('aria-expanded', 'false');
        });

        // 선택된 탭 활성화
        $tab.addClass('is-active');
        $tab.attr('aria-selected', 'true');

        // 모든 패널 비활성화
        $panels.each(function () {
          var $p = $(this);
          $p.removeClass('is-active');
        });

        // 해당하는 패널 활성화
        if (controlsId) {
          var $targetPanel = $('#' + controlsId);
          if ($targetPanel.length) {
            $targetPanel.addClass('is-active');
            // aria-expanded 업데이트 (탭 버튼)
            $tab.attr('aria-expanded', 'true');
            // aria-labelledby 매칭 확인
            var currentLabelledBy = $targetPanel.attr('aria-labelledby');
            if (!currentLabelledBy || currentLabelledBy !== tabId) {
              $targetPanel.attr('aria-labelledby', tabId);
            }
          }
        }

        // 세금계산서 발급 섹션 표시/숨김 처리
        updateTaxSectionVisibility();
      }

      // 결제수단 라디오 버튼과 패널 처리
      var paymentItemSelector = '.vits-payment-item';
      var paymentRadioSelector = '.vits-payment-item .radio-item input[type="radio"]';
      var paymentPanelSelector = '.vits-payment-panel';
      function setPaymentPanelState($radio) {
        if (!$radio.length) return;
        var radioId = $radio.attr('id');
        var controlsId = $radio.attr('aria-controls');
        var $item = $radio.closest(paymentItemSelector);
        var $methodWrap = $item.closest('.vits-payment-method');
        var $allItems = $methodWrap.find(paymentItemSelector);
        var $allPanels = $methodWrap.find(paymentPanelSelector);

        // tab-simple-account가 활성화되어 있고, 다른 라디오 버튼이 선택되면 tab-simple-card로 변경
        var $tabSimpleAccount = $('#tab-simple-account');
        if ($tabSimpleAccount.length && $tabSimpleAccount.hasClass('is-active')) {
          // pay-simple이 아닌 다른 라디오 버튼이 선택된 경우
          if (radioId !== 'pay-simple') {
            var $tabSimpleCard = $('#tab-simple-card');
            if ($tabSimpleCard.length) {
              setPaymentTabState($tabSimpleCard);
            }
          }
        }

        // 모든 패널 비활성화
        $allPanels.each(function () {
          var $p = $(this);
          $p.removeClass('is-active');
        });

        // 모든 라디오 버튼의 aria-expanded를 false로 초기화
        $allItems.find(paymentRadioSelector).each(function () {
          var $r = $(this);
          $r.attr('aria-expanded', 'false');
        });

        // 선택된 라디오 버튼의 패널 활성화
        if (controlsId) {
          var $targetPanel = $('#' + controlsId);
          if ($targetPanel.length) {
            $targetPanel.addClass('is-active');
            // aria-expanded 업데이트 (선택된 라디오 버튼만 true)
            $radio.attr('aria-expanded', 'true');
            // aria-labelledby 매칭 확인
            var currentLabelledBy = $targetPanel.attr('aria-labelledby');
            if (!currentLabelledBy || currentLabelledBy !== radioId) {
              $targetPanel.attr('aria-labelledby', radioId);
            }
          } else {
            // 패널을 찾을 수 없으면 false로 설정
            $radio.attr('aria-expanded', 'false');
          }
        } else {
          // aria-controls가 없으면 false로 설정
          $radio.attr('aria-expanded', 'false');
        }

        // 세금계산서 발급 섹션 표시/숨김 처리
        updateTaxSectionVisibility();

        // pay-credit 선택 시 tax-invoice-batch 자동 체크
        if (radioId === 'pay-credit') {
          var $taxInvoiceBatch = $('#tax-invoice-batch');
          if ($taxInvoiceBatch.length && !$taxInvoiceBatch.is(':checked')) {
            $taxInvoiceBatch.prop('checked', true).trigger('change');
          }
        }
      }

      // 세금계산서 발급 섹션 표시/숨김 처리 함수
      function updateTaxSectionVisibility() {
        var $taxSection = $('.vits-tax');
        var showTax = false;

        // 활성화된 탭 확인 (tab-simple-account)
        var $activeTab = $(paymentTabSelector + '.is-active');
        if ($activeTab.length && $activeTab.attr('id') === 'tab-simple-account') {
          showTax = true;
        }

        // 체크된 라디오 버튼 확인 (pay-transfer, pay-bank, pay-credit)
        if (!showTax) {
          var checkedRadioId = $(paymentRadioSelector + ':checked').attr('id');
          var showTaxIds = ['pay-transfer', 'pay-bank', 'pay-credit'];
          if (showTaxIds.indexOf(checkedRadioId) !== -1) {
            showTax = true;
          }
        }
        if (showTax) {
          $taxSection.addClass('is-active');
        } else {
          $taxSection.removeClass('is-active');
        }
      }

      // 초기 상태 설정
      // tab-simple-card를 초기값으로 설정
      var $tabSimpleCard = $('#tab-simple-card');
      if ($tabSimpleCard.length) {
        // tab-simple-card가 활성화되어 있지 않으면 활성화
        if (!$tabSimpleCard.hasClass('is-active')) {
          setPaymentTabState($tabSimpleCard);
        }
      }

      // 모든 탭의 aria-expanded 초기화
      $(paymentTabSelector).each(function () {
        var $tab = $(this);
        var isActive = $tab.hasClass('is-active');
        var controlsId = $tab.attr('aria-controls');
        if (controlsId) {
          var $panel = $('#' + controlsId);
          var isPanelActive = $panel.length && $panel.hasClass('is-active');
          // 탭이 활성화되어 있고 패널도 활성화되어 있으면 true
          $tab.attr('aria-expanded', isActive && isPanelActive ? 'true' : 'false');
        } else {
          $tab.attr('aria-expanded', 'false');
        }
      });
      $(paymentTabSelector + '.is-active').each(function () {
        setPaymentTabState($(this));
      });

      // 초기 상태에서 모든 라디오 버튼의 aria-expanded 설정
      $(paymentRadioSelector).each(function () {
        var $radio = $(this);
        var controlsId = $radio.attr('aria-controls');
        var isChecked = $radio.is(':checked');
        if (controlsId) {
          var $panel = $('#' + controlsId);
          var isPanelActive = $panel.length && $panel.hasClass('is-active');
          // 체크되어 있고 패널이 활성화되어 있으면 true, 아니면 false
          $radio.attr('aria-expanded', isChecked && isPanelActive ? 'true' : 'false');
        } else {
          $radio.attr('aria-expanded', 'false');
        }
      });
      $(paymentRadioSelector + ':checked').each(function () {
        setPaymentPanelState($(this));
      });

      // 초기 상태에서 pay-credit이 체크되어 있으면 tax-invoice-batch도 체크
      var $payCredit = $('#pay-credit');
      if ($payCredit.length && $payCredit.is(':checked')) {
        var $taxInvoiceBatch = $('#tax-invoice-batch');
        if ($taxInvoiceBatch.length && !$taxInvoiceBatch.is(':checked')) {
          $taxInvoiceBatch.prop('checked', true);
        }
      }

      // 초기 상태에서 세금계산서 섹션 표시 여부 확인
      updateTaxSectionVisibility();

      // 결제수단 탭 클릭 이벤트
      $(document).off('click.cartOrderPaymentTab', paymentTabSelector).on('click.cartOrderPaymentTab', paymentTabSelector, function (e) {
        e.preventDefault();
        setPaymentTabState($(this));
      });

      // 결제수단 라디오 버튼 변경 이벤트
      $(document).off('change.cartOrderPaymentRadio', paymentRadioSelector).on('change.cartOrderPaymentRadio', paymentRadioSelector, function () {
        setPaymentPanelState($(this));
      });
    }
  };
  console.log('[cart-order] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 478:
/***/ (function() {

/**
 * @file scripts/ui/floating.js
 * @purpose 플로팅 최근 본 상품 + TOP 버튼
 * @description
 *  - 썸네일: 최대 3개 표시 (CSS max-height로 제한)
 *  - 패널: recent 클릭 시 토글, 썸네일/외부/닫기 클릭 시 닫힘
 *  - TOP 버튼: threshold 이상에서 스크롤 올릴 때 표시
 * @policy
 *  - init(): 멱등성 보장, 기존 스코프는 UI 갱신
 *  - refresh($scope): 특정 스코프 갱신 (미바인딩 시 init)
 *  - refresh(): 전체 재스캔 + 신규 바인딩 + 기존 갱신
 *  - destroy(): DOM 제거 전 호출 권장 (미호출 시 자동 cleanup)
 *  - 자동 cleanup: DOM 분리 시 다음 init/refresh/스크롤/클릭 시점에 정리
 *  - window scroll: TOP 버튼 있는 스코프가 있을 때만 바인딩
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var STATE = {
    VISIBLE: 'is-visible',
    EMPTY: 'is-empty',
    OPEN: 'is-open',
    SCROLLABLE: 'is-scrollable'
  };
  var SELECTOR = {
    SCOPE: '[data-floating-scope]',
    RECENT: '[data-floating-recent]',
    ITEM: '[data-floating-item]',
    TOP: '[data-floating-top]',
    PANEL: '[data-floating-panel]',
    PANEL_CLOSE: '[data-floating-panel-close]',
    DELETE: '[data-floating-delete]',
    DELETE_ALL: '[data-floating-delete-all]',
    PANEL_ITEM: '[data-floating-panel-item]',
    COUNT_NUM: '[data-floating-count-num]'
  };
  var REMOVE_TARGETS = [SELECTOR.ITEM, SELECTOR.PANEL_ITEM];
  var DATA_KEY = {
    BOUND: 'floatingBound',
    LAST_SCROLL_Y: 'floatingLastScrollY',
    ELS: 'floatingEls'
  };
  var INTERNAL = {
    THROTTLE_DELAY: 100,
    THRESHOLD_RATIO: 0.12,
    TOP_SCROLL_DURATION: 300
  };
  var EVENT_NS = '.uiFloating';
  var isWindowScrollBound = false;
  var isDocumentClickBound = false;
  var scrollThrottleTimer = null;
  var activeScopes = [];

  // 스코프가 DOM에 연결되어 있는지 확인
  function isConnected($scope) {
    if (!$scope || !$scope[0]) return false;
    return $.contains(document.documentElement, $scope[0]);
  }

  // 스코프 내 주요 요소들을 캐싱
  function cacheEls($scope) {
    var els = {
      $recent: $scope.find(SELECTOR.RECENT),
      $top: $scope.find(SELECTOR.TOP),
      $panel: $scope.find(SELECTOR.PANEL),
      $countNum: $scope.find(SELECTOR.COUNT_NUM)
    };
    $scope.data(DATA_KEY.ELS, els);
    return els;
  }

  // 캐싱된 요소 객체 반환
  function getEls($scope) {
    return $scope.data(DATA_KEY.ELS) || null;
  }

  // 썸네일 아이템 목록 반환
  function getItems($scope) {
    return $scope.find(SELECTOR.ITEM);
  }

  // activeScopes 배열에서 스코프 인덱스 찾기
  function findScopeIndex($scope) {
    var el = $scope[0];
    for (var i = 0; i < activeScopes.length; i++) {
      if (activeScopes[i][0] === el) return i;
    }
    return -1;
  }

  // activeScopes 배열에서 스코프 제거
  function removeFromActiveScopes($scope) {
    var idx = findScopeIndex($scope);
    if (idx !== -1) {
      activeScopes.splice(idx, 1);
    }
  }

  // activeScopes 배열에 스코프 추가 (중복 방지)
  function addToActiveScopes($scope) {
    if (findScopeIndex($scope) === -1) {
      activeScopes.push($scope);
    }
  }

  // 스코프에 저장된 데이터 및 이벤트 제거
  function clearScopeData($scope) {
    $scope.off(EVENT_NS);
    $scope.removeData(DATA_KEY.BOUND);
    $scope.removeData(DATA_KEY.LAST_SCROLL_Y);
    $scope.removeData(DATA_KEY.ELS);
  }

  // DOM에서 분리된 스코프 자동 정리
  function cleanupDisconnectedScopes() {
    for (var i = activeScopes.length - 1; i >= 0; i--) {
      if (!isConnected(activeScopes[i])) {
        clearScopeData(activeScopes[i]);
        activeScopes.splice(i, 1);
      }
    }
  }

  // TOP 버튼이 있는 스코프 존재 여부 확인 (실제 DOM 연결 확인)
  function hasTopButtonScope() {
    for (var i = 0; i < activeScopes.length; i++) {
      var els = getEls(activeScopes[i]);
      if (els && els.$top && els.$top.length && $.contains(document.documentElement, els.$top[0])) {
        return true;
      }
    }
    return false;
  }

  // 빈 상태(is-empty) 및 스크롤 가능 상태(is-scrollable) 클래스 토글
  function updateEmptyState($scope) {
    var els = getEls($scope);
    if (!els || !els.$recent.length) return;
    var itemCount = getItems($scope).length;
    els.$recent.toggleClass(STATE.EMPTY, itemCount === 0);
    els.$recent.toggleClass(STATE.SCROLLABLE, itemCount > 3);
  }

  // 상품 개수 텍스트 업데이트
  function updateCount($scope) {
    var els = getEls($scope);
    if (!els || !els.$countNum.length) return;
    els.$countNum.text(getItems($scope).length);
  }

  // 모든 UI 상태 일괄 업데이트
  function updateAllStates($scope) {
    updateEmptyState($scope);
    updateCount($scope);
  }

  // 패널 열기 (빈 상태면 무시)
  function openPanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;
    if (els.$recent.hasClass(STATE.EMPTY)) return;
    els.$panel.addClass(STATE.OPEN);
  }

  // 패널 닫기
  function closePanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;
    els.$panel.removeClass(STATE.OPEN);
  }

  // 패널 토글 (열림 ↔ 닫힘)
  function togglePanel($scope) {
    var els = getEls($scope);
    if (!els || !els.$panel.length) return;
    if (els.$panel.hasClass(STATE.OPEN)) {
      closePanel($scope);
    } else {
      openPanel($scope);
    }
  }

  // 모든 스코프의 패널 닫기
  function closeAllPanels() {
    for (var i = 0; i < activeScopes.length; i++) {
      closePanel(activeScopes[i]);
    }
  }

  // 개별 상품 삭제 (썸네일 + 패널 동시 제거)
  function deleteItem($scope, $item) {
    if (!$item || !$item.length) return;
    var itemId = $item.data('itemId');
    if (itemId == null) return;
    for (var i = 0; i < REMOVE_TARGETS.length; i++) {
      $scope.find(REMOVE_TARGETS[i] + '[data-item-id="' + itemId + '"]').remove();
    }
    updateAllStates($scope);
  }

  // 전체 상품 삭제 후 패널 닫기
  function deleteAll($scope) {
    for (var i = 0; i < REMOVE_TARGETS.length; i++) {
      $scope.find(REMOVE_TARGETS[i]).remove();
    }
    closePanel($scope);
    updateAllStates($scope);
  }

  // 페이지 최상단으로 스크롤
  function scrollToTop() {
    $('html, body').animate({
      scrollTop: 0
    }, INTERNAL.TOP_SCROLL_DURATION);
  }

  // TOP 버튼 표시/숨김 상태 업데이트 (스크롤 방향 기반)
  function updateTopButtonState() {
    cleanupDisconnectedScopes();
    if (!hasTopButtonScope()) {
      unbindWindowScroll();
      return;
    }
    var scrollY = $(window).scrollTop();
    var threshold = $(window).height() * INTERNAL.THRESHOLD_RATIO;
    for (var i = 0; i < activeScopes.length; i++) {
      var $scope = activeScopes[i];
      var els = getEls($scope);
      if (!els || !els.$top.length) continue;
      var lastY = $scope.data(DATA_KEY.LAST_SCROLL_Y) || 0;
      if (scrollY <= threshold) {
        els.$top.removeClass(STATE.VISIBLE);
      } else if (scrollY < lastY) {
        els.$top.addClass(STATE.VISIBLE);
      } else if (scrollY > lastY) {
        els.$top.removeClass(STATE.VISIBLE);
      }
      $scope.data(DATA_KEY.LAST_SCROLL_Y, scrollY);
    }
  }

  // 스크롤 이벤트 throttle 처리
  function throttledScrollHandler() {
    if (scrollThrottleTimer) return;
    scrollThrottleTimer = setTimeout(function () {
      updateTopButtonState();
      scrollThrottleTimer = null;
    }, INTERNAL.THROTTLE_DELAY);
  }

  // 스코프에 이벤트 바인딩 및 초기화
  function bindScope($scope) {
    if (!isConnected($scope)) return;
    if ($scope.data(DATA_KEY.BOUND)) {
      cacheEls($scope);
      addToActiveScopes($scope);
      updateAllStates($scope);
      return;
    }
    cacheEls($scope);
    $scope.data(DATA_KEY.BOUND, true);
    $scope.data(DATA_KEY.LAST_SCROLL_Y, $(window).scrollTop());

    // recent 영역 클릭 → 패널 토글 (a 링크, 패널 내부 제외)
    $scope.on('click' + EVENT_NS, SELECTOR.RECENT, function (e) {
      var $target = $(e.target);
      if ($target.closest('a').length) return;
      if ($target.closest(SELECTOR.PANEL).length) return;
      e.preventDefault();
      togglePanel($scope);
    });

    // 썸네일 클릭 → 이벤트 전파 방지 (링크 이동 허용)
    $scope.on('click' + EVENT_NS, SELECTOR.ITEM, function (e) {
      e.stopPropagation();
    });

    // 패널 클릭 → 이벤트 전파 방지
    $scope.on('click' + EVENT_NS, SELECTOR.PANEL, function (e) {
      e.stopPropagation();
    });

    // 패널 닫기 버튼 클릭 → 패널 닫기
    $scope.on('click' + EVENT_NS, SELECTOR.PANEL_CLOSE, function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel($scope);
    });

    // TOP 버튼 클릭 → 최상단 이동
    $scope.on('click' + EVENT_NS, SELECTOR.TOP, function (e) {
      e.preventDefault();
      scrollToTop();
    });

    // 개별 삭제 버튼 클릭 → 해당 상품 삭제
    $scope.on('click' + EVENT_NS, SELECTOR.DELETE, function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteItem($scope, $(this).closest(SELECTOR.PANEL_ITEM));
    });

    // 전체 삭제 버튼 클릭 → 모든 상품 삭제
    $scope.on('click' + EVENT_NS, SELECTOR.DELETE_ALL, function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteAll($scope);
    });
    addToActiveScopes($scope);
    updateAllStates($scope);
  }

  // 스코프 이벤트 해제 및 데이터 정리
  function unbindScope($scope) {
    clearScopeData($scope);
    removeFromActiveScopes($scope);
  }

  // window scroll 이벤트 바인딩
  function bindWindowScroll() {
    if (isWindowScrollBound) return;
    isWindowScrollBound = true;
    $(window).on('scroll' + EVENT_NS, throttledScrollHandler);
  }

  // window scroll 이벤트 해제
  function unbindWindowScroll() {
    if (!isWindowScrollBound) return;
    isWindowScrollBound = false;
    $(window).off('scroll' + EVENT_NS);
    if (scrollThrottleTimer) {
      clearTimeout(scrollThrottleTimer);
      scrollThrottleTimer = null;
    }
  }

  // document click 이벤트 바인딩 (외부 클릭 시 패널 닫기)
  function bindDocumentClick() {
    if (isDocumentClickBound) return;
    isDocumentClickBound = true;
    $(document).on('click' + EVENT_NS, function (e) {
      cleanupDisconnectedScopes();
      if (activeScopes.length === 0) {
        unbindDocumentClick();
        return;
      }
      var $target = $(e.target);
      if (!$target.closest(SELECTOR.PANEL).length && !$target.closest(SELECTOR.RECENT).length) {
        closeAllPanels();
      }
    });
  }

  // document click 이벤트 해제
  function unbindDocumentClick() {
    if (!isDocumentClickBound) return;
    isDocumentClickBound = false;
    $(document).off('click' + EVENT_NS);
  }
  window.UI.floating = {
    // 초기화: 모든 스코프 바인딩
    init: function () {
      cleanupDisconnectedScopes();
      $(SELECTOR.SCOPE).each(function () {
        bindScope($(this));
      });
      if (activeScopes.length > 0) {
        bindDocumentClick();
      } else {
        unbindDocumentClick();
      }
      if (hasTopButtonScope()) {
        bindWindowScroll();
      } else {
        unbindWindowScroll();
      }
    },
    // 갱신: 특정 스코프 또는 전체 재스캔
    refresh: function ($scope) {
      cleanupDisconnectedScopes();
      if ($scope) {
        bindScope($scope);
      } else {
        $(SELECTOR.SCOPE).each(function () {
          bindScope($(this));
        });
      }
      if (activeScopes.length > 0) {
        bindDocumentClick();
      } else {
        unbindDocumentClick();
      }
      if (hasTopButtonScope()) {
        bindWindowScroll();
      } else {
        unbindWindowScroll();
      }
    },
    // 해제: 특정 스코프 또는 전체 정리
    destroy: function ($scope) {
      if ($scope) {
        unbindScope($scope);
      } else {
        while (activeScopes.length) {
          unbindScope(activeScopes[0]);
        }
      }
      if (activeScopes.length === 0) {
        unbindDocumentClick();
      }
      if (!hasTopButtonScope()) {
        unbindWindowScroll();
      }
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 504:
/***/ (function() {

/**
 * @file scripts/ui/category/plp-chip-sync.js
 * @purpose 체크박스 ↔ 칩 UI 동기화(추가/삭제/전체해제) + 결과바 노출 제어(data-result-chips / data-result-actions)
 * @assumption
 *  - 칩 컨테이너: [data-chip-area] (내부에 .vits-chip-button DOM을 JS로 생성)
 *  - 결과 칩 래퍼: [data-result-chips] (없으면 .result-chips 폴백)
 *  - 결과 액션 래퍼: [data-result-actions] (없으면 .result-actions 폴백)
 *  - 체크박스: input[type="checkbox"] (name: plpCommon/plpAttr/plpBrand)
 *  - 칩 제거 버튼: [data-chip-action="remove"] + data-chip-value
 *  - 전체 해제 버튼: [data-chip-clear] (없으면 .result-clear-button 폴백)
 * @maintenance
 *  - 필터 칩은 체크박스가 상태의 기준이므로, X 클릭 시 반드시 체크박스 해제를 우선한다.
 *  - 공통 chip-button.js가 함께 로드되어도 충돌하지 않도록 remove 클릭은 stopPropagation으로 차단한다.
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.chipSync = window.UI.chipSync || {};
  var NS = '.uiChipSync';
  var CHIP_AREA = '[data-chip-area]';
  var CHIP_REMOVE = '[data-chip-action="remove"]';
  var CHIP_VALUE = 'data-chip-value';
  var RESULT_CHIPS = '[data-result-chips]';
  var RESULT_ACTIONS = '[data-result-actions]';
  var CLEAR_BTN = '[data-chip-clear], .result-clear-button';
  var GROUPS = [{
    name: 'plpCommon',
    title: '공통',
    showCategory: false
  }, {
    name: 'plpAttr',
    title: '속성',
    showCategory: true
  }, {
    name: 'plpCommonCategory',
    title: '카테고리',
    showCategory: false
  }, {
    name: 'plpBrand',
    title: '브랜드',
    showCategory: true
  }];
  function getChipArea() {
    return $(CHIP_AREA).first();
  }
  function isWatchedCheckbox(el) {
    if (!el || el.type !== 'checkbox') return false;
    var nm = String(el.name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return true;
    }
    return false;
  }
  function getGroupByName(name) {
    var nm = String(name || '');
    for (var i = 0; i < GROUPS.length; i += 1) {
      if (GROUPS[i].name === nm) return GROUPS[i];
    }
    return null;
  }
  function escAttr(v) {
    return String(v || '').replace(/"/g, '\\"');
  }
  function hasChip($area, value) {
    return $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').length > 0;
  }
  function getChipLabel($chk) {
    var $label = $chk.closest('label');
    var $name = $label.find('.label-name').first();
    var txt = '';
    if ($name.length) {
      txt = $name.clone().children().remove().end().text();
      txt = $.trim(txt || '');
    } else {
      txt = String($chk.val() || '');
    }
    if (String($chk.attr('name') || '') === 'plpBrand') {
      txt = $.trim(String(txt || '').replace(/\s*\(\s*\d+\s*\)\s*$/, ''));
    }
    return txt;
  }
  function getChipCategoryName($chk) {
    var cfg = getGroupByName($chk.attr('name'));
    if (!cfg) return '';
    return cfg.showCategory ? cfg.title : '';
  }
  function buildChipEl(groupName, value, name, category) {
    var $chip = $('<button/>', {
      type: 'button',
      class: 'vits-chip-button type-filled',
      'data-chip-action': 'remove',
      'aria-label': name + ' 삭제'
    });
    $chip.attr(CHIP_VALUE, value);
    $chip.attr('data-chip-group', groupName);
    if (category) $('<span/>', {
      class: 'text category',
      text: category
    }).appendTo($chip);
    $('<span/>', {
      class: 'text',
      text: name
    }).appendTo($chip);
    $('<span/>', {
      class: 'icon ic ic-x',
      'aria-hidden': 'true'
    }).appendTo($chip);
    return $chip;
  }
  function sortChipsByGroup($area) {
    if (!$area || !$area.length) return;
    for (var i = 0; i < GROUPS.length; i += 1) {
      var g = GROUPS[i].name;
      $area.find('[data-chip-group="' + escAttr(g) + '"]').appendTo($area);
    }
  }
  function addChipFromCheckbox($chk) {
    var $area = getChipArea();
    if (!$area.length) return;
    var value = String($chk.val() || '');
    if (!value) return;
    if (hasChip($area, value)) return;
    var groupName = String($chk.attr('name') || '');
    var name = getChipLabel($chk);
    var category = getChipCategoryName($chk);
    $area.append(buildChipEl(groupName, value, name, category));
    sortChipsByGroup($area);
  }
  function removeChipByValue(value) {
    var $area = getChipArea();
    if (!$area.length) return;
    $area.find('[' + CHIP_VALUE + '="' + escAttr(value) + '"]').remove();
  }
  function uncheckByValue(value) {
    var v = String(value || '');
    if (!v) return;
    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (String(this.value || '') !== v) return;
      if (this.checked) {
        this.checked = false;
        $(this).trigger('change');
      }
    });
  }
  function syncResultUi() {
    var $area = getChipArea();
    if (!$area.length) return;
    var hasAny = $area.children().length > 0;
    var $chipsWrap = $area.closest(RESULT_CHIPS);
    if (!$chipsWrap.length) $chipsWrap = $area.closest('.result-chips');
    if ($chipsWrap.length) $chipsWrap.toggleClass('is-hidden', !hasAny);
    var $actionsWrap = $(RESULT_ACTIONS).first();
    if (!$actionsWrap.length) $actionsWrap = $('.result-actions').first();
    if ($actionsWrap.length) $actionsWrap.toggleClass('is-hidden', !hasAny);
  }
  function clearAll() {
    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (!this.checked) return;
      this.checked = false;
      $(this).trigger('change');
    });
    var $area = getChipArea();
    if ($area.length) $area.empty();
    syncResultUi();
  }
  function bindCheckbox() {
    $(document).off('change' + NS, 'input[type="checkbox"]').on('change' + NS, 'input[type="checkbox"]', function () {
      if (!isWatchedCheckbox(this)) return;
      var $chk = $(this);
      var value = String($chk.val() || '');
      if (!value) return;
      if (this.checked) addChipFromCheckbox($chk);else removeChipByValue(value);
      syncResultUi();
    });
  }
  function bindChipRemove() {
    $(document).off('click' + NS, CHIP_REMOVE).on('click' + NS, CHIP_REMOVE, function (ev) {
      ev.preventDefault();
      ev.stopPropagation(); // chip-button.js 등 공통 remove 처리와 충돌 방지(체크박스 기준 유지)

      var value = $(this).attr(CHIP_VALUE) || $(this).closest('[' + CHIP_VALUE + ']').attr(CHIP_VALUE) || '';
      if (!value) return;
      uncheckByValue(value);
    });
  }
  function bindClear() {
    $(document).off('click' + NS, CLEAR_BTN).on('click' + NS, CLEAR_BTN, function (ev) {
      ev.preventDefault();
      clearAll();
    });
  }
  function buildInitialChips() {
    var $area = getChipArea();
    if (!$area.length) return;
    $area.empty();
    $('input[type="checkbox"]').each(function () {
      if (!isWatchedCheckbox(this)) return;
      if (!this.checked) return;
      addChipFromCheckbox($(this));
    });
    syncResultUi();
  }
  window.UI.chipSync.init = function () {
    bindCheckbox();
    bindChipRemove();
    bindClear();
    buildInitialChips();
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 508:
/***/ (function() {

/**
 * @file scripts/ui/category/category-tree.js
 * @purpose 좌측 카테고리 드릴다운(1~3뎁스): 트리/브레드크럼 동기화 + 1촌 상위 표시 규칙 + 4뎁스(속성) 체크박스 동적 렌더
 * @scope .vits-category-tree 내부 + [data-plp-attr-anchor] 렌더(트리 내부 우선, 없으면 문서 fallback)
 *
 * @display_rules
 *  - 1뎁스 선택: 1뎁스(is-active) + 하위 2뎁스 목록
 *  - 2뎁스 선택: 1뎁스(1촌 상위) + 2뎁스(is-active) + 하위 3뎁스 목록
 *  - 3뎁스 선택: 2뎁스(1촌 상위) + 3뎁스(is-active) 형제 목록 (1뎁스 버튼 숨김)
 *
 * @click_behavior
 *  - 1뎁스 재클릭: 2뎁스, 3뎁스 초기화 (1뎁스 + 2뎁스 목록 상태로 복귀)
 *  - 2뎁스 재클릭: 3뎁스 초기화 (하위 없으면 무동작)
 *  - 3뎁스 클릭: 브레드크럼 선택 후 트리 동기화
 *
 * @assumption
 *  - 트리 버튼: .category-tree-btn (data-depth="1|2|3", data-id="code", data-has-children="true|false")
 *  - 상태 클래스: is-active(최종 선택), is-open(패널 열림), is-hidden(요소 숨김)
 *  - 브레드크럼 셀렉트: [data-vits-select][data-root="cat"][data-depth="1|2|3"] + [data-vits-select-hidden]
 *  - 4뎁스 앵커: [data-plp-attr-anchor] (li 권장, 기본 is-hidden 권장)
 *  - 카테고리 트리 데이터: window.__mockData.category.tree (categoryCode/categoryNm/categoryList/categoryQty)
 *  - 체크박스 마크업: input-checkbox.ejs 구조(checkbox-wrapper/checkbox-item-area/checkbox-item-box...)
 *
 * @maintenance
 *  - 문서 change 바인딩은 모듈에서 1회만 수행(중복 바인딩 방지)
 *  - 트리는 DOM 1개당 인스턴스로 분리(상태 충돌 방지)
 *  - 브레드크럼 셀렉트는 문서에서 depth별 1세트 전제(getSelectRoot는 first() 사용)
 *  - 4뎁스 앵커가 트리 외부에 있는 기존 구조를 위해 "트리 내부 우선 + 문서 fallback"을 사용
 *  - 3뎁스 선택 시 1뎁스 li는 유지하되 버튼만 is-hidden 처리 (하위 2,3뎁스 표시 위해)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var MODULE_KEY = 'categoryTree';
  var EVENT_NS = '.' + MODULE_KEY;
  var TREE_ROOT = '.vits-category-tree';
  var BTN = '.category-tree-btn';
  var ITEM = '.category-tree-item';
  var PANEL = '.category-tree-panel';
  var CLS_ACTIVE = 'is-active';
  var CLS_OPEN = 'is-open';
  var CLS_HIDDEN = 'is-hidden';
  var SELECT_ROOT = '[data-vits-select][data-root="cat"]';
  var SELECT_OPT = '.vits-select-option';
  var SELECT_HIDDEN = '[data-vits-select-hidden]';
  var SELECT_VALUE = '[data-vits-select-value]';
  var SELECT_LIST = '[data-vits-select-list]';
  var SELECT_TRIGGER = '[data-vits-select-trigger]';
  var ATTR_ANCHOR = '[data-plp-attr-anchor]';
  var ATTR_NAME = 'plpAttr';
  var ATTR_VARIANT = 'basic';
  var ATTR_LIST = 'column';
  var ATTR_GAP = 16;
  var INSTANCES = [];
  var IS_DOC_BOUND = false;
  var RAF_ID = 0;

  // mockData 카테고리 트리를 안전하게 반환
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  // 리스트에서 categoryCode로 노드를 찾음
  function findByCode(list, code) {
    if (!Array.isArray(list) || !code) return null;
    var c = String(code || '');
    for (var i = 0; i < list.length; i += 1) {
      var n = list[i];
      if (n && String(n.categoryCode) === c) return n;
    }
    return null;
  }

  // data-* 셀렉터용 값 이스케이프(최소 방어)
  function escAttrValue(v) {
    return String(v || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  // 브레드크럼 셀렉트 루트를 depth로 찾음
  function getSelectRoot(depth) {
    return $(SELECT_ROOT + '[data-depth="' + depth + '"]').first();
  }

  // 브레드크럼 hidden 값을 depth로 읽음
  function getSelectValue(depth) {
    var $sel = getSelectRoot(depth);
    if (!$sel.length) return '';
    var $hidden = $sel.find(SELECT_HIDDEN).first();
    return $hidden.length ? String($hidden.val() || '') : '';
  }

  // 브레드크럼을 placeholder 상태로 리셋(표시/선택/hidden)
  function resetSelectToPlaceholder($root) {
    if (!$root || !$root.length) return;
    var $value = $root.find(SELECT_VALUE).first();
    var $hidden = $root.find(SELECT_HIDDEN).first();
    var placeholder = $value.attr('data-placeholder') || '';
    $root.find(SELECT_OPT).removeClass('vits-select-selected').attr('aria-selected', 'false');
    if ($value.length) $value.text(placeholder);
    if ($hidden.length) {
      $hidden.val('');
      $hidden.trigger('change');
    }
  }

  // 브레드크럼을 "비활성+옵션 비움"까지 포함해서 리셋(상위 변경 시 잔상 방지)
  function disableSelectAndClear($root) {
    if (!$root || !$root.length) return;
    resetSelectToPlaceholder($root);
    var $list = $root.find(SELECT_LIST).first();
    if ($list.length) $list.empty();
    $root.addClass('vits-select-disabled');
    var $trigger = $root.find(SELECT_TRIGGER).first();
    if ($trigger.length) $trigger.prop('disabled', true);
  }

  // 브레드크럼 옵션을 value로 찾아 click()로 선택 처리
  function clickSelectOptionByValue($root, value) {
    if (!$root || !$root.length) return false;
    var v = String(value || '');
    if (!v) return false;
    var $opt = $root.find(SELECT_OPT + '[data-value="' + escAttrValue(v) + '"]').first();
    if (!$opt.length) return false;
    $opt.trigger('click');
    return true;
  }

  // 트리 인스턴스를 생성(트리 DOM 단위로 스코프/이벤트/렌더를 묶음)
  function createInstance($tree) {
    // 4뎁스 앵커는 트리 내부 우선, 없으면 문서에서 fallback(기존 마크업 구조 호환)
    var $attrAnchor = $tree.find(ATTR_ANCHOR).first();
    if (!$attrAnchor.length) $attrAnchor = $(ATTR_ANCHOR).first();

    // 버튼 depth 값을 숫자로 반환
    function getBtnDepth($btn) {
      return parseInt($btn.attr('data-depth'), 10) || 0;
    }

    // 버튼 카테고리 코드를 반환
    function getBtnId($btn) {
      return String($btn.attr('data-id') || '');
    }

    // 버튼에 자식이 있는지 확인
    function hasChildren($btn) {
      return $btn.attr('data-has-children') === 'true';
    }

    // 트리 버튼을 depth+code로 찾음
    function findTreeBtnByCode(depth, code) {
      var c = String(code || '');
      if (!c) return $();
      return $tree.find(BTN + '[data-depth="' + depth + '"][data-id="' + escAttrValue(c) + '"]').first();
    }

    // 아이템의 open 상태를 설정 (패널 열림용)
    function setItemState($btn, active) {
      var $item = $btn.closest(ITEM);
      var $panel = $item.children(PANEL).first();
      $btn.attr('aria-expanded', active ? 'true' : 'false');
      if ($panel.length) $panel.toggleClass(CLS_OPEN, !!active);
    }

    // depth의 아이템 상태를 모두 초기화
    function resetDepthState(depth) {
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        setItemState($(this), false);
      });
    }

    // depth의 아이템을 모두 노출
    function showAllAtDepth(depth) {
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        $(this).closest(ITEM).removeClass(CLS_HIDDEN);
      });
    }

    // 현재 선택 버튼만 남기고 나머지 숨김
    function keepOnly($btn) {
      var depth = getBtnDepth($btn);
      $tree.find(BTN + '[data-depth="' + depth + '"]').each(function () {
        $(this).closest(ITEM).toggleClass(CLS_HIDDEN, !$(this).is($btn));
      });
    }

    // 같은 부모를 가진 형제 버튼들을 모두 표시
    function showSiblings($btn) {
      var depth = getBtnDepth($btn);
      var $item = $btn.closest(ITEM);
      var $parentPanel = $item.parent().closest(PANEL);
      if ($parentPanel.length) {
        // 같은 부모 패널 안의 같은 depth 아이템들만 표시
        $parentPanel.find(BTN + '[data-depth="' + depth + '"]').each(function () {
          $(this).closest(ITEM).removeClass(CLS_HIDDEN);
        });
      } else {
        // depth1인 경우 모든 depth1 표시
        showAllAtDepth(depth);
      }
    }

    // 속성 앵커를 비우고 숨김 처리
    function hideAttrAnchor() {
      if (!$attrAnchor.length) return;
      $attrAnchor.empty().addClass(CLS_HIDDEN);
    }

    // 체크박스 리스트 클래스(list/gap)를 조합
    function getAttrListClass() {
      return 'list-' + ATTR_LIST + '-gap' + ATTR_GAP;
    }

    // 4뎁스 후보를 "선택된 3뎁스의 하위(categoryList)"에서만 추출
    function getDepth4ListFromBreadcrumb() {
      var tree = getTree();
      var d1 = getSelectValue(1);
      var d2 = getSelectValue(2);
      var d3 = getSelectValue(3);
      if (!d1 || !d2 || !d3) return [];
      var d1Node = findByCode(tree, d1);
      var d2List = d1Node && Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
      var d2Node = findByCode(d2List, d2);
      var d3List = d2Node && Array.isArray(d2Node.categoryList) ? d2Node.categoryList : [];
      var d3Node = findByCode(d3List, d3);
      var d4List = d3Node && Array.isArray(d3Node.categoryList) ? d3Node.categoryList : [];
      return d4List.filter(function (n) {
        return n && n.categoryCode && n.categoryNm;
      });
    }

    // input-checkbox.ejs 구조로 "속성" 체크박스 영역을 렌더링
    function renderAttrAnchor(d4List) {
      if (!$attrAnchor.length) return;
      if (!Array.isArray(d4List) || !d4List.length) {
        hideAttrAnchor();
        return;
      }
      $attrAnchor.removeClass(CLS_HIDDEN);
      var $wrap = $('<div/>', {
        class: 'plp-side-filter-item'
      });
      $('<p/>', {
        class: 'plp-side-title',
        text: '속성'
      }).appendTo($wrap);
      var $checkboxWrap = $('<div/>', {
        class: 'checkbox-wrapper size-m type-' + ATTR_VARIANT
      }).appendTo($wrap);
      var $ul = $('<ul/>', {
        class: 'checkbox-item-area ' + getAttrListClass()
      }).appendTo($checkboxWrap);
      for (var i = 0; i < d4List.length; i += 1) {
        var n = d4List[i];
        var code = n && n.categoryCode ? String(n.categoryCode) : '';
        var name = n && n.categoryNm ? String(n.categoryNm) : '';
        var qty = n && n.categoryQty !== undefined && n.categoryQty !== null ? String(n.categoryQty) : '';
        if (!code || !name) continue;
        var $liItem = $('<li/>', {
          class: 'checkbox-item-box'
        }).appendTo($ul);
        var $label = $('<label/>', {
          class: 'checkbox-item'
        }).appendTo($liItem);
        $('<input/>', {
          type: 'checkbox',
          name: ATTR_NAME,
          value: code
        }).appendTo($label);
        $('<span/>', {
          class: 'checkbox-icon',
          'aria-hidden': 'true'
        }).appendTo($label);
        var $name = $('<span/>', {
          class: 'label-name'
        }).appendTo($label);
        $name.append(document.createTextNode(name));
        if (qty !== '') $('<em/>', {
          class: 'label-unit',
          text: qty
        }).appendTo($name);
      }
      $attrAnchor.empty().append($wrap);
    }

    // 브레드크럼 상태에 맞춰 4뎁스(속성) 앵커를 동기화
    function syncDepth4Attr() {
      renderAttrAnchor(getDepth4ListFromBreadcrumb());
    }

    // 브레드크럼 상태를 기준으로 트리 UI를 재구성
    function applyFromBreadcrumb() {
      var d1 = getSelectValue(1);
      var d2 = getSelectValue(2);
      var d3 = getSelectValue(3);
      showAllAtDepth(1);
      showAllAtDepth(2);
      showAllAtDepth(3);
      resetDepthState(1);
      resetDepthState(2);
      resetDepthState(3);

      // 모든 is-active 초기화
      $tree.find(ITEM).removeClass(CLS_ACTIVE);

      // 모든 버튼 보이기
      $tree.find(BTN).removeClass(CLS_HIDDEN);
      if (!d1) {
        syncDepth4Attr();
        return;
      }
      var $b1 = findTreeBtnByCode(1, d1);
      if ($b1.length) {
        setItemState($b1, true);
        keepOnly($b1);

        // 2뎁스가 없으면 1뎁스에 is-active
        if (!d2) {
          $b1.closest(ITEM).addClass(CLS_ACTIVE);
        }
      }
      if (!d2) {
        syncDepth4Attr();
        return;
      }
      var $b2 = findTreeBtnByCode(2, d2);
      if ($b2.length) {
        setItemState($b2, true);

        // 1뎁스 is-active 제거
        if ($b1 && $b1.length) {
          $b1.closest(ITEM).removeClass(CLS_ACTIVE);
        }

        // 3뎁스가 없으면 2뎁스에 is-active
        if (!d3) {
          $b2.closest(ITEM).addClass(CLS_ACTIVE);
        }

        // 2뎁스가 마지막 레벨이면 형제 표시
        if (!hasChildren($b2)) {
          showSiblings($b2);
        } else {
          keepOnly($b2);
        }
      }
      if (!d3) {
        syncDepth4Attr();
        return;
      }
      var $b3 = findTreeBtnByCode(3, d3);
      if ($b3.length) {
        // 3뎁스 선택 시: 1뎁스 버튼만 숨김 (li는 유지)
        if ($b1 && $b1.length) {
          $b1.addClass(CLS_HIDDEN); // 버튼만 숨김
        }

        // 2뎁스 is-active 제거, 3뎁스에 is-active 적용
        if ($b2 && $b2.length) {
          $b2.closest(ITEM).removeClass(CLS_ACTIVE);
        }
        $b3.closest(ITEM).addClass(CLS_ACTIVE);
        showSiblings($b3);
      }
      syncDepth4Attr();
    }

    // 1뎁스 클릭을 처리
    function handleDepth1($btn) {
      var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);
      if (isActive) {
        // 이미 선택된 1뎁스를 다시 클릭하면 2뎁스, 3뎁스 초기화
        disableSelectAndClear(getSelectRoot(3));
        resetSelectToPlaceholder(getSelectRoot(2));
        return;
      }

      // 새로운 1뎁스 선택
      disableSelectAndClear(getSelectRoot(3));
      disableSelectAndClear(getSelectRoot(2));
      clickSelectOptionByValue(getSelectRoot(1), getBtnId($btn));
    }

    // 2뎁스 클릭을 처리
    function handleDepth2($btn) {
      var isActive = $btn.closest(ITEM).hasClass(CLS_ACTIVE);
      if (isActive) {
        // 이미 선택된 2뎁스를 다시 클릭하면 3뎁스 초기화
        disableSelectAndClear(getSelectRoot(3));
        return;
      }

      // 새로운 2뎁스 선택
      disableSelectAndClear(getSelectRoot(3));
      clickSelectOptionByValue(getSelectRoot(2), getBtnId($btn));
    }

    // 3뎁스 클릭을 처리(선택만)
    function handleDepth3($btn) {
      clickSelectOptionByValue(getSelectRoot(3), getBtnId($btn));
    }

    // 트리 클릭 이벤트를 바인딩
    function bindTree() {
      $tree.off('click' + EVENT_NS).on('click' + EVENT_NS, BTN, function (e) {
        e.preventDefault();
        var $btn = $(this);
        var depth = getBtnDepth($btn);
        if (!depth) return;
        if (depth === 1) handleDepth1($btn);
        if (depth === 2) handleDepth2($btn);
        if (depth === 3) handleDepth3($btn);
      });
    }

    // 트리 루트를 초기화
    function init() {
      hideAttrAnchor();
      applyFromBreadcrumb();
      bindTree();
    }

    // 트리 인스턴스를 파기(이벤트/렌더 정리)
    function destroy() {
      $tree.off(EVENT_NS);
      hideAttrAnchor();
    }
    return {
      init: init,
      destroy: destroy,
      applyFromBreadcrumb: applyFromBreadcrumb
    };
  }

  // 브레드크럼 change 연쇄 호출을 1프레임으로 병합
  function broadcastApplyFromBreadcrumb() {
    if (RAF_ID) window.cancelAnimationFrame(RAF_ID);
    RAF_ID = window.requestAnimationFrame(function () {
      for (var i = 0; i < INSTANCES.length; i += 1) {
        if (INSTANCES[i] && typeof INSTANCES[i].applyFromBreadcrumb === 'function') {
          INSTANCES[i].applyFromBreadcrumb();
        }
      }
      RAF_ID = 0;
    });
  }

  // 문서 브레드크럼 변경을 1회만 바인딩
  function bindDocumentBreadcrumbSyncOnce() {
    if (IS_DOC_BOUND) return;
    $(document).on('change' + EVENT_NS, SELECT_ROOT + ' ' + SELECT_HIDDEN, function () {
      broadcastApplyFromBreadcrumb();
    });
    IS_DOC_BOUND = true;
  }
  window.UI.categoryTree = {
    // 모듈 초기화(트리별 인스턴스 생성/초기화)
    init: function () {
      bindDocumentBreadcrumbSyncOnce();
      $(TREE_ROOT).each(function () {
        var $tree = $(this);
        var inst = $tree.data(MODULE_KEY);
        if (!inst) {
          inst = createInstance($tree);
          $tree.data(MODULE_KEY, inst);
          INSTANCES.push(inst);
        }
        inst.init();
      });
    },
    // 모듈 파기(모든 트리 이벤트/렌더 정리)
    destroy: function () {
      for (var i = 0; i < INSTANCES.length; i += 1) {
        if (INSTANCES[i] && typeof INSTANCES[i].destroy === 'function') {
          INSTANCES[i].destroy();
        }
      }
      INSTANCES = [];
      if (RAF_ID) {
        window.cancelAnimationFrame(RAF_ID);
        RAF_ID = 0;
      }
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 538:
/***/ (function() {

/**
 * scripts/core/common.js
 * @purpose 공통 초기화/바인딩(실행 트리거)
 * @assumption
 *  - jQuery는 전역(window.jQuery 또는 window.$)에 존재해야 한다
 *  - UI.init은 core/ui.js에서 정의되어 있어야 한다
 * @maintenance
 *  - 페이지 의미 분기(gnb/main/detail 등) 로직 금지
 *  - 공통 실행(초기화 트리거)만 담당하고, 기능 구현은 ui/*로 분리한다
 *  - DOMReady에서 UI.init은 1회만 호출한다(중복 호출 금지)
 */
(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[common] jQuery not found (window.jQuery/window.$ undefined)');
    return;
  }
  $(function () {
    console.log('[common] DOM ready');
    if (window.UI && window.UI.init) window.UI.init();
  });
})(window.jQuery || window.$, window);

/***/ }),

/***/ 572:
/***/ (function() {

/**
 * @file scripts/ui/stepTab.js
 * @purpose data-속성 기반 스텝 탭(단계별 진행) 공통
 * @description
 *  - 스코프: [data-step-scope="id"] 내부에서만 동작
 *  - 매핑: [data-step-tab="n"] ↔ [data-step-panel="n"]
 *  - 상태: is-active(현재), is-done(완료), is-disabled(비활성)
 *  - 진행: [data-step-complete] 버튼 클릭 시 다음 스텝 이동
 * @flow
 *  - 탭 헤더는 클릭 불가 (시각적 표시만)
 *  - 패널 내 완료 버튼으로만 다음 스텝 이동
 *  - 이전 스텝으로 돌아가기 불가 (단방향)
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일, 표현/스타일은 CSS에서만 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[stepTab] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var ACTIVE = 'is-active';
  var DONE = 'is-done';
  var DISABLED = 'is-disabled';
  function getScope(scopeId) {
    return $('[data-step-scope="' + scopeId + '"]');
  }
  function getCurrentStep($scope) {
    var $activePanel = $scope.find('[data-step-panel].' + ACTIVE);
    return $activePanel.length ? parseInt($activePanel.data('stepPanel'), 10) : 1;
  }
  function getTotalSteps($scope) {
    return $scope.find('[data-step-panel]').length;
  }
  function activateStep($scope, stepNum) {
    var $tabs = $scope.find('[data-step-tab]');
    var $panels = $scope.find('[data-step-panel]');
    $panels.removeClass(ACTIVE);
    $panels.filter('[data-step-panel="' + stepNum + '"]').addClass(ACTIVE);
    $tabs.each(function () {
      var $tab = $(this);
      var tabNum = parseInt($tab.data('stepTab'), 10);
      $tab.removeClass(ACTIVE + ' ' + DONE + ' ' + DISABLED);
      if (tabNum === stepNum) {
        $tab.addClass(ACTIVE);
      } else if (tabNum < stepNum) {
        $tab.addClass(DONE);
      } else {
        $tab.addClass(DISABLED);
      }
    });
  }
  function completeStep($scope) {
    var scopeId = $scope.data('stepScope');
    var currentStep = getCurrentStep($scope);
    var totalSteps = getTotalSteps($scope);
    var nextStep = currentStep + 1;
    var isLast = currentStep >= totalSteps;
    var event = new CustomEvent('stepTab:complete', {
      bubbles: true,
      detail: {
        scopeId: scopeId,
        currentStep: currentStep,
        nextStep: isLast ? null : nextStep,
        isLast: isLast
      }
    });
    $scope[0].dispatchEvent(event);
    if (isLast) {
      $scope.find('[data-step-tab="' + currentStep + '"]').removeClass(ACTIVE).addClass(DONE);
      console.log('[stepTab] 모든 스텝 완료');
      return;
    }
    activateStep($scope, nextStep);
    console.log('[stepTab] step ' + currentStep + ' → ' + nextStep);
  }
  function bindScope($scope) {
    $scope.on('click', '[data-step-complete]', function (e) {
      e.preventDefault();
      completeStep($scope);
    });
  }
  window.UI.stepTab = {
    init: function () {
      $('[data-step-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[stepTab] init');
    },
    complete: function (scopeId) {
      var $scope = getScope(scopeId);
      if ($scope.length) {
        completeStep($scope);
      }
    },
    reset: function (scopeId) {
      var $scope = getScope(scopeId);
      if (!$scope.length) return;
      $scope.find('[data-step-tab]').removeClass(DONE);
      activateStep($scope, 1);
      console.log('[stepTab] reset');
    },
    getCurrentStep: function (scopeId) {
      var $scope = getScope(scopeId);
      return $scope.length ? getCurrentStep($scope) : null;
    }
  };
  console.log('[stepTab] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 593:
/***/ (function() {

/**
 * @file scripts/ui/auth-ui.js
 * @purpose 로그인 및 회원 인증 페이지 UI 컨트롤
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[auth-ui] jQuery not found');
  }
  window.UI = window.UI || {};
  const initAuthTabs = (root = document) => {
    const tabWraps = root.querySelectorAll('.vits-auth-tabs');
    tabWraps.forEach(tabWrap => {
      const buttons = Array.from(tabWrap.querySelectorAll('button'));
      if (!buttons.length) {
        return;
      }
      let form = tabWrap.closest('form');
      if (!form && tabWrap.parentElement) {
        var next = tabWrap.parentElement.nextElementSibling;
        if (next && next.tagName === 'FORM') {
          form = next;
        }
      }
      if (!form) {
        return;
      }
      const fieldGroups = Array.from(form.querySelectorAll('.vits-login-form-fields'));
      if (fieldGroups.length < 2) {
        return;
      }
      const setActive = index => {
        buttons.forEach((button, idx) => {
          const isActive = idx === index;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        fieldGroups.forEach((group, idx) => {
          const isActive = idx === index;
          group.style.display = isActive ? '' : 'none';
          group.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
      };
      const currentIndex = Math.max(0, buttons.findIndex(button => button.classList.contains('is-active')));
      setActive(currentIndex);
      buttons.forEach((button, idx) => {
        if (button.dataset.authTabBound === 'true') {
          return;
        }
        button.dataset.authTabBound = 'true';
        if (!button.getAttribute('type')) {
          button.setAttribute('type', 'button');
        }
        button.addEventListener('click', event => {
          event.preventDefault();
          setActive(idx);
        });
      });
    });
  };
  initAuthTabs();
  window.UI.authUi = {
    init: function () {
      console.log('[auth-ui] init');
    }
  };
  console.log('[auth-ui] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 596:
/***/ (function() {

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
    if (prev === null || typeof prev === 'undefined') return {
      move: 'new',
      delta: null
    };
    if (curr === null || typeof curr === 'undefined') return {
      move: 'same',
      delta: null
    };
    if (prev > curr) return {
      move: 'up',
      delta: prev - curr
    };
    if (prev < curr) return {
      move: 'down',
      delta: curr - prev
    };
    return {
      move: 'same',
      delta: 0
    };
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
      if (it.delta === null) $move.removeAttr('data-delta');else $move.attr('data-delta', String(it.delta));
    });
  }

  // 롤링 표시 1줄 DOM 생성(현재 표시용)
  function buildRow(it) {
    var data = it || {
      currRank: null,
      word: '',
      move: 'same',
      delta: null
    };
    var $row = $('<span/>', {
      class: 'header-rank-row'
    });
    $('<span/>', {
      class: 'header-rank-num',
      text: data.currRank !== null ? data.currRank : ''
    }).appendTo($row);
    $('<span/>', {
      class: 'header-rank-word',
      text: data.word || ''
    }).appendTo($row);
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
    $view = $('<span/>', {
      class: 'header-rank-view'
    });
    var $track = $('<span/>', {
      class: 'header-rank-track'
    });
    var $rowA = buildRow(items[0]);
    var $rowB = buildRow(items[1] || items[0]);
    $track.append($rowA).append($rowB);
    $view.append($track);
    $link.empty().append($view);
    return {
      $view: $view,
      $track: $track,
      $rowA: $rowA,
      $rowB: $rowB
    };
  }

  // 롤링 row 내용/상태 덮어쓰기(번호/키워드/변동)
  function copyRow($toRow, it) {
    if (!$toRow || !$toRow.length || !it) return;
    $toRow.find('.header-rank-num').text(it.currRank !== null ? it.currRank : '');
    $toRow.find('.header-rank-word').text(it.word || '');
    var $mv = $toRow.find('.header-rank-move');
    $mv.removeClass(MOVE_CLASS_LIST);
    $mv.addClass('rank-move-' + (it.move || 'same'));
    if (it.delta === null) $mv.removeAttr('data-delta');else $mv.attr('data-delta', String(it.delta));
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

/***/ }),

/***/ 697:
/***/ (function() {

/**
 * @file scripts/ui/header/header-brand.js
 * @description 브랜드 탭 + 검색 + 칩 필터링
 * @requires jQuery
 *
 * @fires brand:tabChange - 탭 전환 시 { tabId }
 * @fires brand:subChange - 서브탭 전환 시 { groupId, subId }
 * @fires brand:chipAdd - 칩 추가 시 { keyword }
 * @fires brand:chipRemove - 칩 삭제 시 { keyword }
 * @fires brand:reset - 초기화 시
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};

  // ── 상수 ──

  var SEL = {
    ROOT: '[data-brand-tab]',
    SCOPE: '[data-brand-search-scope]',
    PANEL: '.gnb-panel-brand',
    // 탭
    TAB_TRIGGER: '[data-tab-trigger]',
    TAB_PANEL: '[data-tab-panel]',
    TAB_GROUP: '[data-tab-group]',
    SUB_TRIGGER: '[data-sub-trigger]',
    SUB_PANEL: '[data-sub-panel]',
    // 검색
    FORM: '[data-brand-search]',
    INPUT: '[data-brand-search-input]',
    CHIPS: '[data-brand-chips]',
    CHIP: '[data-chip-value]',
    CHIP_REMOVE: '[data-chip-action="remove"]',
    RESET: '[data-brand-chips-reset]',
    // 브랜드 목록
    BRAND_LINK: '[data-brand-item]',
    COUNT: '[data-brand-count]'
  };
  var CLS = {
    ACTIVE: 'is-active',
    OPEN: 'is-open',
    SEARCH_MODE: 'is-search-mode'
  };
  var TAB = {
    ALL: 'all',
    KOREAN: 'korean',
    ALPHABET: 'alphabet',
    EMPTY: 'empty'
  };

  // 스크롤 유무 판단 → 클래스 토글
  function checkScroll($root) {
    var el = $root.find('.tab-panels')[0];
    if (!el) return;
    var hasScroll = el.scrollHeight > el.clientHeight;
    $root.toggleClass('has-scroll', hasScroll);
  }

  // 칩 컨테이너 찾기
  function getChips($root) {
    return $root.closest(SEL.PANEL).find(SEL.CHIPS);
  }

  // XSS 방지용 이스케이프
  function escapeHtml(str) {
    return $('<div>').text(str).html();
  }

  // 1차 탭 활성화 (전체/가나다순/알파벳순)
  function activateTab($root, tabId) {
    var $triggers = $root.find(SEL.TAB_TRIGGER);
    var $panels = $root.find(SEL.TAB_PANEL);
    var $groups = $root.find(SEL.TAB_GROUP);
    var $targetTrigger = $root.find('[data-tab-trigger="' + tabId + '"]');
    var $targetPanel = $root.find('[data-tab-panel="' + tabId + '"]');
    if (!$targetPanel.length) return;

    // 전체 비활성
    $triggers.removeClass(CLS.ACTIVE).attr({
      'aria-selected': 'false',
      tabindex: '-1'
    });
    $panels.removeClass(CLS.ACTIVE).attr('hidden', '');
    $groups.removeClass(CLS.OPEN);

    // 선택 활성
    $targetTrigger.addClass(CLS.ACTIVE).attr({
      'aria-selected': 'true',
      tabindex: '0'
    });
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    // 그룹 탭이면 서브탭 영역 열기
    var $group = $targetTrigger.closest(SEL.TAB_GROUP);
    if ($group.length) $group.addClass(CLS.OPEN);
    $root.trigger('brand:tabChange', {
      tabId: tabId
    });
  }

  // 2차 서브탭 활성화 (ㄱ,ㄴ,ㄷ... / A,B,C...Z)
  function activateSubTab($root, $group, subId) {
    var groupId = $group.data('tabGroup');
    var $parentPanel = $root.find('[data-tab-panel="' + groupId + '"]');
    var $subTriggers = $group.find(SEL.SUB_TRIGGER);
    var $subPanels = $parentPanel.find(SEL.SUB_PANEL);
    var $targetTrigger = $group.find('[data-sub-trigger="' + subId + '"]');
    var $targetPanel = $parentPanel.find('[data-sub-panel="' + subId + '"]');
    if (!$targetPanel.length) return;
    $subTriggers.removeClass(CLS.ACTIVE).attr({
      'aria-selected': 'false',
      tabindex: '-1'
    });
    $subPanels.removeClass(CLS.ACTIVE).attr('hidden', '');
    $targetTrigger.addClass(CLS.ACTIVE).attr({
      'aria-selected': 'true',
      tabindex: '0'
    });
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');
    $root.trigger('brand:subChange', {
      groupId: groupId,
      subId: subId
    });
  }

  // 검색 모드 진입 → 전체 탭으로 고정
  function enterSearchMode($root) {
    $root.addClass(CLS.SEARCH_MODE);
    activateTab($root, TAB.ALL);
    $root.find(SEL.TAB_GROUP).removeClass(CLS.OPEN);
  }

  // 검색 모드 해제 → 기본 탭으로 복원
  function resetTabState($root) {
    var defaultTab = $root.data('defaultTab') || TAB.KOREAN;
    $root.removeClass(CLS.SEARCH_MODE);
    activateTab($root, defaultTab);

    // 서브탭 첫번째로 복원
    var $group = $root.find('[data-tab-group="' + defaultTab + '"]');
    if ($group.length) {
      var $firstSub = $group.find(SEL.SUB_TRIGGER).first();
      if ($firstSub.length) {
        activateSubTab($root, $group, $firstSub.data('subTrigger'));
      }
    }
  }

  // 칩 버튼 HTML 생성
  function createChipHtml(keyword, isActive) {
    var escaped = escapeHtml(keyword);
    return '<button type="button" class="vits-chip-button type-outline' + (isActive ? ' ' + CLS.ACTIVE : '') + '" data-chip-value="' + escaped + '">' + '<span class="text">' + escaped + '</span>' + '<span class="icon" aria-hidden="true" data-chip-action="remove">' + '<i class="ic ic-x"></i></span></button>';
  }

  // 칩 유무에 따라 컨테이너 표시/숨김
  function toggleChipsVisibility($chips) {
    var hasChips = $chips.find(SEL.CHIP).length > 0;
    $chips.attr('hidden', hasChips ? null : '');
  }

  // 현재 활성 칩의 키워드 반환
  function getActiveKeyword($chips) {
    var $active = $chips.find(SEL.CHIP + '.' + CLS.ACTIVE);
    return $active.length ? String($active.data('chipValue')).toLowerCase() : '';
  }

  // 특정 칩 활성화 (나머지 비활성)
  function setActiveChip($chips, keyword) {
    $chips.find(SEL.CHIP).removeClass(CLS.ACTIVE);
    if (keyword) {
      $chips.find('[data-chip-value="' + keyword + '"]').addClass(CLS.ACTIVE);
    }
  }

  // 전체 패널 초기 상태로 복원 (링크 전부 표시 + 카운트 복원)
  function resetAllPanel($root) {
    var $panelAll = $root.find('[data-tab-panel="' + TAB.ALL + '"]');
    var $links = $panelAll.find(SEL.BRAND_LINK);
    $links.removeAttr('hidden');
    $panelAll.find(SEL.COUNT).text($links.length);
  }

  // 활성 칩 키워드로 브랜드 목록 필터링
  function filterBrands($root) {
    var $chips = getChips($root);
    var $panelAll = $root.find('[data-tab-panel="' + TAB.ALL + '"]');
    var $panelEmpty = $root.find('[data-tab-panel="' + TAB.EMPTY + '"]');
    var keyword = getActiveKeyword($chips);

    // 키워드 없으면 초기 상태로
    if (!keyword) {
      resetAllPanel($root);
      $panelEmpty.attr('hidden', '');
      resetTabState($root);
      return;
    }
    enterSearchMode($root);

    // 필터링 실행
    var matchCount = 0;
    $panelAll.find(SEL.BRAND_LINK).each(function () {
      var $link = $(this);
      var isMatch = $link.text().toLowerCase().indexOf(keyword) > -1;
      $link.attr('hidden', isMatch ? null : '');
      if (isMatch) matchCount++;
    });

    // 결과 카운트 업데이트
    $panelAll.find(SEL.COUNT).text(matchCount);

    // 결과 없으면 빈 상태 표시
    if (matchCount === 0) {
      $panelAll.attr('hidden', '');
      $panelEmpty.removeAttr('hidden');
    } else {
      $panelEmpty.attr('hidden', '');
    }
  }

  // 칩 추가 (중복 시 활성화만)
  function addChip($root, keyword) {
    var $chips = getChips($root);
    var $reset = $chips.find(SEL.RESET);
    var trimmed = $.trim(keyword);
    if (!trimmed) return;
    var $existing = $chips.find('[data-chip-value="' + trimmed + '"]');

    // 중복이면 활성화만
    if ($existing.length) {
      setActiveChip($chips, trimmed);
      filterBrands($root);
      return;
    }
    setActiveChip($chips, '');
    $(createChipHtml(trimmed, true)).insertBefore($reset);
    toggleChipsVisibility($chips);
    filterBrands($root);
    $root.trigger('brand:chipAdd', {
      keyword: trimmed
    });
  }

  // 칩 삭제 (활성 칩 삭제 시 마지막으로 이동 후 필터링)
  function removeChip($root, $chip) {
    var $chips = getChips($root);
    var wasActive = $chip.hasClass(CLS.ACTIVE);
    var keyword = $chip.data('chipValue');
    $chip.remove();
    toggleChipsVisibility($chips);

    // 활성 칩 삭제 시 남은 마지막 칩 활성화
    if (wasActive) {
      var $last = $chips.find(SEL.CHIP).last();
      if ($last.length) {
        setActiveChip($chips, $last.data('chipValue'));
      }
    }
    filterBrands($root);
    $root.trigger('brand:chipRemove', {
      keyword: keyword
    });
  }

  // 전체 초기화 (칩 전부 삭제 + 탭 복원)
  function resetAll($root) {
    var $chips = getChips($root);
    $chips.find(SEL.CHIP).remove();
    toggleChipsVisibility($chips);
    filterBrands($root);
    $root.trigger('brand:reset');
  }
  function bindEvents($root) {
    var $panel = $root.closest(SEL.PANEL);
    var $form = $panel.find(SEL.FORM);
    var $input = $panel.find(SEL.INPUT);
    var $chips = getChips($root);

    // 1차 탭 클릭
    $root.on('click.brand', SEL.TAB_TRIGGER, function (e) {
      e.preventDefault();
      if ($root.hasClass(CLS.SEARCH_MODE)) return;
      activateTab($root, $(this).data('tabTrigger'));
    });

    // 2차 서브탭 클릭
    $root.on('click.brand', SEL.SUB_TRIGGER, function (e) {
      e.preventDefault();
      var $btn = $(this);
      activateSubTab($root, $btn.closest(SEL.TAB_GROUP), $btn.data('subTrigger'));
    });

    // 검색 폼 제출
    $form.on('submit.brand', function (e) {
      e.preventDefault();
      addChip($root, $input.val());
      $input.val('');
    });

    // 칩 클릭 → 해당 칩 활성화 후 필터링
    $chips.on('click.brand', SEL.CHIP, function (e) {
      if ($(e.target).closest(SEL.CHIP_REMOVE).length) return;
      setActiveChip($chips, $(this).data('chipValue'));
      filterBrands($root);
    });

    // 칩 X 버튼 → 삭제
    $chips.on('click.brand', SEL.CHIP_REMOVE, function (e) {
      e.stopPropagation();
      removeChip($root, $(this).closest(SEL.CHIP));
    });

    // 초기화 버튼
    $chips.on('click.brand', SEL.RESET, function () {
      resetAll($root);
    });

    // 초기 스크롤 체크
    checkScroll($root);

    // 탭 전환 시 스크롤 체크
    $root.on('brand:tabChange brand:subChange', function () {
      checkScroll($root);
    });

    // 필터링 후 스크롤 체크
    $root.on('brand:chipAdd brand:chipRemove brand:reset', function () {
      checkScroll($root);
    });
  }
  window.UI.Brand = {
    init: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if ($root.data('brandInit')) return;
        $root.data('brandInit', true);
        bindEvents($root);
      });
    },
    destroy: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        var $panel = $root.closest(SEL.PANEL);
        $root.off('.brand');
        $panel.find(SEL.FORM).off('.brand');
        getChips($root).off('.brand');
        $root.removeData('brandInit');
      });
    },
    // 외부에서 칩 추가
    addChip: function ($root, keyword) {
      addChip($($root), keyword);
    },
    // 외부에서 초기화
    reset: function ($root) {
      resetAll($($root));
    },
    // 외부에서 탭 전환
    showTab: function ($root, tabId) {
      activateTab($($root), tabId);
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 755:
/***/ (function() {

/**
 * @file scripts/ui/chip-button.js
 * @purpose 칩 버튼 제거(삭제) 공통: data-속성 기반
 * @description
 *  - 트리거: [data-chip-action="remove"] 클릭 시 해당 칩(.vits-chip-button) DOM 제거
 *  - 대상 식별: data-chip-value(옵션) 값은 후속 연동(필터 상태 동기화 등)에 사용 가능
 * @a11y
 *  - X 버튼은 aria-label로 "… 삭제" 제공(마크업에서 처리)
 * @maintenance
 *  - 동작은 공통(삭제만), 표현/상태(활성 등)는 CSS에서 처리
 *  - 이벤트는 위임 방식으로 1회 바인딩(동적 렌더에도 대응)
 *  - trigger payload에 chipEl/groupEl를 포함해 "어떤 영역 칩이 삭제됐는지" 구분 가능하게 한다.
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var EVENT_NS = '.uiChipButton';
  var GROUP_SEL = '.vits-chip-button-group';
  var REMOVE_SEL = '[data-chip-action="remove"]';
  var CHIP_SEL = '.vits-chip-button';

  // 칩 엘리먼트 찾기: 클릭 지점 기준으로 가장 가까운 칩
  function getChipEl($target) {
    return $target.closest(CHIP_SEL);
  }

  // 그룹 엘리먼트 찾기: 칩 그룹 컨테이너
  function getGroupEl($chip) {
    return $chip.closest(GROUP_SEL);
  }

  // 삭제 값 읽기(없어도 삭제는 수행)
  function getChipValue($chip) {
    return $chip.attr('data-chip-value') || '';
  }

  // 칩 제거: DOM에서 제거만 수행(부가 연동은 이벤트로 넘김)
  function removeChip($chip) {
    if (!$chip || !$chip.length) return;
    var value = getChipValue($chip);
    var chipEl = $chip[0];
    var $group = getGroupEl($chip);
    var groupEl = $group.length ? $group[0] : null;
    $chip.remove();

    // 외부 연동용 커스텀 이벤트
    $(document).trigger('ui:chip-remove', {
      value: value,
      chipEl: chipEl,
      groupEl: groupEl
    });
  }

  // 클릭 핸들러: remove 트리거 클릭 시 해당 칩 제거
  function onClickRemove(e) {
    var $t = $(e.target);

    // 아이콘(svg 등) 클릭도 버튼 클릭으로 처리
    if (!$t.is(REMOVE_SEL)) $t = $t.closest(REMOVE_SEL);
    if (!$t.length) return;
    e.preventDefault();
    var $chip = getChipEl($t);
    removeChip($chip);
  }

  // 이벤트 위임 바인딩: 그룹 내부에서만 remove 트리거 처리
  function bind() {
    $(document).off('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL);
    $(document).on('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL, onClickRemove);
  }
  window.UI.chipButton = {
    init: function () {
      bind();
    },
    destroy: function () {
      $(document).off('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL);
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 795:
/***/ (function() {

/**
 * @file scripts/ui/footer/footer-biz-info.js
 * @purpose 푸터 '사업자정보조회' 레이어 팝업에 통신판매사업자 등록현황(OpenAPI) 결과를 테이블로 주입
 * @assumption
 *  - 트리거: .company-btn-lookup + data-biz-brno="사업자등록번호(숫자)"
 *  - 레이어: [data-toggle-box="modal-company"] (open/close는 toggle.js가 담당, 여기서는 데이터 조회/주입만)
 *  - 상태/영역: [data-biz-status], [data-biz-table], [data-biz-field="..."]
 * @ops -note
 *  - 현재 인증키는 개인 계정 기준(개발/테스트용)
 *  - 운영 서버 반영 시 회사 계정/회사 정보 기준으로 인증키 및 관련 정보 수정/교체 요청 필요
 * @note
 *  - resultType=json 사용
 *  - OP_PATH는 사업자등록번호별 조회(/getMllBsBiznoInfo_2) 기준
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};

  // Config: 마크업 변경 대비(트리거/레이어/주입 셀렉터는 이 구간만 수정)
  var ROOT_SEL = '[data-footer-biz]'; // 스코프(없으면 document 기준으로 1회만 동작)
  var LAYER_SEL = '[data-toggle-box="modal-company"]'; // 레이어(푸터 사업자정보조회 팝업)
  var TRIGGER_SEL = '.company-btn-lookup'; // 트리거(사업자정보조회 버튼)

  var END_POINT = 'https://apis.data.go.kr/1130000/MllBs_2Service';
  var OP_PATH = '/getMllBsBiznoInfo_2';

  // Ops: 운영 반영 시 회사 계정 키로 교체 필요(Encoding 키 권장)
  var SERVICE_KEY = '06d4351e0dfaaa207724b9c64e8fcc9814fce520ff565409cd7b70715706f34b';
  var STATUS_SEL = '[data-biz-status]'; // 상태 문구 영역
  var TABLE_SEL = '[data-biz-table]'; // 결과 테이블(숨김 토글 대상)
  var FIELD_SEL = '[data-biz-field]'; // 필드 셀(키 기반 주입)

  // Event: destroy/unbind 대비 네임스페이스 고정
  var EVT_NS = '.footerBizInfo';

  // Cache: 동일 brno 중복 호출 방지(진행 중 요청은 합치고, 성공 결과는 brno별 보관)
  var cache = {
    items: {},
    // { [brno]: item }
    pendings: {} // { [brno]: jqXHR/promise }
  };

  // DOM: root 스코프 기준으로 레이어/주입 대상 캐시(레이어는 first()만 사용)
  function getEls($root) {
    var $scope = $root && $root.length ? $root : $(document);
    var $layer = $scope.find(LAYER_SEL).first();
    return {
      $root: $scope,
      $layer: $layer,
      $status: $layer.find(STATUS_SEL).first(),
      $table: $layer.find(TABLE_SEL).first(),
      $fields: $layer.find(FIELD_SEL)
    };
  }

  // Utils: 사업자등록번호는 숫자만 유지(비정상 입력 방어)
  function normalizeBrno(v) {
    return String(v || '').replace(/\D/g, '');
  }

  // Utils: 사업자등록번호 표시용 포맷(000-00-00000)
  function formatBrno(v) {
    var n = normalizeBrno(v);
    if (n.length === 10) return n.slice(0, 3) + '-' + n.slice(3, 5) + '-' + n.slice(5);
    return n || '-';
  }

  // Utils: YYYYMMDD → YYYY.MM.DD 표시
  function formatYmd(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 8) return n.slice(0, 4) + '.' + n.slice(4, 6) + '.' + n.slice(6);
    return n || '-';
  }

  // Fetch: API 호출 URL 조립(사업자등록번호별 조회)
  function buildUrl(brno) {
    return END_POINT + OP_PATH + '?serviceKey=' + encodeURIComponent(SERVICE_KEY) + '&pageNo=1' + '&numOfRows=10' + '&resultType=json' + '&brno=' + encodeURIComponent(brno);
  }

  // Parse: OpenAPI 표준 header(resultCode/resultMsg) 추출(가능한 경우)
  function pickApiMeta(json) {
    var header = json && json.response && json.response.header;
    if (!header) return null;
    return {
      resultCode: header.resultCode,
      resultMsg: header.resultMsg
    };
  }

  // Parse: OpenAPI 응답 구조 변동 대응(일반 케이스 우선, 실패 시 fallback DFS)
  function pickFirstItem(json) {
    var body = json && json.response && json.response.body;
    var root = body || json;
    var v;

    // body.items.item
    v = root && root.items && root.items.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.item
    v = root && root.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.items
    v = root && root.items;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // Fallback: 데이터처럼 보이는 객체를 DFS로 1개 탐색(정답 보장 로직이 아닌 최후 방어)
    function findFirstObject(node, depth) {
      if (!node || depth > 8) return null;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i += 1) {
          var r1 = findFirstObject(node[i], depth + 1);
          if (r1) return r1;
        }
        return null;
      }
      if (typeof node === 'object') {
        var keys = Object.keys(node);

        // 원시값(문자/숫자/불리언) 필드가 3개 이상이면 “데이터 객체”로 간주
        var primitiveCount = 0;
        for (var k = 0; k < keys.length; k += 1) {
          var val = node[keys[k]];
          var t = typeof val;
          if (val == null) continue;
          if (t === 'string' || t === 'number' || t === 'boolean') primitiveCount += 1;
        }
        if (primitiveCount >= 3) return node;
        for (var j = 0; j < keys.length; j += 1) {
          var r2 = findFirstObject(node[keys[j]], depth + 1);
          if (r2) return r2;
        }
      }
      return null;
    }
    return findFirstObject(root, 0);
  }

  // UI: 상태 문구/테이블 노출만 제어(레이어 open/close는 toggle.js 담당)
  function setUiLoading(els) {
    if (els.$status.length) els.$status.text('조회 중입니다…');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  // UI: 에러 시 문구 표시 및 테이블 숨김
  function setUiError(els, msg) {
    if (els.$status.length) els.$status.text(msg || '조회에 실패했습니다.');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  // UI: 성공 시 문구 제거 및 테이블 노출
  function setUiSuccess(els) {
    if (els.$status.length) els.$status.text('');
    if (els.$table.length) els.$table.prop('hidden', false);
  }

  // Render helper: data-biz-field 키로 셀을 찾아 텍스트 주입(값 없으면 '-')
  function setFieldText(els, key, value) {
    if (!els || !els.$layer || !els.$layer.length) return;
    var $cell = els.$layer.find('[data-biz-field="' + key + '"]').first();
    if (!$cell.length) return;
    $cell.text(value == null || value === '' ? '-' : String(value));
  }

  // Render: 테이블 필드 매핑(스펙 변경 시 여기만 수정)
  function renderBizInfo(els, brno, item) {
    setFieldText(els, 'bzmnNm', item && item.bzmnNm); // 상호
    setFieldText(els, 'brno', formatBrno(item && item.brno || brno)); // 사업자등록번호
    setFieldText(els, 'operSttusCdNm', item && item.operSttusCdNm); // 운영상태
    setFieldText(els, 'ctpvNm', item && item.ctpvNm); // 시/도
    setFieldText(els, 'dclrInsttNm', item && item.dclrInsttNm); // 신고기관
    setFieldText(els, 'fromYmd', formatYmd(item && item.fromYmd)); // 신고일/조회기간(스펙 확정 시 필드명 기준으로 조정)
    setFieldText(els, 'prmmiMnno', item && item.prmmiMnno); // 인허가(등록)번호
  }

  // Fetch: JSON 파싱 실패 방어(text로 받는 경우 대비)
  function parseJsonSafe(text) {
    try {
      return typeof text === 'string' ? JSON.parse(text) : text;
    } catch (e) {
      console.warn('[footerBizInfo] JSON parse failed:', e);
      return null;
    }
  }

  // Fetch: 동일 brno는 1회만 조회(진행 중 요청은 pendings 재사용)
  function fetchBizInfoOnce(brno) {
    var n = normalizeBrno(brno);
    if (!n) return $.Deferred().reject('INVALID_BRNO').promise();
    if (cache.items[n]) return $.Deferred().resolve(cache.items[n]).promise();
    if (cache.pendings[n]) return cache.pendings[n];
    cache.pendings[n] = $.ajax({
      url: buildUrl(n),
      method: 'GET',
      dataType: 'text',
      // 서버 응답 헤더/포맷 이슈 대비(필요 시 json으로 변경)
      timeout: 8000 // 운영 환경/네트워크 정책에 따라 조정 가능
    }).then(function (text) {
      var json = parseJsonSafe(text);
      if (!json) return $.Deferred().reject('PARSE_ERROR').promise();
      var meta = pickApiMeta(json);
      if (meta && meta.resultCode && meta.resultCode !== '00') {
        return $.Deferred().reject(meta.resultMsg || 'API_ERROR').promise();
      }
      var item = pickFirstItem(json);
      if (!item) return $.Deferred().reject('EMPTY').promise();
      cache.items[n] = item;
      return item;
    }).always(function () {
      delete cache.pendings[n];
    });
    return cache.pendings[n];
  }

  // Bind: 트리거에서 사업자번호 읽기(숫자만)
  function readBrno($btn) {
    return normalizeBrno($btn && $btn.length ? $btn.attr('data-biz-brno') : '');
  }

  // Bind: 트리거 클릭 시 조회/주입만 수행(레이어 토글은 toggle.js)
  function bindTrigger(els) {
    var $root = els.$root;

    // Bind: 동일 root에서 중복 바인딩 방지(재초기화 대비)
    $root.off('click' + EVT_NS, TRIGGER_SEL);
    $root.on('click' + EVT_NS, TRIGGER_SEL, function () {
      var brno = readBrno($(this));
      if (!els.$layer.length) return;
      if (!brno) {
        setUiError(els, '사업자등록번호가 없습니다.');
        return;
      }

      // UX: 캐시가 없을 때만 로딩 표시(선조회/기조회면 즉시 렌더)
      if (!cache.items[brno]) setUiLoading(els);
      fetchBizInfoOnce(brno).then(function (item) {
        setUiSuccess(els);
        renderBizInfo(els, brno, item);
      }).fail(function (err) {
        setUiError(els, err === 'EMPTY' ? '조회 결과가 없습니다.' : '조회에 실패했습니다.');
      }).always(function () {
        // UX: 비정상 종료로 로딩 문구가 남는 경우 방어
        if (els.$status.length && els.$status.text() === '조회 중입니다…') {
          setUiError(els, '조회에 실패했습니다.');
        }
      });
    });
  }

  // Prefetch: 최초 1회 선조회로 팝업 오픈 시 즉시 렌더(실패해도 UX 영향 최소)
  function prefetchOnce(els) {
    var $btn = els.$root.find(TRIGGER_SEL).first();
    var brno = readBrno($btn);
    if (!brno) return;
    if (cache.items[brno]) {
      renderBizInfo(els, brno, cache.items[brno]);
      return;
    }
    fetchBizInfoOnce(brno).then(function (item) {
      renderBizInfo(els, brno, item);
    });
  }

  // Init: root 1개 초기화(스코프별 분리 가능)
  function initRoot($root) {
    var els = getEls($root);
    if (!els.$layer.length) return;
    bindTrigger(els);
    prefetchOnce(els);
  }
  window.UI.footerBizInfo = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      var $roots = $(ROOT_SEL);

      // 스코프가 없으면 문서 기준으로 1회만 초기화
      if (!$roots.length) {
        initRoot($(document));
        return;
      }
      $roots.each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 803:
/***/ (function() {

/**
 * @file scripts/ui/form/textarea.js
 * @purpose textarea 공통: 글자수 카운트/제한(그래핌 기준) + IME(조합) 대응 + 스크롤 상태 클래스 토글
 * @scope .vits-textarea 컴포넌트 내부 textarea만 적용(전역 영향 없음)
 *
 * @rule
 *  - 높이/줄수/리사이즈는 CSS에서만 관리(JS는 height에 관여하지 않음)  // 단, single-auto/single-lock 모드에서만 inline height를 사용
 *  - 스크롤 발생 시에만 root에 .is-scroll
 *
 * @state
 *  - root.is-scroll: textarea 실제 overflow 발생 시 토글
 *
 * @option (root) data-textarea-count="true|false"
 * @option (textarea) data-max-length="500" // 입력 제한(선택, 그래핌 기준)
 * @option (root) data-textarea-mode="single-fixed|single-auto|single-lock|multi-fixed"
 * @option (root) data-textarea-max-lines="N"      // single-auto 최대 줄(선택)
 * @option (root) data-textarea-lock-lines="N"     // single-lock 잠금 줄(선택)
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - Intl.Segmenter 미지원 환경은 Array.from 폴백(그래핌 근사)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.textarea = window.UI.textarea || {};
  var MODULE_KEY = 'textarea';
  var NS = '.' + MODULE_KEY;
  var ROOT = '.vits-textarea';
  var TA = ROOT + ' textarea';
  var MODE = {
    SINGLE_FIXED: 'single-fixed',
    SINGLE_AUTO: 'single-auto',
    SINGLE_LOCK: 'single-lock',
    MULTI_FIXED: 'multi-fixed'
  };

  // 숫자 data-속성 파싱(없으면 0)
  function intAttr($el, name) {
    if (!$el || !$el.length) return 0;
    var v = parseInt($el.attr(name), 10);
    return Number.isFinite(v) ? v : 0;
  }

  // root 옵션 조회(문자열)
  function rootOpt($root, name) {
    return $root && $root.length ? $root.attr(name) || '' : '';
  }

  // root 옵션 조회(숫자)
  function rootOptInt($root, name) {
    return intAttr($root, name);
  }

  // 그래핌(사용자 체감 글자) 단위 카운트
  function graphemeCount(str) {
    var s = String(str || '');
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var c = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) c += 1;
        return c;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }
    return Array.from(s).length;
  }

  // 최대 글자수 기준 자르기(그래핌 우선)
  function sliceToMax(str, max) {
    var s = String(str || '');
    var m = parseInt(max, 10) || 0;
    if (!m) return s;
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var out = '';
        var i = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) {
          if (i >= m) break;
          out += r.value.segment;
          i += 1;
        }
        return out;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }
    return Array.from(s).slice(0, m).join('');
  }

  // 입력 제한 적용(조합 중엔 미적용)
  function enforceMaxLength($ta, isComposing) {
    if (!$ta || !$ta.length) return;
    var maxLen = intAttr($ta, 'data-max-length');
    if (!maxLen || isComposing) return;
    var v = $ta.val() || '';
    var next = sliceToMax(v, maxLen);
    if (next !== v) $ta.val(next);
  }

  // css 값(px) 파싱
  function pxNum(v) {
    var n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  // textarea 스타일 기반 line/extra 계산
  function metrics($ta) {
    var cs = window.getComputedStyle($ta[0]);
    var lh = pxNum(cs.lineHeight);
    if (!lh) lh = pxNum(cs.fontSize) * 1.5;
    var pt = pxNum(cs.paddingTop);
    var pb = pxNum(cs.paddingBottom);
    var bt = pxNum(cs.borderTopWidth);
    var bb = pxNum(cs.borderBottomWidth);
    return {
      line: lh,
      extra: pt + pb + bt + bb
    };
  }

  // rows 기준 높이(px) 계산
  function heightByRows($ta, rows) {
    var m = metrics($ta);
    var r = Math.max(1, rows || 1);
    return m.line * r + m.extra;
  }

  // textarea 높이(px) 주입
  function setHeightPx($ta, px) {
    $ta[0].style.height = Math.max(0, px) + 'px';
  }

  // inline height 제거(CSS 규칙으로 복귀)
  function clearHeightPx($ta) {
    $ta[0].style.height = '';
    $ta.removeClass('is-clamped is-locked');
  }

  // scrollHeight 기반 자동 높이 계산(clamp)
  function calcAutoHeightPx($ta, minPx, maxPx) {
    $ta[0].style.height = 'auto';
    var h = $ta[0].scrollHeight || 0;
    if (minPx) h = Math.max(h, minPx);
    if (maxPx) h = Math.min(h, maxPx);
    return h;
  }

  // 카운트 UI 갱신(옵션 true일 때만)
  function updateCountUI($root, $ta) {
    if (rootOpt($root, 'data-textarea-count') !== 'true') return;
    var $count = $root.find('[data-ui-textarea-count]').first();
    if (!$count.length) return;
    var v = $ta.val() || '';
    $count.text(String(graphemeCount(v)));
    var maxLen = intAttr($ta, 'data-max-length');
    var $max = $root.find('[data-ui-textarea-max]').first();
    if (maxLen && $max.length) $max.text(String(maxLen));
  }

  // 스크롤 발생 여부 감지(스크롤바 표시 시점 기준)
  function syncScrollState($root, $ta) {
    var el = $ta[0];
    if (!el) return;
    var oy = window.getComputedStyle(el).overflowY;
    var canScroll = oy === 'auto' || oy === 'scroll';
    if (!canScroll) {
      $root.removeClass('is-scroll');
      $ta.removeClass('vits-scrollbar');
      return;
    }
    var isOverflow = el.scrollHeight - el.clientHeight > 1;
    $root.toggleClass('is-scroll', isOverflow);
    $ta.toggleClass('vits-scrollbar', isOverflow);
  }

  // fixed 모드 처리(높이는 CSS가 담당)
  function syncFixedByCss($root, $ta) {
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
    clearHeightPx($ta);
  }

  // single-auto 높이 동기화(1줄 → max-lines까지 확장)
  function syncSingleAuto($root, $ta) {
    var baseRows = intAttr($ta, 'rows') || 1;
    var maxLines = rootOptInt($root, 'data-textarea-max-lines') || baseRows;
    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, maxLines);
    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);
    $ta.toggleClass('is-clamped', next >= maxPx);
    $ta.removeClass('is-locked');
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
  }

  // single-lock 높이 동기화(지정 줄수 도달 시 고정 전환)
  function syncSingleLock($root, $ta) {
    var locked = rootOpt($root, 'data-textarea-locked') === 'true';
    var lockLines = rootOptInt($root, 'data-textarea-lock-lines') || 1;
    var baseRows = intAttr($ta, 'rows') || 1;
    if (locked) {
      var lockPx = rootOptInt($root, 'data-textarea-locked-px');
      if (lockPx) setHeightPx($ta, lockPx);
      $ta.addClass('is-locked');
      return;
    }
    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, lockLines);
    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);

    // 줄수는 \n 기준(단일락 정책 유지)
    var v = ($ta.val() || '').replace(/\r\n/g, '\n');
    var lines = v.length ? v.split('\n').length : 1;
    if (lines >= lockLines) {
      $root.attr('data-textarea-locked', 'true');
      $root.attr('data-textarea-locked-px', String(next));
      $ta.addClass('is-locked');
    }
    $ta.toggleClass('is-clamped', next >= maxPx);
  }

  // 모드별 적용(제한 → 높이 → 카운트 → 스크롤)
  function apply($root, $ta, opts) {
    var isComposing = !!(opts && opts.isComposing);
    var mode = rootOpt($root, 'data-textarea-mode');
    enforceMaxLength($ta, isComposing);
    if (mode === MODE.SINGLE_FIXED || mode === MODE.MULTI_FIXED) syncFixedByCss($root, $ta);
    if (mode === MODE.SINGLE_AUTO) syncSingleAuto($root, $ta);
    if (mode === MODE.SINGLE_LOCK) syncSingleLock($root, $ta);
    updateCountUI($root, $ta);
    syncScrollState($root, $ta);
  }

  // 단일 textarea 초기 동기화
  function initOne($ta) {
    if (!$ta || !$ta.length) return;
    var $root = $ta.closest(ROOT);
    if (!$root.length) return;
    apply($root, $ta, {
      isComposing: false
    });
  }

  // 이벤트 바인딩(위임 1회, init 재호출 대비)
  function bindOnce() {
    $(document).off(NS);
    $(document).on('compositionstart' + NS, TA, function () {
      $(this).data('isComposing', true);
    }).on('compositionend' + NS, TA, function () {
      var $ta = $(this);
      $ta.data('isComposing', false);
      initOne($ta);
    }).on('input' + NS, TA, function () {
      var $ta = $(this);
      var $root = $ta.closest(ROOT);
      if (!$root.length) return;
      apply($root, $ta, {
        isComposing: !!$ta.data('isComposing')
      });
    });
  }

  // root 범위 초기화(부분 렌더 지원)
  function initAll(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find(TA).each(function () {
      initOne($(this));
    });
  }
  window.UI.textarea = {
    init: function (root) {
      if (!window.UI.textarea.__bound) {
        bindOnce();
        window.UI.textarea.__bound = true;
      }
      initAll(root);
    },
    destroy: function () {
      $(document).off(NS);
      window.UI.textarea.__bound = false;
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 809:
/***/ (function() {

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
    return String(str || '').replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
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
    $('<span/>', {
      class: 'text',
      text: v
    }).appendTo($chip);
    $('<span/>', {
      class: 'icon ic ic-x',
      'aria-hidden': 'true'
    }).appendTo($chip);
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
        scrollerEl.scrollTo({
          left: left,
          behavior: 'smooth'
        });
        return;
      }
    }
    scrollerEl.scrollTo({
      left: getMaxScrollLeft(scrollerEl),
      behavior: 'smooth'
    });
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
        scrollerEl.scrollTo({
          left: left,
          behavior: 'smooth'
        });
        return;
      }
    }
    scrollerEl.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
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
    window.UI.inputSearch.init({
      $form: els.$form,
      $input: els.$input,
      $validation: els.$validation
    }, {
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
    });
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
            window.UI.inputSearch.setInvalid({
              $input: els.$input,
              $validation: els.$validation
            }, true);
          }
          return;
        }
        if (appendChip(els, kw)) syncVisibility(els);
        if (window.UI && window.UI.inputSearch && typeof window.UI.inputSearch.setInvalid === 'function') {
          window.UI.inputSearch.setInvalid({
            $input: els.$input,
            $validation: els.$validation
          }, false);
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
      window.UI.inputSearch.setInvalid({
        $input: els.$input,
        $validation: els.$validation
      }, false);
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

/***/ }),

/***/ 847:
/***/ (function() {

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
    return 'data-' + String(key || '').replace(/([A-Z])/g, '-$1').toLowerCase();
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
    if (isOpen) closeLayer(target, $btn, $box);else openLayer(target, $btn, $box);
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
    $(document).off('click' + NS, SEL_BTN).on('click' + NS, SEL_BTN, onToggle);
    $(document).off('click' + NS + 'InnerClose', SEL_CLOSE).on('click' + NS + 'InnerClose', SEL_CLOSE, onInnerClose);
    $(document).off('click' + NS + 'Outside').on('click' + NS + 'Outside', onOutsideClick);
    $(document).off('keydown' + NS + 'Esc').on('keydown' + NS + 'Esc', onEsc);
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

/***/ }),

/***/ 864:
/***/ (function() {

/**
 * @file scripts/ui/period-btn.js
 * @purpose 기간 선택 버튼 UI (그룹 기반 라디오 버튼 동작)
 * @description
 *  - 그룹: [data-ui="period-btn-group"][data-group="groupName"]
 *  - 버튼: [data-ui="period-btn"][data-value="..."]
 *  - 상태: aria-pressed(true/false)로만 제어
 *  - 동작: 같은 그룹 내에서 1개 버튼만 활성화(상호배타적)
 * @a11y
 *  - aria-pressed 속성으로 활성/비활성 상태 전달
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일)
 *  - 비즈니스 로직은 콜백/이벤트로 외부에서 처리
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[period-btn] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var BTN_SELECTOR = '[data-ui="period-btn"]';

  /**
   * @purpose 그룹 내 버튼 이벤트 바인딩
   * @param {jQuery} $group - period-btn-group 요소
   * @returns {void}
   */
  function bindGroup($group) {
    var groupName = $group.data('group');
    $group.on('click', BTN_SELECTOR, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var value = $btn.data('value');
      if (!value) {
        console.warn('[period-btn] data-value is required');
        return;
      }

      // 같은 그룹 내 다른 버튼 모두 비활성화
      $group.find(BTN_SELECTOR).attr('aria-pressed', 'false');

      // 클릭한 버튼만 활성화
      $btn.attr('aria-pressed', 'true');
      console.log('[period-btn] selected:', groupName, value);

      // 외부 콜백 (옵션)
      if (window.UI.PeriodBtn.onSelect) {
        window.UI.PeriodBtn.onSelect(value, groupName);
      }
    });
  }
  window.UI.PeriodBtn = {
    /**
     * @purpose 초기화
     * @returns {void}
     */
    init: function () {
      $('[data-ui="period-btn-group"]').each(function () {
        bindGroup($(this));
      });
      console.log('[period-btn] init');
    },
    /**
     * @purpose 특정 그룹에서 특정 값으로 선택
     * @param {string} groupName - data-group 값
     * @param {string} value - data-value 값
     * @returns {void}
     */
    setValue: function (groupName, value) {
      var $group = $('[data-ui="period-btn-group"][data-group="' + groupName + '"]');
      if (!$group.length) {
        console.warn('[period-btn] group not found:', groupName);
        return;
      }
      $group.find(BTN_SELECTOR).attr('aria-pressed', 'false');
      var $btn = $group.find(BTN_SELECTOR + '[data-value="' + value + '"]');
      if ($btn.length) {
        $btn.attr('aria-pressed', 'true');
        console.log('[period-btn] setValue:', groupName, value);
      }
    },
    /**
     * @purpose 특정 그룹의 현재 선택된 값 반환
     * @param {string} groupName - data-group 값
     * @returns {string|null}
     */
    getValue: function (groupName) {
      var $group = $('[data-ui="period-btn-group"][data-group="' + groupName + '"]');
      var $selected = $group.find(BTN_SELECTOR + '[aria-pressed="true"]');
      return $selected.length ? $selected.data('value') : null;
    },
    /**
     * @purpose 외부 콜백 (선택 시 실행)
     * @type {Function|null}
     */
    onSelect: null
  };
  console.log('[period-btn] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 865:
/***/ (function() {

/**
 * @file scripts/ui/form/select.js
 * @purpose 커스텀 셀렉트 공통: 단일/브레드크럼(1~3뎁스) UI + 옵션 렌더링 + 선택값 표시 + 연동 활성화
 * @scope init(root) 컨테이너 범위 내에서만 그룹(브레드크럼) 캐시를 구축하고, 이벤트는 closest(ROOT) 기반으로 동작
 * @rule group(data-root) 유무로 단일/연결(브레드크럼) 분기하며, 단일은 closest만으로 종료
 * @maintenance
 *  - 초기화: core/ui.js에서 UI.select.init(document) 1회 호출
 *  - 부분 렌더링: UI.select.destroy(root) 후 UI.select.init(root)로 재초기화
 */

(function ($, window, document) {
  'use strict';

  // jQuery 의존(프로젝트 전제)
  if (!$) {
    console.log('[select] jQuery not found');
    return;
  }

  // 네임스페이스 보장
  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  // 셀렉터
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var TITLE = '[data-plp-category-title]';
  var PORTAL = '[data-vits-select-portal]';

  // 클래스
  var CLS_OPEN = 'vits-select-open';
  var CLS_DROPUP = 'vits-select-dropup';
  var CLS_DISABLED = 'vits-select-disabled';
  var CLS_NO_OPTION = 'is-no-option';
  var CLS_SELECTED = 'vits-select-selected';
  var CLS_OPT_DISABLED = 'vits-select-option-disabled';
  var CLS_PORTAL_LIST = 'vits-select-list-portal';

  // 이벤트 네임스페이스
  var NS = '.uiSelect';

  // dropup 계산 상수
  var GUTTER = 8;
  var MIN_H = 120;
  var PORTAL_GAP = 4;

  // 컨테이너/루트 키 분리(부분 렌더링 destroy 안정화)
  var DATA_CONTAINER_KEY = 'uiSelectContainerKey';
  var DATA_ROOT_KEY = 'uiSelectRootKey';
  var DATA_PORTAL_ORIGIN = 'uiSelectPortalOrigin';

  // 스코프 저장소(scopeKey -> { $container, groups, openRoot })
  var scopes = {};
  var scopeSeq = 0;

  // 안전 문자열 변환
  function toStr(v) {
    return String(v == null ? '' : v);
  }

  // mockData 카테고리 트리 안전 반환
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }

  // 루트의 group 반환(연결 여부 판단 키)
  function getGroup($root) {
    return toStr($root.attr('data-root')).trim();
  }

  // 루트의 depth 반환
  function getDepth($root) {
    return parseInt($root.attr('data-depth'), 10) || 0;
  }

  // portal 여부 체크
  function isPortal($root) {
    return $root.is(PORTAL);
  }

  // 루트의 scopeKey 반환(없으면 0)
  function getRootScopeKey($root) {
    var v = $root && $root.length ? $root.data(DATA_ROOT_KEY) : null;
    return v != null ? v : 0;
  }

  // 컨테이너의 scopeKey 반환(없으면 null)
  function getContainerScopeKey($container) {
    var v = $container && $container.length ? $container.data(DATA_CONTAINER_KEY) : null;
    return v != null ? v : null;
  }

  // scopeKey로 스코프 조회
  function getScope(scopeKey) {
    return scopes[scopeKey] || null;
  }

  // 동일 스코프의 그룹 캐시 조회
  function getGroupCache($root) {
    var scope = getScope(getRootScopeKey($root));
    if (!scope) return null;
    var group = getGroup($root);
    if (!group) return null;
    return scope.groups[group] || null;
  }

  // 그룹 내 depth 루트 찾기
  function findDepth($roots, depth) {
    var $found = $();
    $roots.each(function () {
      var $r = $(this);
      if (getDepth($r) === depth) $found = $found.add($r);
    });
    return $found;
  }

  // root에 연결된 list 찾기 (portal 모드 대응)
  function findList($root) {
    // 일반 모드: 자식에서 찾기
    var $list = $root.find(LIST);
    if ($list.length) return $list;

    // portal 모드: body에서 origin 기준으로 찾기
    return $('body').children(LIST).filter(function () {
      var $origin = $(this).data(DATA_PORTAL_ORIGIN);
      return $origin && $origin.is($root);
    });
  }

  // portal list 닫기 (원위치 복귀)
  function closePortal($root) {
    var $list = $('body').children(LIST).filter(function () {
      var $origin = $(this).data(DATA_PORTAL_ORIGIN);
      return $origin && $origin.is($root);
    });
    if (!$list.length) return;
    $list.removeData(DATA_PORTAL_ORIGIN).removeClass(CLS_PORTAL_LIST).css({
      position: '',
      top: '',
      left: '',
      minWidth: '',
      maxHeight: '',
      zIndex: ''
    }).appendTo($root);
  }

  // 특정 루트 닫기
  function closeOne($root) {
    if (!$root || !$root.length) return;
    $root.removeClass(CLS_OPEN + ' ' + CLS_DROPUP);
    $root.find(TRIGGER).attr('aria-expanded', 'false');
    if (isPortal($root)) {
      closePortal($root);
    } else {
      $root.find(LIST).each(function () {
        this.style.maxHeight = '0px';
      });
    }
  }

  // 스코프 단위로 열린 셀렉트 닫기
  function closeOpenedInScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope || !scope.openRoot || !scope.openRoot.length) return;
    closeOne(scope.openRoot);
    scope.openRoot = null;
  }

  // 전체 스코프의 열린 셀렉트 닫기(전역 ROOT 스캔 없음)
  function closeAllOpened() {
    Object.keys(scopes).forEach(function (k) {
      closeOpenedInScope(parseInt(k, 10));
    });
  }

  // trigger 기준 스크롤 컨테이너 탐색
  function getScrollParent(el) {
    var p = el && el.parentElement;
    while (p && p !== document.body && p !== document.documentElement) {
      var st = window.getComputedStyle(p);
      var oy = st.overflowY;
      if (oy === 'auto' || oy === 'scroll') return p;
      p = p.parentElement;
    }
    return window;
  }

  // 오픈 직전 dropup/최대높이 계산 (일반 모드)
  function applyDropDirection($root) {
    if (!$root || !$root.length) return;
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;
    var triggerEl = $trigger.get(0);
    var listEl = $list.get(0);
    if (!triggerEl || !listEl) return;
    var scroller = getScrollParent(triggerEl);
    var cRect = scroller === window ? {
      top: 0,
      bottom: window.innerHeight
    } : scroller.getBoundingClientRect();
    var tRect = triggerEl.getBoundingClientRect();
    var spaceBelow = cRect.bottom - tRect.bottom;
    var spaceAbove = tRect.top - cRect.top;
    var prevMaxH = listEl.style.maxHeight;
    listEl.style.maxHeight = 'none';
    var listH = listEl.scrollHeight;
    listEl.style.maxHeight = prevMaxH;
    var forced = $root.hasClass(CLS_DROPUP);
    var shouldDropUp = forced ? true : spaceBelow < listH && spaceAbove > spaceBelow;
    if (!forced) $root.toggleClass(CLS_DROPUP, shouldDropUp);
    var maxH = (shouldDropUp ? spaceAbove : spaceBelow) - GUTTER;
    if (maxH < MIN_H) maxH = MIN_H;
    listEl.style.maxHeight = maxH + 'px';
    listEl.style.overflowY = 'auto';
  }

  // portal 모드 열기
  function openPortal($root) {
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;
    var rect = $trigger[0].getBoundingClientRect();
    var customMaxH = $root.attr('data-max-height'); // 커스텀 max-height 읽기

    // 숫자만 있으면 px 붙이기
    if (customMaxH && /^\d+$/.test(customMaxH)) {
      customMaxH = customMaxH + 'px';
    }
    $list.data(DATA_PORTAL_ORIGIN, $root).addClass(CLS_PORTAL_LIST).css({
      position: 'fixed',
      left: rect.left + 'px',
      minWidth: rect.width + 'px',
      zIndex: 99999
    }).appendTo('body');
    var listH = $list.outerHeight();
    var spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    var spaceAbove = rect.top - GUTTER;
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    var maxH;
    var calcMaxH;
    var topPos;
    var bottomPos;

    // openPortal 함수 수정
    if (shouldDropUp) {
      calcMaxH = Math.max(spaceAbove, MIN_H) + 'px';
      bottomPos = window.innerHeight - rect.top + PORTAL_GAP;
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: '',
        bottom: bottomPos + 'px',
        maxHeight: maxH
      });
      $root.addClass(CLS_DROPUP);
    } else {
      calcMaxH = Math.max(spaceBelow, MIN_H) + 'px';
      topPos = rect.bottom + PORTAL_GAP;
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: topPos + 'px',
        bottom: '',
        maxHeight: maxH
      });
      $root.removeClass(CLS_DROPUP);
    }
  }

  // 특정 루트 오픈(스코프 단위 1개만 열림 유지)
  function openOne($root) {
    var scopeKey = getRootScopeKey($root);
    closeOpenedInScope(scopeKey);
    if (isPortal($root)) {
      openPortal($root);
    } else {
      applyDropDirection($root);
    }
    $root.addClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'true');
    var scope = getScope(scopeKey);
    if (scope) scope.openRoot = $root;
  }

  // disabled 동기화
  function setDisabled($root, disabled) {
    var on = !!disabled;
    $root.toggleClass(CLS_DISABLED, on);
    $root.find(TRIGGER).prop('disabled', on);
    if (on) {
      closeOne($root);
      var scope = getScope(getRootScopeKey($root));
      if (scope && scope.openRoot && scope.openRoot.is($root)) scope.openRoot = null;
    }
  }

  // 하위 옵션 없음 상태 토글
  function setNoOption($root, on) {
    $root.toggleClass(CLS_NO_OPTION, !!on);
  }

  // hidden 값 세팅 + change 트리거(외부 연동 포인트)
  function setHiddenVal($root, v) {
    var $hidden = $root.find(HIDDEN);
    if (!$hidden.length) return;
    $hidden.val(toStr(v));
    $hidden.trigger('change');
  }

  // hidden 값 반환
  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? toStr($hidden.val()) : '';
  }

  // placeholder/hidden/선택표시 초기화
  function resetToPlaceholder($root, clearOptions) {
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');
    setHiddenVal($root, '');
    var $list = findList($root);
    $list.find(OPT).removeClass(CLS_SELECTED).attr('aria-selected', 'false');
    if (clearOptions) $list.empty();
  }

  // placeholder/옵션 제거 후 비활성
  function disableAndClear($root) {
    resetToPlaceholder($root, true);
    setNoOption($root, false);
    setDisabled($root, true);
  }

  // 옵션 없음 상태로 비활성
  function disableAsNoOption($root) {
    resetToPlaceholder($root, true);
    setNoOption($root, true);
    setDisabled($root, true);
  }

  // 옵션 렌더링
  function renderOptions($root, items) {
    var $list = findList($root);
    if (!$list.length) return;
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.value) continue;
      html += '<li class="vits-select-option" role="option" tabindex="-1" data-value="' + toStr(it.value).replace(/"/g, '\\"') + '" aria-selected="false">' + toStr(it.text || '') + '</li>';
    }
    $list.html(html);
  }

  // 옵션 주입 후 활성
  function enableWithOptions($root, items) {
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  // 옵션 선택 처리(표시/hidden/a11y 동기화)
  function setSelected($root, $opt) {
    var $list = findList($root);
    $list.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass(CLS_SELECTED, sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });
    $root.find(VALUE).text($opt.text());
    setHiddenVal($root, $opt.attr('data-value') || ''); // [2026-01-30 수정] data-value 없으면 빈 값
  }

  // hidden 값 기준 선택 복원
  function setSelectedByValue($root, value) {
    var v = toStr(value);
    if (!v) return false;
    var $list = findList($root);
    var $match = $list.find(OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]');
    if (!$match.length) return false;
    setSelected($root, $match.eq(0));
    return true;
  }

  // 카테고리 코드로 노드 탐색
  function findNodeByCode(list, code) {
    if (!code) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && toStr(list[i].categoryCode) === toStr(code)) return list[i];
    }
    return null;
  }

  // 노드 children을 options items로 변환
  function mapChildren(node) {
    var out = [];
    var children = node && Array.isArray(node.categoryList) ? node.categoryList : [];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (!c || !c.categoryCode) continue;
      out.push({
        value: c.categoryCode,
        text: c.categoryNm || ''
      });
    }
    return out;
  }

  // 브레드크럼 2/3뎁스 옵션/활성 갱신(그룹 캐시 기반)
  function applyBreadcrumb($changedRoot, changedDepth) {
    var cache = getGroupCache($changedRoot);
    if (!cache) return;
    var $d1 = cache.byDepth[1] || $();
    var $d2 = cache.byDepth[2] || $();
    var $d3 = cache.byDepth[3] || $();
    if (!$d2.length && !$d3.length) return;
    var tree = getTree();
    var d1Val = $d1.length ? getHiddenVal($d1) : '';
    var d1Node = d1Val ? findNodeByCode(tree, d1Val) : null;
    if (!d1Node) {
      if ($d2.length) disableAndClear($d2);
      if ($d3.length) disableAndClear($d3);
      return;
    }
    if ($d2.length) {
      var d2Items = mapChildren(d1Node);
      if (!d2Items.length) {
        disableAsNoOption($d2);
        if ($d3.length) disableAndClear($d3);
        return;
      }
      if (changedDepth === 1) resetToPlaceholder($d2, true);
      enableWithOptions($d2, d2Items);
      if (changedDepth !== 1) setSelectedByValue($d2, getHiddenVal($d2));
      if (!getHiddenVal($d2) && $d3.length) disableAndClear($d3);
    }
    if ($d3.length) {
      var d2Val = $d2.length ? getHiddenVal($d2) : '';
      if (!d2Val) {
        disableAndClear($d3);
        return;
      }
      var d2ListSafe = Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
      var d2Node = findNodeByCode(d2ListSafe, d2Val);
      if (!d2Node) {
        disableAndClear($d3);
        return;
      }
      var d3Items = mapChildren(d2Node);
      if (!d3Items.length) {
        disableAsNoOption($d3);
        return;
      }
      if (changedDepth === 2) resetToPlaceholder($d3, true);
      enableWithOptions($d3, d3Items);
      if (changedDepth !== 2) setSelectedByValue($d3, getHiddenVal($d3));
    }
  }

  // 스코프 컨테이너에서만 타이틀 탐색
  function findTitleInScope(scope) {
    if (!scope || !scope.$container || !scope.$container.length) return $();
    return scope.$container.find(TITLE).first();
  }

  // depth별 마지막 선택값을 타이틀에 반영
  function setTitleFromDepth($title, byDepth) {
    if (!$title || !$title.length) return;
    var $d1 = byDepth[1] || $();
    var $d2 = byDepth[2] || $();
    var $d3 = byDepth[3] || $();
    var $d3Opt = $d3.length ? findList($d3).find(OPT + '.' + CLS_SELECTED).last() : $();
    var $d2Opt = $d2.length ? findList($d2).find(OPT + '.' + CLS_SELECTED).last() : $();
    var $d1Opt = $d1.length ? findList($d1).find(OPT + '.' + CLS_SELECTED).last() : $();
    var $pick = $d3Opt.length ? $d3Opt : $d2Opt.length ? $d2Opt : $d1Opt;
    if ($pick.length) $title.text($pick.text());
  }

  // 동일 스코프 내 group만 사용해 타이틀 갱신
  function updateCategoryTitle($root) {
    if (!$root || !$root.length) return;
    var scope = getScope(getRootScopeKey($root));
    if (!scope) return;
    var $title = findTitleInScope(scope);
    if (!$title.length) return;
    var titleGroup = toStr($title.attr('data-root')).trim();
    var group = titleGroup || getGroup($root);
    if (!group) return;
    var gCache = scope.groups[group];
    if (!gCache) return;
    setTitleFromDepth($title, gCache.byDepth);
  }

  // 스코프 캐시 구축(group 있는 셀렉트만)
  function buildScopeCache(scopeKey, $container) {
    var $rootsAll = $container.find(ROOT);
    var groups = {};
    $rootsAll.each(function () {
      var $r = $(this);
      $r.data(DATA_ROOT_KEY, scopeKey);
      var g = getGroup($r);
      if (!g) return;
      if (!groups[g]) groups[g] = {
        group: g,
        $roots: $(),
        byDepth: {}
      };
      groups[g].$roots = groups[g].$roots.add($r);
    });
    Object.keys(groups).forEach(function (g) {
      var $gRoots = groups[g].$roots;
      groups[g].byDepth[1] = findDepth($gRoots, 1);
      groups[g].byDepth[2] = findDepth($gRoots, 2);
      groups[g].byDepth[3] = findDepth($gRoots, 3);
    });
    scopes[scopeKey] = {
      $container: $container,
      groups: groups,
      openRoot: null
    };
  }

  // 스코프 캐시 제거
  function destroyScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope) return;
    closeOpenedInScope(scopeKey);
    if (scope.$container && scope.$container.length) {
      scope.$container.removeData(DATA_CONTAINER_KEY);
      scope.$container.find(ROOT).each(function () {
        $(this).removeData(DATA_ROOT_KEY);
      });
    }
    delete scopes[scopeKey];
  }

  // 특정 컨테이너 캐시 제거(키 기반)
  function destroy(root) {
    if (!root) return;
    var $container = $(root);
    var scopeKey = getContainerScopeKey($container);
    if (scopeKey == null) return;
    destroyScope(scopeKey);
  }

  // 전체 캐시 제거
  function destroyAll() {
    Object.keys(scopes).forEach(function (k) {
      destroyScope(parseInt(k, 10));
    });
  }

  // 이벤트 바인딩(1회)
  function bind() {
    // 외부 클릭 시 닫기
    $(document).on('mousedown' + NS, function (e) {
      var $target = $(e.target);
      // portal list 클릭도 예외 처리
      if (!$target.closest(ROOT).length && !$target.closest('.' + CLS_PORTAL_LIST).length) {
        closeAllOpened();
      }
    });

    // 트리거 클릭
    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();
      var $root = $(this).closest(ROOT);
      if ($root.hasClass(CLS_DISABLED)) return;
      var scopeKey = getRootScopeKey($root);
      if ($root.hasClass(CLS_OPEN)) {
        closeOpenedInScope(scopeKey);
        return;
      }
      openOne($root);
    });

    // 옵션 클릭 (일반 모드)
    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 옵션 클릭 (portal 모드 - body에 붙은 list)
    $(document).on('click' + NS, '.' + CLS_PORTAL_LIST + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 모든 스크롤 감지 (capture phase)
    document.addEventListener('scroll', function () {
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          // 열린 셀렉트가 특정 영역 안에 있을 때만 닫기
          if (scope.openRoot.closest('.vits-claim-request-body').length) {
            closeOpenedInScope(k);
          } else {
            // 다른 곳은 기존처럼 위치 따라감
            updatePortalPosition(scope.openRoot);
          }
        }
      });
    }, true);

    // 리사이즈
    $(window).on('resize' + NS, function () {
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          updatePortalPosition(scope.openRoot);
        }
      });
    });
  }

  // 옵션 클릭 공통 핸들러
  function handleOptionClick($opt) {
    if ($opt.hasClass(CLS_OPT_DISABLED)) return;

    // portal 모드면 origin에서 root 찾기
    var $list = $opt.closest(LIST);
    var $root = $list.data(DATA_PORTAL_ORIGIN) || $opt.closest(ROOT);
    var depth = getDepth($root);
    var scopeKey = getRootScopeKey($root);
    setSelected($root, $opt);
    closeOpenedInScope(scopeKey);
    var url = toStr($opt.attr('data-url')).trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    var group = getGroup($root);
    if (!group) return;
    applyBreadcrumb($root, depth);
    updateCategoryTitle($root);
  }

  // portal 위치 갱신 (스크롤/리사이즈 대응)
  function updatePortalPosition($root) {
    if (!$root || !$root.length) return;
    var $trigger = $root.find(TRIGGER);
    var $list = $('body').children(LIST).filter(function () {
      var $origin = $(this).data(DATA_PORTAL_ORIGIN);
      return $origin && $origin.is($root);
    });
    if (!$trigger.length || !$list.length) return;
    var rect = $trigger[0].getBoundingClientRect();
    var isDropUp = $root.hasClass(CLS_DROPUP);
    if (isDropUp) {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: '',
        bottom: window.innerHeight - rect.top + PORTAL_GAP + 'px'
      });
    } else {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: rect.bottom + PORTAL_GAP + 'px',
        bottom: ''
      });
    }
  }

  // 스코프 초기화(컨테이너 단위)
  function init(root) {
    var $container = root ? $(root) : $(document);

    // 전역 init은 항상 document 컨테이너로 통일
    if (!root) root = document;

    // 동일 컨테이너 재초기화는 기존 캐시 정리 후 재구축
    destroy(root);

    // 컨테이너 init은 순번 부여(전역도 동일 정책)
    var scopeKey = ++scopeSeq;
    $container = $(root);
    $container.data(DATA_CONTAINER_KEY, scopeKey);
    buildScopeCache(scopeKey, $container);
    $container.find(ROOT).find(TRIGGER).attr('aria-expanded', 'false');
    $container.find(ROOT).each(function () {
      var $r = $(this);
      if ($r.hasClass(CLS_DISABLED)) setDisabled($r, true);
    });
    var scope = getScope(scopeKey);
    if (scope) {
      Object.keys(scope.groups).forEach(function (g) {
        var gCache = scope.groups[g];
        var $d1 = gCache.byDepth[1] || $();
        if ($d1.length) applyBreadcrumb($d1.eq(0), 0);
      });
      var groups = Object.keys(scope.groups);
      if (groups.length) {
        var firstGroup = scope.groups[groups[0]];
        var $d1 = firstGroup && firstGroup.byDepth ? firstGroup.byDepth[1] : $();
        if ($d1 && $d1.length) updateCategoryTitle($d1.eq(0));
      }
    }
  }

  // 외부 init은 여러 번 호출될 수 있으나 이벤트는 1회만 바인딩
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };

  // 캐시 정리 API(동적 렌더링/페이지 전환 대응)
  window.UI.select.destroy = function (root) {
    destroy(root);
  };

  // 전체 캐시 정리 API(테스트/리셋용)
  window.UI.select.destroyAll = function () {
    destroyAll();
  };
})(window.jQuery, window, document);

/***/ }),

/***/ 882:
/***/ (function() {

/**
 * @file scripts/ui/form/input-search.js
 * @purpose input-search 공통: submit 가로채기 + 검색어 정규화 + validation(aria-invalid/메시지) 토글 + submit 훅 제공
 * @scope input-search.ejs 내부 요소만 제어(페이지별 UI 로직은 onSubmit에서 처리)
 *
 * @hook
 *  - form: [data-search-form]
 *  - input: [data-search-input]
 *  - validation: .vits-input-search.vits-validation 내부 .input-validation (hidden 토글)
 *
 * @contract
 *  - init(root?): 문서/루트 스캔 초기화
 *  - init({$form,$input,$validation}, { onSubmit }): 단일 폼 초기화
 *  - onSubmit(query, ctx) 반환값:
 *    - false => invalid 표시(중복 등)
 *    - 그 외 => invalid 해제(정상)
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - 빈 값 submit은 무시(에러 표시 없음)하는 정책을 유지
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.inputSearch = window.UI.inputSearch || {};
  var MODULE_KEY = 'inputSearch';
  var NS = '.' + MODULE_KEY;
  var FORM = '[data-search-form]';
  var INPUT = '[data-search-input]';
  var VALID_WRAP = '.vits-input-search.vits-validation';
  var VALID_MSG = '.input-validation';

  // 문자열 앞뒤 공백 제거
  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  // 연속 공백을 1칸으로 정규화
  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }

  // input 기준으로 validation 메시지 엘리먼트를 찾음
  function findValidation($input) {
    if (!$input || !$input.length) return $();
    var $wrap = $input.closest(VALID_WRAP);
    return $wrap.length ? $wrap.find(VALID_MSG).first() : $();
  }

  // validation UI를 토글(input aria-invalid + 메시지 hidden)
  function setInvalid($input, $validation, on) {
    if ($input && $input.length) $input.attr('aria-invalid', on ? 'true' : null);
    if ($validation && $validation.length) $validation.prop('hidden', !on);
  }

  // 옵션에서 onSubmit 훅을 안전하게 추출
  function getOnSubmit(opt) {
    return opt && typeof opt.onSubmit === 'function' ? opt.onSubmit : null;
  }

  // 입력 중이면 validation을 해제
  function bindClearOnInput($input, $validation) {
    if (!$input || !$input.length) return;
    $input.off('input' + NS).on('input' + NS, function () {
      setInvalid($input, $validation, false);
    });
  }

  // submit 시 query를 정규화하고 onSubmit/이벤트로 전달
  function bindSubmit($form, $input, $validation, opt) {
    if (!$form || !$form.length || !$input || !$input.length) return;
    var onSubmit = getOnSubmit(opt);
    $form.off('submit' + NS).on('submit' + NS, function (e) {
      e.preventDefault();
      var query = normalizeSpaces($input.val());

      // 빈 값은 아무 것도 하지 않음(에러 표시도 하지 않음)
      if (!query) return;
      var ctx = {
        $form: $form,
        $input: $input,
        $validation: $validation
      };
      var ok = true;

      // 페이지 로직에서 false를 반환하면 invalid 처리
      if (onSubmit) ok = onSubmit(query, ctx) !== false;
      setInvalid($input, $validation, !ok);

      // 공통 이벤트(필요 시 다른 레이어에서도 구독 가능)
      $(document).trigger('ui:input-search-submit', {
        query: query,
        form: $form[0],
        input: $input[0]
      });
    });
  }

  // 단일 폼에 필요한 요소를 정규화해 반환($validation은 없으면 자동 탐색)
  function resolveElements(arg) {
    // 단일형: init({$form,$input,$validation}, opt)
    if (arg && arg.$form && arg.$input) {
      return {
        $form: arg.$form,
        $input: arg.$input,
        $validation: arg.$validation && arg.$validation.length ? arg.$validation : findValidation(arg.$input)
      };
    }

    // 내부용(스캔형): initOne($form, opt)
    if (arg && arg.$form && !arg.$input) {
      var $input = arg.$form.find(INPUT).first();
      return {
        $form: arg.$form,
        $input: $input,
        $validation: $input.length ? findValidation($input) : $()
      };
    }
    return null;
  }

  // 폼 1개 단위를 초기화
  function initOne($form, opt) {
    var el = resolveElements({
      $form: $form
    });
    if (!el || !el.$input || !el.$input.length) return;
    setInvalid(el.$input, el.$validation, false);
    bindClearOnInput(el.$input, el.$validation);
    bindSubmit(el.$form, el.$input, el.$validation, opt);
  }

  // root 범위에서 폼들을 스캔해 초기화
  function initAll(root, opt) {
    var $scope = root ? $(root) : $(document);
    $scope.find(FORM).each(function () {
      initOne($(this), opt);
    });
  }

  // 검색어 정규화 결과를 반환
  window.UI.inputSearch.normalize = function (str) {
    return normalizeSpaces(str);
  };

  // 특정 input의 validation을 토글(외부 제어용)
  window.UI.inputSearch.setInvalid = function (arg, on) {
    var $input = arg && arg.$input ? arg.$input : $();
    var $validation = arg && arg.$validation ? arg.$validation : $();
    setInvalid($input, $validation, !!on);
  };

  // init 시그니처를 2가지로 지원(스캔형 / 단일형)
  window.UI.inputSearch.init = function (arg, opt) {
    // 단일형: init({$form,$input,$validation}, { onSubmit })
    var el = resolveElements(arg);
    if (el && el.$form && el.$input && el.$input.length) {
      setInvalid(el.$input, el.$validation, false);
      bindClearOnInput(el.$input, el.$validation);
      bindSubmit(el.$form, el.$input, el.$validation, opt);
      return;
    }

    // 스캔형: init(root) 또는 init()
    initAll(arg, opt);
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 918:
/***/ (function() {

/**
 * scripts/core/utils.js
 * @purpose 공통 유틸 모음(항상 로드)
 * @assumption
 *  - 전역 오염 최소화(필요 시 window.Utils 네임스페이스로만 제공)
 *  - UI 기능이 아닌 "범용/반복 로직"만 둔다
 * @maintenance
 *  - 실행 트리거(DOMReady/이벤트 바인딩) 금지
 *  - 특정 페이지/컴포넌트 전용 로직 금지
 *  - 프로젝트 공통으로 쓰이는 유틸만, 실제 반복이 확인될 때만 추가한다
 */

(function (window, document) {
  'use strict';

  // 모바일 환경 100vh 보정용 --vh CSS 변수 계산
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh);

  // 초기 로딩 transition 방지
  document.body.classList.add('is-loading');
  requestAnimationFrame(function () {
    document.body.classList.remove('is-loading');
  });
})(window, document);

/***/ }),

/***/ 952:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-range-picker.js
 * @description
 * Kendo Calendar 기반 단일 달력 Range Picker 자동 초기화 모듈.
 */

(function (window) {
  'use strict';

  // ============================================
  // 유틸리티 함수
  // ============================================
  function parseJsonSafe(str) {
    if (!str) return null;
    var decoded = str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try {
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoCalendar);
  }
  function parseDateValue(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    try {
      return new Date(val);
    } catch {
      return null;
    }
  }
  function formatDate(date, format) {
    if (!date) return '';
    if (window.kendo && window.kendo.toString) {
      return window.kendo.toString(date, format);
    }
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  // 2026-01-30 isSameDate 함수 삭제

  function applyVitsClassToWrapper($wrap, $popup) {
    if (!$wrap || !$wrap.length) return;
    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);
    if ($popup && $popup.length) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) {
          $popup.addClass(classList[i]);
        }
      }
    }
  }

  // ============================================
  // Range Picker 초기화
  // ============================================
  function initRangePicker(el) {
    var $ = window.jQuery;
    var $el = $(el);
    if ($el.data('vitsKendoRangePicker')) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    opts.format = opts.format || 'yyyy.MM.dd';
    opts.separator = opts.separator || ' ~ ';
    opts.placeholder = opts.placeholder || '시작일 ~ 종료일';
    if (opts.min) opts.min = parseDateValue(opts.min);
    if (opts.max) opts.max = parseDateValue(opts.max);
    var $wrap = $el;
    var $display = $wrap.find('.js-range-display');
    var $popup = $wrap.find('.js-calendar-popup');
    var $toggle = $wrap.find('.js-calendar-toggle');
    var $calendarWrap = $wrap.find('.js-kendo-calendar');
    var $startInput = $wrap.find('.js-start-date');
    var $endInput = $wrap.find('.js-end-date');
    var state = {
      startDate: null,
      endDate: null,
      isSelectingEnd: false,
      isOpen: false
    };
    var isHighlighting = false; // 2026-01-30 추가

    var startVal = $startInput.val();
    var endVal = $endInput.val();
    if (startVal) state.startDate = parseDateValue(startVal);
    if (endVal) state.endDate = parseDateValue(endVal);
    var calendarOpts = {
      change: onCalendarChange,
      navigate: onCalendarNavigate,
      culture: 'en-US',
      animation: false,
      footer: false,
      month: {
        header: '#= kendo.toString(data.date, "yyyy.MM") #'
      },
      start: 'month',
      depth: 'month'
    };
    if (opts.min) calendarOpts.min = opts.min;
    if (opts.max) calendarOpts.max = opts.max;
    $calendarWrap.kendoCalendar(calendarOpts);
    var calendar = $calendarWrap.data('kendoCalendar');
    var navTitleScheduled = false;
    var dayNameScheduled = false;
    var monthNameScheduled = false;
    function scheduleNavTitle() {
      if (navTitleScheduled) return;
      navTitleScheduled = true;
      window.requestAnimationFrame(function () {
        navTitleScheduled = false;
        updateNavTitle();
      });
    }
    function scheduleDayNames() {
      if (dayNameScheduled) return;
      dayNameScheduled = true;
      window.requestAnimationFrame(function () {
        dayNameScheduled = false;
        updateDayNames();
      });
    }
    function forceUpdateUI() {
      scheduleNavTitle();
      scheduleDayNames();
      scheduleMonthNames();
      window.setTimeout(function () {
        scheduleNavTitle();
        scheduleDayNames();
        scheduleMonthNames();
      }, 0);
    }
    function updateNavTitle() {
      var currentDate = calendar.current();
      var year = currentDate.getFullYear();
      var month = String(currentDate.getMonth() + 1).padStart(2, '0');
      var title = year + '<span class="nav-dot">.</span>' + month;
      $calendarWrap.find('.k-button-text').html(title);
    }

    // 월 영문 -> 숫자로 표시
    function updateMonthNames() {
      $calendarWrap.find('.k-calendar-view td .k-link').each(function () {
        var $link = $(this);
        var text = $link.text().trim();
        var monthMap = {
          Jan: '1월',
          Feb: '2월',
          Mar: '3월',
          Apr: '4월',
          May: '5월',
          Jun: '6월',
          Jul: '7월',
          Aug: '8월',
          Sep: '9월',
          Oct: '10월',
          Nov: '11월',
          Dec: '12월'
        };
        if (monthMap[text]) {
          $link.text(monthMap[text]);
        }
      });
    }
    function scheduleMonthNames() {
      if (monthNameScheduled) return;
      monthNameScheduled = true;
      window.requestAnimationFrame(function () {
        monthNameScheduled = false;
        updateMonthNames();
      });
    }

    // 영문 요일 표시
    function updateDayNames() {
      var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      $calendarWrap.find('th').each(function (index) {
        var $th = $(this);
        if ($th.text().trim().length <= 3) {
          $th.text(dayNames[index]);
        }
      });
    }
    var isUpdatingUI = false; // 2026-01-30 추가

    // 2026-01-30 var uiObserver 수정
    var uiObserver = new MutationObserver(function () {
      if (isHighlighting || isUpdatingUI) return;
      isUpdatingUI = true;
      uiObserver.disconnect();

      // schedule 함수 대신 직접 호출
      updateNavTitle();
      updateDayNames();
      updateMonthNames();
      highlightRange();
      window.setTimeout(function () {
        uiObserver.observe($calendarWrap[0], {
          childList: true,
          subtree: true,
          characterData: true
        });
        isUpdatingUI = false;
      }, 50);
    });
    uiObserver.observe($calendarWrap[0], {
      childList: true,
      subtree: true,
      characterData: true
    });

    // ============================================
    // 상태 클래스 관리
    // ============================================

    // 2026-02-03 추가 - 범위 선택 완료 시 래퍼에 is-selected 클래스 토글
    function updateSelectedState() {
      $wrap.toggleClass('is-selected', !!(state.startDate && state.endDate));
    }

    // ============================================
    // 이벤트 핸들러
    // ============================================

    function onCalendarChange() {
      var selectedDate = calendar.value();
      if (!state.isSelectingEnd) {
        state.startDate = selectedDate;
        state.endDate = null;
        state.isSelectingEnd = true;
      } else {
        if (selectedDate < state.startDate) {
          state.endDate = state.startDate;
          state.startDate = selectedDate;
        } else {
          state.endDate = selectedDate;
        }
        state.isSelectingEnd = false;
        closePopup();
        $el.trigger('rangepicker:change', [getPublicValue()]);
      }
      updateDisplay();
      updateHiddenInputs();
      highlightRange();
      updateSelectedState(); // 2026-02-03 추가
    }
    function onCalendarNavigate() {
      forceUpdateUI();
      window.setTimeout(function () {
        highlightRange();
        updateNavTitle();
        updateDayNames();
      }, 10);
    }
    function highlightRange() {
      isHighlighting = true; // 2026-01-30 추가

      var $cells = $calendarWrap.find('td');
      $cells.removeClass('k-range-start k-range-end k-range-mid');
      if (state.startDate && state.endDate) {
        $calendarWrap.addClass('has-range');
      } else {
        $calendarWrap.removeClass('has-range');
      }

      // 2026-01-30 수정
      if (!state.startDate) {
        isHighlighting = false;
        return;
      }

      // 2026-01-30 추가 - 시간 제거한 순수 날짜로 비교
      var startTime = new Date(state.startDate.getFullYear(), state.startDate.getMonth(), state.startDate.getDate()).getTime();
      var endTime = state.endDate ? new Date(state.endDate.getFullYear(), state.endDate.getMonth(), state.endDate.getDate()).getTime() : null;
      $cells.each(function () {
        var $cell = $(this);
        var $link = $cell.find('.k-link');
        var dateValue = $link.attr('data-value');
        if (!dateValue) return;
        var parts = dateValue.split('/');
        var cellDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
        var cellTime = cellDate.getTime(); // 2026-01-30 추가

        var isStart = cellTime === startTime; // 2026-01-30 수정
        var isEnd = endTime && cellTime === endTime; // 2026-01-30 수정
        var isInRange = endTime && cellTime > startTime && cellTime < endTime; // 2026-01-30 수정

        if (isStart) $cell.addClass('k-range-start');
        if (isEnd) $cell.addClass('k-range-end');
        if (isInRange) $cell.addClass('k-range-mid');
      });
      isHighlighting = false; // 2026-01-30 추가
    }
    function updateDisplay() {
      var value = '';
      if (state.startDate && state.endDate) {
        value = formatDate(state.startDate, opts.format) + opts.separator + formatDate(state.endDate, opts.format);
      } else if (state.startDate) {
        value = formatDate(state.startDate, opts.format) + opts.separator;
      }
      $display.val(value);
    }
    function updateHiddenInputs() {
      $startInput.val(state.startDate ? formatDate(state.startDate, opts.format) : '');
      $endInput.val(state.endDate ? formatDate(state.endDate, opts.format) : '');
    }
    function openPopup() {
      if ($wrap.hasClass('is-disabled')) return;
      $popup.addClass('is-open');
      state.isOpen = true;
      highlightRange();
      applyVitsClassToWrapper($wrap, $popup);
      $el.trigger('rangepicker:open');
    }
    function closePopup() {
      $popup.removeClass('is-open');
      state.isOpen = false;
      $el.trigger('rangepicker:close');
    }
    function togglePopup() {
      if (state.isOpen) {
        closePopup();
      } else {
        openPopup();
      }
    }
    function getPublicValue() {
      return {
        start: state.startDate,
        end: state.endDate,
        startStr: $startInput.val(),
        endStr: $endInput.val()
      };
    }

    // ============================================
    // 이벤트 바인딩
    // ============================================

    $display.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
      togglePopup();
    });
    $toggle.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
      togglePopup();
    });
    $popup.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
    });
    $(document).on('click.vitsRangePicker_' + $el.attr('id'), function () {
      if (!state.isSelectingEnd) {
        closePopup();
      }
    });
    $(document).on('keydown.vitsRangePicker_' + $el.attr('id'), function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closePopup();
      }
    });

    // ============================================
    // Public API
    // ============================================
    var instance = {
      getValue: getPublicValue,
      setValue: function (start, end) {
        state.startDate = start ? parseDateValue(start) : null;
        state.endDate = end ? parseDateValue(end) : null;
        state.isSelectingEnd = false;
        updateDisplay();
        updateHiddenInputs();
        highlightRange();
        updateSelectedState(); // 2026-02-03 추가

        if (calendar && state.startDate) {
          calendar.navigate(state.startDate);
        }
        $el.trigger('rangepicker:change', [getPublicValue()]);
      },
      reset: function () {
        state.startDate = null;
        state.endDate = null;
        state.isSelectingEnd = false;
        $display.val('');
        $startInput.val('');
        $endInput.val('');
        if (calendar) {
          calendar.value(null);
        }
        highlightRange();
        updateSelectedState(); // 2026-02-03 추가
        $el.trigger('rangepicker:reset');
      },
      open: openPopup,
      close: closePopup,
      toggle: togglePopup,
      disable: function () {
        $wrap.addClass('is-disabled');
        $display.prop('disabled', true);
        $toggle.prop('disabled', true);
        closePopup();
      },
      enable: function () {
        $wrap.removeClass('is-disabled');
        $display.prop('disabled', false);
        $toggle.prop('disabled', false);
      },
      destroy: function () {
        var id = $el.attr('id') || '';
        $(document).off('.vitsRangePicker_' + id);
        $display.off('.vitsRangePicker');
        $toggle.off('.vitsRangePicker');
        $popup.off('.vitsRangePicker');
        if (calendar) {
          calendar.destroy();
        }
        $el.removeData('vitsKendoRangePicker');
      }
    };
    $el.data('vitsKendoRangePicker', instance);
    updateDisplay();
    highlightRange();
    updateSelectedState(); // 2026-02-03 추가 - 초기값이 있을 경우 대응

    console.log('[kendo-range-picker] initialized:', $el.attr('id') || 'anonymous');
  }

  // ============================================
  // 초기화 함수들
  // ============================================

  function initOne(el) {
    var $el = window.jQuery(el);
    var uiType = $el.attr('data-ui');
    if (uiType === 'kendo-range-picker') {
      initRangePicker(el);
    }
  }
  function initAll(root) {
    if (!ensureKendoAvailable()) {
      console.warn('[kendo-range-picker] Kendo UI not available');
      return;
    }
    var $root = root ? window.jQuery(root) : window.jQuery(document);
    $root.find('[data-ui="kendo-range-picker"]').each(function () {
      initOne(this);
    });
  }
  function autoBindStart(container) {
    if (!window.MutationObserver) return null;
    var target = container || document.body;
    initAll(target);
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (!node || node.nodeType !== 1) continue;
          initAll(node);
        }
      }
    });
    obs.observe(target, {
      childList: true,
      subtree: true
    });
    return obs;
  }
  function getInstance(selector) {
    var $el = window.jQuery(selector);
    return $el.data('vitsKendoRangePicker') || null;
  }

  // ============================================
  // 전역 API 노출
  // ============================================
  window.VitsKendoRangePicker = {
    initAll: initAll,
    initOne: initOne,
    autoBindStart: autoBindStart,
    getInstance: getInstance
  };

  // ============================================
  // DOM Ready 시 자동 초기화
  // ============================================
  if (window.jQuery) {
    window.jQuery(function () {
      autoBindStart();
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.jQuery) {
        autoBindStart();
      }
    });
  }
  console.log('[kendo-range-picker] loaded');
})(window);

/***/ }),

/***/ 978:
/***/ (function() {

/**
 * @file scripts/ui/header/header-search.js
 * @purpose 헤더 검색 패널 UI (최근검색어 + 연관검색어 + 상품패널)
 * @description
 *  - 스코프: [data-header-search] 내부에서만 동작
 *  - 패널: 인풋 포커스/입력 시 열림, ESC/외부클릭 시 닫힘
 *  - 연관검색어 hover → 상품패널 노출 (200ms 딜레이로 숨김)
 * @markup_contract
 *  - 인풋: [data-search-input] + [data-search-clear]
 *  - 패널: [data-search-panel]
 *  - 최근검색어: [data-recent-wrap] > [data-recent-list] > li[data-recent-item]
 *  - 연관검색어: [data-related-wrap] > [data-related-list] > li[data-related-item="key"] > a.search-related-item
 *  - 상품패널: [data-products-wrap] > [data-products-panel="key"] (key로 매핑)
 * @state_classes
 *  - is-open: 패널 열림
 *  - is-active: 연관검색어/상품패널 활성
 *  - is-visible: 삭제버튼 표시
 *  - is-hidden: 전체삭제 숨김
 * @requires jQuery
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.warn('[headerSearch] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var MODULE_KEY = 'headerSearch';
  var SCOPE_SEL = '[data-header-search]';
  var CONFIG = {
    PRODUCTS_TOP_GAP: 100,
    HIDE_DELAY: 200,
    RESIZE_DEBOUNCE: 150,
    VIEWPORT_MARGIN: 10
  };
  var KEY = {
    ESC: 27
  };
  var DUMMY_HREFS = ['', '#', '#!'];
  var CLS = {
    OPEN: 'is-open',
    ACTIVE: 'is-active',
    VISIBLE: 'is-visible',
    HIDDEN: 'is-hidden'
  };
  var SEL = {
    INPUT: '[data-search-input]',
    CLEAR_BTN: '[data-search-clear]',
    PANEL: '[data-search-panel]',
    RECENT_WRAP: '[data-recent-wrap]',
    RECENT_LIST: '[data-recent-list]',
    RECENT_ITEM: '[data-recent-item]',
    RECENT_DEL: '[data-recent-del]',
    RECENT_CLEAR: '[data-recent-clear]',
    RELATED_WRAP: '[data-related-wrap]',
    RELATED_LIST: '[data-related-list]',
    RELATED_ITEM: '[data-related-item]',
    RELATED_LINK: '[data-related-item] > a.search-related-item',
    PRODUCTS_WRAP: '[data-products-wrap]',
    PRODUCTS_PANEL: '[data-products-panel]',
    PRODUCTS_TITLE: '[data-products-title]'
  };

  // 고유 ID 생성
  function generateId() {
    return '_' + Math.random().toString(36).slice(2, 11);
  }

  // 셀렉터 이스케이프 (XSS 방지)
  var escapeSelector = $.escapeSelector || function (str) {
    return String(str).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  };

  // state 조회/저장
  function getState($scope) {
    return $scope.data(MODULE_KEY) || {};
  }
  function setState($scope, state) {
    $scope.data(MODULE_KEY, state);
  }

  // DOM 캐싱 조회
  function getEls($scope) {
    var state = getState($scope);
    if (state.$els) return state.$els;
    state.$els = {
      $input: $scope.find(SEL.INPUT).first(),
      $clearBtn: $scope.find(SEL.CLEAR_BTN).first(),
      $panel: $scope.find(SEL.PANEL).first(),
      $recentWrap: $scope.find(SEL.RECENT_WRAP).first(),
      $recentList: $scope.find(SEL.RECENT_LIST).first(),
      $relatedWrap: $scope.find(SEL.RELATED_WRAP).first(),
      $relatedList: $scope.find(SEL.RELATED_LIST).first(),
      $productsWrap: $scope.find(SEL.PRODUCTS_WRAP).first()
    };
    return state.$els;
  }

  // 인풋 값 조회
  function getInputValue($scope) {
    return String(getEls($scope).$input.val() || '').trim();
  }

  // 타이머/rAF 취소
  function cancelRaf(state) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }
  function cancelHideTimer(state) {
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
      state.hideTimer = null;
    }
  }

  // 상품패널 타이머 정리
  function cleanupProductsTimers(state) {
    cancelHideTimer(state);
    cancelRaf(state);
  }

  // 전체 타이머 정리 (destroy용)
  function cleanupAllTimers(state) {
    cleanupProductsTimers(state);
    if (state.resizeTimer) {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
  }

  // 패널 열기/닫기
  function openPanel($scope) {
    var state = getState($scope);
    if (state.isOpen) return;
    var els = getEls($scope);
    if (!els.$panel.length) return;
    els.$panel.addClass(CLS.OPEN);
    els.$input.attr('aria-expanded', 'true');
    state.isOpen = true;
    setState($scope, state);
  }
  function closePanel($scope, opts) {
    opts = opts || {};
    var state = getState($scope);
    if (!state.isOpen) return;
    var els = getEls($scope);
    els.$panel.removeClass(CLS.OPEN);
    els.$input.attr('aria-expanded', 'false');
    state.isOpen = false;
    setState($scope, state);
    if (!opts.skipProducts) resetProducts($scope);
  }

  // 삭제버튼 동기화
  function syncClearBtn($scope) {
    var $clearBtn = getEls($scope).$clearBtn;
    if ($clearBtn.length) {
      $clearBtn.toggleClass(CLS.VISIBLE, getInputValue($scope).length > 0);
    }
  }

  // 최근검색어 전체삭제 버튼 동기화
  function syncRecentClearBtn($scope) {
    var $recentWrap = getEls($scope).$recentWrap;
    if (!$recentWrap.length) return;
    var $clearBtn = $recentWrap.find(SEL.RECENT_CLEAR);
    if ($clearBtn.length) {
      $clearBtn.toggleClass(CLS.HIDDEN, !$recentWrap.find(SEL.RECENT_ITEM).length);
    }
  }

  // 최근검색어 삭제 핸들러
  function handleRecentDelClick($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    $(e.currentTarget).closest(SEL.RECENT_ITEM).remove();
    syncRecentClearBtn($scope);
  }
  function handleRecentClearAll($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    var $recentList = getEls($scope).$recentList;
    if ($recentList.length) $recentList.empty();
    syncRecentClearBtn($scope);
  }

  // 상품패널 노출 (rAF로 위치 계산)
  function showProducts($scope, key, opts) {
    if (!key) return;
    opts = opts || {};
    var els = getEls($scope);
    var $productsWrap = els.$productsWrap;
    if (!$productsWrap.length) return;
    var $targetPanel = $productsWrap.find('[data-products-panel="' + escapeSelector(key) + '"]').first();
    if (!$targetPanel.length) return;
    var state = getState($scope);
    if (opts.fromResize) {
      state.resizeTimer = null;
      state.baseLeft = null;
    }
    cancelRaf(state);
    var mySeq = (state.showSeq || 0) + 1;
    state.showSeq = mySeq;
    $productsWrap.css({
      top: '',
      left: ''
    }).addClass(CLS.ACTIVE);

    // 타이틀: 마지막 카테고리명만
    var $title = $productsWrap.find(SEL.PRODUCTS_TITLE);
    if ($title.length) {
      var category = String($targetPanel.data('products-category') || '');
      $title.text(category.split(' > ').pop().trim());
    }

    // rAF: 위치 계산 + 뷰포트 오버플로우 보정
    state.rafId = requestAnimationFrame(function () {
      var s = getState($scope);
      if (!s.bound || s.showSeq !== mySeq) return;
      s.rafId = null;

      // baseLeft 캐싱 (최초 1회)
      if (typeof s.baseLeft !== 'number') {
        var posLeft = $productsWrap.position().left;
        s.baseLeft = typeof posLeft === 'number' && !isNaN(posLeft) ? posLeft : 0;
      }

      // top 위치 계산
      var $relatedWrap = els.$relatedWrap;
      var $panel = els.$panel;
      if ($relatedWrap.length && $panel.length) {
        var panelOffset = $panel.offset();
        var wrapOffset = $relatedWrap.offset();
        if (panelOffset && wrapOffset) {
          var gap = parseInt($productsWrap.data('products-gap'), 10) || CONFIG.PRODUCTS_TOP_GAP;
          $productsWrap.css('top', wrapOffset.top - panelOffset.top - gap + 'px');
        }
      }

      // 뷰포트 오른쪽 오버플로우 보정
      var productsOffset = $productsWrap.offset();
      var productsWidth = $productsWrap.outerWidth();
      var viewportWidth = $(window).width();
      if (productsOffset && productsWidth) {
        var rightEdge = productsOffset.left + productsWidth;
        if (rightEdge > viewportWidth) {
          var overflow = rightEdge - viewportWidth + CONFIG.VIEWPORT_MARGIN;
          $productsWrap.css('left', s.baseLeft - overflow + 'px');
        }
      }
      $productsWrap.find(SEL.PRODUCTS_PANEL).removeClass(CLS.ACTIVE);
      $targetPanel.addClass(CLS.ACTIVE);
      setState($scope, s);
    });
    setState($scope, state);
  }

  // 상품패널 UI 초기화
  function resetProductsUI($scope) {
    var els = getEls($scope);
    if (els.$productsWrap.length) {
      els.$productsWrap.removeClass(CLS.ACTIVE).css({
        top: '',
        left: ''
      });
      els.$productsWrap.find(SEL.PRODUCTS_PANEL).removeClass(CLS.ACTIVE);
    }
    if (els.$relatedList.length) {
      els.$relatedList.find(SEL.RELATED_ITEM).removeClass(CLS.ACTIVE);
    }
  }

  // 상품패널 초기화 (state + UI)
  function resetProducts($scope) {
    var state = getState($scope);
    cleanupProductsTimers(state);
    state.showSeq = (state.showSeq || 0) + 1;
    setState($scope, state);
    resetProductsUI($scope);
  }

  // 상품패널 숨김 예약/취소
  function scheduleProductsHide($scope) {
    var state = getState($scope);
    cancelHideTimer(state);
    state.hideTimer = setTimeout(function () {
      resetProducts($scope);
    }, CONFIG.HIDE_DELAY);
    setState($scope, state);
  }
  function cancelProductsHide($scope) {
    var state = getState($scope);
    if (!state.hideTimer) return;
    cancelHideTimer(state);
    setState($scope, state);
  }

  // 연관검색어 hover 핸들러
  function handleRelatedEnter($scope, e) {
    cancelProductsHide($scope);
    var $item = $(e.currentTarget);
    var key = $item.attr('data-related-item');
    if (!key) return;
    var $relatedList = getEls($scope).$relatedList;
    if ($relatedList.length) $relatedList.find(SEL.RELATED_ITEM).removeClass(CLS.ACTIVE);
    $item.addClass(CLS.ACTIVE);
    showProducts($scope, key);
  }

  // 연관검색어 leave (li 내부/상품패널 이동은 무시)
  function handleRelatedLeave($scope, e) {
    var toElement = e.relatedTarget || e.toElement;
    if (toElement && $(toElement).closest(SEL.RELATED_ITEM)[0] === e.currentTarget) return;
    var $productsWrap = getEls($scope).$productsWrap;
    if (toElement && $productsWrap.length && $(toElement).closest($productsWrap).length) return;
    scheduleProductsHide($scope);
  }

  // 연관검색어 클릭 (a 기본동작 허용)
  function handleRelatedClick($scope, e) {
    var href = String($(e.currentTarget).attr('href') || '').trim();
    if (DUMMY_HREFS.indexOf(href) > -1) e.preventDefault();
    closePanel($scope);
  }

  // 상품패널 leave
  function handleProductsLeave($scope, e) {
    var toElement = e.relatedTarget || e.toElement;
    if (toElement && $(toElement).closest(SEL.RELATED_ITEM).length) return;
    scheduleProductsHide($scope);
  }

  // 인풋 핸들러
  function handleInput($scope) {
    syncClearBtn($scope);
    if (getInputValue($scope).length > 0) {
      openPanel($scope);
    } else {
      closePanel($scope);
    }
  }
  function handleClearClick($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    getEls($scope).$input.val('').trigger('focus');
    syncClearBtn($scope);
    closePanel($scope);
  }
  function handleFormSubmit($scope, e) {
    e.preventDefault();
    closePanel($scope);
    var els = getEls($scope);
    els.$input.trigger('blur');
    if (els.$clearBtn.length) els.$clearBtn.removeClass(CLS.VISIBLE);
  }

  // 외부클릭/ESC 핸들러
  function handleOutsideClick($scope, e) {
    var state = getState($scope);
    if (!state.isOpen) return;
    if ($(e.target).closest($scope[0]).length) return;
    closePanel($scope);
  }
  function handleKeydown($scope, e) {
    var state = getState($scope);
    if (!state.isOpen) return;
    if (e.keyCode === KEY.ESC) {
      e.preventDefault();
      closePanel($scope);
      getEls($scope).$input.trigger('blur');
    }
  }

  // 이벤트 바인딩
  function bindScope($scope) {
    var ns = '.' + MODULE_KEY;
    var state = getState($scope);
    if (state.bound) return;
    if (!state.id) state.id = generateId();
    var els = getEls($scope);
    if (!els.$input.length || !els.$panel.length) return;
    setState($scope, state);

    // 인풋
    els.$input.on('input' + ns, function () {
      handleInput($scope);
    });
    els.$input.on('focus' + ns, function () {
      if (getInputValue($scope).length > 0) {
        syncClearBtn($scope);
        openPanel($scope);
      }
    });

    // 삭제버튼
    if (els.$clearBtn.length) {
      els.$clearBtn.on('click' + ns, function (e) {
        handleClearClick($scope, e);
      });
    }

    // 폼
    $scope.on('submit' + ns, function (e) {
      handleFormSubmit($scope, e);
    });

    // 최근검색어 (위임)
    if (els.$recentWrap.length) {
      $scope.on('click' + ns, SEL.RECENT_DEL, function (e) {
        handleRecentDelClick($scope, e);
      });
      $scope.on('click' + ns, SEL.RECENT_CLEAR, function (e) {
        handleRecentClearAll($scope, e);
      });
    }

    // 연관검색어 (위임)
    if (els.$relatedList.length) {
      $scope.on('mouseenter' + ns, SEL.RELATED_ITEM, function (e) {
        handleRelatedEnter($scope, e);
      });
      $scope.on('mouseleave' + ns, SEL.RELATED_ITEM, function (e) {
        handleRelatedLeave($scope, e);
      });
      $scope.on('click' + ns, SEL.RELATED_LINK, function (e) {
        handleRelatedClick($scope, e);
      });
    }

    // 상품패널 (직접)
    if (els.$productsWrap.length) {
      els.$productsWrap.on('mouseenter' + ns, function () {
        cancelProductsHide($scope);
      });
      els.$productsWrap.on('mouseleave' + ns, function (e) {
        handleProductsLeave($scope, e);
      });
    }

    // document 이벤트
    var docNs = ns + state.id;
    $(document).on('click' + docNs, function (e) {
      handleOutsideClick($scope, e);
    });
    $(document).on('keydown' + docNs, function (e) {
      handleKeydown($scope, e);
    });

    // 리사이즈 (디바운스)
    $(window).on('resize' + docNs, function () {
      var state = getState($scope);
      if (state.resizeTimer) clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(function () {
        var s = getState($scope);
        if (s.isOpen && els.$productsWrap.hasClass(CLS.ACTIVE)) {
          var $activeItem = els.$relatedList.find(SEL.RELATED_ITEM + '.' + CLS.ACTIVE);
          var activeKey = $activeItem.attr('data-related-item');
          if (activeKey) {
            showProducts($scope, activeKey, {
              fromResize: true
            });
            return;
          }
        }
        s.resizeTimer = null;
        setState($scope, s);
      }, CONFIG.RESIZE_DEBOUNCE);
      setState($scope, state);
    });

    // 초기 동기화
    syncClearBtn($scope);
    if (els.$recentWrap.length) syncRecentClearBtn($scope);
    state.bound = true;
    state.docNs = docNs;
    state.resizeTimer = null;
    setState($scope, state);
  }

  // 이벤트 해제
  function unbindScope($scope) {
    var ns = '.' + MODULE_KEY;
    var state = getState($scope);
    cleanupAllTimers(state);
    var els = getEls($scope);
    els.$input.off(ns);
    els.$clearBtn.off(ns);
    $scope.off(ns);
    if (els.$productsWrap.length) els.$productsWrap.off(ns);
    if (state.docNs) {
      $(document).off(state.docNs);
      $(window).off(state.docNs);
    }
    els.$panel.removeClass(CLS.OPEN);
    resetProductsUI($scope);
    $scope.removeData(MODULE_KEY);
  }

  // Public API
  window.UI.headerSearch = {
    init: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        var $scope = $(this);
        var prev = getState($scope);
        if (prev.bound) unbindScope($scope);
        setState($scope, {
          id: generateId(),
          isOpen: false,
          hideTimer: null,
          resizeTimer: null,
          rafId: null,
          showSeq: 0,
          baseLeft: null,
          bound: false,
          docNs: null,
          $els: null
        });
        bindScope($scope);
      });
    },
    destroy: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        unbindScope($(this));
      });
    },
    refresh: function (root) {
      this.destroy(root);
      this.init(root);
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 986:
/***/ (function() {

/**
 * @file scripts/ui/product/tab-scrollbar.js
 * @purpose 탭 고정(top 100) + 클릭이동(가려짐 없음) + active 동기화
 * @description
 *  - 클릭 시 섹션 타이틀이 탭 바로 아래로 오도록 이동
 *  - 스크롤 시 baseline(탭 바로 아래) 기준으로 active 동기화
 * @requires jQuery
 * @markup-control
 *  - #tabNav: 탭 네비게이션
 *  - #tabBar: 활성 탭 인디케이터
 *  - .tabBtn[data-target]: 탭 버튼 (data-target에 섹션 id)
 *  - .section[id]: 섹션 요소
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[tab-scrollbar] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  function initTabScrollbar() {
    var $tabWrap = $('.tab-wrap');
    var $tabShowPrice = $tabWrap.find('.tab-show-price');
    var $tabNav = $('#tab-nav');
    var $tabBar = $('#tab-Bar');
    var $tabBtns = $tabNav.find('.tab-btn[data-target]');
    var $sections = $('.tab-section[id]');
    // 다른 규격찾기 모달 열릴때 body 스크롤 class 추가
    var $body = $('body');
    var $optionModal = $('#findOtherOptionModal');
    var OPTION_MODAL_BODY_OPEN_CLASS = 'is-option-modal-open';
    var OPTION_MODAL_BODY_HIDE_CLASS = 'is-option-modal-hide';
    var optionModalInitTimer = null;
    var optionModalOpenWrapped = false;
    function getScrollTop() {
      return $(window).scrollTop();
    }
    function getViewportHeight() {
      return window.innerHeight;
    }
    function getScrollHeight() {
      return document.documentElement.scrollHeight;
    }
    function getTabWrapHeight() {
      return $tabWrap.outerHeight();
    }
    function getElementTop($el) {
      return $el.offset().top;
    }
    function isTabWrapAtTop() {
      if (!$tabWrap.length) {
        return false;
      }
      var wrapRect = $tabWrap[0].getBoundingClientRect();
      return wrapRect.top <= 0.5;
    }
    function updateShowPrice() {
      var shouldOpen = isTabWrapAtTop();
      $tabShowPrice.toggleClass('is-open', shouldOpen);
    }
    function updateTabBar($activeBtn) {
      if (!$tabBar.length || !$activeBtn || !$activeBtn.length) {
        return;
      }
      var left = $activeBtn.position().left;
      $tabBar.css({
        width: $activeBtn.outerWidth(),
        transform: 'translateX(' + left + 'px)'
      });
    }
    function setActiveById(targetId) {
      if (!targetId) {
        return;
      }
      var $targetBtn = $tabBtns.filter('[data-target="' + targetId + '"]');
      if (!$targetBtn.length) {
        return;
      }
      $tabBtns.removeClass('is-active');
      $targetBtn.addClass('is-active');
      updateTabBar($targetBtn);
    }
    function getCurrentSectionId() {
      var baseline = getScrollTop() + getTabWrapHeight();
      var currentId = $sections.first().attr('id');
      $sections.each(function () {
        var $section = $(this);
        if (getElementTop($section) <= baseline + 1) {
          currentId = $section.attr('id');
        }
      });
      return currentId;
    }
    function isAtBottom() {
      return getScrollTop() + getViewportHeight() >= getScrollHeight() - 2;
    }
    function updateActiveOnScroll() {
      if (!$sections.length) {
        return;
      }
      var targetId = isAtBottom() ? $sections.last().attr('id') : getCurrentSectionId();
      setActiveById(targetId);
    }
    function scrollToSection($target) {
      var targetTop = getElementTop($target) - getTabWrapHeight();
      if (targetTop < 0) {
        targetTop = 0;
      }
      var scrollDuration = 0; // 애니메이션 필요 시 250 등으로 조정
      $('html, body').stop().animate({
        scrollTop: targetTop
      }, scrollDuration);
    }

    // 다른 규격찾기 모달 열릴때 body 스크롤 class 추가
    function updateOptionModalBodyClass(isOpen) {
      if (!$optionModal.length) {
        return;
      }
      $body.toggleClass(OPTION_MODAL_BODY_OPEN_CLASS, !!isOpen);
      $body.toggleClass(OPTION_MODAL_BODY_HIDE_CLASS, false);
    }
    function bindOptionModalEvents() {
      var inst = $optionModal.data('kendoWindow');
      if (!inst) {
        return false;
      }
      inst.unbind('open.optionModalToggle');
      inst.unbind('close.optionModalToggle');
      inst.bind('open.optionModalToggle', function () {
        updateOptionModalBodyClass(true);
      });
      inst.bind('close.optionModalToggle', function () {
        updateOptionModalBodyClass(false);
      });
      if (!inst._optionModalCloseWrapped) {
        inst._optionModalCloseWrapped = true;
        var originalClose = inst.close;
        inst.close = function () {
          updateOptionModalBodyClass(false);
          return originalClose.call(inst);
        };
      }
      return true;
    }
    function ensureOptionModalOpenHook() {
      if (!window.VitsKendoWindow || optionModalOpenWrapped) {
        return;
      }
      optionModalOpenWrapped = true;
      var originalOpen = window.VitsKendoWindow.open;
      var originalClose = window.VitsKendoWindow.close;
      window.VitsKendoWindow.open = function (id, options) {
        if (id === 'findOtherOptionModal') {
          updateOptionModalBodyClass(true);
        }
        return originalOpen.call(window.VitsKendoWindow, id, options);
      };
      window.VitsKendoWindow.close = function (id) {
        if (id === 'findOtherOptionModal') {
          updateOptionModalBodyClass(false);
        }
        return originalClose.call(window.VitsKendoWindow, id);
      };
    }
    function initOptionModalBodyClass() {
      if (!$optionModal.length) {
        return;
      }
      if (window.VitsKendoWindow && !$optionModal.data('kendoWindow')) {
        window.VitsKendoWindow.initAll(document);
      }
      ensureOptionModalOpenHook();
      if (bindOptionModalEvents()) {
        return;
      }
      if (!optionModalInitTimer) {
        optionModalInitTimer = window.setInterval(function () {
          ensureOptionModalOpenHook();
          if (bindOptionModalEvents()) {
            window.clearInterval(optionModalInitTimer);
            optionModalInitTimer = null;
          }
        }, 200);
      }
    }
    var ticking = false;
    function onScroll() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(function () {
        updateShowPrice();
        updateActiveOnScroll();
        ticking = false;
      });
    }
    $tabBtns.on('click', function (event) {
      event.preventDefault();
      var targetId = $(this).data('target');
      var $target = $('#' + targetId);
      if (!$target.length) {
        return;
      }
      setActiveById(targetId);
      scrollToSection($target);
    });
    $('.vits-more-view > button').on('click', function (event) {
      event.preventDefault();
      var $button = $(this);
      var $detailWrap = $('.vits-img-detail');
      if (!$detailWrap.length) {
        return;
      }
      var isOpen = $detailWrap.toggleClass('is-open').hasClass('is-open');
      var $text = $button.find('.text');
      if ($text.length) {
        $text.text(isOpen ? '상품 정보 접기' : '상품 정보 더보기');
      }
      var $icon = $button.find('i');
      if ($icon.length) {
        $icon.toggleClass('ic-arrow-up', isOpen).toggleClass('ic-arrow-down', !isOpen);
      }
    });
    $(window).on('scroll', onScroll);
    $(window).on('resize', function () {
      updateShowPrice();
      updateActiveOnScroll();
      updateTabBar($tabBtns.filter('.is-active'));
    });
    initOptionModalBodyClass(); // 다른 규격찾기 모달 열릴때 함수 초기화

    if (!$tabWrap.length || !$tabNav.length || !$tabBtns.length || !$sections.length) {
      return;
    }
    updateShowPrice();
    updateActiveOnScroll();
    updateTabBar($tabBtns.filter('.is-active'));
  }
  $(initTabScrollbar);
  console.log('[tab-scrollbar] module loaded');
})(window.jQuery || window.$, window);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return "public/resources/js/mro/renewal/ui/" + chunkId + ".chunk.js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	!function() {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "root:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = function(url, done, key, chunkId) {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = function(prev, event) {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach(function(fn) { return fn(event); });
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl + "../../../../../../";
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			524: 0,
/******/ 			96: 0,
/******/ 			152: 0,
/******/ 			133: 0,
/******/ 			237: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = function(chunkId, promises) {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(/^(395|524|979)$/.test(chunkId)) {
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise(function(resolve, reject) { installedChunkData = installedChunks[chunkId] = [resolve, reject]; });
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = function(event) {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = function(chunkId) { return installedChunks[chunkId] === 0; };
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkroot"] = self["webpackChunkroot"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,152,133,237,979], function() { return __webpack_require__(203); })
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;