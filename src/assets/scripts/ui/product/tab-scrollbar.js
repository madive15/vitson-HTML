/**
 * @file scripts/ui/product/tab-scrollbar.js
 * @purpose 탭 고정(top 100) + 클릭이동(가려짐 없음) + active 동기화
 * @description
 *  - 클릭 시 섹션 타이틀이 탭 바로 아래로 오도록 이동
 *  - 스크롤 시 baseline(탭 바로 아래) 기준으로 active 동기화
 * @requires jQuery
 * @markup-control
 *  - #tabNav: 탭 네비게이션
 *  - #tabBar: 활성 탭 인디케이터
 *  - .tabBtn[data-target]: 탭 버튼 (data-target에 섹션 id)
 *  - .section[id]: 섹션 요소
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[tab-scrollbar] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  function initTabScrollbar() {
    var $tabWrap = $('.tab-wrap');
    var $tabShowPrice = $tabWrap.find('.tab-show-price');
    var $tabNav = $('#tab-nav');
    var $tabBar = $('#tab-Bar');
    var $tabBtns = $tabNav.find('.tab-btn[data-target]');
    var $sections = $('.tab-section[id]');
    // 다른 규격찾기 모달 열릴때 body 스크롤 class 추가
    var $body = $('body');
    var $optionModal = $('#findOtherOptionModal');
    var OPTION_MODAL_BODY_OPEN_CLASS = 'is-option-modal-open';
    var OPTION_MODAL_BODY_HIDE_CLASS = 'is-option-modal-hide';
    var optionModalInitTimer = null;
    var optionModalOpenWrapped = false;

    function getScrollTop() {
      return $(window).scrollTop();
    }

    function getViewportHeight() {
      return window.innerHeight;
    }

    function getScrollHeight() {
      return document.documentElement.scrollHeight;
    }

    function getTabWrapHeight() {
      return $tabWrap.outerHeight();
    }

    function getElementTop($el) {
      return $el.offset().top;
    }

    function isTabWrapAtTop() {
      if (!$tabWrap.length) {
        return false;
      }
      var wrapRect = $tabWrap[0].getBoundingClientRect();
      return wrapRect.top <= 0.5;
    }

    function updateShowPrice() {
      var shouldOpen = isTabWrapAtTop();
      $tabShowPrice.toggleClass('is-open', shouldOpen);
    }

    function updateTabBar($activeBtn) {
      if (!$tabBar.length || !$activeBtn || !$activeBtn.length) {
        return;
      }
      var left = $activeBtn.position().left;
      $tabBar.css({
        width: $activeBtn.outerWidth(),
        transform: 'translateX(' + left + 'px)'
      });
    }

    function setActiveById(targetId) {
      if (!targetId) {
        return;
      }
      var $targetBtn = $tabBtns.filter('[data-target="' + targetId + '"]');
      if (!$targetBtn.length) {
        return;
      }
      $tabBtns.removeClass('is-active');
      $targetBtn.addClass('is-active');
      updateTabBar($targetBtn);
    }

    function getCurrentSectionId() {
      var baseline = getScrollTop() + getTabWrapHeight();
      var currentId = $sections.first().attr('id');
      $sections.each(function () {
        var $section = $(this);
        if (getElementTop($section) <= baseline + 1) {
          currentId = $section.attr('id');
        }
      });
      return currentId;
    }

    function isAtBottom() {
      return getScrollTop() + getViewportHeight() >= getScrollHeight() - 2;
    }

    function updateActiveOnScroll() {
      if (!$sections.length) {
        return;
      }
      var targetId = isAtBottom() ? $sections.last().attr('id') : getCurrentSectionId();
      setActiveById(targetId);
    }

    function scrollToSection($target) {
      var targetTop = getElementTop($target) - getTabWrapHeight();
      if (targetTop < 0) {
        targetTop = 0;
      }
      var scrollDuration = 0; // 애니메이션 필요 시 250 등으로 조정
      $('html, body').stop().animate({scrollTop: targetTop}, scrollDuration);
    }

    // 다른 규격찾기 모달 열릴때 body 스크롤 class 추가
    function updateOptionModalBodyClass(isOpen) {
      if (!$optionModal.length) {
        return;
      }
      $body.toggleClass(OPTION_MODAL_BODY_OPEN_CLASS, !!isOpen);
      $body.toggleClass(OPTION_MODAL_BODY_HIDE_CLASS, false);
    }

    function bindOptionModalEvents() {
      var inst = $optionModal.data('kendoWindow');
      if (!inst) {
        return false;
      }
      inst.unbind('open.optionModalToggle');
      inst.unbind('close.optionModalToggle');
      inst.bind('open.optionModalToggle', function () {
        updateOptionModalBodyClass(true);
      });
      inst.bind('close.optionModalToggle', function () {
        updateOptionModalBodyClass(false);
      });
      if (!inst._optionModalCloseWrapped) {
        inst._optionModalCloseWrapped = true;
        var originalClose = inst.close;
        inst.close = function () {
          updateOptionModalBodyClass(false);
          return originalClose.call(inst);
        };
      }
      return true;
    }

    function ensureOptionModalOpenHook() {
      if (!window.VitsKendoWindow || optionModalOpenWrapped) {
        return;
      }
      optionModalOpenWrapped = true;
      var originalOpen = window.VitsKendoWindow.open;
      var originalClose = window.VitsKendoWindow.close;

      window.VitsKendoWindow.open = function (id, options) {
        if (id === 'findOtherOptionModal') {
          updateOptionModalBodyClass(true);
        }
        return originalOpen.call(window.VitsKendoWindow, id, options);
      };

      window.VitsKendoWindow.close = function (id) {
        if (id === 'findOtherOptionModal') {
          updateOptionModalBodyClass(false);
        }
        return originalClose.call(window.VitsKendoWindow, id);
      };
    }

    function initOptionModalBodyClass() {
      if (!$optionModal.length) {
        return;
      }

      if (window.VitsKendoWindow && !$optionModal.data('kendoWindow')) {
        window.VitsKendoWindow.initAll(document);
      }

      ensureOptionModalOpenHook();

      if (bindOptionModalEvents()) {
        return;
      }

      if (!optionModalInitTimer) {
        optionModalInitTimer = window.setInterval(function () {
          ensureOptionModalOpenHook();
          if (bindOptionModalEvents()) {
            window.clearInterval(optionModalInitTimer);
            optionModalInitTimer = null;
          }
        }, 200);
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(function () {
        updateShowPrice();
        updateActiveOnScroll();
        ticking = false;
      });
    }

    $tabBtns.on('click', function (event) {
      event.preventDefault();
      var targetId = $(this).data('target');
      var $target = $('#' + targetId);
      if (!$target.length) {
        return;
      }
      setActiveById(targetId);
      scrollToSection($target);
    });

    $('.vits-more-view > button').on('click', function (event) {
      event.preventDefault();
      var $button = $(this);
      var $detailWrap = $('.vits-img-detail');
      if (!$detailWrap.length) {
        return;
      }
      var isOpen = $detailWrap.toggleClass('is-open').hasClass('is-open');
      var $text = $button.find('.text');
      if ($text.length) {
        $text.text(isOpen ? '상품 정보 접기' : '상품 정보 더보기');
      }
      var $icon = $button.find('i');
      if ($icon.length) {
        $icon.toggleClass('ic-arrow-up', isOpen).toggleClass('ic-arrow-down', !isOpen);
      }
    });

    $(window).on('scroll', onScroll);
    $(window).on('resize', function () {
      updateShowPrice();
      updateActiveOnScroll();
      updateTabBar($tabBtns.filter('.is-active'));
    });

    initOptionModalBodyClass(); // 다른 규격찾기 모달 열릴때 함수 초기화

    if (!$tabWrap.length || !$tabNav.length || !$tabBtns.length || !$sections.length) {
      return;
    }

    updateShowPrice();
    updateActiveOnScroll();
    updateTabBar($tabBtns.filter('.is-active'));
  }

  $(initTabScrollbar);
  console.log('[tab-scrollbar] module loaded');
})(window.jQuery || window.$, window);
