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

    if (!$tabWrap.length || !$tabNav.length || !$tabBtns.length || !$sections.length) {
      return;
    }

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

    updateShowPrice();
    updateActiveOnScroll();
    updateTabBar($tabBtns.filter('.is-active'));
  }

  $(initTabScrollbar);
  console.log('[tab-scrollbar] module loaded');
})(window.jQuery || window.$, window);
