# ejs-webpack-template
ejs, webpack5

## local root
- http://localhost:3333/html


## wiki
[go wiki](https://github.com/madive15/ejs-webpack-template/wiki)

## Build Setup
```bash
# install pnpm
$ npm i -g pnpm

# install dependencies
$ pnpm
```

## Build commands

### dev server
```bash
# serve with hot reload at localhost
$ pnpm dev

```

### webpack build
```bash
# build for production 
$ pnpm build
```
### gh-pages deploy
```bash
# build and update gh-pages
$ pnpm gh-pages
```

### webpack utils
```bash
# generate webpack-bundle-analyzer
$ pnpm analyze

```

## Lint commands

### eslint
```bash
# eslint
$ pnpm eslint

# eslint -fix
$ pnpm eslint:fix

```

### stylelint
```bash
# stylelint
$ pnpm stylelint

# stylelint -fix
$ pnpm stylelint:fix

```

### ejslint
```bash
# ejslint
$ pnpm ejslint

# ejslint -fix
$ pnpm ejslint:fix

```

## .env 환경변수
```bash
# 예시
# dist 로 내보낼 경로
## dist/..
APP_ENV_URL=
## dist/pc/..
APP_ENV_URL=pc
## dist/mo/..
APP_ENV_URL=mo

# 사용된 언어 (js|ts)
APP_ENV_TYPE=js

# 앱 이름
APP_ENV_ROOT=app

# dev서버 포트 번호
APP_PORT=3333
```

## commit message
- [api](https://www.npmjs.com/package/@commitlint/config-conventional)
- [lint rules](https://commitlint.js.org/#/reference-rules)
- [conventional commits](https://www.conventionalcommits.org/ko/v1.0.0/)

- [subject] (제목) 한글사용가능
- [scope] 추가 컨텍스트 정보를 제공하며 괄호 안에 포함됩니다.
- [body] (본문)
- [type] 요구조건에 맞게 삽입
  - `build:`-> 시스템 또는 외부 종속성에 영향을 미치는 변경사항 (npm, gulp, yarn 레벨)
  - `chore:`-> 패키지 매니저 설정할 경우, 코드 수정 없이 설정을 변경
  - `ci:`-> ci구성파일 및 스크립트 변경
  - `docs:`-> documentation 변경
  - `feat:`-> 새로운 기능
  - `fix:`-> 버그 수정
  - `perf:`-> 성능 개선
  - `refactor:`-> 버그를 수정하거나 기능을 추가하지 않는 코드 변경, 리팩토링
  - `revert:`-> 작업 되돌리기
  - `style:`-> 코드 의미에 영향을 주지 않는 변경사항 ( white space, formatting, colons )
  - `test:`-> 누락된 테스트 추가 또는 기존 테스트 수정
```bash
<type>: <subject>          -- 헤더 (!200자! 이내로 작성!!!!)
<type>(<scope>): <subject> -- (<scope>)있는 헤더 (!200자! 이내로 작성!!!!)
<BLANK LINE>               -- 빈줄
<body>                     -- 선택적 본문
<BLANK LINE>               -- 빈줄
<footer>                   -- 선택적 바닥글

# 예시
feat(scss): main.scss 스타일 추가
+++++++++++
+++++++++++
docs(README.md): 수정

수정입니다!
+++++++++++
+++++++++++
fix(img): img 경로수정

```
- 예시! 
```bash
foo: some message # fails
fix: some message # passes

FIX: some message # fails
fix: some message # passes

FIX: some message # fails
fix: some message # passes

fix(SCOPE): Some message # fails
fix(SCOPE): Some Message # fails
fix(SCOPE): SomeMessage # fails
fix(SCOPE): SOMEMESSAGE # fails
fix(scope): some message # passes
fix(scope): some Message # passes

fix: # fails
fix: some message # passes

fix: some message. # fails
fix: some message # passes

```

## ■ FILE STRUCTURE
```bash
root                 
│
└───dist          # project 들이 빌드된 폴더
└───config        # webpack 유틸 파일
│
└───public        # webpack 번들 이 안되는 폴더(src(js)나 href(css)를 이용하여 연결) 
  └───scripts     # js 파일
  └───lib         # js 라이브러리 파일들
  └───images      # 이미지 파일(배너나 mock등 변경이 되는 이미지)
  └───styles      # css 파일(scss는 로더가 적용이 안됨)
│
└───src           # webpack 번들 대상이되는 폴더 (import(js, scss)를 이용하여 연결) 
  └───assets      # 리소스 파일들
  └───fonts       # 폰트파일
  └───images      # 이미지 파일(아이콘등 앱에 의존을 가진 이미지)
  └───scripts     # js 파일
  └───scss        # scss 파일
    └───abstracts # local 믹스인, local변수
└───views         # ejs 파일
  └───components  # components ejs
  └───layout      # layout ejs
  └───pages       # pages 작업 ejs
└───app.js        # root import js 


  

```


