/**
 * @file scripts/ui/footer/footer-biz-info.js
 * @purpose 푸터 '사업자정보조회' 레이어 팝업에 통신판매사업자 등록현황(OpenAPI) 결과를 테이블로 주입
 * @assumption
 *  - 트리거: .company-btn-lookup + data-biz-brno="사업자등록번호(숫자)"
 *  - 레이어: [data-toggle-box="modal-company"] (open/close는 toggle.js가 담당, 여기서는 데이터 조회/주입만)
 *  - 상태/영역: [data-biz-status], [data-biz-table], [data-biz-field="..."]
 * @ops -note
 *  - 현재 인증키는 개인 계정 기준(개발/테스트용)
 *  - 운영 서버 반영 시 회사 계정/회사 정보 기준으로 인증키 및 관련 정보 수정/교체 요청 필요
 * @note
 *  - resultType=json 사용
 *  - OP_PATH는 사업자등록번호별 조회(/getMllBsBiznoInfo_2) 기준
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  // Config: 마크업 변경 대비(트리거/레이어/주입 셀렉터는 이 구간만 수정)
  var ROOT_SEL = '[data-footer-biz]'; // 스코프(없으면 document 기준으로 1회만 동작)
  var LAYER_SEL = '[data-toggle-box="modal-company"]'; // 레이어(푸터 사업자정보조회 팝업)
  var TRIGGER_SEL = '.company-btn-lookup'; // 트리거(사업자정보조회 버튼)

  var END_POINT = 'https://apis.data.go.kr/1130000/MllBs_2Service';
  var OP_PATH = '/getMllBsBiznoInfo_2';

  // Ops: 운영 반영 시 회사 계정 키로 교체 필요(Encoding 키 권장)
  var SERVICE_KEY = '06d4351e0dfaaa207724b9c64e8fcc9814fce520ff565409cd7b70715706f34b';

  var STATUS_SEL = '[data-biz-status]'; // 상태 문구 영역
  var TABLE_SEL = '[data-biz-table]'; // 결과 테이블(숨김 토글 대상)
  var FIELD_SEL = '[data-biz-field]'; // 필드 셀(키 기반 주입)

  // Event: destroy/unbind 대비 네임스페이스 고정
  var EVT_NS = '.footerBizInfo';

  // Cache: 동일 brno 중복 호출 방지(진행 중 요청은 합치고, 성공 결과는 brno별 보관)
  var cache = {
    items: {}, // { [brno]: item }
    pendings: {} // { [brno]: jqXHR/promise }
  };

  // DOM: root 스코프 기준으로 레이어/주입 대상 캐시(레이어는 first()만 사용)
  function getEls($root) {
    var $scope = $root && $root.length ? $root : $(document);
    var $layer = $scope.find(LAYER_SEL).first();

    return {
      $root: $scope,
      $layer: $layer,
      $status: $layer.find(STATUS_SEL).first(),
      $table: $layer.find(TABLE_SEL).first(),
      $fields: $layer.find(FIELD_SEL)
    };
  }

  // Utils: 사업자등록번호는 숫자만 유지(비정상 입력 방어)
  function normalizeBrno(v) {
    return String(v || '').replace(/\D/g, '');
  }

  // Utils: 사업자등록번호 표시용 포맷(000-00-00000)
  function formatBrno(v) {
    var n = normalizeBrno(v);
    if (n.length === 10) return n.slice(0, 3) + '-' + n.slice(3, 5) + '-' + n.slice(5);
    return n || '-';
  }

  // Utils: YYYYMMDD → YYYY.MM.DD 표시
  function formatYmd(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 8) return n.slice(0, 4) + '.' + n.slice(4, 6) + '.' + n.slice(6);
    return n || '-';
  }

  // Fetch: API 호출 URL 조립(사업자등록번호별 조회)
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

  // Parse: OpenAPI 표준 header(resultCode/resultMsg) 추출(가능한 경우)
  function pickApiMeta(json) {
    var header = json && json.response && json.response.header;
    if (!header) return null;

    return {
      resultCode: header.resultCode,
      resultMsg: header.resultMsg
    };
  }

  // Parse: OpenAPI 응답 구조 변동 대응(일반 케이스 우선, 실패 시 fallback DFS)
  function pickFirstItem(json) {
    var body = json && json.response && json.response.body;
    var root = body || json;

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

    // Fallback: 데이터처럼 보이는 객체를 DFS로 1개 탐색(정답 보장 로직이 아닌 최후 방어)
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

        for (var j = 0; j < keys.length; j += 1) {
          var r2 = findFirstObject(node[keys[j]], depth + 1);
          if (r2) return r2;
        }
      }

      return null;
    }

    return findFirstObject(root, 0);
  }

  // UI: 상태 문구/테이블 노출만 제어(레이어 open/close는 toggle.js 담당)
  function setUiLoading(els) {
    if (els.$status.length) els.$status.text('조회 중입니다…');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  // UI: 에러 시 문구 표시 및 테이블 숨김
  function setUiError(els, msg) {
    if (els.$status.length) els.$status.text(msg || '조회에 실패했습니다.');
    if (els.$table.length) els.$table.prop('hidden', true);
  }

  // UI: 성공 시 문구 제거 및 테이블 노출
  function setUiSuccess(els) {
    if (els.$status.length) els.$status.text('');
    if (els.$table.length) els.$table.prop('hidden', false);
  }

  // Render helper: data-biz-field 키로 셀을 찾아 텍스트 주입(값 없으면 '-')
  function setFieldText(els, key, value) {
    if (!els || !els.$layer || !els.$layer.length) return;

    var $cell = els.$layer.find('[data-biz-field="' + key + '"]').first();
    if (!$cell.length) return;

    $cell.text(value == null || value === '' ? '-' : String(value));
  }

  // Render: 테이블 필드 매핑(스펙 변경 시 여기만 수정)
  function renderBizInfo(els, brno, item) {
    setFieldText(els, 'bzmnNm', item && item.bzmnNm); // 상호
    setFieldText(els, 'brno', formatBrno((item && item.brno) || brno)); // 사업자등록번호
    setFieldText(els, 'operSttusCdNm', item && item.operSttusCdNm); // 운영상태
    setFieldText(els, 'ctpvNm', item && item.ctpvNm); // 시/도
    setFieldText(els, 'dclrInsttNm', item && item.dclrInsttNm); // 신고기관
    setFieldText(els, 'fromYmd', formatYmd(item && item.fromYmd)); // 신고일/조회기간(스펙 확정 시 필드명 기준으로 조정)
    setFieldText(els, 'prmmiMnno', item && item.prmmiMnno); // 인허가(등록)번호
  }

  // Fetch: JSON 파싱 실패 방어(text로 받는 경우 대비)
  function parseJsonSafe(text) {
    try {
      return typeof text === 'string' ? JSON.parse(text) : text;
    } catch (e) {
      console.warn('[footerBizInfo] JSON parse failed:', e);
      return null;
    }
  }

  // Fetch: 동일 brno는 1회만 조회(진행 중 요청은 pendings 재사용)
  function fetchBizInfoOnce(brno) {
    var n = normalizeBrno(brno);
    if (!n) return $.Deferred().reject('INVALID_BRNO').promise();

    if (cache.items[n]) return $.Deferred().resolve(cache.items[n]).promise();
    if (cache.pendings[n]) return cache.pendings[n];

    cache.pendings[n] = $.ajax({
      url: buildUrl(n),
      method: 'GET',
      dataType: 'text', // 서버 응답 헤더/포맷 이슈 대비(필요 시 json으로 변경)
      timeout: 8000 // 운영 환경/네트워크 정책에 따라 조정 가능
    })
      .then(function (text) {
        var json = parseJsonSafe(text);
        if (!json) return $.Deferred().reject('PARSE_ERROR').promise();

        var meta = pickApiMeta(json);
        if (meta && meta.resultCode && meta.resultCode !== '00') {
          return $.Deferred()
            .reject(meta.resultMsg || 'API_ERROR')
            .promise();
        }

        var item = pickFirstItem(json);
        if (!item) return $.Deferred().reject('EMPTY').promise();

        cache.items[n] = item;
        return item;
      })
      .always(function () {
        delete cache.pendings[n];
      });

    return cache.pendings[n];
  }

  // Bind: 트리거에서 사업자번호 읽기(숫자만)
  function readBrno($btn) {
    return normalizeBrno($btn && $btn.length ? $btn.attr('data-biz-brno') : '');
  }

  // Bind: 트리거 클릭 시 조회/주입만 수행(레이어 토글은 toggle.js)
  function bindTrigger(els) {
    var $root = els.$root;

    // Bind: 동일 root에서 중복 바인딩 방지(재초기화 대비)
    $root.off('click' + EVT_NS, TRIGGER_SEL);

    $root.on('click' + EVT_NS, TRIGGER_SEL, function () {
      var brno = readBrno($(this));
      if (!els.$layer.length) return;

      if (!brno) {
        setUiError(els, '사업자등록번호가 없습니다.');
        return;
      }

      // UX: 캐시가 없을 때만 로딩 표시(선조회/기조회면 즉시 렌더)
      if (!cache.items[brno]) setUiLoading(els);

      fetchBizInfoOnce(brno)
        .then(function (item) {
          setUiSuccess(els);
          renderBizInfo(els, brno, item);
        })
        .fail(function (err) {
          setUiError(els, err === 'EMPTY' ? '조회 결과가 없습니다.' : '조회에 실패했습니다.');
        })
        .always(function () {
          // UX: 비정상 종료로 로딩 문구가 남는 경우 방어
          if (els.$status.length && els.$status.text() === '조회 중입니다…') {
            setUiError(els, '조회에 실패했습니다.');
          }
        });
    });
  }

  // Prefetch: 최초 1회 선조회로 팝업 오픈 시 즉시 렌더(실패해도 UX 영향 최소)
  function prefetchOnce(els) {
    var $btn = els.$root.find(TRIGGER_SEL).first();
    var brno = readBrno($btn);

    if (!brno) return;

    if (cache.items[brno]) {
      renderBizInfo(els, brno, cache.items[brno]);
      return;
    }

    fetchBizInfoOnce(brno).then(function (item) {
      renderBizInfo(els, brno, item);
    });
  }

  // Init: root 1개 초기화(스코프별 분리 가능)
  function initRoot($root) {
    var els = getEls($root);
    if (!els.$layer.length) return;

    bindTrigger(els);
    prefetchOnce(els);
  }

  window.UI.footerBizInfo = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      var $roots = $(ROOT_SEL);

      // 스코프가 없으면 문서 기준으로 1회만 초기화
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
