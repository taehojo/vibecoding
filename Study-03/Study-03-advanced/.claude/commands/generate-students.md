# generate-students

학생 데이터를 생성하는 명령어

## 실행
```bash
node student-data-generator.js
```

## 기능
- 20명의 가상 학생 데이터 생성
- 각 학생당 5-10개의 퀴즈 기록
- 카테고리별 점수 및 학습 시간 기록
- A-F 등급 자동 부여

## 출력
- `student_data.json` 파일 생성
- 등급 분포 콘솔 출력

## 데이터 구조
```json
{
  "id": "STU001",
  "name": "김민준",
  "class": "1반",
  "averageScore": 75,
  "grade": "C",
  "quizHistory": [...]
}
```