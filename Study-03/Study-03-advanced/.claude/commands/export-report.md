# export-report

HTML 보고서를 CSV 형식으로 내보내는 명령어

## 실행
```bash
node export-report.js
```

## 기능
- HTML 보고서 자동 탐색 (최신 파일 선택)
- 요약 CSV 생성 (통계 및 상위 5명)
- 상세 CSV 생성 (전체 학생 목록)
- Excel 호환 UTF-8 BOM 인코딩

## 생성 파일
1. **요약 CSV** (`report_summary_YYYY-MM-DD.csv`)
   - 전체 통계 정보
   - 상위 5명 학생 정보
   - 등급 기준 설명

2. **상세 CSV** (`report_detailed_YYYY-MM-DD.csv`)
   - 전체 학생 목록
   - 학생별 평균 점수
   - 상대평가 등급
   - 퀴즈 응시 횟수

## CSV 구조

### 요약 CSV
```
생성일시, 2025. 8. 31. 오후 2:41:06
총 학생 수, 20명
전체 평균, 64.3점
최고 점수, 76점
최저 점수, 52점

순위, 이름, 반, 평균 점수, 등급
1, 홍지민, 4반, 76점, A
...
```

### 상세 CSV
```
학생ID, 이름, 반, 평균점수, 등급, 퀴즈횟수
STU001, 김민준, 1반, 65, B, 8
...
```

## 사용 예시
```bash
# 1. 먼저 HTML 보고서 생성
node teacher-report.js

# 2. CSV로 내보내기
node export-report.js

# 3. Excel에서 CSV 파일 열기
```

## 특징
- 한글 Excel 호환 (UTF-8 BOM)
- 자동 파일 탐색
- 다중 형식 지원
- 정렬된 데이터 출력