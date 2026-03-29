# Business Logic & Core Logic

이 문서는 프로젝트의 도메인 지식, UI 구조 및 핵심 로직에 대해 정의합니다.

## 🏢 Domain Overview

이 프로젝트는 비츠온(Vitson) 쇼핑몰의 퍼블리싱 프로젝트로, PC 및 모바일(MO) 환경을 지원하는 HTML/CSS 퍼블리싱 결과물입니다.

## 🏗 UI Architecture

-   **Header**: `src/views/layout/header.ejs` (PC), `src/views/layout-mo/header/` (MO)
-   **Footer**: `src/views/layout/footer.ejs` (PC), `src/views/layout-mo/footer/` (MO)
-   **Components**: 자주 사용되는 UI(아이콘, 버튼, 탭, 모달 등)는 `src/views/components`에 위치하며, 재사용 가능하도록 설계되었습니다.
-   **Swiper**: 슬라이더 및 캐러셀 구현에 Swiper 라이브러리를 사용합니다.
-   **Kendo UI**: 복잡한 UI 및 그리드 데이터 표현에 Kendo UI 라이브러리를 사용합니다.

## 🔄 Data Flow

1.  **Mock Data Injection**: 페이지 로드 시 `mockData`가 EJS 템플릿으로 주입됩니다.
2.  **Template Logic**: `header.ejs`, `index.ejs` 등에서 `mockData`를 기반으로 조건부 렌더링 및 루프 처리를 수행합니다.
3.  **Static Logic**: 서버 연동 없이 정적인 HTML 결과물을 생성하며, 필요한 인터랙션은 JavaScript/TypeScript로 처리합니다.

## 🏷 Core Components

-   `icon.ejs`: SVG 및 폰트 아이콘 처리
-   `button/`: 다양한 형태의 공용 버튼 컴포넌트
-   `form/`: 입력 폼, 체크박스, 라디오 버튼 등
-   `modal/`: 팝업 및 레이어 모달 구조
-   `product/`: 상품 카드 및 리스트 UI
