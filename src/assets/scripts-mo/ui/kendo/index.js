/**
 * @file scripts-mo/ui/kendo/index.js
 * @description Kendo UI 관련 모듈 통합 관리
 */
import './kendo-window.js';
import './kendo-datepicker.js';
import './kendo-datepicker-single.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['VmKendoWindow', 'VmKendoRangePicker', 'VmKendoDatePickerSingle'];

  window.UI.kendo = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.initAll === 'function') mod.initAll();
      });
    }
  };
})(window);
