/**
 * @file scripts-mo/ui/breadcrumb/breadcrumb.js
 * @description 브레드크럼 — 카테고리 경로 표시 및 팝업 연동
 * @scope .vm-breadcrumb-list
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiBreadcrumb';
  var SCOPE = '.vm-breadcrumb-list';
  var LIST = '.vm-breadcrumb-items';
  var items = [];

  function render() {
    var $el = $(SCOPE);
    if (!$el.length) return;

    var $list = $el.find(LIST);
    if (!$list.length) return;

    // 홈 버튼은 유지하고 나머지만 교체
    var html = '<li><a href="/" class="vm-breadcrumb-btn"><span class="text">홈</span></a></li>';

    for (var i = 0; i < items.length; i++) {
      var isLast = i === items.length - 1;
      html +=
        '<li><button type="button" class="vm-breadcrumb-btn' +
        (isLast ? ' is-current' : '') +
        '">' +
        '<span class="text">' +
        escapeHtml(items[i]) +
        '</span>' +
        '</button></li>';
    }

    $list.html(html);
  }

  function update(names) {
    items = names || [];
    render();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bindEvents() {
    $(document)
      .off('click' + NS)
      .on('click' + NS, SCOPE + ' .vm-breadcrumb-btn:not([href])', function () {
        if (window.KendoWindow) {
          window.KendoWindow.open('categorySheet');

          // 팝업 열린 후 스크롤
          setTimeout(function () {
            if (window.CategorySheet && window.CategorySheet.scrollToActive) {
              window.CategorySheet.scrollToActive();
            }
          }, 100);
        }
      });
  }

  function init() {
    bindEvents();
  }

  window.CategoryBreadcrumb = {
    init: init,
    update: update
  };
})(window.jQuery, window);
