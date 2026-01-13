/**
 * @file scripts/ui/footer/footer-biz-info.js
 * @purpose 푸터 '사업자정보조회' 레이어 팝업에 통신판매사업자 등록현황(OpenAPI) 결과를 테이블로 주입
 * @assumption
 *  - 트리거: [data-toggle-btn="biz-info"] + data-biz-brno="사업자등록번호(숫자)"
 *  - 레이어: [data-toggle-box="biz-info"] (open/close는 toggle.js가 담당, 여기서는 데이터 조회/주입만)
 *  - 상태/영역: [data-biz-status], [data-biz-table], [data-biz-field="..."]
 * @ops -note
 *  - 현재 인증키는 개인 계정 기준(개발/테스트용)이며,
 *    운영 서버 반영 시 회사 계정/회사 정보 기준으로 인증키 및 관련 정보 수정/교체 요청 필요
 * @note
 *  - resultType=json 사용
 *  - OP_PATH는 사업자등록번호별 조회(/getMllBsBiznoInfo_2) 기준
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var ROOT_SEL = '[data-footer-biz]'; // 푸터 스코프(없으면 document 기준으로도 동작)
  var LAYER_SEL = '[data-toggle-box="modal-company"]';
  var TRIGGER_SEL = '.company-btn-lookup';

  var END_POINT = 'https://apis.data.go.kr/1130000/MllBs_2Service';
  var OP_PATH = '/getMllBsBiznoInfo_2';

  // 실제 키로 교체(Encoding 키 권장)
  var SERVICE_KEY = '06d4351e0dfaaa207724b9c64e8fcc9814fce520ff565409cd7b70715706f34b';

  // 레이어 내부 셀렉터(주입 대상)
  var STATUS_SEL = '[data-biz-status]';
  var TABLE_SEL = '[data-biz-table]';
  var FIELD_SEL = '[data-biz-field]';

  // 전역 1건 캐시(회사 고정 1개 기준: 최초 조회 후 재사용)
  var cache = {
    brno: null,
    item: null,
    pending: null
  };

  // root 내부 주요 엘리먼트 캐시
  function getEls($root) {
    var $scope = $root && $root.length ? $root : $(document);
    var $layer = $scope.find(LAYER_SEL).first();

    return {
      $root: $root && $root.length ? $root : $scope,

      $layer: $layer,
      $status: $layer.find(STATUS_SEL).first(),
      $table: $layer.find(TABLE_SEL).first(),
      $fields: $layer.find(FIELD_SEL)
    };
  }

  // 테이블 셀에 텍스트 주입(없으면 '-' 처리)
  function setFieldText(els, key, value) {
    var $cell = els.$layer.find('[data-biz-field="' + key + '"]').first();
    $cell.text(value == null || value === '' ? '-' : String(value));
  }

  // 사업자등록번호 표시용 포맷(000-00-00000)
  function formatBrno(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 10) return n.slice(0, 3) + '-' + n.slice(3, 5) + '-' + n.slice(5);
    return n || '-';
  }

  // YYYYMMDD → YYYY.MM.DD 표시
  function formatYmd(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 8) return n.slice(0, 4) + '.' + n.slice(4, 6) + '.' + n.slice(6);
    return n || '-';
  }

  // API 호출 URL 조립(사업자등록번호별 조회)
  function buildUrl(brno) {
    return (
      END_POINT +
      OP_PATH +
      '?serviceKey=' +
      encodeURIComponent(SERVICE_KEY) +
      '&pageNo=1' +
      '&numOfRows=10' +
      '&resultType=json' +
      '&brno=' +
      encodeURIComponent(brno)
    );
  }

  function pickFirstItem(json) {
    // OpenAPI 표준 래퍼가 있으면 body부터, 아니면 json 자체부터 탐색
    var body = json && json.response && json.response.body;
    var root = body || json;

    // 1) 가장 흔한 패턴들 먼저 시도
    var v;

    // body.items.item
    v = root && root.items && root.items.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.item
    v = root && root.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.items
    v = root && root.items;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // 2) 그래도 못 찾으면: root 안에서 "데이터처럼 보이는 객체"를 DFS로 1개 찾아서 반환
    function findFirstObject(node, depth) {
      if (!node || depth > 8) return null;

      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i += 1) {
          var r1 = findFirstObject(node[i], depth + 1);
          if (r1) return r1;
        }
        return null;
      }

      if (typeof node === 'object') {
        var keys = Object.keys(node);

        // 원시값(문자/숫자/불리언) 필드가 3개 이상이면 “데이터 객체”로 간주
        var primitiveCount = 0;
        for (var k = 0; k < keys.length; k += 1) {
          var val = node[keys[k]];
          var t = typeof val;
          if (val == null) continue;
          if (t === 'string' || t === 'number' || t === 'boolean') primitiveCount += 1;
        }
        if (primitiveCount >= 3) return node;

        // 자식 탐색
        for (var j = 0; j < keys.length; j += 1) {
          var r2 = findFirstObject(node[keys[j]], depth + 1);
          if (r2) return r2;
        }
      }

      return null;
    }

    return findFirstObject(root, 0);
  }

  // 레이어 상태(로딩/에러/성공) UI만 담당
  function setUiLoading(els) {
    if (els.$status.length) els.$status.text('조회 중입니다…');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  function setUiError(els, msg) {
    if (els.$status.length) els.$status.text(msg || '조회에 실패했습니다.');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  function setUiSuccess(els) {
    if (els.$status.length) els.$status.text(''); // 성공 시 문구 비움
    if (els.$table.length) els.$table.prop('hidden', false);
  }

  // 테이블에 필요한 "일반적인" 필드만 매핑(요구사항 최소셋)
  function renderBizInfo(els, brno, item) {
    // API 스펙 변경 시 여기 매핑만 업데이트하면 됨
    setFieldText(els, 'bzmnNm', item.bzmnNm); // 상호
    setFieldText(els, 'brno', formatBrno(item.brno || brno)); // 사업자등록번호
    setFieldText(els, 'operSttusCdNm', item.operSttusCdNm); // 운영상태
    setFieldText(els, 'ctpvNm', item.ctpvNm); // 시/도
    setFieldText(els, 'dclrInsttNm', item.dclrInsttNm); // 신고기관
    setFieldText(els, 'fromYmd', formatYmd(item.fromYmd)); // 조회기간/신고일(스펙에 맞게 조정)
    setFieldText(els, 'prmmiMnno', item.prmmiMnno); // 인허가(등록)번호
  }

  // 동일 사업자번호는 1회만 조회하고 재사용(중복 호출 방지)
  function fetchBizInfoOnce(brno) {
    if (cache.item && cache.brno === brno) return $.Deferred().resolve(cache.item).promise();
    if (cache.pending && cache.brno === brno) return cache.pending;

    cache.brno = brno;

    cache.pending = $.ajax({
      url: buildUrl(brno),
      method: 'GET',
      dataType: 'text',
      timeout: 8000
    })
      .then(function (text) {
        var json = typeof text === 'string' ? JSON.parse(text) : text;

        // 지금 단계에서 이 로그가 “정답”
        console.log('[biz] json=', json);

        var item = pickFirstItem(json);

        console.log('[biz] item=', item);
        console.log('[biz] keys=', item ? Object.keys(item) : null);

        if (!item) return $.Deferred().reject('EMPTY').promise();

        cache.item = item;
        return item;
      })
      .always(function () {
        cache.pending = null;
      });

    return cache.pending;
  }

  // 트리거에서 사업자번호 읽기(숫자만)
  function readBrno($btn) {
    return String($btn.attr('data-biz-brno') || '').replace(/\D/g, '');
  }

  function bindTrigger(els) {
    $(document).on('click.footerBizInfo', TRIGGER_SEL, function () {
      var brno = readBrno($(this));
      if (!els.$layer.length) return;

      if (!brno) {
        setUiError(els, '사업자등록번호가 없습니다.');
        return;
      }

      // 캐시가 없을 때만 로딩 표시(선조회 했으면 안 뜸)
      if (!(cache.item && cache.brno === brno)) setUiLoading(els);

      fetchBizInfoOnce(brno)
        .then(function (item) {
          setUiSuccess(els);

          // 디버그(화면에 “데이터 들어옴”을 강제로 표시)
          // if (els.$status.length) els.$status.text(JSON.stringify(item).slice(0, 200));

          renderBizInfo(els, brno, item);
        })
        .fail(function (err) {
          setUiError(els, err === 'EMPTY' ? '조회 결과가 없습니다.' : '조회에 실패했습니다.');
        })
        .always(function () {
          if (els.$status.length && els.$status.text() === '조회 중입니다…') {
            setUiError(els, '조회에 실패했습니다.');
          }
        });
    });
  }

  // root 1개 초기화
  function initRoot($root) {
    var els = getEls($root);
    if (!els.$layer.length) return;

    // 클릭 바인딩은 그대로
    bindTrigger(els);

    // --- S: 페이지 진입 시 1회 선조회(prefetch) ---
    // 버튼에 박아둔 사업자번호를 1개만 가져와서 캐시에 저장
    var $btn = $(TRIGGER_SEL).first();
    var brno = readBrno($btn);

    if (!brno) return;

    // 선조회는 사용자에게 로딩 문구를 강제로 보여줄 필요 없음(팝업 열기 전이니까)
    fetchBizInfoOnce(brno).then(function (item) {
      // 팝업을 열지 않아도, 미리 테이블에 값만 채워둠(열면 즉시 보임)
      renderBizInfo(els, brno, item);
    });
    // --- E: 페이지 진입 시 1회 선조회(prefetch) ---
  }

  window.UI.footerBizInfo = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      var $roots = $(ROOT_SEL);

      // data-footer-biz 스코프가 없으면 문서 기준으로 1회만 초기화
      if (!$roots.length) {
        initRoot($(document));
        return;
      }

      $roots.each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);
