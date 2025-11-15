# teacher-mode

교사 모드 전체 기능을 실행하는 통합 명령어

## 실행
```bash
node teacher-dashboard.js
```

## 실행 순서
1. **generate-students** → 학생 데이터 생성
2. **analyze-grades** → 성적 분석
3. **compare-students** → 학생 비교
4. **create-report** → HTML 보고서 생성
5. **export-report** → CSV 파일 내보내기

## 기능
- 5개 명령어 순차 실행
- 각 단계 실행 시간 측정
- 오류 처리 및 중단 관리
- 실행 결과 요약 보고
- 생성 파일 확인

## 출력
```
╔════════════════════════════════════╗
║     🎓 교사 대시보드 시작          ║
║     Teacher Dashboard v1.0         ║
╚════════════════════════════════════╝

[1/5] 학생 데이터 생성
✅ 완료 (0.08초)

[2/5] 성적 분석
✅ 완료 (0.07초)

[3/5] 학생 비교
✅ 완료 (0.07초)

[4/5] HTML 보고서 생성
✅ 완료 (0.09초)

[5/5] CSV 파일 내보내기
✅ 완료 (0.05초)

📊 실행 결과 요약
🔸 완료율: 5/5 (100%)
🔸 생성된 파일:
  ✅ student_data.json (108KB)
  ✅ teacher_report_2025-08-31.html (16KB)
```

## 생성 파일
- `student_data.json` - 학생 데이터베이스
- `teacher_report_YYYY-MM-DD.html` - HTML 보고서
- `report_summary_YYYY-MM-DD.csv` - 요약 CSV
- `report_detailed_YYYY-MM-DD.csv` - 상세 CSV

## 활용
- 일일/주간 성적 관리
- 학부모 상담 자료 준비
- 교육청 보고서 작성
- 학습 계획 수립