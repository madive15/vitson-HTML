# Gemini Documentation Index

이 문서는 프로젝트의 전반적인 구조, 코딩 규칙, 비즈니스 로직 및 AI 지침을 관리하는 메인 인덱스입니다.

## 📁 문서 구조

1.  **[AI Rules](ai-rules.md)**: Gemini 응답 및 작업 기록 규칙.
2.  **[Conventions](conventions.md)**: 코딩 규칙, 네이밍 컨벤션, 스타일 가이드.
3.  **[Business Logic](business-logic.md)**: 핵심 도메인 지식 및 UI 구조.
4.  **[API Specs](api-specs.md)**: Mock 데이터 구조 및 연동 가이드.
5.  **[Work Logs](logs/)**: Gemini 작업 로그 기록 저장소.

## 🛠 Tech Stack

-   **Templating**: EJS (Embedded JavaScript)
-   **Styling**: SCSS (Sass), PostCSS, TailwindCSS
-   **Scripting**: JavaScript (ES6+), TypeScript
-   **UI Libraries**: Swiper, Kendo UI
-   **Build Tool**: Webpack 5, Babel

## 🤖 핵심 AI 지침 (Summary)

-   **언어**: 모든 응답과 코드 주석은 **한국어**를 원칙으로 합니다.
-   **로그**: 모든 파일 수정 및 생성 작업 후에는 `docs/gemini/logs/` 폴더에 날짜별(`yyyy-mm-dd.md`) 작업 로그를 기록합니다.
-   **구조 준수**: EJS 템플릿과 SCSS 스타일링 중심의 퍼블리싱 프로젝트 구조를 엄격히 따릅니다.
-   **품질**: Linting 및 Formatting(Prettier) 규칙을 반드시 준수하여 코드를 작성합니다.
