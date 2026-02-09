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

  const initPasswordToggle = (root = document) => {
    const eyeButtons = root.querySelectorAll('.vits-btn-eyes button');
    eyeButtons.forEach((btn) => {
      if (btn.dataset.passwordToggleBound === 'true') {
        return;
      }
      btn.dataset.passwordToggleBound = 'true';
      if (!btn.getAttribute('type')) {
        btn.setAttribute('type', 'button');
      }
      btn.addEventListener('click', () => {
        const iconSpan = btn.querySelector('.ic');
        if (!iconSpan) return;

        const isOpen = btn.classList.contains('is-eye-open');
        if (isOpen) {
          btn.classList.remove('is-eye-open');
          btn.classList.add('is-eye-close');
          iconSpan.classList.remove('ic-eye-show');
          iconSpan.classList.add('ic-eye-hide');
          btn.setAttribute('aria-label', '비밀번호 표시');
        } else {
          btn.classList.remove('is-eye-close');
          btn.classList.add('is-eye-open');
          iconSpan.classList.remove('ic-eye-hide');
          iconSpan.classList.add('ic-eye-show');
          btn.setAttribute('aria-label', '비밀번호 숨기기');
        }
      });
    });
  };

  initAuthTabs();
  initPasswordToggle();

  window.UI.authUi = {
    init: function (root) {
      const el = root && root.nodeType === 1 ? root : document;
      initAuthTabs(el);
      initPasswordToggle(el);
    }
  };

  console.log('[auth-ui] module loaded');
})(window.jQuery || window.$, window);
