/**
 * @file scripts/ui/form/textarea.js
 * @purpose textarea 공통: 글자수 카운트/제한(그래핌 기준) + IME(조합) 대응 + 스크롤 상태 클래스 토글
 * @scope .vits-textarea 컴포넌트 내부 textarea만 적용(전역 영향 없음)
 *
 * @rule
 *  - 높이/줄수/리사이즈는 CSS에서만 관리(JS는 height에 관여하지 않음)  // 단, single-auto/single-lock 모드에서만 inline height를 사용
 *  - 스크롤 발생 시에만 root에 .is-scroll
 *
 * @state
 *  - root.is-scroll: textarea 실제 overflow 발생 시 토글
 *
 * @option (root) data-textarea-count="true|false"
 * @option (textarea) data-max-length="500" // 입력 제한(선택, 그래핌 기준)
 * @option (root) data-textarea-mode="single-fixed|single-auto|single-lock|multi-fixed"
 * @option (root) data-textarea-max-lines="N"      // single-auto 최대 줄(선택)
 * @option (root) data-textarea-lock-lines="N"     // single-lock 잠금 줄(선택)
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - Intl.Segmenter 미지원 환경은 Array.from 폴백(그래핌 근사)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.textarea = window.UI.textarea || {};

  var MODULE_KEY = 'textarea';
  var NS = '.' + MODULE_KEY;

  var ROOT = '.vits-textarea';
  var TA = ROOT + ' textarea';

  var MODE = {
    SINGLE_FIXED: 'single-fixed',
    SINGLE_AUTO: 'single-auto',
    SINGLE_LOCK: 'single-lock',
    MULTI_FIXED: 'multi-fixed'
  };

  // 숫자 data-속성 파싱(없으면 0)
  function intAttr($el, name) {
    if (!$el || !$el.length) return 0;
    var v = parseInt($el.attr(name), 10);
    return Number.isFinite(v) ? v : 0;
  }

  // root 옵션 조회(문자열)
  function rootOpt($root, name) {
    return $root && $root.length ? $root.attr(name) || '' : '';
  }

  // root 옵션 조회(숫자)
  function rootOptInt($root, name) {
    return intAttr($root, name);
  }

  // 그래핌(사용자 체감 글자) 단위 카운트
  function graphemeCount(str) {
    var s = String(str || '');

    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {granularity: 'grapheme'});
        var c = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) c += 1;
        return c;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }

    return Array.from(s).length;
  }

  // 최대 글자수 기준 자르기(그래핌 우선)
  function sliceToMax(str, max) {
    var s = String(str || '');
    var m = parseInt(max, 10) || 0;
    if (!m) return s;

    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {granularity: 'grapheme'});
        var out = '';
        var i = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) {
          if (i >= m) break;
          out += r.value.segment;
          i += 1;
        }
        return out;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }

    return Array.from(s).slice(0, m).join('');
  }

  // 입력 제한 적용(조합 중엔 미적용)
  function enforceMaxLength($ta, isComposing) {
    if (!$ta || !$ta.length) return;

    var maxLen = intAttr($ta, 'data-max-length');
    if (!maxLen || isComposing) return;

    var v = $ta.val() || '';
    var next = sliceToMax(v, maxLen);
    if (next !== v) $ta.val(next);
  }

  // css 값(px) 파싱
  function pxNum(v) {
    var n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  // textarea 스타일 기반 line/extra 계산
  function metrics($ta) {
    var cs = window.getComputedStyle($ta[0]);

    var lh = pxNum(cs.lineHeight);
    if (!lh) lh = pxNum(cs.fontSize) * 1.5;

    var pt = pxNum(cs.paddingTop);
    var pb = pxNum(cs.paddingBottom);
    var bt = pxNum(cs.borderTopWidth);
    var bb = pxNum(cs.borderBottomWidth);

    return {line: lh, extra: pt + pb + bt + bb};
  }

  // rows 기준 높이(px) 계산
  function heightByRows($ta, rows) {
    var m = metrics($ta);
    var r = Math.max(1, rows || 1);
    return m.line * r + m.extra;
  }

  // textarea 높이(px) 주입
  function setHeightPx($ta, px) {
    $ta[0].style.height = Math.max(0, px) + 'px';
  }

  // inline height 제거(CSS 규칙으로 복귀)
  function clearHeightPx($ta) {
    $ta[0].style.height = '';
    $ta.removeClass('is-clamped is-locked');
  }

  // scrollHeight 기반 자동 높이 계산(clamp)
  function calcAutoHeightPx($ta, minPx, maxPx) {
    $ta[0].style.height = 'auto';
    var h = $ta[0].scrollHeight || 0;
    if (minPx) h = Math.max(h, minPx);
    if (maxPx) h = Math.min(h, maxPx);
    return h;
  }

  // 카운트 UI 갱신(옵션 true일 때만)
  function updateCountUI($root, $ta) {
    if (rootOpt($root, 'data-textarea-count') !== 'true') return;

    var $count = $root.find('[data-ui-textarea-count]').first();
    if (!$count.length) return;

    var v = $ta.val() || '';
    $count.text(String(graphemeCount(v)));

    var maxLen = intAttr($ta, 'data-max-length');
    var $max = $root.find('[data-ui-textarea-max]').first();
    if (maxLen && $max.length) $max.text(String(maxLen));
  }

  // 스크롤 발생 여부 감지(스크롤바 표시 시점 기준)
  function syncScrollState($root, $ta) {
    var el = $ta[0];
    if (!el) return;

    var oy = window.getComputedStyle(el).overflowY;
    var canScroll = oy === 'auto' || oy === 'scroll';

    if (!canScroll) {
      $root.removeClass('is-scroll');
      $ta.removeClass('vits-scrollbar');
      return;
    }

    var isOverflow = el.scrollHeight - el.clientHeight > 1;

    $root.toggleClass('is-scroll', isOverflow);
    $ta.toggleClass('vits-scrollbar', isOverflow);
  }

  // fixed 모드 처리(높이는 CSS가 담당)
  function syncFixedByCss($root, $ta) {
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
    clearHeightPx($ta);
  }

  // single-auto 높이 동기화(1줄 → max-lines까지 확장)
  function syncSingleAuto($root, $ta) {
    var baseRows = intAttr($ta, 'rows') || 1;
    var maxLines = rootOptInt($root, 'data-textarea-max-lines') || baseRows;

    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, maxLines);

    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);

    $ta.toggleClass('is-clamped', next >= maxPx);
    $ta.removeClass('is-locked');
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
  }

  // single-lock 높이 동기화(지정 줄수 도달 시 고정 전환)
  function syncSingleLock($root, $ta) {
    var locked = rootOpt($root, 'data-textarea-locked') === 'true';
    var lockLines = rootOptInt($root, 'data-textarea-lock-lines') || 1;
    var baseRows = intAttr($ta, 'rows') || 1;

    if (locked) {
      var lockPx = rootOptInt($root, 'data-textarea-locked-px');
      if (lockPx) setHeightPx($ta, lockPx);
      $ta.addClass('is-locked');
      return;
    }

    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, lockLines);

    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);

    // 줄수는 \n 기준(단일락 정책 유지)
    var v = ($ta.val() || '').replace(/\r\n/g, '\n');
    var lines = v.length ? v.split('\n').length : 1;

    if (lines >= lockLines) {
      $root.attr('data-textarea-locked', 'true');
      $root.attr('data-textarea-locked-px', String(next));
      $ta.addClass('is-locked');
    }

    $ta.toggleClass('is-clamped', next >= maxPx);
  }

  // 모드별 적용(제한 → 높이 → 카운트 → 스크롤)
  function apply($root, $ta, opts) {
    var isComposing = !!(opts && opts.isComposing);
    var mode = rootOpt($root, 'data-textarea-mode');

    enforceMaxLength($ta, isComposing);

    if (mode === MODE.SINGLE_FIXED || mode === MODE.MULTI_FIXED) syncFixedByCss($root, $ta);
    if (mode === MODE.SINGLE_AUTO) syncSingleAuto($root, $ta);
    if (mode === MODE.SINGLE_LOCK) syncSingleLock($root, $ta);

    updateCountUI($root, $ta);
    syncScrollState($root, $ta);
  }

  // 단일 textarea 초기 동기화
  function initOne($ta) {
    if (!$ta || !$ta.length) return;
    var $root = $ta.closest(ROOT);
    if (!$root.length) return;

    apply($root, $ta, {isComposing: false});
  }

  // 이벤트 바인딩(위임 1회, init 재호출 대비)
  function bindOnce() {
    $(document).off(NS);

    $(document)
      .on('compositionstart' + NS, TA, function () {
        $(this).data('isComposing', true);
      })
      .on('compositionend' + NS, TA, function () {
        var $ta = $(this);
        $ta.data('isComposing', false);
        initOne($ta);
      })
      .on('input' + NS, TA, function () {
        var $ta = $(this);
        var $root = $ta.closest(ROOT);
        if (!$root.length) return;

        apply($root, $ta, {isComposing: !!$ta.data('isComposing')});
      });
  }

  // root 범위 초기화(부분 렌더 지원)
  function initAll(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find(TA).each(function () {
      initOne($(this));
    });
  }

  window.UI.textarea = {
    init: function (root) {
      if (!window.UI.textarea.__bound) {
        bindOnce();
        window.UI.textarea.__bound = true;
      }
      initAll(root);
    },
    destroy: function () {
      $(document).off(NS);
      window.UI.textarea.__bound = false;
    }
  };
})(window.jQuery || window.$, window, document);
