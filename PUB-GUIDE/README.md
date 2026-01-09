# 퍼블리싱 가이드

- 이미지 경로(프로젝트 기준): `/resources/img/mro/renewal`
- 가이드 페이지 생성 참고: `/g-foundations/g-icon.ejs`
  - 가이드 전용 SCSS: `scss/pages/guide.scss`
  - 가이드 페이지 식별(가이드에서만 추가 스타일/스크립트 적용):
    ```html
    <!-- 가이드 페이지 식별: data-guide="true" -->
    <body class="vits-scope" data-guide="true"></body>
    ```
- SCSS 스타일린트 자동 개행 예외(@if / @else 구문):

  ```scss
  @if $direct == 'all' {
    // ...
  }
  // @else 구문에서만 at-rule-empty-line-before 룰이 걸려 예외 처리
  // stylelint-disable-next-line at-rule-empty-line-before
  @else {
    // ...
  }
  ```

- EJS/HTML 자동 포맷(개행/정렬) 예외(가독성 유지용, 최소 범위 적용):
  - `prettier-ignore`는 **“바로 다음 노드 1개”에만 적용**됨(필요한 블록 바로 위에만 사용)
  ```ejs
  <!-- prettier-ignore -->
  <% ... %>
  ```
  ```html
  <!-- prettier-ignore -->
  <div>...</div>
  ```

<br />

## 1. 클래스 네이밍 규칙 (vits- Prefix)

모든 신규 클래스는 `vits-` 접두어를 필수로 사용한다.<br/>
이는 **기존 운영 소스와의 클래스 충돌을 방지**하기 위함이다.

### 1.1. 규칙

- 클래스명은 반드시 `vits-`로 시작한다.
- 소문자와 하이픈(`-`)을 사용한다.
- 역할 기준으로 명명한다.

### 1.2. 예시

- `vits-wrap`
- `vits-button`
- `vits-dropdown`
- `vits-modal`

<br />

## 2. SCSS

### 2.1. SCSS. 내장 모듈

```scss
// -----------------------------------------------------------------------------
// base/_colors.scss.               <- 파일 경로
// - 프로젝트 공통 색상 토큰/팔레트 모음    <- 파일 간략 설명
// -----------------------------------------------------------------------------

/**
 *  토큰, 옵션 맵, 반응형 설정 등에서 거의 필수 
 *  : map.get (자주 사용) / map.merge / map.has-key / map.remove / map.keys / map.values
 */
@use 'sass:map';

/**
 * 타입 검사, 디버깅, 방어 코드 작성 시 사용
 * : meta.type-of / meta.inspect / meta.content-exists / meta.global-variable-exists
 */
@use 'sass:meta';

/**
 * 네이밍 조합, 문자열 처리 시 사용
 * : string.index / string.slice / string.length / string.unquote
 */
@use 'sass:string';

/**
 * 리스트 반복 및 값 조작 시 사용
 * : list.nth / list.append / list.length / list.index
 */
@use 'sass:list';

/**
 * 수치 계산 및 단위 처리 시 사용
 * : math.div / math.round / math.ceil / math.floor
 */
@use 'sass:math';

/**
 * 컬러 값 조정 및 조합 시 사용
 * : color.scale / color.adjust / color.mix / color.alpha
 */
@use 'sass:color';

/**
 * 고급 셀렉터 조작이 필요한 경우에만 사용
 * : selector.nest / selector.append / selector.extend
 */
@use 'sass:selector';
```

<br />

### 2.2. SCSS 베이스 설정

```scss
/* 
 *  내장 모듈 기입    ← sass:map 같은 SCSS 내장 모듈
 *  베이스 설정 기입   ← 프로젝트 변수, 믹스인 등
 */

// -----------------------------------------------------------------------------
// 내장 모듈
// -----------------------------------------------------------------------------
@use 'sass:map';
@use 'sass:math';

// -----------------------------------------------------------------------------
// 프로젝트 베이스 설정
// -----------------------------------------------------------------------------
/* 
 *  옳지 않은 예
 *  - 장점: 작성 편의성 ↑, 모든 변수/함수/믹스인을 별도 선언 없이 사용 가능
 *  - 단점: 프로젝트 규모가 커지고 SCSS 파일이 많아질 경우, 의존성 꼬임 및 모듈 순환(Module Loop) 오류 발생 가능
 */
@use '@/assets/scss/abstracts/index' as *;

/* 
 *  옳은 예
 *  - abstracts/index를 통째로 as * 사용하기보다는, 필요한 모듈만 별도 namespace로 가져오기
 */
@use '@/assets/scss/abstracts/variables' as var;
@use '@/assets/scss/abstracts/mixins' as mx;
@use '@/assets/scss/abstracts/functions' as fn;
@use '@/assets/scss/base/colors' as color;
@use '@/assets/scss/base/typography' as typo;
@use '@/assets/scss/components/icon' as icon;
```

<br />

### 2.3. SCSS 기본 작성 예시

```scss
// -----------------------------------------------------------------------------
// abstracts/_functions.scss
// - 전역에서 사용하는 Sass 함수 모음
// -----------------------------------------------------------------------------

@use 'sass:map';
@use 'sass:math';
@use 'sass:meta';
@use 'sass:list';
@use '@/assets/scss/base/colors' as color;

// 관련 scss 작성
```

<br />

### 2.4. SCSS 폴더 구조

```text
scss/
├─ abstracts/                 # 전역 유틸(변수/함수/믹스인) 및 공통 설정
│  ├─ _functions.scss         # 전역 함수(rem, dim 등)
│  ├─ _mixins.scss            # 전역 믹스인(레이아웃/유틸/헬퍼)
│  ├─ _variables.scss         # 전역 변수(브레이크포인트, 단위, z-index 등)
│  ├─ index.scss              # abstracts 배럴(@forward 모음)
│  └─ root.scss               # 전역 루트 설정(:root 토큰/커스텀프로퍼티 등)
├─ base/                      # 기본 스타일(리셋/폰트/컬러/타이포 등)
│  ├─ _colors.scss            # 프로젝트 컬러 토큰/팔레트
│  ├─ _fonts.scss             # 폰트 로드(@font-face)
│  ├─ _reset.scss             # 기본 초기화(reset/기본 요소 스타일)
│  ├─ _scrollbar.scss         # vits-scope 스크롤바 스킨(시각 스타일)
│  ├─ _typography.scss        # 타이포 토큰/믹스인/기본 텍스트 규칙
│  └─ index.scss              # base 배럴(@forward 모음)
├─ components/                # 컴포넌트 스타일 엔트리(모듈 모음)
│  └─ index.scss              # 컴포넌트 SCSS 모듈 모음
├─ layout/                    # 레이아웃 스타일(그리드/헤더/푸터/컨테이너 등)
│  ├─ _wrapper.scss           # [수정 금지] Layout Core: wrapper 프레임 + grid 기본 구조 + sticky 정책(body 스크롤 기준)
│  ├─ _header.scss            # 헤더 레이아웃
│  ├─ _footer.scss            # 푸터 레이아웃
│  ├─ _grid.scss              # grid 확장/옵션(필요 시에만). 기본 구조/정책은 _wrapper.scss(Core) 기준을 따른다
│  └─ index.scss              # 레이아웃 SCSS 모듈 모음
├─ pages/                     # 페이지 단위 스타일(화면별/라우트별)
│  └─ index.scss              # 페이지 SCSS 모듈 모음
└─ vendors/                   # 외부 라이브러리/벤더 CSS
   └─ index.scss              # 벤더 CSS 모듈 모음
```

<br />

### 2.5. scrollbar.scss (스크롤바 커스텀 사용 규칙)

`_scrollbar.scss`는 vits 화면에서만 스크롤바의 시각 스타일을 CSS로 커스텀하기 위한 파일이다.<br />
스크롤 동작, 이벤트 제어, 라이브러리는 사용하지 않는다.

- **문서 스크롤**

  - `html.vits-scope`, `body.vits-scope` 기준으로 자동 적용된다.

- **내부 스크롤**

  - `overflow: auto` / `scroll`이 적용된 요소는 별도의 스크롤 컨텍스트이므로 자동 적용되지 않는다.
  - **내부 스크롤에도 동일한 스킨이 필요할 경우, 해당 요소에 `.vits-scrollbar` 클래스를 명시적으로(opt-in) 추가**한다.

- **주의 사항**

  - 전역(`::-webkit-scrollbar`)으로 덮어쓰는 방식은 금지한다.
  - 운영 전역 스타일 및 외부 컴포넌트와의 충돌을 방지하기 위함이다.

- **확장 방식**
  - 페이지별 색상 변경은 wrapper에서 CSS 변수만 덮어쓰는 방식으로 처리한다.

<br />

### 2.6. @include / @extend 작성 위치 규칙(Sass mixed-decls 예방)

Sass에서는 **중첩 규칙(@media, @supports, &:hover 등) 뒤에** <br />
**선언(display, padding 등)이 오는 구조를 mixed-decls로 판단**하며,<br />
향후 Sass 해석 방식 변경 시 스타일 결과가 달라질 수 있어 **경고가 발생.**<br />
<br />

#### 선택자 블록 내부의 작성 순서

- **기본 개념**

  - 선언(Declaration) :
    - `display`, `padding`, `min-height`, `overflow` 등 일반 속성
  - 중첩 규칙(Nested Rule)
    - `@media` / `@supports`
    - `&:hover`, `&:active`
    - `.child { … }` 형태의 내부 셀렉터

<br />

- **작성 원칙**

  - 같은 선택자 블록 안에서 **선언 → 중첩 규칙 순서**를 유지한다.
  - `@include`는 **해당 믹스인이 어떤 코드를 “출력하는지”에 따라 위치를 결정**한다.
    - 선언만 출력하는 믹스인 → 선언 영역 어디에 두어도 무방
    - `@media` / `@supports` 등 중첩 규칙을 포함하는 믹스인 → 선언 뒤, 중첩 영역에 배치
  - `@extend`는 코드 가독성을 위해 블록 최상단 배치 권장

<br />

- **mixin 예시** (선언 + 중첩 규칙이 함께 있는 경우)

  - 이 믹스인은 중첩 규칙(@supports)을 출력하므로 선언 영역과 섞이지 않게 주의해야 한다.

  ```scss
  @mixin full-height {
    min-height: 100vh; // 선언
    min-height: 100dvh; // 선언

    @supports not (height: 100dvh) {
      // 중첩 규칙
      min-height: calc(var(--vh, 1vh) * 100);
    }
  }
  ```

<br />

- **바른 작성 예시 (권장)**

  - → 선언이 먼저 나오고
  - → 중첩 규칙을 포함한 `@include`가 마지막에 위치
  - → `mixed-decls` 경고 없음

  ```scss
  .vits-wrapper {
    /* 1) (선택) @extend */
    // @extend %layout-frame;

    /* 2) 선언 영역 */
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
    overflow: hidden;

    /* 3) 중첩 규칙 영역 */
    @include mx.full-height;
  }
  ```

<br />

- **오류 발생 예시 (비권장)**

  - 중첩 규칙 이후 선언이 등장하여 경고 발생 가능

  ```scss
  .vits-wrapper {
    @include mx.full-height; // @supports가 먼저 출력됨

    display: flex; // 중첩 규칙 뒤 선언 → mixed-decls 경고
  }
  ```

<br />

> @media / @supports 등을 출력하는 @include는 같은 선택자 블록에서 반드시 선언 뒤에 배치한다.

<br />

## 3. `.ejs`

- [퍼블 산출물 (로컬 서버)](http://localhost:3333/html/index.html)

### 3.1. `.ejs` 파일/폴더 규칙

1. `IA(엑셀 파일)` 기준, `1depth(한글)`을 영문화하여 폴더 생성

- 예&rpar; 엑셀 `1depth` : 로그인 일 때
- 생성 폴더: `pages/login`

2. 파일명은 `IA(엑셀 파일)` 기준, `화면ID`로 생성.

- 예&rpar; 엑셀 `화면ID` : `PC_LO_02010101`
- 생성 파일 : `PC_LO_02010101.ejs`

<br />

### 3.2. `.ejs` 폴더 구조

```text
pages/
├─ g-components/                                     # 가이드: 컴포넌트 예시
│  └─ guide-toggle.ejs                               # 토글 컴포넌트 가이드
├─ g-foundations/                                    # 가이드: 파운데이션
│  └─ g-icon.ejs                                     # 아이콘 가이드
├─ g-template/                                       # 가이드: 템플릿(레이아웃 골격)
│  ├─ sample-main.ejs                                # 샘플(기본)
│  ├─ sample-left.ejs                                # 샘플(좌측)
│  ├─ sample-right.ejs                               # 샘플(우측)
│  ├─ template-main.ejs                              # 템플릿(기본)
│  ├─ template-side-left.ejs                         # 템플릿(좌측 사이드)
│  └─ template-side-right.ejs                        # 템플릿(우측 사이드)
├─ guide/                                            # 가이드 문서
│  ├─ plan/                                          # 설계/정리
│  └─ rule/                                          # 규칙
└─ index.ejs                                         # 퍼블리싱 현황판
```

## 4. JS

### 4.1. JS 폴더 구조

```text
scripts/
├─ index.js                                          # 번들 엔트리(짧게 유지)
├─ core/
│  ├─ utils.js                                       # 공통 유틸(항상 로드, 환경 보정/범용 로직)
│  ├─ ui.js                                          # UI 모듈 import 묶음 + UI.init 정의
│  └─ common.js                                      # DOMReady에서 UI.init 실행(트리거)
└─ ui/
   ├─ toggle.js                                      # 토글
   └─ swiper.js                                      # swiper
```

## 5. 접근성(aria) 최소 적용 가이드

본 프로젝트는 웹접근성 인증/전담 범위는 아니며,<br />
**마크업 단계에서 기본 사용성 확보를 위한 최소한의 aria 속성만 적용한다.**

### 5.1. 기본 원칙

- 의미가 명확한 **시맨틱 HTML을 우선 사용**한다.
- aria는 텍스트가 없거나 상태 변화가 있는 UI에 한해 **최소로 적용**한다.
- 불필요한 role, aria 속성의 과도한 사용은 지양한다.

<br />

### 5.2. 적용 대상 및 기준

#### 5.2.1. 텍스트 없는 버튼/링크

- 아이콘만 있는 컨트롤은 기능을 알 수 있도록 aria-label을 적용한다.

```html
<button type="button" aria-label="메뉴 열기"></button>
```

```html
<a href="#" aria-label="닫기"></a>
```

<br />

#### 5.2.2. 상태 변경 UI (토글/아코디언/드롭다운)

- 열림/닫힘 상태를 aria-expanded로 표기한다.
- 제어 대상은 aria-controls로 연결한다.

```html
<button type="button" aria-expanded="false" aria-controls="gnb-menu">전체 메뉴</button>

<div id="gnb-menu" hidden></div>
```

<br />

#### 5.2.3. 라벨이 없는 입력 요소

- 시각적 label이 없는 경우 aria-label 또는 숨김 label을 사용한다.

```html
<input type="search" aria-label="검색어 입력" />
```

<br />

#### 5.2.4. 모달/레이어 UI

- 모달 컨테이너에 dialog 역할을 명시한다.
- 제목 요소와 aria-labelledby로 연결한다.

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">공지사항</h2>
</div>
```

<br />

### 5.3. 적용하지 않는 경우

- 텍스트가 충분히 제공된 버튼/링크
- 단순 레이아웃 목적의 요소(div, span)
- title 속성만을 사용한 설명
