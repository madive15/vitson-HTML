/**
 * @file scripts-mo/ui/filter/filter-mypage.js
 * @description 마이페이지 필터 모듈 — 셀렉트 ↔ 데이트피커 연동
 * @scope .vm-mypage-filter
 *
 * @state .is-filter-open   — 필터 확장 (데이트피커 row + 액션 + 딤 노출)
 * @state .has-filter-value  — 기본값 외 값 변경 시 (초기화 버튼 노출)
 * @state .is-direct-input   — 직접입력 선택 시 (데이트피커 상시 노출)
 *
 * @note
 *  - 기본값: 1개월(value '0') — 변경으로 취급하지 않음
 *  - 닫기: 조회하기 / 초기화 / 딤 클릭
 *  - 직접입력: 필터 닫혀도 데이트피커 row 상시 노출 유지
 *  - 프리셋 상태에서 달력 날짜 직접 선택 시 자동으로 직접입력 전환
 *  - 인풋 포커스 시 필터 열림, 스크롤 잠금 안 함
 *  - 셀렉트 변경 시 필터 열림, 스크롤 잠금 적용
 *  - 페이지 로드 시 기본값(1개월) hidden input에 날짜 세팅
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var UI = window.UI;
  if (!UI || !UI.select) return;

  // 상수
  var NS = '.uiFilterMypage';
  var SCOPE = '.vm-mypage-filter';
  var PICKER_INIT_DELAY = 50;
  var DATE_SEPARATOR = ' ~ ';

  var CLS = {
    open: 'is-filter-open',
    hasValue: 'has-filter-value',
    directInput: 'is-direct-input'
  };

  var SEL = {
    periodRoot: '[data-select-id="vm-order-period"]',
    statusRoot: '[data-select-id="vm-order-status"]',
    deliveryRoot: '[data-select-id="vm-order-delivery"]',
    datePicker: '#vm-order-daterange',
    searchInput: '#vm-order-search-searchKeyword',
    dim: '.vm-mypage-filter-dim',
    resetBtn: '.actions-reset',
    searchBtn: '.actions-search'
  };

  // 기간 프리셋 (월 단위)
  var PRESET_MONTHS = {0: 1, 1: 3, 2: 6, 3: 12};
  var DIRECT_INPUT_VALUE = '4';
  var DEFAULT_PERIOD = '0';
  var DEFAULT_SELECT = '0';

  // 내부 상태
  var _$filter = null;
  var _baseHeight = 0;
  var _savedScrollY = 0;
  var _bound = false;
  var _pickerReady = false;
  var _scrollLocked = false;
  var _programmaticChange = false;

  // 날짜 포맷
  function formatDateStr(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + d;
  }

  // 데이트피커 인스턴스 조회
  function getPickerInstance() {
    var rp = window.VmKendoRangePicker;
    if (!rp || !rp.getInstance) return null;
    return rp.getInstance(SEL.datePicker);
  }

  // 데이트피커 최초 초기화 — display 전환 후 호출
  function ensurePickerInit(callback) {
    if (_pickerReady && getPickerInstance()) {
      if (callback) callback();
      return;
    }

    var rp = window.VmKendoRangePicker;
    if (rp && rp.initAll) {
      rp.initAll(_$filter[0]);
    }

    setTimeout(function () {
      _pickerReady = !!getPickerInstance();
      if (callback) callback();
    }, PICKER_INIT_DELAY);
  }

  // 날짜 계산
  function calcPresetRange(months) {
    var end = new Date();
    var start = new Date();
    start.setMonth(start.getMonth() - months);
    return {start: start, end: end};
  }

  // 스크롤 잠금
  function lockScroll() {
    if (_scrollLocked) return;
    _scrollLocked = true;
    _savedScrollY = window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = -_savedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (!_scrollLocked) return;
    _scrollLocked = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _savedScrollY);
  }

  // 높이 잠금 — 콘텐츠 밀림 방지
  function lockHeight() {
    _baseHeight = _$filter.outerHeight();
    _$filter.css({height: _baseHeight, overflow: 'visible'});
  }

  function unlockHeight() {
    _$filter.css({height: '', overflow: ''});
  }

  // 필터 확장
  function openFilter(callback, withScrollLock) {
    if (_$filter.hasClass(CLS.open)) {
      if (callback) callback();
      return;
    }
    lockHeight();
    _$filter.addClass(CLS.open);
    $(SEL.dim).show();
    if (withScrollLock !== false) lockScroll();
    ensurePickerInit(callback);
  }

  // 필터 축소
  function closeFilter() {
    if (!_$filter.hasClass(CLS.open)) return;
    _$filter.removeClass(CLS.open);
    $(SEL.dim).hide();
    unlockHeight();
    unlockScroll();
  }

  // hidden input 직접 세팅 — picker 미초기화 상태에서 사용
  function setHiddenDateValues(start, end) {
    var $el = $(SEL.datePicker);
    var startStr = formatDateStr(start);
    var endStr = formatDateStr(end);

    $el.find('.js-start-date').val(startStr);
    $el.find('.js-end-date').val(endStr);
    $el.find('.js-range-display').val(startStr + DATE_SEPARATOR + endStr);
  }

  // 데이트피커 값 세팅 — picker 없으면 hidden input 직접 세팅
  function setDateRange(start, end) {
    _programmaticChange = true;
    var picker = getPickerInstance();
    if (picker) {
      picker.setValue(start, end);
    } else {
      setHiddenDateValues(start, end);
    }
    _programmaticChange = false;
  }

  // 데이트피커 리셋 — picker 없으면 hidden input 직접 클리어
  function resetDateRange() {
    var picker = getPickerInstance();
    if (picker) {
      picker.reset();
      return;
    }
    var $el = $(SEL.datePicker);
    $el.find('.js-start-date').val('');
    $el.find('.js-end-date').val('');
    $el.find('.js-range-display').val('');
  }

  // 현재 프리셋 기준으로 필터 열기 + 날짜 세팅
  function openWithCurrentPreset(withScrollLock) {
    var value = UI.select.getValue($(SEL.periodRoot));
    var months = PRESET_MONTHS[value];

    openFilter(function () {
      if (months) {
        var range = calcPresetRange(months);
        setDateRange(range.start, range.end);
      }
    }, withScrollLock);
  }

  // 필터 값 유무 체크 — 기본값(1개월)은 변경으로 취급하지 않음
  function updateFilterValueState() {
    var hasValue = false;

    var periodVal = UI.select.getValue($(SEL.periodRoot));
    if (periodVal && periodVal !== DEFAULT_PERIOD) hasValue = true;

    var statusVal = UI.select.getValue($(SEL.statusRoot));
    if (statusVal && statusVal !== DEFAULT_SELECT) hasValue = true;

    var deliveryVal = UI.select.getValue($(SEL.deliveryRoot));
    if (deliveryVal && deliveryVal !== DEFAULT_SELECT) hasValue = true;

    var searchVal = $(SEL.searchInput).val();
    if (searchVal && searchVal.trim()) hasValue = true;

    _$filter.toggleClass(CLS.hasValue, hasValue);
  }

  // 조회기간 변경 핸들러
  function onPeriodChange() {
    if (_programmaticChange) return;

    var value = $(this).val();
    var months = PRESET_MONTHS[value];

    _$filter.toggleClass(CLS.directInput, value === DIRECT_INPUT_VALUE);

    if (months) {
      openFilter(function () {
        var range = calcPresetRange(months);
        setDateRange(range.start, range.end);
      });
    } else if (value === DIRECT_INPUT_VALUE) {
      openFilter(function () {
        resetDateRange();
      });
    }

    updateFilterValueState();
  }

  // 주문상태/배송상태 변경 핸들러
  function onSelectChange() {
    openWithCurrentPreset(true);
    updateFilterValueState();
  }

  // 데이트피커 날짜 직접 선택 → 셀렉트를 직접입력으로 변경
  function onDatePickerChange() {
    if (_programmaticChange) return;

    var periodVal = UI.select.getValue($(SEL.periodRoot));
    if (periodVal === DIRECT_INPUT_VALUE) return;

    _programmaticChange = true;
    UI.select.setValue($(SEL.periodRoot), DIRECT_INPUT_VALUE);
    _programmaticChange = false;

    _$filter.addClass(CLS.directInput);
    updateFilterValueState();
  }

  // 검색 input 포커스 → 필터 열림, 스크롤 잠금 안 함
  function onInputFocus() {
    openWithCurrentPreset(false);
  }

  // 딤 클릭 → 닫기
  function onDimClick() {
    closeFilter();
  }

  // 초기화 버튼
  function onResetClick() {
    _programmaticChange = true;

    _$filter.removeClass(CLS.directInput);
    UI.select.setValue($(SEL.periodRoot), DEFAULT_PERIOD);
    UI.select.setValue($(SEL.statusRoot), DEFAULT_SELECT);
    UI.select.setValue($(SEL.deliveryRoot), DEFAULT_SELECT);
    $(SEL.searchInput).val('');

    _programmaticChange = false;

    var range = calcPresetRange(PRESET_MONTHS[DEFAULT_PERIOD]);
    setHiddenDateValues(range.start, range.end);
    resetDateRange();

    closeFilter();
    updateFilterValueState();
  }

  // 조회하기 버튼
  function onSearchClick() {
    closeFilter();
    // TODO: 조회 API 호출
  }

  // 초기 상태 — hidden input에 기본값(1개월) 날짜 세팅
  function setInitialState() {
    var value = UI.select.getValue($(SEL.periodRoot));
    var months = PRESET_MONTHS[value];
    if (!months) return;

    var range = calcPresetRange(months);
    setHiddenDateValues(range.start, range.end);
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // 스코프 내 모든 셀렉트 change 위임
    $doc.on('change' + NS, SCOPE + ' [data-vits-select-hidden]', function () {
      var $root = $(this).closest('[data-vits-select]');
      var selectId = $root.attr('data-select-id');

      if (selectId === 'vm-order-period') {
        onPeriodChange.call(this);
      } else {
        onSelectChange();
      }
    });

    $doc.on('rangepicker:change' + NS, SEL.datePicker, onDatePickerChange);
    $doc.on('focusin' + NS, SEL.searchInput, onInputFocus);
    $doc.on('click' + NS, SEL.dim, onDimClick);
    $doc.on('click' + NS, SCOPE + ' ' + SEL.resetBtn, onResetClick);
    $doc.on('click' + NS, SCOPE + ' ' + SEL.searchBtn, onSearchClick);
    $doc.on('input' + NS, SEL.searchInput, updateFilterValueState);
  }

  // 공개 API
  function init() {
    _$filter = $(SCOPE);
    if (!_$filter.length) return;

    bindEvents();
    setInitialState();
  }

  function destroy() {
    $(document).off(NS);
    closeFilter();
    _$filter = null;
    _baseHeight = 0;
    _savedScrollY = 0;
    _bound = false;
    _pickerReady = false;
    _scrollLocked = false;
    _programmaticChange = false;
  }

  window.FilterMypage = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
