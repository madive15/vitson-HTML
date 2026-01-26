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
