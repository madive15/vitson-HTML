/**
 * @file scripts-mo/ui/common/auth.js
 * @description 모바일 로그인/인증 페이지 UI (인증 탭, 비밀번호 표시·숨김 토글)
 * @reference scripts/ui/auth-ui.js
 * @scope .vits-auth-tabs + .vits-login-form-fields | .vm-login-form-fields
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var AUTH_TAB_FIELD_GROUPS = '.vits-login-form-fields, .vm-login-form-fields';

  function setAuthTabActive(btnList, groupList, index) {
    for (var i = 0; i < btnList.length; i++) {
      var isActive = i === index;
      btnList[i].classList.toggle('is-active', isActive);
      btnList[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    for (var j = 0; j < groupList.length; j++) {
      var active = j === index;
      groupList[j].style.display = active ? '' : 'none';
      groupList[j].setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  /**
   * 인증 방법 탭 전환 (이메일/휴대전화 등)
   */
  function initAuthTabs(root) {
    var el = root && root.nodeType === 1 ? root : document;
    var tabWraps = el.querySelectorAll('.vits-auth-tabs');

    for (var w = 0; w < tabWraps.length; w++) {
      var tabWrap = tabWraps[w];
      var buttons = tabWrap.querySelectorAll('button');
      if (!buttons.length) continue;

      var form = tabWrap.closest('form');
      if (!form && tabWrap.parentElement) {
        var next = tabWrap.parentElement.nextElementSibling;
        if (next && next.tagName === 'FORM') form = next;
      }
      if (!form) continue;

      var fieldGroups = form.querySelectorAll(AUTH_TAB_FIELD_GROUPS);
      if (fieldGroups.length < 2) continue;

      var currentIndex = -1;
      for (var k = 0; k < buttons.length; k++) {
        if (buttons[k].classList.contains('is-active')) {
          currentIndex = k;
          break;
        }
      }
      if (currentIndex < 0) currentIndex = 0;
      setAuthTabActive(buttons, fieldGroups, currentIndex);

      for (var b = 0; b < buttons.length; b++) {
        var btn = buttons[b];
        if (btn.dataset.authTabBound === 'true') continue;
        btn.dataset.authTabBound = 'true';
        if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
        (function (idx) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            setAuthTabActive(buttons, fieldGroups, idx);
          });
        })(b);
      }
    }
  }

  /**
   * 비밀번호 표시/숨김 토글 버튼 초기화
   */
  function initPasswordToggle(root) {
    var el = root && root.nodeType === 1 ? root : document;
    var eyeButtons = el.querySelectorAll('.vits-btn-eyes button');

    for (var i = 0; i < eyeButtons.length; i++) {
      var btn = eyeButtons[i];
      if (btn.dataset.passwordToggleBound === 'true') continue;

      btn.dataset.passwordToggleBound = 'true';
      if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');

      btn.addEventListener('click', function () {
        var iconSpan = this.querySelector('.ic');
        if (!iconSpan) return;

        var isOpen = this.classList.contains('is-eye-open');
        var input = this.closest('.vits-input') ? this.closest('.vits-input').querySelector('input') : null;

        if (isOpen) {
          this.classList.remove('is-eye-open');
          this.classList.add('is-eye-close');
          iconSpan.classList.remove('ic-eye-show');
          iconSpan.classList.add('ic-eye-hide');
          this.setAttribute('aria-label', '비밀번호 표시');
          if (input) input.type = 'password';
        } else {
          this.classList.remove('is-eye-close');
          this.classList.add('is-eye-open');
          iconSpan.classList.remove('ic-eye-hide');
          iconSpan.classList.add('ic-eye-show');
          this.setAttribute('aria-label', '비밀번호 숨기기');
          if (input) input.type = 'text';
        }
      });
    }
  }

  window.UI.auth = {
    init: function (root) {
      initAuthTabs(root);
      initPasswordToggle(root);
    }
  };
})(window.jQuery || window.$, window);
