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

### 8.

---

**최종 업데이트**: 2026-04-09
**작성자**: 이동걸
