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

    obs.observe(target, {childList: true, subtree: true});
    return obs;
  }

  window.VitsKendoDropdown = {
    initAll: initAll,
    autoBindStart: autoBindStart
  };
})(window);
