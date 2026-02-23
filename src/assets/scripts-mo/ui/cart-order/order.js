/**
 * @file scripts-mo/ui/cart-order/order.js
 * @description 주문/결제(주문서) 페이지 UI 기능
 * - 배송 방법 탭 전환 (택배/퀵배송/화물)
 * - 화물 선택 시 노출/비노출 영역 제어 (data-freight-visible, data-freight-hidden)
 * - 결제수단 탭 전환 (vm-payment-tab / vm-payment-tab-panel)
 * - 결제수단 라디오와 패널 매칭 (vm-payment-item / vm-payment-panel)
 * - 결제 카드/계좌 리스트 Swiper (data-swiper-type="payment")
 */

import Swiper from 'swiper/bundle';

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[order] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var EVENT_NS = '.uiOrder';
  var ROOT_SEL = '.vm-cart-order';
  var METHOD_BTN_SEL = '.vm-shipping-method-btn';
  var METHOD_PANEL_SEL = '.vm-shipping-panel';
  var FREIGHT_VISIBLE_SEL = '[data-freight-visible="false"]';
  var FREIGHT_HIDDEN_SEL = '[data-freight-hidden="false"]';
  var INIT_KEY = 'uiOrderInit';

  // 결제수단 (데스크톱 vits-* → 모바일 vm-*)
  var PAYMENT_TAB_SEL = '.vm-payment-tab[role="tab"]';
  var PAYMENT_TAB_PANEL_SEL = '.vm-payment-tab-panel[role="tabpanel"]';
  var PAYMENT_ITEM_SEL = '.vm-payment-item';
  var PAYMENT_RADIO_SEL = '.vm-payment-item input[type="radio"][aria-controls]';
  var PAYMENT_PANEL_SEL = '.vm-payment-panel';
  var PAYMENT_METHOD_SEL = '.vm-payment-method';

  // 결제 카드/계좌 Swiper
  var PAYMENT_SWIPER_SEL = '.vm-card-list.js-swiper[data-swiper-type="payment"]';
  var SWIPER_DATA_KEY = 'uiPaymentSwiper';
  var PAYMENT_SWIPER_OPTIONS = {
    slidesPerView: 'auto',
    spaceBetween: 12,
    speed: 500,
    slidesOffsetAfter: 50,
    breakpoints: {
      768: {
        slidesOffsetAfter: 280
      }
    },
    a11y: false,
    on: {
      init: function (swiper) {
        if (!swiper.slides || !swiper.slides.length) return;
        $(swiper.slides).removeClass('is-selected');
        var active = swiper.slides[swiper.activeIndex];
        if (active) $(active).addClass('is-selected');
      },
      slideChangeTransitionEnd: function (swiper) {
        if (!swiper.slides || !swiper.slides.length) return;
        $(swiper.slides).removeClass('is-selected');
        var active = swiper.slides[swiper.activeIndex];
        if (active) $(active).addClass('is-selected');
      }
    }
  };

  var METHOD_FREIGHT = 'freight';
  var ID_TAB_SIMPLE_ACCOUNT = 'tab-simple-account';
  var ID_TAB_SIMPLE_CARD = 'tab-simple-card';
  var ID_PAY_SIMPLE = 'pay-simple';

  function getScope(root) {
    if (!root) return $(ROOT_SEL);
    var $el = $(root);
    if (!$el.length) return $el;
    return $el.find(ROOT_SEL).addBack().filter(ROOT_SEL);
  }

  /**
   * 배송 방법 탭 클릭 시 해당 패널만 활성화
   */
  function bindShippingMethodTabs($scope) {
    var $btns = $scope.find(METHOD_BTN_SEL);
    var $panels = $scope.find(METHOD_PANEL_SEL);
    if (!$btns.length || !$panels.length) return;

    $btns.off('click' + EVENT_NS);
    $btns.on('click' + EVENT_NS, function () {
      var method = $(this).data('method');
      if (!method) return;

      $btns.removeClass('is-active');
      $(this).addClass('is-active');

      $panels.removeClass('is-active');
      $panels.filter('[data-panel="' + method + '"]').addClass('is-active');

      updateFreightVisibility($scope, method);
    });
  }

  /**
   * 화물 선택 시 data-freight-visible 영역 노출, data-freight-hidden 영역 비노출
   */
  function updateFreightVisibility($scope, method) {
    var isFreight = method === METHOD_FREIGHT;
    $scope.find(FREIGHT_VISIBLE_SEL).toggle(isFreight);
    $scope.find(FREIGHT_HIDDEN_SEL).toggle(!isFreight);
  }

  function bindFreightVisibility($scope) {
    var $activeBtn = $scope.find(METHOD_BTN_SEL + '.is-active');
    var method = $activeBtn.length ? $activeBtn.data('method') : '';
    updateFreightVisibility($scope, method);
  }

  /**
   * 결제수단 탭 클릭 시 해당 탭패널만 활성화 (간편결제 내 카드/계좌 탭)
   */
  function setPaymentTabState($scope, $tab) {
    if (!$tab || !$tab.length) return;

    var tabId = $tab.attr('id');
    var controlsId = $tab.attr('aria-controls');
    var $tablist = $tab.closest('[role="tablist"]');
    var $parentPanel = $tablist.closest(PAYMENT_PANEL_SEL);
    if (!$tablist.length || !$parentPanel.length) return;

    var $tabs = $tablist.find(PAYMENT_TAB_SEL);
    var $panels = $parentPanel.find(PAYMENT_TAB_PANEL_SEL);

    $tabs.each(function () {
      var $t = $(this);
      $t.removeClass('is-active');
      $t.attr('aria-selected', 'false');
      $t.attr('aria-expanded', 'false');
    });

    $tab.addClass('is-active');
    $tab.attr('aria-selected', 'true');

    $panels.each(function () {
      $(this).removeClass('is-active');
    });

    if (controlsId) {
      var $targetPanel = $scope.find('#' + controlsId);
      if ($targetPanel.length) {
        $targetPanel.addClass('is-active');
        $tab.attr('aria-expanded', 'true');
        var currentLabelledBy = $targetPanel.attr('aria-labelledby');
        if (!currentLabelledBy || currentLabelledBy !== tabId) {
          $targetPanel.attr('aria-labelledby', tabId);
        }
        // 노출된 패널 안의 payment 스와이퍼는 초기화 시 숨겨져 있었을 수 있으므로 크기 재계산
        $targetPanel.find(PAYMENT_SWIPER_SEL).each(function () {
          var instance = $(this).data(SWIPER_DATA_KEY);
          if (instance && typeof instance.update === 'function') instance.update();
        });
      }
    }
  }

  /**
   * 결제수단 라디오 변경 시 해당 패널만 활성화 (간편결제/카드/계좌이체/무통장/여신)
   */
  function setPaymentPanelState($scope, $radio) {
    if (!$radio || !$radio.length) return;

    var controlsId = $radio.attr('aria-controls');
    if (!controlsId) return;

    var radioId = $radio.attr('id');
    var $item = $radio.closest(PAYMENT_ITEM_SEL);
    var $methodWrap = $item.closest(PAYMENT_METHOD_SEL);
    if (!$item.length || !$methodWrap.length) return;

    var $allPanels = $methodWrap.find(PAYMENT_PANEL_SEL);

    // 간편결제 탭이 '계좌'일 때 다른 결제수단 선택 시 카드 탭으로 전환
    var $tabSimpleAccount = $scope.find('#' + ID_TAB_SIMPLE_ACCOUNT);
    if ($tabSimpleAccount.length && $tabSimpleAccount.hasClass('is-active')) {
      if (radioId !== ID_PAY_SIMPLE) {
        var $tabSimpleCard = $scope.find('#' + ID_TAB_SIMPLE_CARD);
        if ($tabSimpleCard.length) {
          setPaymentTabState($scope, $tabSimpleCard);
        }
      }
    }

    $allPanels.each(function () {
      $(this).removeClass('is-active');
    });

    $methodWrap.find(PAYMENT_RADIO_SEL).attr('aria-expanded', 'false');

    var $targetPanel = $methodWrap.find('#' + controlsId);
    if ($targetPanel.length) {
      $targetPanel.addClass('is-active');
      $radio.attr('aria-expanded', 'true');
      var currentLabelledBy = $targetPanel.attr('aria-labelledby');
      if (!currentLabelledBy || currentLabelledBy !== radioId) {
        $targetPanel.attr('aria-labelledby', radioId);
      }
    } else {
      $radio.attr('aria-expanded', 'false');
    }
  }

  /**
   * 결제 카드/계좌 리스트 Swiper 초기화
   */
  function initPaymentSwipers($scope) {
    if (typeof Swiper === 'undefined') return;

    var $containers = $scope.find(PAYMENT_SWIPER_SEL);
    if (!$containers.length) return;

    $containers.each(function () {
      if ($(this).data(SWIPER_DATA_KEY)) return;
      if (!this.querySelector('.swiper-wrapper')) return;

      var prevEl = this.querySelector('.swiper-button-prev');
      var nextEl = this.querySelector('.swiper-button-next');
      var $el = $(this);

      if (!this.classList.contains('swiper')) this.classList.add('swiper');

      var options = Object.assign({}, PAYMENT_SWIPER_OPTIONS);
      if (prevEl && nextEl) {
        options.navigation = {
          nextEl: nextEl,
          prevEl: prevEl,
          disabledClass: 'swiper-button-disabled'
        };
      }

      try {
        var instance = new Swiper(this, options);
        $el.data(SWIPER_DATA_KEY, instance);
        this.querySelectorAll('.swiper-slide').forEach(function (slide, index) {
          slide.addEventListener('click', function () {
            instance.slideTo(index);
          });
        });
      } catch (e) {
        console.warn('[order] Payment swiper init failed', e);
      }
    });
  }

  /**
   * 결제수단 탭/라디오 이벤트 바인딩 및 초기 상태
   */
  function bindPayment($scope) {
    var $payment = $scope.find('.vm-payment');
    if (!$payment.length) return;

    // 초기: 간편결제 카드 탭 활성화
    var $tabSimpleCard = $scope.find('#' + ID_TAB_SIMPLE_CARD);
    if ($tabSimpleCard.length && !$tabSimpleCard.hasClass('is-active')) {
      setPaymentTabState($scope, $tabSimpleCard);
    }

    // 탭 aria-expanded 초기화
    $scope.find(PAYMENT_TAB_SEL).each(function () {
      var $tab = $(this);
      var isActive = $tab.hasClass('is-active');
      var controlsId = $tab.attr('aria-controls');
      if (controlsId) {
        var $panel = $scope.find('#' + controlsId);
        var isPanelActive = $panel.length && $panel.hasClass('is-active');
        $tab.attr('aria-expanded', isActive && isPanelActive ? 'true' : 'false');
      } else {
        $tab.attr('aria-expanded', 'false');
      }
    });

    $scope.find(PAYMENT_TAB_SEL + '.is-active').each(function () {
      setPaymentTabState($scope, $(this));
    });

    // 라디오 aria-expanded 초기화 후 체크된 항목 기준으로 패널 활성화
    $scope.find(PAYMENT_RADIO_SEL).each(function () {
      var $radio = $(this);
      var controlsId = $radio.attr('aria-controls');
      var isChecked = $radio.is(':checked');
      if (controlsId) {
        var $panel = $scope.find('#' + controlsId);
        var isPanelActive = $panel.length && $panel.hasClass('is-active');
        $radio.attr('aria-expanded', isChecked && isPanelActive ? 'true' : 'false');
      } else {
        $radio.attr('aria-expanded', 'false');
      }
    });

    $scope.find(PAYMENT_RADIO_SEL + ':checked').each(function () {
      setPaymentPanelState($scope, $(this));
    });

    // 결제수단 탭 클릭
    $scope.off('click' + EVENT_NS, PAYMENT_TAB_SEL);
    $scope.on('click' + EVENT_NS, PAYMENT_TAB_SEL, function (e) {
      e.preventDefault();
      setPaymentTabState($scope, $(this));
    });

    // 결제수단 라디오 변경
    $scope.off('change' + EVENT_NS, PAYMENT_RADIO_SEL);
    $scope.on('change' + EVENT_NS, PAYMENT_RADIO_SEL, function () {
      setPaymentPanelState($scope, $(this));
    });

    // 결제 카드/계좌 Swiper 초기화
    initPaymentSwipers($scope);
  }

  /**
   * 주문서 영역 초기화 (배송 탭, 화물 노출, 결제수단)
   */
  function bindRoot($scope) {
    if ($scope.data(INIT_KEY)) return;
    $scope.data(INIT_KEY, true);

    bindShippingMethodTabs($scope);
    bindFreightVisibility($scope);
    bindPayment($scope);
  }

  window.UI.order = {
    init: function (root) {
      var $scope = getScope(root);
      if (!$scope.length) return;

      $scope.each(function () {
        bindRoot($(this));
      });

      console.log('[order] order page initialized');
    }
  };

  console.log('[order] module loaded');
})(window.jQuery, window);
