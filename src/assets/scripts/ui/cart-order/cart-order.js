/**
 * @file scripts/ui/cart-order/cart-order.js
 * @purpose 장바구니 , 배송정보 , 결제 페이지에 대한 공통 UI 처리
 * @description
 *  - 할인금액 토글 처리 (클릭 시 할인금액 상세 표시/숨김)
 *  - 배송방법 탭과 패널 매칭 처리 (data-method/data-panel 기반)
 *  - 결제수단 탭과 패널 매칭 처리 (vits-payment-tab)
 *  - 결제수단 라디오 버튼과 패널 매칭 처리 (vits-payment-item)
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[cart-order] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  window.UI.cartOrder = {
    init: function () {
      //vits-cart-body 영역
      var discountItemSelector = '.vits-cart-summary-item.has-discount';
      var shippingWrapSelector = '.vits-shipping';
      var shippingBtnSelector = '.vits-shipping-method-btn[data-method]';
      var shippingPanelSelector = '.vits-shipping-panel[data-panel]';
      var addressWrapSelector = '.vits-address-modify-form';
      var addressTypeSelector = '.vits-address-type input[type="radio"][name="shippingType"]';
      var addressPanelSelector = '.vits-address-fields[data-address-panel]';

      function setDiscountState($item, isActive) {
        var $toggle = $item.find('.discount-toggle').first();
        var $info = $item.find('.discount-info').first();
        var $detail = $item.find('.discount-info-detail').first();
        var $icon = $toggle.find('.ic').first();
        var nextActive = !!isActive;

        if (!$toggle.length || !$info.length || !$detail.length) return;

        $info.toggleClass('is-active', nextActive);
        $toggle.attr('aria-expanded', nextActive ? 'true' : 'false');
        $detail.attr('aria-hidden', nextActive ? 'true' : 'false');

        if ($icon.length) {
          $icon.toggleClass('ic-arrow-down', !nextActive);
          $icon.toggleClass('ic-arrow-up', nextActive);
        }
      }

      function setShippingState($wrap, method) {
        if (!$wrap.length || !method) return;

        var $buttons = $wrap.find(shippingBtnSelector);
        var $panels = $wrap.find(shippingPanelSelector);
        var methodValue = String(method);
        var hasPanel = $panels.filter('[data-panel="' + methodValue + '"]').length > 0;

        if (!hasPanel) return;

        $buttons.each(function () {
          var $btn = $(this);
          var isActive = $btn.attr('data-method') === methodValue;
          $btn.toggleClass('is-active', isActive);
        });

        $panels.each(function () {
          var $panel = $(this);
          var isActive = $panel.attr('data-panel') === methodValue;
          $panel.toggleClass('is-active', isActive);
        });
      }

      function setAddressTypeState($wrap, typeValue, radioId) {
        if (!$wrap.length || !typeValue) return;

        var $radios = $wrap.find(addressTypeSelector);
        var $panels = $wrap.find(addressPanelSelector);
        var value = String(typeValue);
        var $targetPanel = $panels.filter('[data-address-panel="' + value + '"]').first();

        if (!$targetPanel.length) return;

        $radios.each(function () {
          var $radio = $(this);
          var isExpanded = $radio.val() === value;
          $radio.attr('aria-expanded', isExpanded ? 'true' : 'false');
        });

        $panels.each(function () {
          var $panel = $(this);
          var isActive = $panel.attr('data-address-panel') === value;
          $panel.toggleClass('is-active', isActive);
          $panel.attr('aria-hidden', isActive ? 'false' : 'true');

          if (isActive && radioId) {
            $panel.attr('aria-labelledby', radioId);
          }
        });
      }

      $(discountItemSelector).each(function () {
        var $item = $(this);
        var isActive = $item.find('.discount-info').first().hasClass('is-active');
        setDiscountState($item, isActive);
      });

      $(shippingWrapSelector).each(function () {
        var $wrap = $(this);
        var $activeBtn = $wrap.find(shippingBtnSelector + '.is-active').first();
        var activeMethod = $activeBtn.attr('data-method');

        if (!activeMethod) {
          activeMethod = $wrap.find(shippingBtnSelector).first().attr('data-method');
        }

        if (activeMethod) {
          setShippingState($wrap, activeMethod);
        }
      });

      $(addressWrapSelector).each(function () {
        var $wrap = $(this);
        var $checked = $wrap.find(addressTypeSelector + ':checked').first();
        var $fallback = $wrap.find(addressTypeSelector).first();
        var $current = $checked.length ? $checked : $fallback;
        var typeValue = $current.val();

        if (typeValue) {
          setAddressTypeState($wrap, typeValue, $current.attr('id'));
        }
      });

      $(document)
        .off('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle')
        .on('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle', function () {
          var $toggle = $(this);
          var $item = $toggle.closest(discountItemSelector);
          var isActive = $item.find('.discount-info').first().hasClass('is-active');
          setDiscountState($item, !isActive);
        });

      $(document)
        .off('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector)
        .on('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector, function () {
          var $btn = $(this);
          var $wrap = $btn.closest(shippingWrapSelector);
          var method = $btn.attr('data-method');
          setShippingState($wrap, method);
        });

      $(document)
        .off('change.cartOrderAddressType', addressTypeSelector)
        .on('change.cartOrderAddressType', addressTypeSelector, function () {
          var $radio = $(this);
          var $wrap = $radio.closest(addressWrapSelector);
          var typeValue = $radio.val();
          setAddressTypeState($wrap, typeValue, $radio.attr('id'));
        });

      // 결제수단 탭 처리
      var paymentTabSelector = '.vits-payment-tab[role="tab"]';
      var paymentTabPanelSelector = '.vits-payment-tab-panel[role="tabpanel"]';

      function setPaymentTabState($tab) {
        if (!$tab.length) return;

        var tabId = $tab.attr('id');
        var controlsId = $tab.attr('aria-controls');
        var $tablist = $tab.closest('[role="tablist"]');
        var $tabs = $tablist.find(paymentTabSelector);
        var $parentPanel = $tablist.closest('.vits-payment-panel');
        var $panels = $parentPanel.find(paymentTabPanelSelector);

        // 모든 탭 비활성화
        $tabs.each(function () {
          var $t = $(this);
          $t.removeClass('is-active');
          $t.attr('aria-selected', 'false');
          $t.attr('aria-expanded', 'false');
        });

        // 선택된 탭 활성화
        $tab.addClass('is-active');
        $tab.attr('aria-selected', 'true');

        // 모든 패널 비활성화
        $panels.each(function () {
          var $p = $(this);
          $p.removeClass('is-active');
        });

        // 해당하는 패널 활성화
        if (controlsId) {
          var $targetPanel = $('#' + controlsId);
          if ($targetPanel.length) {
            $targetPanel.addClass('is-active');
            // aria-expanded 업데이트 (탭 버튼)
            $tab.attr('aria-expanded', 'true');
            // aria-labelledby 매칭 확인
            var currentLabelledBy = $targetPanel.attr('aria-labelledby');
            if (!currentLabelledBy || currentLabelledBy !== tabId) {
              $targetPanel.attr('aria-labelledby', tabId);
            }
          }
        }
      }

      // 결제수단 라디오 버튼과 패널 처리 (vits-tax 내부 세금계산서 라디오는 제외)
      var paymentItemSelector = '.vits-payment-item';
      var paymentRadioSelector = '.vits-payment-item input[type="radio"][aria-controls]';
      var paymentPanelSelector = '.vits-payment-panel';

      function setPaymentPanelState($radio) {
        if (!$radio.length) return;
        // vits-tax 세금계산서 라디오는 패널 전환에 영향 주지 않음
        var controlsId = $radio.attr('aria-controls');
        if (!controlsId) return;

        var radioId = $radio.attr('id');
        var $item = $radio.closest(paymentItemSelector);
        var $methodWrap = $item.closest('.vits-payment-method');
        var $allItems = $methodWrap.find(paymentItemSelector);
        var $allPanels = $methodWrap.find(paymentPanelSelector);

        // tab-simple-account가 활성화되어 있고, 다른 라디오 버튼이 선택되면 tab-simple-card로 변경
        var $tabSimpleAccount = $('#tab-simple-account');
        if ($tabSimpleAccount.length && $tabSimpleAccount.hasClass('is-active')) {
          // pay-simple이 아닌 다른 라디오 버튼이 선택된 경우
          if (radioId !== 'pay-simple') {
            var $tabSimpleCard = $('#tab-simple-card');
            if ($tabSimpleCard.length) {
              setPaymentTabState($tabSimpleCard);
            }
          }
        }

        // 모든 패널 비활성화
        $allPanels.each(function () {
          var $p = $(this);
          $p.removeClass('is-active');
        });

        // 모든 라디오 버튼의 aria-expanded를 false로 초기화
        $allItems.find(paymentRadioSelector).each(function () {
          var $r = $(this);
          $r.attr('aria-expanded', 'false');
        });

        // 선택된 라디오 버튼의 패널 활성화 (같은 결제 영역 내에서만 탐색)
        if (controlsId) {
          var $targetPanel = $methodWrap.find('#' + controlsId);
          if ($targetPanel.length) {
            $targetPanel.addClass('is-active');
            // aria-expanded 업데이트 (선택된 라디오 버튼만 true)
            $radio.attr('aria-expanded', 'true');
            // aria-labelledby 매칭 확인
            var currentLabelledBy = $targetPanel.attr('aria-labelledby');
            if (!currentLabelledBy || currentLabelledBy !== radioId) {
              $targetPanel.attr('aria-labelledby', radioId);
            }
          } else {
            // 패널을 찾을 수 없으면 false로 설정
            $radio.attr('aria-expanded', 'false');
          }
        } else {
          // aria-controls가 없으면 false로 설정
          $radio.attr('aria-expanded', 'false');
        }
      }

      // 초기 상태 설정
      // tab-simple-card를 초기값으로 설정
      var $tabSimpleCard = $('#tab-simple-card');
      if ($tabSimpleCard.length) {
        // tab-simple-card가 활성화되어 있지 않으면 활성화
        if (!$tabSimpleCard.hasClass('is-active')) {
          setPaymentTabState($tabSimpleCard);
        }
      }

      // 모든 탭의 aria-expanded 초기화
      $(paymentTabSelector).each(function () {
        var $tab = $(this);
        var isActive = $tab.hasClass('is-active');
        var controlsId = $tab.attr('aria-controls');

        if (controlsId) {
          var $panel = $('#' + controlsId);
          var isPanelActive = $panel.length && $panel.hasClass('is-active');
          // 탭이 활성화되어 있고 패널도 활성화되어 있으면 true
          $tab.attr('aria-expanded', isActive && isPanelActive ? 'true' : 'false');
        } else {
          $tab.attr('aria-expanded', 'false');
        }
      });

      $(paymentTabSelector + '.is-active').each(function () {
        setPaymentTabState($(this));
      });

      // 초기 상태에서 모든 라디오 버튼의 aria-expanded 설정
      $(paymentRadioSelector).each(function () {
        var $radio = $(this);
        var controlsId = $radio.attr('aria-controls');
        var isChecked = $radio.is(':checked');

        if (controlsId) {
          var $panel = $('#' + controlsId);
          var isPanelActive = $panel.length && $panel.hasClass('is-active');
          // 체크되어 있고 패널이 활성화되어 있으면 true, 아니면 false
          $radio.attr('aria-expanded', isChecked && isPanelActive ? 'true' : 'false');
        } else {
          $radio.attr('aria-expanded', 'false');
        }
      });

      $(paymentRadioSelector + ':checked').each(function () {
        setPaymentPanelState($(this));
      });

      // 결제수단 탭 클릭 이벤트
      $(document)
        .off('click.cartOrderPaymentTab', paymentTabSelector)
        .on('click.cartOrderPaymentTab', paymentTabSelector, function (e) {
          e.preventDefault();
          setPaymentTabState($(this));
        });

      // 결제수단 라디오 버튼 변경 이벤트
      $(document)
        .off('change.cartOrderPaymentRadio', paymentRadioSelector)
        .on('change.cartOrderPaymentRadio', paymentRadioSelector, function () {
          setPaymentPanelState($(this));
        });
    }
  };

  console.log('[cart-order] module loaded');
})(window.jQuery || window.$, window);
