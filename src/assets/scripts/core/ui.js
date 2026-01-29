/**
 * scripts/core/ui.js
 * @purpose UI 기능 모음
 * @assumption
 *  - 기능별 UI는 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함한다
 *  - 각 UI 모듈은 window.UI.{name}.init 형태로 초기화 함수를 제공한다
 * @maintenance
 *  - index.js를 길게 만들지 않기 위해 UI import는 여기서만 관리한다
 *  - UI.init에는 “초기화 호출”만 둔다(기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */
import '../ui/toggle.js';
import '../ui/step-tab.js';
import '../ui/period-btn.js';
import '../ui/scroll-boundary.js';
import '../ui/layer.js';
import '../ui/modal.js';
import '../ui/tooltip.js';
import '../ui/swiper.js';
import '../ui/swiper-test.js';
import '../ui/chip-button.js';
import '../ui/quantity-stepper.js';
import '../ui/form/textarea.js';
import '../ui/form/checkbox-total.js';
import '../ui/header/header-rank.js';
import '../ui/header/header-search.js';
import '../ui/header/header-gnb.js';
import '../ui/footer.js';
import '../ui/product/tab-scrollbar.js';
import '../ui/form/select.js';
import '../ui/form/input-search.js';
import '../ui/category/plp-titlebar-research.js';
import '../ui/category/category-tree.js';
import '../ui/category/plp-chip-sync.js';
import '../ui/category/plp-view-toggle.js';
import '../ui/more-expand.js';
import '../ui/filter-expand.js';
import '../ui/cart-order/cart-order.js';
import '../ui/kendo/kendo.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  /**
   * 공통 UI 초기화 진입점
   * @returns {void}
   * @example
   * // scripts/core/common.js에서 DOMReady 시점에 호출
   * UI.init();
   */
  window.UI.init = function () {
    if (window.UI.kendo && window.UI.kendo.init) window.UI.kendo.init();
    if (window.UI.toggle && window.UI.toggle.init) window.UI.toggle.init();
    if (window.UI.stepTab && window.UI.stepTab.init) window.UI.stepTab.init();
    if (window.UI.PeriodBtn && window.UI.PeriodBtn.init) window.UI.PeriodBtn.init();
    if (window.UI.scrollBoundary && window.UI.scrollBoundary.init) window.UI.scrollBoundary.init();
    if (window.UI.layer && window.UI.layer.init) window.UI.layer.init();
    if (window.UI.modal && window.UI.modal.init) window.UI.modal.init();
    if (window.UI.tooltip && window.UI.tooltip.init) window.UI.tooltip.init();
    if (window.UI.swiper && window.UI.swiper.init) window.UI.swiper.init();
    if (window.UI.swiperTest && window.UI.swiperTest.init) window.UI.swiperTest.init();
    if (window.UI.chipButton && window.UI.chipButton.init) window.UI.chipButton.init();
    if (window.UI.textarea && window.UI.textarea.init) window.UI.textarea.init();
    if (window.UI.checkboxTotal && window.UI.checkboxTotal.init) window.UI.checkboxTotal.init();
    if (window.UI.quantityStepper && window.UI.quantityStepper.init) window.UI.quantityStepper.init();
    if (window.UI.headerRank && window.UI.headerRank.init) window.UI.headerRank.init();
    if (window.UI.headerSearch && window.UI.headerSearch.init) window.UI.headerSearch.init();
    if (window.UI.headerGnb && window.UI.headerGnb.init) window.UI.headerGnb.init();
    if (window.UI.footerBizInfo && window.UI.footerBizInfo.init) window.UI.footerBizInfo.init();
    if (window.UI.initDealGallery && window.UI.initDealGallery.init) window.UI.initDealGallery.init();
    if (window.UI.tabScrollbar && window.UI.tabScrollbar.init) window.UI.tabScrollbar.init();
    if (window.UI.select && window.UI.select.init) window.UI.select.init(document);
    if (window.UI.inputSearch && window.UI.inputSearch.init) window.UI.inputSearch.init();
    if (window.UI.plpTitlebarResearch && window.UI.plpTitlebarResearch.init) window.UI.plpTitlebarResearch.init();
    if (window.UI.categoryTree && window.UI.categoryTree.init) window.UI.categoryTree.init();
    if (window.UI.chipSync && window.UI.chipSync.init) window.UI.chipSync.init();
    if (window.UI.plpViewToggle && window.UI.plpViewToggle.init) window.UI.plpViewToggle.init();
    if (window.UI.moreExpand && window.UI.moreExpand.init) window.UI.moreExpand.init();
    if (window.UI.filterExpand && window.UI.filterExpand.init) window.UI.filterExpand.init();
    if (window.UI.cartOrder && window.UI.cartOrder.init) window.UI.cartOrder.init();
  };

  console.log('[core/ui] loaded');
})(window);
