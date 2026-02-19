/*
 * name : glim.js
 * desc : 퍼블리싱 현황판
 * writer : glim han
 * date : 2020/02/13
 * last : 2020/02/13
 *
 */

$(document).ready(function () {
  ia.init();
});

function funcIAMenuDropdown() {
  $('.ia-header-guide-mobile').toggleClass('is-visible');
}

var ia = {
  init: function () {
    var _this = this;
    var _color = $('body').data('theme-color');
    $('.ia-header-wrapper').css('background-color', _color);
    $('.ia-header-wrapper > .ia-section').append('<ul class="js-cate-group"></ul>');

    $('.ia-section-list')
      .each(function (i) {
        var file = $(this).data('file');
        var color = $(this).data('color');
        var graphHtml =
          '<li>' +
          '	<a href="#gIA' +
          i +
          '">' +
          '		<span class="tit"><!-- 자동입력 --></span>' +
          '		<span class="bar" data-color="' +
          _color +
          '"><span class="active"></span></span>' +
          '		<span class="pages"><em class="graph-complete"></em>/<em class="graph-total"></em></span>' +
          '	</a>' +
          '</li>';

        var cateHtml =
          '<li>' + '	<a href="#gIA' + i + '">' + i + '-' + $(this).find('.ia-h2 > a').text() + '	</a>' + '</li>';

        $(this).attr('id', 'gIA' + i);
        $('.ia-graph .graph').append(graphHtml);

        _this.cal('#gIA' + i, i);

        $('.js-cate-group').append(cateHtml);
        $('.ia-content-body').css('padding-top', $('.ia-header-wrapper').outerHeight());
        $('.ia-content-body .ia-section-list').css('padding-top', $('.ia-header-wrapper').outerHeight());
      })
      .promise()
      .done(function () {
        //console.log ( 'len',  $('.ia-tbl-wrap').find('.row-done-new').length );
        $('.ia-total-legend .c-total .value').text($('.ia-tbl-wrap').find('tbody > tr').length);
        $('.ia-total-legend .c-done .value').text(
          $('.ia-tbl-wrap').find('.row-done').length +
            $('.ia-tbl-wrap').find('.row-done-new').length +
            $('.ia-tbl-wrap').find('.row-done-update').length
        );
        $('.ia-total-legend .c-done-new .value').text($('.ia-tbl-wrap').find('.row-done-new').length);
        $('.ia-total-legend .c-done-update .value').text($('.ia-tbl-wrap').find('.row-done-update').length);

        applyPopupLabelText(); // 팝업 유형 텍스트 주입

        $('.ia-section-header').on('click', function () {
          $(this).parents('.ia-section').toggleClass('is-hide');
        });
      });
  },
  cal: function (obj, idx) {
    var lastUpdateDate = String(findLastUpdateDate(obj)); //날짜중 최종완료날짜 찾아옴
    //console.log(lastUpdateDate);
    var today = lastUpdateDate.substr(0, 2) + '-' + lastUpdateDate.substr(2, 2) + '-' + lastUpdateDate.substr(4, 2);

    $(obj)
      .find('td.col-complete')
      .each(function (n) {
        var text = $(this).text();
        var completedd = $(this).siblings('.col-date').text().toString();
        //완료,수정날짜있는경우 마지막날짜로 체크
        var lastdate = completedd.indexOf('/') == -1 ? completedd.trim() : completedd.toString().split('/')[1].trim();
        //console.log(lastdate, today);
        if (completedd.indexOf('/') == -1 && text == '완료' && lastdate == today.toString()) {
          $(this).parent('tr').addClass('row-done-new'); //노란색
        } else if (completedd.indexOf('/') != -1 && lastdate == today.toString()) {
          $(this).parent('tr').addClass('row-done-update'); //초록색
          $(this).text('수정');
        } else if (text == '완료') {
          $(this).parent('tr').addClass('row-done'); //하늘색
        } else if (text == '삭제' || text == '병합') {
          $(this).parent('tr').addClass('row-del'); //
          // $(this).parent('tr').find('.col-memo').empty();
          $(this).parent('tr').find('.col-memo').addClass('active row-del');
        } else if (text == '진행중') {
          $(this).parent('tr').addClass('row-ing'); //
          $(this).parent('tr').find('.col-memo').addClass('active');
        }
      });

    $(obj)
      .find('td.col-date')
      .each(function () {
        var text = $(this).text().trim();
        if (text.indexOf('/') !== -1) {
          var lastDate = text.split('/').pop().trim();
          $(this).text(lastDate);
        }
      });
    //console.log(lastUpdateDate, today);

    //계산
    var cal_total = $(obj).find('.ia-tbl-wrap tbody > tr').length; //총페이지갯수
    var cal_complete = $(obj).find('.row-done , .row-done-update, .row-done-new, .row-del').length; //완료페이지
    var cal_process = Math.round((cal_complete / cal_total) * 100);

    var new_len = $(obj).find('.row-done-new').length;
    var update_len = $(obj).find('.row-done-update').length;
    var cal_total_txt = new_len == 0 ? cal_total : cal_total + '<span class="ico-new">New(' + new_len + ')</span>';
    cal_total_txt =
      update_len == 0 ? cal_total_txt : cal_total_txt + '<span class="ico-update">Update(' + update_len + ')</span>';

    //그래프
    var graph = $('.ia-graph a[href="' + obj + '"]');
    var graph_tit = $(graph).find('.tit');
    var graph_total = $(graph).find('.graph-total');
    var graph_complete = $(graph).find('.graph-complete');
    var graph_process = $(graph).find('.bar');
    var graph_active = $(graph).find('.bar .active');
    graph_total.html(cal_total_txt);
    graph_complete.html(cal_complete);
    graph_process.attr('data-process', cal_process + '%');
    graph_active.css({backgroundColor: graph_process.data('color'), width: cal_process + '%'});

    //범례
    var legend_total = $(obj).find('.legend-total');
    var legend_complete = $(obj).find('.legend-complete');
    var legend_process = $(obj).find('.legend-process');
    legend_total.text(cal_total);
    legend_complete.text(cal_complete);
    if (cal_complete > 0) {
      legend_process.text(cal_process + '%');
    } else {
      legend_process.text('0%');
    }

    //리스트
    var ia_num = $(obj).find('.col-num');
    graph_tit.html(ia_tit);

    //넘버링
    for (var i = 0; i < cal_total; i++) {
      ia_num.eq(i).text(i + 1);
    }

    /*20190516 update*/
    //리스트
    var ia_tit = $(obj).find('.ia-h2 > a').text();
    $(obj)
      .find('.ia-h2 > a')
      .text('#' + idx + ' ' + ia_tit);
    graph_tit.html('#' + idx + ' ' + ia_tit);

    $('.ia-total-legend .c-last-date .value').text(lastUpdateDate);

    $(obj)
      .find('button.btn-memo')
      .each(function () {
        // 완료 신규/수정 완료일 때 자동으로 열어버리는 로직 제거 (요구사항: 완료는 닫힘)
        // if ($(this).closest('tr').hasClass('row-done-new') || $(this).closest('tr').hasClass('row-done-update')) {
        //   $(this).closest('tr').find('.col-memo').toggleClass('active');
        // }
        $(this).click(function () {
          $(this).closest('tr').find('.col-memo').toggleClass('active');
          return false;
        });
      });

    $(obj)
      .find('.btn-memo-all')
      .click(function () {
        if ($(this).parents('table').find('.col-memo.active').length > 0) {
          $(this).parents('table').find('.col-memo').removeClass('active');
        } else {
          $(this).parents('table').find('.col-memo').addClass('active');
        }
      });
  }
};

function numReturnToZero(a) {
  if (a < 10) {
    a = '0' + a;
  }
  return a;
}
function findLastUpdateDate(obj) {
  var maxdd = 0;
  var lastdate = 0;
  $('td.col-date').each(function (n) {
    var completedd = $(this).text().split('-').join('').trim();
    completedd = completedd.replace(/ /gi, '');
    lastdate = completedd.indexOf('/') == -1 ? Number(completedd) : Number(completedd.toString().split('/')[1]);
    lastdate = lastdate.toString().length > 6 ? Number(lastdate.toString().substring(6, 6)) : lastdate; //20200313 case add
    maxdd = Math.max(lastdate, maxdd);
    //console.log ("---------------", lastdate, completedd, maxdd);
  });
  //console.log ( "--------------------recent----",  maxdd );
  return maxdd;
}

function trim(x) {
  return x.replace(/^\s+|\s+$/gm, '');
}

// [D] col-popup 표시 텍스트를 DOM에 실제로 주입(검색/복사용)
// - CSS ::after(content)는 화면 표기만 되고 텍스트 검색에 안 잡힐 수 있음
// - data-popup 값 기준으로 셀 텍스트를 넣어 검색 가능하게 처리
function applyPopupLabelText() {
  var POPUP_LABEL = {
    b: 'bottom sheet',
    sr: 'side slide (right)',
    sl: 'side slide (left)',
    m: 'center modal',
    f: 'full'
  };

  $('.ia-tbl-wrap table td.col-popup').each(function () {
    var $cell = $(this);
    var key = String($cell.data('popup') || '').trim();
    if (!key || !POPUP_LABEL[key]) return;

    // 기존 텍스트가 이미 있으면 덮어쓰지 않음(수동 입력 보호)
    var current = $cell.text().trim();
    if (current) return;

    $cell.text(POPUP_LABEL[key]);
  });
}
