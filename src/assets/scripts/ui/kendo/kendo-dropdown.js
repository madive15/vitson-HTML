/**
 * @file scripts/ui/kendo/kendo-dropdown.js
 * @description
 * Kendo DropDownList 자동 초기화 모듈.
 * - select[data-ui="kendo-dropdown"]를 찾아 data-opt(JSON)로 초기화한다.
 * - data-handler 키로 이벤트를 매핑한다(함수 직렬화 불가 이슈 회피).
 * - 상위 래퍼(.vits-dropdown)의 vits- 클래스를 Kendo wrapper에도 복사한다.
 * - 리스트 팝업도 래퍼 스코프에서 커스텀 가능하도록 appendTo를 래퍼로 기본 설정한다(옵션 미지정 시).
 */

(function (window) {
  'use strict';

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDropDownList);
  }

  function applyVitsClassToWrapper($wrap, inst) {
    // vits- 클래스만 wrapper/popup로 이관(전역 오염 방지)
    if (!$wrap || !$wrap.length || !inst) return;

    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);

    // 입력 wrapper
    if (inst.wrapper) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) inst.wrapper.addClass(classList[i]);
      }
    }

    // 팝업(옵션 리스트) - 열릴 때 생성되는 케이스 방어
    if (inst.popup && inst.popup.element) {
      for (var j = 0; j < classList.length; j++) {
        if (classList[j].indexOf('vits-') === 0) {
          inst.popup.element.addClass(classList[j]);

          // 테마에 따라 실제 배경/테두리가 animation container에 걸리는 경우가 많음
          var $ac = inst.popup.element.closest('.k-animation-container');
          if ($ac && $ac.length) $ac.addClass(classList[j]);
        }
      }
    }
  }

  var HANDLERS = {
    productSelect: function (inst) {
      // 필요할 때만 내부 구현
      inst.bind('change', function () {
        // var v = inst.value();
        // var item = inst.dataItem();
      });
    }
  };

  function applyHandler($el, inst) {
    var key = ($el.attr('data-handler') || '').trim();
    if (!key) return;
    if (!HANDLERS[key]) return;
    HANDLERS[key](inst);
  }

  function initOne(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDropDownList')) return;

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};

    var $wrap = $el.closest('.vits-dropdown');

    // appendTo는 DOM element로 주는 쪽이 더 안전함
    if ($wrap.length && opts.appendTo === undefined) opts.appendTo = $wrap[0];

    $el.kendoDropDownList(opts);

    var inst = $el.data('kendoDropDownList');

    // 팝업이 "열릴 때" 생기는 경우가 많아서 open 시점에 다시 클래스 이관(핵심)
    if (inst && inst.bind) {
      inst.bind('open', function () {
        applyVitsClassToWrapper($wrap, inst);
      });
    }

    applyHandler($el, inst);
    applyVitsClassToWrapper($wrap, inst);
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
