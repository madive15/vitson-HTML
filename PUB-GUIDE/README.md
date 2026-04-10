# [Vitson-HTML] 프로젝트 통합 인수인계

이 문서는 비츠온(Vitson) 쇼핑몰 퍼블리싱 프로젝트의 구조, 작업 방식, 그리고 모든 JS/SCSS 파일에 대한 상세 기술 명세를 정리한 최종 가이드입니다.

---

## 1. 프로젝트 개요 및 기술 스택 (Overview)

- **목적**: PC 및 모바일(MO) 환경을 지원하는 고도화된 HTML/CSS/JS 퍼블리싱 결과물 제작.
- **핵심 철학**: 선언적 UI(Data-attributes 기반), 모듈화된 로직, 접근성(ARIA) 자동화.
- **Tech Stack**:
  - **Templating**: EJS (Embedded JavaScript) - 컴포넌트 단위 설계
  - **Styling**: SCSS (Sass), Tailwind CSS, PostCSS (Autoprefixer)
  - **Scripting**: jQuery, TypeScript, ES6+ - `window.UI` 네임스페이스 모듈화
  - **UI Libraries**: Kendo UI, Swiper 11
  - **Build Tool**: Webpack 5

---

## 2. 프로젝트 구조 (Directory Structure)

```text
/
├── config/              # Webpack 설정 (Common, Dev, Prod) 및 환경 변수
├── docs/                # 프로젝트 문서 및 AI 작업 로그 (gemini/)
├── public/              # 정적 리소스 (빌드 시 dist로 일괄 복사)
│   └── resources/
│       ├── css/         # 외부 라이브러리 및 공통 CSS
│       ├── images/      # 이미지 및 아이콘 자산
│       ├── mock/        # [핵심] EJS에 주입되는 JSON Mock 데이터 관리
│       └── kendo_new/   # Kendo UI 라이브러리 소스 및 테마
├── src/
│   ├── app.js           # PC 엔트리 (전역 스크립트 및 스타일 임포트)
│   ├── app-mo.js        # MO 엔트리
│   ├── assets/          # 소스 자산
│   │   ├── scripts/     # PC JavaScript/TypeScript 모듈
│   │   ├── scripts-mo/  # MO JavaScript 모듈 (utils, ui, core)
│   │   └── scss/        # SCSS 스타일 (PC/MO 폴더 분리 구조)
│   └── views/           # EJS 템플릿
│       ├── components/  # 재사용 가능한 UI 단위 (PC/MO 별도)
│       ├── layout/      # 레이아웃 (Header, Footer, LNB 등)
│       └── pages/       # 실제 서비스 페이지 단위 템플릿
└── _templates/          # 코드 제너레이터(Hygen) 템플릿
```

### 2.1. 빌드 결과물 구조 (Build Output Structure)

`pnpm build:sh:prettier` 실행 후 생성되는 `dist/` 폴더의 구조입니다. 모든 HTML과 주요 CSS는 Prettier를 통해 포맷팅이 완료된 상태입니다.

```text
dist/
├── assets/          # Webpack 번들 에셋 (fonts, scripts, css 등)
├── html/            # PC용 HTML 페이지 결과물
├── html-mo/         # 모바일용 HTML 페이지 결과물
├── resources/       # [핵심] 공통 정적 리소스 (이미지, CSS, JS, Mock)
│   ├── css/         # 후처리 및 포맷팅이 완료된 스타일시트
│   ├── js/          # 공통 라이브러리 및 유틸리티
│   ├── img/         # 이미지 및 아이콘 자산
│   └── mock/        # EJS 데이터 바인딩용 JSON 데이터
├── wsg/             # 퍼블리싱 가이드(WSG) 및 관련 리소스
├── index.html       # PC 퍼블리싱 현황판
└── index_mo.html    # 모바일 퍼블리싱 현황판
```

```
dist/resources/css/mro/renewal/\*.css
dist/resources/img/mro/renewal/\*.\*
dist/resources/js/mro/renewal/ui/\*.js
를 복사하여
개발 mro_renewal 레포의
src/main/webapp/resources/css/mro/renewal/\*.css
src/main/webapp/resources/img/mro/renewal/\*.\*
src/main/webapp/resources/js/mro/renewal/ui/\*.js
로 붙여넣기하여 개발소스로 옮겨주면된다
```

---

## 3. 작업 방식 및 워크플로우 (Work Workflow)

### 3.1. 신규 페이지 및 컴포넌트 생성

1.  **마크업 설계**: `src/views/pages/` 또는 `pages-mo/`에 새 EJS 파일을 생성합니다.
2.  **데이터 바인딩**: `public/resources/mock/`에 대응하는 JSON 데이터를 생성하고, EJS 상단에서 `mockData` 객체로 주입받아 반복문/조건문을 작성합니다.
3.  **컴포넌트화**: 2회 이상 중복되는 UI는 `views/components/`로 분리하여 `<%- include() %>`로 호출합니다.

### 3.2. 스타일링 규칙

- **계층 구조**: `abstracts` (변수/믹스인) → `base` (기초) → `components` (단위) → `pages` (특수) 순서의 의존성을 유지합니다.
- **네이밍**: `kebab-case`를 원칙으로 하며, 상태 제어는 클래스(`is-active`) 또는 데이터 속성(`[data-state]`)을 활용합니다.
- **아이콘**: 신규 아이콘 추가 시 `_icon.scss`의 `$svg-map`에 등록하여 `ic-mask` 믹스인으로 사용합니다.

### 3.3. 스크립트 모듈화

- **모듈 생성**: `scripts/ui/` 또는 `scripts-mo/ui/`에 기능 단위로 파일을 생성합니다.
- **자동 초기화**: 생성한 파일을 `core/ui.js`에서 `import`하고, `modules` 배열에 등록하면 DOM Ready 시점에 자동으로 `init()`이 실행됩니다.
- **선언적 바인딩**: JS에서 직접 DOM을 탐색하기보다 `data-vits-tab="id"`와 같이 마크업에 명시된 속성을 기준으로 로직을 작성합니다.

---

## 4. JavaScript 기술 명세 (JS Technical Reference)

### 4.1. Mobile Core 및 UI (`src/assets/scripts-mo/`)

- **core/common.js**: `DOMContentLoaded` 시 `window.UI` 내 모든 모듈의 `init()`을 일괄 실행하는 자동 초기화 엔진.
- **core/ui.js**: 모바일 모듈 진입점. 모듈 로드 순서 정의 및 `UI.init()` 통합 관리.
- **core/utils.js**: `is-pc` 기기 판별, iOS `--vh` 보정, `[data-scroll-end]` 자동 스크롤, 검색 오버레이 키보드 보정.
- **ui/scroll-lock.js**: iOS 대응 `position:fixed` + `top` 보정 방식의 전역 스크롤 잠금 모듈.
- **ui/brand/brand-sheet.js**: 초성(ㄱ~ㅎ) 필터링, 스냅 스크롤링, 뷰포트 맞춤 버튼 너비 역산(`fitButtons`).
- **ui/cart-order/cart.js**: 수량 증감 제어 및 텍스트 길이에 따른 인풋 너비 동적 계산(`measure`).
- **ui/cart-order/order.js**: 배송/결제 탭 연동, 화물 노출 조건부 제어, 결제 전용 Swiper(payment 타입) 관리.
- **ui/category/category-renderer.js**: 3뎁스 카테고리 계층 렌더링 엔진. AJAX 데이터 로드 및 동적 HTML 빌드.
- **ui/category/category-sheet.js**: 바텀시트 카테고리 선택기. 브레드크럼 동기화 및 `category:change` 이벤트 발행.
- **ui/category/category-tree-search.js**: 필터 팝업 내 아코디언 트리 및 검색 결과 더보기(`[data-search-more-btn]`) 제어.
- **ui/common/pull-refresh.js**: 내부 스크롤 컨테이너 전용 커스텀 Pull-to-refresh. `--pull-distance` 변수 전달.
- **ui/common/expand.js**: `Range API`를 활용한 실시간 텍스트 넘침 감지 및 더보기 버튼 동적 생성.
- **ui/common/tab-sticky.js**: 스크롤 위치 연동 탭. 섹션 도달 시 활성 탭 자동 전환 및 중앙 정렬 스크롤.
- **ui/common/voice-blob.js**: Lottie 라이브러리 동적 로드 및 AI 음성 애니메이션 플레이어 제어.
- **ui/home/**: `home-recommend-legend.js`(그리드 컬럼 수 제어), `home-swiper-visual/tab/peek.js`(테마별 Swiper).
- **ui/product/bottom-product-bar.js**: 드래그 핸들 기반 옵션 바. 드래그 닫기 가속도(Velocity) 판정 로직 포함.
- **ui/product/detail-gallery.js**: 상품 상세 갤러리. 메인-모달 Swiper 연동 및 Android 백버튼(`popstate`) 대응.
- **ui/search/search-rank.js**: 실시간 검색어 롤링. 2열 순차 Flip 애니메이션 및 데이터 갱신 제어.
- **ui/search/search-suggest.js**: 입력 상태에 따른 최근검색어/추천검색어 뷰 토글 로직.

### 4.2. PC UI 모듈 (`src/assets/scripts/ui/`)

- **modal.js**: PC 전역 모달 상태 머신. `open/active/closing` 3단계 관리 및 바디 스크롤 위치 복원.
- **tab.js**: ARIA 표준 준수 탭 시스템. 키보드 네비게이션(화살표, Home/End) 및 URL Hash 지원.
- **form/select.js**: 1~3뎁스 계층형 셀렉트. 상위 선택 시 하위 데이터 동적 바인딩 및 Portal 모드 지원.
- **category/category-tree.js**: PLP 좌측 드릴다운 트리. 브레드크럼 양방향 싱크 및 4뎁스 속성 필터 동적 렌더.
- **category/plp-chip-sync.js**: 필터 체크박스 상태를 상단 칩 UI와 실시간 동기화 및 전체 해제 기능.
- **category/plp-titlebar-research.js**: 결과 내 재검색 칩 내비게이션 및 연관검색어 추천 패널 제어.
- **home-ui.js**: PC 홈 페이지 7종 이상의 Swiper 인스턴스 통합 관리 및 레전드 상품 그리드 재구성.
- **product/tab-scrollbar.js**: 상품 상세 스티키 탭. `baseline` 계산을 통한 스크롤-탭 active 동기화.
- **kendo/kendo-dropdown.js**: Kendo Dropdown의 placeholder 및 계층형(Cascading) 데이터 연동 보정.
- **kendo/kendo-window.js**: Observer 기반 모달 센터 정렬 및 내부 DatePicker 드롭다운 방향 보정.
- **swiper.js**: 상세 전용 갤러리. 메인-썸네일 동기화 및 마우스 트래킹 기반 이미지 줌(Zoom).

---

## 5. SCSS 스타일 명세 (SCSS Technical Reference)

### 5.1. PC 컴포넌트 (`src/assets/scss/components/`)

- **\_alerts.scss**: 정보형(Blue), 경고형(Red) 등 테마별 알림 박스 및 불렛 리스트 스타일.
- **\_breadcrumb.scss**: 셀렉트 박스 조합형 경로 표시. `disabled` 상태 시 자동 숨김 처리 로직.
- **\_button.scss**: Sass Map 기반 버튼 시스템. `:has()`를 활용한 아이콘 여백 동적 제어.
- **\_category-tree.scss**: 드릴다운 트리의 깊이별 인덴트(Indent) 및 토글 아이콘(+/-) 애니메이션.
- **\_datepicker.scss**: Kendo 달력 위젯의 전면 재디자인. 브랜드 컬러 및 둥근 버튼 스타일 적용.
- **\_floating.scss**: 최근 본 상품 썸네일(50% 원형) 및 툴팁형 패널, TOP 버튼 디자인.
- **\_form.scss**: Input, Checkbox, Radio의 표준 디자인. `is-invalid` 시 텍스트/테두리 강조 처리.
- **\_icon.scss**: SVG Mask 기법. `ic-mask` 믹스인으로 50종 이상의 아이콘을 `color`로 통합 제어.
- **\_label.scss**: 상품 플래그(Today, Hot), 칩 버튼(Filled/Outline), 파일 첨부 칩 스타일.
- **\_layer.scss**: 비교 바(Compare)와 슬라이드 패널의 베이스 Transition 및 Z-index 관리.
- **\_modal.scss**: 표준 팝업 레이아웃. 폭 고정값(480/710) 및 스크롤 영역 높이 제한 처리.
- **\_pagination.scss**: 기본 페이징 및 Kendo Pager의 화살표/숫자 버튼 커스텀.
- **\_select.scss**: 커스텀 셀렉트 UI. `is-open` 시 `transform` 애니메이션 및 Portal 전용 스타일.
- **\_swiper.scss**: Swiper 전용 내비게이션(둥근 버튼 + 그림자) 및 상품 카드 슬라이더 스타일.
- **\_toggle.scss**: 범용 아코디언 패널. `clip-path`를 이용해 위에서 아래로 펼쳐지는 효과 구현.
- **\_tooltip.scss**: 툴팁 컨테이너와 화살표 포지셔닝. `aria-hidden` 연동 가시성 제어.

### 5.2. 모바일 전용 컴포넌트 (`src/assets/scss/components-mo/`)

- **\_ai-blob.scss**: AI 음성 인식 전용 오버레이. Lottie 애니메이션 중앙 정렬 레이아웃.
- **\_breadcrumb.scss**: 모바일 특화 칩 형태 브레드크럼. 가로 스크롤 및 현재 위치 강조.
- **\_collapse.scss**: 높이/개수 기반 더보기 항목의 부드러운 노출을 위한 Transition 정의.
- **\_coupon.scss**: 티켓 스타일 쿠폰 카드. 점선 절취선 및 상태별 투명도 처리.
- **\_datepicker.scss**: 모바일 뷰포트 맞춤 달력 크기 보정 및 특정 페이지 내 위치 강제 보정.
- **\_empty-state.scss**: 데이터 없음 페이지 전용 대형 아이콘 및 중앙 정렬 텍스트 레이아웃.
- **\_filter.scss**: 인라인 체크박스 그룹의 가로 스크롤 및 필터 팝업의 섹션별 토글 스타일.
- **\_floating.scss**: 하단 탭바 높이를 감지하여 유동적으로 변하는 모바일 전용 플로팅 세션.
- **\_form.scss**: 모바일 터치에 최적화된 폼 높이(32~48px) 및 비밀번호 눈 토글 전용 스타일.
- **\_kendo-window.scss**: Kendo 팝업을 바텀시트, 풀스크린 슬라이드로 변형하는 **프로젝트 핵심 모바일 스타일**.
- **\_label.scss**: 모바일 상품 뱃지 크기 최적화 및 상태별 색상 맵 적용.
- **\_overflow-menu.scss**: 케밥 버튼 클릭 시 노출되는 모바일 전용 컨텍스트 메뉴 및 딤 처리.
- **\_product.scss**: 리스트/썸네일 뷰 전환 그리드, 품절 블러 효과, 추천 스와이프 통합 스타일.
- **\_step-flow.scss**: 페이지 전환형 다단계 진행 바 및 현재 스텝 시각화 애니메이션.
- **\_tab.scss**: 언더라인형, 라디오 버튼형 등 모바일 특화 탭 디자인 및 애니메이션.
- **\_tooltip.scss**: 모바일 좁은 화면에서의 툴팁 최대 너비 제한 및 레이아웃 보정.

---

## 6. 유지보수 및 품질 관리

1.  **PC/MO 동기화**: 소스가 분리되어 있으므로 공통 로직 수정 시 반드시 양쪽 디렉토리를 모두 반영하십시오.
2.  **Lint/Format**: 배포 전 `pnpm eslint:fix` 및 `pnpm stylelint:fix` 실행은 필수입니다.
3.  **검증**: 수정 후 `pnpm build:sh:prettier`를 통해 결과물 HTML의 포맷팅을 최종 확인하십시오.

---

## 7. 명령어 가이드 (Command Reference)

프로젝트 개발, 빌드 및 품질 관리를 위한 주요 명령어 일람입니다. `pnpm` 사용을 권장합니다.

### 7.1. 개발 및 빌드 (Development & Build)

- **`pnpm dev`**: 로컬 개발 서버를 실행합니다. (`localhost:8080`)
  - EJS 템플릿 변경 시 실시간 반영(HMR)을 지원하며, 대규모 프로젝트 환경을 고려하여 Node.js 메모리 제한을 12GB로 확장하여 실행합니다.
- **`pnpm build`**: 운영 환경을 위한 정적 자산(Static Assets)을 빌드합니다.
  - `webpack.prod.cjs` 설정을 사용하며, `dist/` 폴더에 결과물이 생성됩니다.
- **`pnpm build:sh`**: 빌드 후 후처리 스크립트(`postbuild.sh`)를 실행합니다.
  - `dist/public` 내부 파일을 루트로 이동시키고, HTML/CSS 내 잘못된 경로(`/public/`)를 자동으로 보정합니다.
- **`pnpm build:sh:css`**: 빌드 후 CSS 파일 전용 후처리 스크립트(`postbuildcss.sh`)를 실행합니다.
  - HTML 제외, CSS 내 경로 보정 작업만 수행할 때 사용합니다.
- **`pnpm build:sh:prettier`**: [가장 권장되는 빌드 방식] 빌드, 후처리, 그리고 결과물(HTML/CSS) 포맷팅까지 일괄 수행합니다.
- **`pnpm build:sh:prettier:css`**: 빌드 및 CSS 전용 후처리 후, CSS 파일만 포맷팅을 수행합니다.
- **`pnpm analyze`**: 빌드된 번들 크기를 시각적으로 분석합니다.

### 7.2. 코드 품질 및 포맷팅 (Lint & Format)

- **`pnpm eslint` / `pnpm eslint:fix`**: JavaScript 및 TypeScript 파일의 컨벤션 위반 사항을 검사하고 자동 교정합니다.
- **`pnpm stylelint` / `pnpm stylelint:fix`**: SCSS/CSS 파일의 스타일 규칙 및 속성 선언 순서를 검사하고 자동 교정합니다.
- **`pnpm ejslint`**: EJS 템플릿의 문법 오류를 사전에 검사합니다.
- **`pnpm prettier:dist`**: 빌드된 결과물(`dist/`) 내 HTML 및 CSS 파일의 가독성을 위해 코드 포맷팅을 강제 적용합니다.
- **`pnpm prettier:dist:css`**: 빌드된 결과물 내 CSS 파일만 타겟팅하여 포맷팅을 적용합니다.

### 7.3. 배포 (Deployment)

- **`pnpm gh-pages`**: 빌드 후 현재 `dist/` 내용을 지정된 GitHub Pages 브랜치로 배포합니다.

### 7.4. 코드 제너레이터 (Code Generation)

신규 페이지 및 컴포넌트 구조를 일관성 있게 생성하기 위해 **Hygen**을 활용합니다.

- **`npx hygen pages with-prompt`**: [핵심] 대화형 프롬프트를 통해 신규 EJS 페이지 템플릿을 생성합니다.
- **`npx hygen generator new [name]`**: 새로운 Hygen 제너레이터(기본형)를 생성합니다.
- **`npx hygen generator with-prompt [name]`**: 프롬프트 입력 기능이 포함된 신규 제너레이터를 생성합니다.

---

## 8. 코드 표준 및 린트 규칙 (Coding Standards & Linting)

프로젝트의 코드 일관성과 품질 유지를 위해 ESLint와 Stylelint를 엄격히 적용합니다.

### 8.1. JavaScript / TypeScript (ESLint)

- **기반 설정**: `eslint:recommended`, `@typescript-eslint/recommended`, `prettier/recommended`
- **환경**: Browser, Node.js, ES6+ 지원.
- **주요 규칙**:
  - `no-unused-vars`: 미사용 변수 발견 시 '경고(warn)' 처리.
  - **Prettier 연동**: 모든 포맷팅 규칙은 Prettier에 위임하며, 충돌 발생 시 Prettier 규칙을 우선합니다.
- **전역 변수**: `APP_NODE_ENV`, `APP_ENV_ROOT` 등 환경 변수들에 대한 전역 참조를 허용합니다.

### 8.2. SCSS / CSS (Stylelint)

- **기반 설정**: `stylelint-config-standard-scss`, `stylelint-config-recess-order` (속성 선언 순서 강제)
- **네이밍 컨벤션**: 클래스 선택자, 변수명, `@keyframes` 명칭은 모두 **`kebab-case`**를 원칙으로 합니다.
- **주요 규칙**:
  - `unit-allowed-list`: 허용된 단위만 사용 가능 (`px`, `rem`, `vh`, `dvh`, `vw`, `%` 등. 특히 **`dvh`** 포함).
  - `selector-pseudo-element-colon-notation`: 가상 요소에 이중 콜론(`::`) 사용 강제.
  - `declaration-empty-line-before`: 속성 선언 사이의 불필요한 빈 줄 금지.
  - `at-rule-no-unknown`: SCSS 전용 구문(@include, @mixin 등) 사용을 위해 기본 CSS 미확인 규칙 검사를 보정.
- **속성 정렬**: CSS 속성은 의미론적 그룹(Layout -> Box -> Visual -> Typography)에 따라 자동 정렬됩니다.

### 8.3. 공통 준수 사항 및 자동화

- **VS Code 자동 교정 (권장)**: `.vscode/settings.json` 설정을 통해 파일 저장 시 **Prettier(포맷팅), ESLint(JS/TS 오류), Stylelint(SCSS 정렬)**가 즉시 자동 교정됩니다.
  - **필수 확장**: `Prettier - Code formatter`, `ESLint`, `Stylelint` 익스텐션을 설치하여 활용하십시오.
- **Ignore 규칙**: `dist`, `node_modules`, `public`, `config` 디렉토리는 린트 검사 대상에서 제외됩니다.
- **수동 교정**: 대량의 파일 수정 시 `pnpm eslint:fix` 및 `pnpm stylelint:fix` 명령어를 사용하여 전체 코드 스타일을 동기화할 수 있습니다.

## 9. 퍼블리싱 가이드

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

### 9.1. 클래스 네이밍 규칙 (vits- Prefix)

모든 신규 클래스는 `vits-` 접두어를 필수로 사용한다.<br/>
이는 **기존 운영 소스와의 클래스 충돌을 방지**하기 위함이다.

#### 9.1.1. 규칙

- 클래스명은 반드시 `vits-`로 시작한다.
- 소문자와 하이픈(`-`)을 사용한다.
- 역할 기준으로 명명한다.

#### 9.1.2. 예시

- `vits-wrap`
- `vits-button`
- `vits-dropdown`
- `vits-modal`

<br />

### 9.2. SCSS

#### 9.2.1. SCSS 내장 모듈

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

#### 9.2.2. SCSS 베이스 설정

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

#### 9.2.3. SCSS 기본 작성 예시

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

#### 9.2.4. SCSS 폴더 구조

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
│  ├─ _icon.scss              # 아이콘
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

#### 9.2.5. SCSS 사용 예시

##### 유닛 토큰($unit) 사용 기준

- **기본 원칙**

  - 여백(`padding`, `margin` 등)은 유닛 토큰(`$unit`)을 사용
  - `border`, `border-radius` `font-size` 제외

- **유닛 토큰 사용 예시:**

  ```scss
  @use 'sass:map';
  @use '@/assets/scss/abstracts/variables' as var;

  .ex {
    padding: map.get(var.$unit, 12) map.get(var.$unit, 16);
  }
  ```

- **예외: 직접 px 사용(border / radius 등):**

  ```scss
  @use '@/assets/scss/abstracts/mixins' as mx;

  // border - px 적용
  @include mx.border(); // 하단 1px solid primary
  @include mx.border(all, 2px, dashed); // 전체 2px dashed 기본 색상

  // border-radius -> px 적용
  .ex {
    border-radius: 10px;
  }
  ```

  <br />

##### CON : 사이즈 / 색상 제어

- **아이콘의 색상, 크기**는 부모(컴포넌트)에서 제어한다.<br />(크기: ic-size, 색상: color)

  ```html
  <button class="btn" type="button" aria-label="닫기">
    <i class="ic ic-close" aria-hidden="true"></i>
  </button>
  ```

  ```scss
  @use 'sass:map';
  @use '@/assets/scss/abstracts/variables' as var;
  @use '@/assets/scss/base/colors' as color;
  @use '@/assets/scss/components/icon' as icon;

  .btn {
    // 크기
    @include icon.ic-size(map.get(var.$unit, 40));

    // 색상
    color: map.get(color.$gray-shades, '20');
  }
  ```

<br />

#### 9.2.6. scrollbar.scss (스크롤바 커스텀 사용 규칙)

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

#### 9.2.7. @include / @extend 작성 위치 규칙(Sass mixed-decls 예방)

Sass에서는 **중첩 규칙(@media, @supports, &:hover 등) 뒤에** <br />
**선언(display, padding 등)이 오는 구조를 mixed-decls로 판단**하며,<br />
향후 Sass 해석 방식 변경 시 스타일 결과가 달라질 수 있어 **경고가 발생.**<br />
<br />

##### 선택자 블록 내부의 작성 순서

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

### 9.3. .ejs

- [퍼블 산출물 (로컬 서버)](http://localhost:3333/html/index.html)

#### 9.3.1. .ejs 파일/폴더 규칙

1. `IA(엑셀 파일)` 기준, `1depth(한글)`을 영문화하여 폴더 생성

- 예&rpar; 엑셀 `1depth` : 로그인 일 때
- 생성 폴더: `pages/login`

2. 파일명은 `IA(엑셀 파일)` 기준, `화면ID`로 생성.

- 예&rpar; 엑셀 `화면ID` : `PC_LO_02010101`
- 생성 파일 : `PC_LO_02010101.ejs`

<br />

#### 9.3.2. .ejs 폴더 구조

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

### 9.4. JS

#### 9.4.1. JS 폴더 구조

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

### 9.5. 접근성(aria) 최소 적용 가이드

본 프로젝트는 웹접근성 인증/전담 범위는 아니며,<br />
**마크업 단계에서 기본 사용성 확보를 위한 최소한의 aria 속성만 적용한다.**

#### 9.5.1. 기본 원칙

- 의미가 명확한 **시맨틱 HTML을 우선 사용**한다.
- aria는 텍스트가 없거나 상태 변화가 있는 UI에 한해 **최소로 적용**한다.
- 불필요한 role, aria 속성의 과도한 사용은 지양한다.

<br />

#### 9.5.2. 적용 대상 및 기준

##### 텍스트 없는 버튼/링크

- 아이콘만 있는 컨트롤은 기능을 알 수 있도록 aria-label을 적용한다.

```html
<button type="button" aria-label="메뉴 열기"></button>
```

```html
<a href="#" aria-label="닫기"></a>
```

<br />

##### 상태 변경 UI (토글/아코디언/드롭다운)

- 열림/닫힘 상태를 aria-expanded로 표기한다.
- 제어 대상은 aria-controls로 연결한다.

```html
<button type="button" aria-expanded="false" aria-controls="gnb-menu">전체 메뉴</button>

<div id="gnb-menu" hidden></div>
```

<br />

##### 라벨이 없는 입력 요소

- 시각적 label이 없는 경우 aria-label 또는 숨김 label을 사용한다.

```html
<input type="search" aria-label="검색어 입력" />
```

<br />

##### 모달/레이어 UI

- 모달 컨테이너에 dialog 역할을 명시한다.
- 제목 요소와 aria-labelledby로 연결한다.

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">공지사항</h2>
</div>
```

<br />

#### 9.5.3. 적용하지 않는 경우

- 텍스트가 충분히 제공된 버튼/링크
- 단순 레이아웃 목적의 요소(div, span)
- title 속성만을 사용한 설명

---

**최종 업데이트**: 2026-04-10
**작성자**: 이동걸
