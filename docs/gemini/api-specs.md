# API Specifications & Integration Guide

이 문서는 프로젝트에서 사용하는 Mock 데이터 구조 및 API 연동 규격을 정의합니다.

## 📄 Mock Data Structure

이 프로젝트는 `public/resources/mock/` 하위에 JSON 파일 형식으로 Mock 데이터를 관리합니다.

### 📦 Product Data (`products.json`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `totalCount` | Number | 전체 상품 수 |
| `products` | Array | 상품 리스트 |
| `productCode` | String | 상품 코드 (PK) |
| `productNm` | String | 상품명 |
| `brandNm` | String | 브랜드명 |
| `salePrice` | Number | 판매가 |
| `discountRate` | Number | 할인율 |
| `imageUrl` | String | 상품 이미지 URL |
| `stockYn` | String | 재고 여부 (Y/N) |
| `freeShipYn` | String | 무료배송 여부 (Y/N) |

### 📂 Category Data (`category.json`)

-   카테고리 계층 구조 및 경로(depth1, depth2, depth3)를 관리합니다.

## 🔗 Frontend Integration

### 1. EJS `include` Integration

```javascript
<%- include(`${_src}/views/components/product/product-card.ejs`, { product: productData }) %>
```

### 2. Path Handling

-   `srcPath`: EJS 템플릿의 소스 경로 (`src/`)
-   `publicPath`: 정적 리소스의 경로 (`public/`)
-   `mockData`: 전체 Mock 데이터를 통합하여 관리하는 객체

## 🚀 Data Mocking Patterns

-   각 페이지의 EJS 파일에서 필요한 Mock 데이터를 `include`하여 동적 컨텐츠를 표현합니다.
-   `globalThis.__mockData`를 사용하여 글로벌 데이터 컨텐츠에 접근할 수 있습니다.
