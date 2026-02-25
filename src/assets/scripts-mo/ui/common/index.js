/**
 * @file scripts-mo/ui/common/index.js
 * @description 공통 UI 모듈 통합
 */

import './tooltip.js';
import './sticky-observer.js';
import './overflow-menu.js';
import './toggle.js';
import './step-flow.js';
import './expand.js';
import './tab.js';
import './scroll-buttons.js';
import './tab-sticky.js';
import './collapse.js';
import './scroll-overflow-gradient.js';
import './option-box.js';
import './step-tab.js';
import './auth.js';
import './survey-detail.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = [
    'tooltip',
    'stickyObserver',
    'overflowMenu',
    'toggle',
    'stepFlow',
    'expand',
    'tab',
    'scrollButtons',
    'tabSticky',
    'collapse',
    'scrollOverflowGradient',
    'optionBox',
    'stepTab',
    'auth',
    'surveyDetail'
  ];

  window.UI.common = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
