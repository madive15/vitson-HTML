/**
 * @file scripts-mo/ui/filter/filter-product.js
 * @description 상품 필터 — 인라인/팝업 체크박스 양방향 연동 + 칩 관리
 * @scope [data-filter-product]
 *
 * @mapping
 *  [data-filter-product]  → 필터 최상위 스코프
 *  [data-filter-popup]    → 팝업 내부 스코프
 *  [data-filter-chips]    → 칩 렌더 영역 (JS 동적 생성)
 *
 * @state .is-filtered — 1개 이상 필터 적용 시 스코프에 부여
 * @state .is-hidden   — 브랜드 더보기 접힌 항목
 * @state .is-expanded — 브랜드 더보기 펼침
 *
 * @events
 *  filter:apply (document) — 필터 적용 시 발행 { applied }
 *  category:change (document) — 수신: 필터 초기화 + 속성 그룹 교체
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  // 상수
  var NS = '.uiFilterProduct';
  var SCOPE = '[data-filter-product]';
  var POPUP_ID = 'filterSheet';
  var CHIP_ORDER = ['ck-brand', 'ck-common', 'ck-attr'];
  var CHIP_SCROLL_GAP = 4;
  var SLIDE_DURATION = 200;

  var CLS = {
    filtered: 'is-filtered',
    hidden: 'is-hidden',
    expanded: 'is-expanded'
  };

  var SEL = {
    inlineCheckbox: '.filter-product-group input[type="checkbox"]',
    popup: '[data-filter-popup]',
    chips: '[data-filter-chips]',
    filterBtn: '[data-filter-state]',
    applyBtn: '[data-filter-apply]',
    closeBtn: '[data-filter-close]',
    toggleBtn: '[data-filter-toggle]',
    brandMore: '[data-filter-more]'
  };

  // 내부 상태
  var _applied = {};
  var _bound = false;
  var _lastAdded = null;
  var _categoryChanged = false;

  // 유틸
  function getAppliedCount() {
    var count = 0;
    Object.keys(_applied).forEach(function (key) {
      count += _applied[key].length;
    });
    return count;
  }

  function isChecked(name, value) {
    return _applied[name] && _applied[name].indexOf(value) > -1;
  }

  function addFilter(name, value) {
    if (!_applied[name]) _applied[name] = [];
    if (_applied[name].indexOf(value) === -1) {
      _applied[name].push(value);
      _lastAdded = {name: name, value: value};
    }
  }

  function removeFilter(name, value) {
    if (!_applied[name]) return;
    var idx = _applied[name].indexOf(value);
    if (idx > -1) _applied[name].splice(idx, 1);
    if (!_applied[name].length) delete _applied[name];
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 체크박스 라벨 텍스트 조회
  function findLabel(name, value) {
    var $cb = $('input[type="checkbox"]')
      .filter(function () {
        return this.name === name && this.value === value;
      })
      .first();
    if (!$cb.length) return value;
    var $label = $cb.closest('label').find('.label');
    if (!$label.length) $label = $cb.closest('label').find('.label-name');
    return $label.length
      ? $label
          .text()
          .replace(/\s*\(\d+\)$/, '')
          .trim()
      : value;
  }

  // 모든 체크박스 동기화 (인라인 + 팝업)
  function syncAllCheckboxes() {
    $('input[type="checkbox"]').each(function () {
      if (this.name) {
        $(this).prop('checked', isChecked(this.name, this.value));
      }
    });
  }

  // 팝업 체크박스에서 _applied 읽기
  function readPopupState() {
    _applied = {};
    $(SEL.popup)
      .find('input[type="checkbox"]:checked')
      .each(function () {
        addFilter(this.name, this.value);
      });
  }

  // 인라인 필터 스크롤 초기화
  function resetInlineScroll() {
    var el = $(SCOPE).find('.vm-filter-product-inner')[0];
    if (el) el.scrollLeft = 0;
  }

  // 칩 렌더
  function renderChips() {
    var $bar = $(SCOPE).find('.filter-product-bar');
    var $chips = $bar.find(SEL.chips);

    if (!getAppliedCount()) {
      $chips.remove();
      _lastAdded = null;
      return;
    }

    if (!$chips.length) {
      $chips = $('<div class="filter-product-selected" data-filter-chips>');
      $bar.append($chips);
    }

    var html = ['<div class="vits-chip-button-group">'];

    CHIP_ORDER.forEach(function (name) {
      if (!_applied[name]) return;
      _applied[name].forEach(function (value) {
        var label = findLabel(name, value);
        html.push(
          '<button type="button" class="vits-chip-button type-outline size-s"' +
            ' data-chip-action="remove"' +
            ' data-chip-name="' +
            esc(name) +
            '"' +
            ' data-chip-value="' +
            esc(value) +
            '">' +
            '<span class="text">' +
            esc(label) +
            '</span>' +
            '<span class="icon" aria-hidden="true"><i class="ic ic-x"></i></span>' +
            '</button>'
        );
      });
    });
    html.push('</div>');

    $chips.html(html.join(''));

    // 마지막 추가된 칩으로 스크롤
    var $group = $chips.find('.vits-chip-button-group');
    if ($group.length && _lastAdded) {
      var $target = $group.find(
        '[data-chip-name="' + _lastAdded.name + '"][data-chip-value="' + _lastAdded.value + '"]'
      );
      if ($target.length) {
        var groupEl = $group[0];
        groupEl.scrollLeft = Math.max(0, $target[0].offsetLeft - groupEl.offsetLeft - CHIP_SCROLL_GAP);
      }
      _lastAdded = null;
    }
  }

  // UI 상태 갱신
  function updateUI() {
    var $scope = $(SCOPE);
    var count = getAppliedCount();
    var hasFilter = count > 0;

    $scope.toggleClass(CLS.filtered, hasFilter);

    // 스코프 안 filter-btn: 텍스트 변경 + is-selected
    var $innerState = $scope.find(SEL.filterBtn);
    $innerState.toggleClass('is-selected', hasFilter);
    var $innerText = $innerState.find('button .text');
    if ($innerText.length) {
      $innerText.text(hasFilter ? '필터' : '필터 더보기');
    }

    // 스코프 밖 filter-btn (toolbar 등): is-selected만
    var $outerState = $(SEL.filterBtn).not($innerState);
    $outerState.toggleClass('is-selected', hasFilter);

    renderChips();
  }

  function emitApply() {
    $(document).trigger('filter:apply', [{applied: $.extend(true, {}, _applied)}]);
  }

  // 팝업 열기
  function openPopup() {
    if (!window.VmKendoWindow) return;
    window.VmKendoWindow.open(POPUP_ID);

    // 팝업 열린 후 체크박스 동기화
    requestAnimationFrame(function () {
      syncAllCheckboxes();

      if (_categoryChanged) {
        _categoryChanged = false;
        var el = $(SEL.popup).closest('.vm-modal-content')[0];
        if (el) el.scrollTop = 0;
      }
    });
  }

  // 적용하기
  function applyAndClose() {
    readPopupState();
    _lastAdded = null;
    syncAllCheckboxes();
    updateUI();
    emitApply();
    if (window.VmKendoWindow) window.VmKendoWindow.close(POPUP_ID);

    // 팝업 적용 후 칩 스크롤 처음으로
    var $group = $(SCOPE).find('.vits-chip-button-group');
    if ($group.length) {
      $group[0].scrollLeft = 0;
    }
  }

  // 속성 체크박스 HTML 생성 — 인라인용
  function buildInlineAttrCheckboxes(items) {
    var html = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html.push(
        '<label class="vm-ckbox-text">' +
          '<input type="checkbox" name="ck-attr" value="' +
          esc(item.categoryCode) +
          '">' +
          '<span class="label">' +
          esc(item.categoryNm) +
          '</span>' +
          '</label>'
      );
    }
    return html.join('');
  }

  // 속성 체크박스 HTML 생성 — 팝업용 (input-checkbox.ejs 구조)
  function buildPopupAttrCheckboxes(items) {
    var html = [
      '<div class="checkbox-wrapper type-basic size-m">' + '<ul class="checkbox-item-area list-column-gap16">'
    ];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html.push(
        '<li class="checkbox-item-box">' +
          '<label class="checkbox-item">' +
          '<input type="checkbox" name="ck-attr" value="' +
          esc(item.categoryCode) +
          '">' +
          '<span class="checkbox-icon" aria-hidden="true"></span>' +
          '<span class="label-name">' +
          esc(item.categoryNm) +
          '</span>' +
          '</label>' +
          '</li>'
      );
    }
    html.push('</ul></div>');
    return html.join('');
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // 인라인 체크박스 → 즉시 적용
    $doc.on('change' + NS, SCOPE + ' ' + SEL.inlineCheckbox, function () {
      if (this.checked) {
        addFilter(this.name, this.value);
      } else {
        removeFilter(this.name, this.value);
      }
      syncAllCheckboxes();
      updateUI();
      emitApply();
    });

    // 팝업 열기 — 스코프 안
    $doc.on('click' + NS, SCOPE + ' ' + SEL.filterBtn, openPopup);

    // 팝업 열기 — 스코프 밖 (toolbar 등)
    $doc.on('click' + NS, '.toolbar-filter ' + SEL.filterBtn, openPopup);

    // 팝업: 적용하기
    $doc.on('click' + NS, SEL.applyBtn, applyAndClose);

    // 팝업: 닫기
    $doc.on('click' + NS, SEL.closeBtn, function () {
      if (window.VmKendoWindow) window.VmKendoWindow.close(POPUP_ID);
    });

    // 팝업: 섹션 토글
    $doc.on('click' + NS, SEL.popup + ' ' + SEL.toggleBtn, function () {
      var $btn = $(this);
      var $body = $btn.closest('.filter-popup-section').find('.filter-popup-body');
      var isOpen = $btn.attr('aria-expanded') === 'true';
      $btn.attr('aria-expanded', String(!isOpen));
      $body.slideToggle(SLIDE_DURATION);
    });

    // 팝업: 브랜드 더보기
    $doc.on('click' + NS, '[data-filter-more]', function () {
      var $btn = $(this);
      var $section = $btn.closest('[data-filter-group]');
      $section.find('.' + CLS.hidden).removeClass(CLS.hidden);
      $section.addClass(CLS.expanded);
      $btn.remove();
    });

    // 칩 삭제
    $doc.on('click' + NS, SEL.chips + ' [data-chip-action="remove"]', function () {
      var $chip = $(this);
      var name = $chip.attr('data-chip-name');
      var value = $chip.attr('data-chip-value');
      if (name && value) {
        removeFilter(name, value);
        syncAllCheckboxes();
        updateUI();
        emitApply();
      }
    });

    // 카테고리 변경 → 필터 초기화 + 속성 그룹 교체
    $doc.on('category:change' + NS, function (e, data) {
      var d4 = (data && data.depth4) || [];
      var $inlineAttr = $(SCOPE).find('[data-filter-group="ck-attr"]');
      var $inlineLabel = $inlineAttr.prev('.filter-product-label');
      var $popupAttr = $(SEL.popup).find('[data-filter-group="ck-attr"]');

      // 전체 필터 초기화
      _applied = {};
      $('input[type="checkbox"]').each(function () {
        if (this.name) $(this).prop('checked', false);
      });

      _categoryChanged = true;

      if (!d4.length) {
        $inlineAttr.hide();
        $inlineLabel.hide();
        $popupAttr.closest('.filter-popup-section').hide();
        updateUI();
        resetInlineScroll();
        return;
      }

      $inlineAttr.show();
      $inlineLabel.show();
      $popupAttr.closest('.filter-popup-section').show();

      $inlineAttr.html(buildInlineAttrCheckboxes(d4));
      $popupAttr.find('.filter-popup-body').html(buildPopupAttrCheckboxes(d4));

      updateUI();
      resetInlineScroll();
    });
  }

  // 공개 API
  function init() {
    if (!$(SCOPE).length) return;
    _applied = {};
    _lastAdded = null;
    _categoryChanged = false;
    bindEvents();
    updateUI();
  }

  function destroy() {
    $(document).off(NS);
    _applied = {};
    _lastAdded = null;
    _categoryChanged = false;
    _bound = false;
  }

  window.FilterProduct = {
    init: init,
    destroy: destroy,
    getApplied: function () {
      return $.extend(true, {}, _applied);
    }
  };
})(window.jQuery, window);
