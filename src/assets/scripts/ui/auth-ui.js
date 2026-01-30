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
    tabWraps.forEach((tabWrap) => {
      const buttons = Array.from(tabWrap.querySelectorAll('button'));
      if (!buttons.length) {
        return;
      }
      const form = tabWrap.closest('form');
      if (!form) {
        return;
      }
      const fieldGroups = Array.from(form.querySelectorAll('.vits-login-form-fields'));
      if (fieldGroups.length < 2) {
        return;
      }

      const setActive = (index) => {
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

      const currentIndex = Math.max(
        0,
        buttons.findIndex((button) => button.classList.contains('is-active'))
      );
      setActive(currentIndex);

      buttons.forEach((button, idx) => {
        if (button.dataset.authTabBound === 'true') {
          return;
        }
        button.dataset.authTabBound = 'true';
        if (!button.getAttribute('type')) {
          button.setAttribute('type', 'button');
        }
        button.addEventListener('click', (event) => {
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
