/**
 * scripts/ui/kendo/kendo.js
 * @purpose Kendo UI 관련 모듈 통합 관리
 */
import './kendo-dropdown.js';
import './kendo-datepicker.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  window.UI.kendo = {
    init: function () {
      if (window.VitsKendoDropdown) {
        window.VitsKendoDropdown.initAll(document);
        window.VitsKendoDropdown.autoBindStart(document.body);
      }

      if (window.VitsKendoDatepicker) {
        window.VitsKendoDatepicker.initAll(document);
        window.VitsKendoDatepicker.autoBindStart(document.body);
      }

      console.log('[kendo] all modules initialized');
    }
  };

  console.log('[kendo] loaded');
})(window);
