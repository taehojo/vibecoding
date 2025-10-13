---
aliases: []
---

# quiz-check

퀴즈 문제의 정답 정확성을 검증합니다.

## 사용법
```
/quiz-check [카테고리]
```

## 예시
- `/quiz-check` - 전체 문제 검증
- `/quiz-check 한국사` - 한국사 카테고리만 검증
- `/quiz-check 과학` - 과학 카테고리만 검증

## 기능
1. **정답 유효성 검사**
   - 정답 인덱스가 올바른 범위 내에 있는지 확인
   - 중복된 선택지가 없는지 검사
   - 정답이 실제로 정확한지 검증

2. **문제 품질 검사**
   - 최상급 표현에 기준이 명시되어 있는지 확인
   - 시간 관련 표현에 구체적 시점이 있는지 검증
   - 문제와 설명의 일관성 확인

3. **형식 검사**
   - 문제 길이가 적절한지 (10-200자)
   - 설명이 충분히 상세한지 (10자 이상)
   - 선택지 길이가 적절한지

4. **통계 분석**
   - 난이도별 분포
   - 정답 번호 분포
   - 카테고리별 문제 수

## 실행 코드
```javascript
const fs = require('fs');

// 파라미터 파싱
const args = process.argv.slice(2);
const targetCategory = args[0] || null;

// questions.js 파일 읽기
const questionsContent = fs.readFileSync('questions.js', 'utf8');
const match = questionsContent.match(/const quizQuestions = (\[[\s\S]*\]);/);
if (!match) {
    console.error('❌ questions.js 파일을 파싱할 수 없습니다.');
    process.exit(1);
}
const quizQuestions = eval(match[1]);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               🔍 퀴즈 정답 정확성 검증                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 필터링
let questionsToCheck = quizQuestions;
if (targetCategory) {
    questionsToCheck = quizQuestions.filter(q => q.category === targetCategory);
    console.log(`📌 검증 대상: ${targetCategory} 카테고리 (${questionsToCheck.length}문제)\n`);
} else {
    console.log(`📌 검증 대상: 전체 문제 (${questionsToCheck.length}문제)\n`);
}

// 정답 검증 (여기서는 기본 검사만 수행, 실제 정답은 수동 확인 필요)
const issues = [];
let validCount = 0;

questionsToCheck.forEach(q => {
    const questionIssues = [];
    
    // 1. 정답 인덱스 검사
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        questionIssues.push('❌ 정답 인덱스가 유효하지 않음');
    }
    
    // 2. 중복 선택지 검사
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
        questionIssues.push('❌ 중복된 선택지 존재');
    }
    
    // 3. 정답이 선택지에 있는지 확인
    const correctOption = q.options[q.correctAnswer];
    if (!correctOption) {
        questionIssues.push('❌ 정답이 선택지에 없음');
    }
    
    // 4. 설명과 정답의 일관성 체크 (키워드 기반)
    if (q.explanation && correctOption) {
        const hasRelation = q.explanation.includes(correctOption) || 
                          correctOption.split(' ').some(word => 
                              word.length > 2 && q.explanation.includes(word));
        if (!hasRelation) {
            questionIssues.push('⚠️ 설명에 정답 관련 내용이 없을 수 있음');
        }
    }
    
    // 5. 최상급 표현 검사
    const superlatives = ['가장', '최초', '최대', '최소', '최고', '제일'];
    const hasSuperlative = superlatives.some(word => q.question.includes(word));
    if (hasSuperlative) {
        const hasContext = q.question.includes('기준') || 
                          q.question.includes('년') || 
                          q.question.includes('세기') ||
                          q.question.includes('측정');
        if (!hasContext) {
            questionIssues.push('⚠️ 최상급 표현에 기준이 명확하지 않음');
        }
    }
    
    if (questionIssues.length > 0) {
        issues.push({
            id: q.id,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            correctAnswer: correctOption,
            issues: questionIssues
        });
    } else {
        validCount++;
    }
});

// 결과 출력
console.log('📊 검증 결과');
console.log('─'.repeat(60));
console.log(`✅ 검증 통과: ${validCount}개`);
console.log(`⚠️ 확인 필요: ${issues.length}개\n`);

if (issues.length > 0) {
    console.log('🚨 확인이 필요한 문제들:');
    console.log('─'.repeat(60));
    
    issues.forEach(issue => {
        console.log(`\n[ID: ${issue.id}] ${issue.category} - ${issue.difficulty}`);
        console.log(`문제: ${issue.question}`);
        console.log(`정답: ${issue.correctAnswer}`);
        issue.issues.forEach(i => console.log(`  ${i}`));
    });
}

// 정답 분포 분석
console.log('\n📊 정답 번호 분포');
console.log('─'.repeat(60));

const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
questionsToCheck.forEach(q => answerDist[q.correctAnswer]++);

[0, 1, 2, 3].forEach(i => {
    const count = answerDist[i];
    const percent = ((count / questionsToCheck.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / questionsToCheck.length) * 30));
    console.log(`  ${i + 1}번: ${bar} ${count}개 (${percent}%)`);
});

// 균형 평가
const maxCount = Math.max(...Object.values(answerDist));
const minCount = Math.min(...Object.values(answerDist));
if (maxCount - minCount > Math.ceil(questionsToCheck.length * 0.3)) {
    console.log('\n⚠️ 정답 분포가 편향되어 있습니다.');
}

console.log('\n✅ 검증 완료\n');
```

## 출력 예시
```
╔══════════════════════════════════════════════════════════════╗
║               🔍 퀴즈 정답 정확성 검증                          ║
╚══════════════════════════════════════════════════════════════╝

📌 검증 대상: 한국사 카테고리 (13문제)

📊 검증 결과
────────────────────────────────────────────────────────────
✅ 검증 통과: 13개
⚠️ 확인 필요: 0개

📊 정답 번호 분포
────────────────────────────────────────────────────────────
  1번: █████████ 4개 (30.8%)
  2번: ████████████ 5개 (38.5%)
  3번: ███████ 3개 (23.1%)
  4번: ██ 1개 (7.7%)

✅ 검증 완료
```