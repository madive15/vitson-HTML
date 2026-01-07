#!/bin/sh

# 스크립트 실행 중 오류 발생 시 즉시 종료
set -e

# 빌드 결과물이 위치할 기본 디렉토리
DIST_DIR="dist"
# 제거 대상이 될 'public' 폴더의 경로
PUBLIC_DIR="${DIST_DIR}/public"

# dist/public 디렉토리가 존재하지 않으면 아무 작업 없이 스크립트 종료
if [ ! -d "$PUBLIC_DIR" ]; then
  echo "dist/public 디렉토리를 찾을 수 없습니다. 작업을 건너뜝니다."
  exit 0
fi

echo "콘텐츠를 ${PUBLIC_DIR} 에서 ${DIST_DIR} 로 복사 중..."
# `public` 폴더의 모든 내용(숨김 파일 포함)을 `dist` 폴더로 복사합니다.
# `/.`는 디렉토리 자체가 아닌 디렉토리의 내용물을 복사하기 위함입니다.
cp -r "${PUBLIC_DIR}/." "${DIST_DIR}/"

echo "원본 디렉토리 ${PUBLIC_DIR} 삭제 중..."
# 원본 `public` 디렉토리를 삭제합니다.
rm -rf "$PUBLIC_DIR"

echo "'public' 폴더 제거 완료."

# --- HTML 및 CSS 파일 내의 경로 수정 ---
echo "HTML 및 CSS 파일 내의 에셋 경로를 수정 중..."
# `dist` 디렉토리 내의 모든 `.html` 및 `.css` 파일을 찾습니다.
# 찾은 각 파일에 대해 반복 작업을 수행합니다.
find "$DIST_DIR" \( -name "*.html" -o -name "*.css" \) | while read filename; do
  # `sed` 명령어를 사용하여 파일 내용을 수정합니다.
  # - `../public/` 패턴을 `../` 로 변경하고
  # - `/public/` 패턴을 `/` 로 변경합니다.
  # 임시 파일을 사용한 후 원본 파일로 이동시켜 교차 플랫폼 호환성을 유지합니다.
  sed 's#\.\./public/#\.\./#g; s#/public/#/#g' "$filename" > "$filename.tmp" && mv "$filename.tmp" "$filename"
done
echo "경로 수정 완료."