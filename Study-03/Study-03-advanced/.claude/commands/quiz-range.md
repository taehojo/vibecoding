```js
// Quiz Range Analyzer
// 사용법: /quiz-range [시작번호] [종료번호]
// 예: /quiz-range 1 10

const fs = require('fs');
const path = require('path');

// 파라미터 파싱
const args = process.argv.slice(2);
const startId = parseInt(args[0]) || 1;
const endId = parseInt(args[1]) || startId + 9;

// questions.js 파일 읽기
const questionsPath = path.join(process.cwd(), 'questions.js');
let questionsContent = '';

try {
    questionsContent = fs.readFileSync(questionsPath, 'utf8');
} catch (error) {
    console.error('❌ questions.js 파일을 읽을 수 없습니다:', error.message);
    process.exit(1);
}

// questions 배열 추출
let quizQuestions;
try {
    eval(questionsContent);
} catch (error) {
    console.error('❌ questions.js 파싱 실패:', error.message);
    process.exit(1);
}

// 지정된 범위의 문제 필터링
const rangeQuestions = quizQuestions.filter(q => q.id >= startId && q.id <= endId);

if (rangeQuestions.length === 0) {
    console.error(`❌ ${startId}번부터 ${endId}번 범위에 해당하는 문제가 없습니다.`);
    console.log(`   전체 문제 범위: 1번 ~ ${quizQuestions.length}번`);
    process.exit(1);
}

// 통계 계산
const stats = {
    total: rangeQuestions.length,
    byCategory: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    answerDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
    averageExplanationLength: 0
};

// 각 문제 분석
rangeQuestions.forEach(q => {
    // 카테고리별 집계
    if (!stats.byCategory[q.category]) {
        stats.byCategory[q.category] = {
            count: 0,
            difficulty: { easy: 0, medium: 0, hard: 0 },
            answers: { 0: 0, 1: 0, 2: 0, 3: 0 }
        };
    }
    stats.byCategory[q.category].count++;
    stats.byCategory[q.category].difficulty[q.difficulty]++;
    stats.byCategory[q.category].answers[q.correctAnswer]++;
    
    // 전체 난이도 집계
    stats.byDifficulty[q.difficulty]++;
    
    // 정답 분포 집계
    stats.answerDistribution[q.correctAnswer]++;
    
    // 설명 길이 평균
    stats.averageExplanationLength += q.explanation.length;
});

stats.averageExplanationLength = Math.round(stats.averageExplanationLength / stats.total);

// 보고서 출력
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log(`║               📊 퀴즈 범위 분석 보고서                          ║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`📌 분석 범위: ${startId}번 ~ ${endId}번 (총 ${stats.total}문제)\n`);

// 카테고리별 분석
console.log('## 📚 카테고리별 분포');
console.log('┌─────────────────┬──────┬──────────────────────────────────┐');
console.log('│ 카테고리        │ 문제 │ 난이도 분포                     │');
console.log('├─────────────────┼──────┼──────────────────────────────────┤');

Object.entries(stats.byCategory).forEach(([category, data]) => {
    const diffStr = `쉬움:${data.difficulty.easy} 보통:${data.difficulty.medium} 어려움:${data.difficulty.hard}`;
    console.log(`│ ${category.padEnd(15)} │ ${String(data.count).padStart(4)} │ ${diffStr.padEnd(32)} │`);
});
console.log('└─────────────────┴──────┴──────────────────────────────────┘\n');

// 전체 난이도 분포
console.log('## 🎯 전체 난이도 분포');
const maxDiff = Math.max(...Object.values(stats.byDifficulty));
['easy', 'medium', 'hard'].forEach(level => {
    const count = stats.byDifficulty[level];
    const percent = (count / stats.total * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / maxDiff * 30));
    const label = level === 'easy' ? '쉬움  ' : level === 'medium' ? '보통  ' : '어려움';
    console.log(`  ${label}: ${bar} ${count}개 (${percent}%)`);
});
console.log();

// 정답 분포 분석
console.log('## 🎲 정답 선택지 분포');
const optionLabels = ['첫 번째', '두 번째', '세 번째', '네 번째'];
const maxAnswer = Math.max(...Object.values(stats.answerDistribution));

[0, 1, 2, 3].forEach(option => {
    const count = stats.answerDistribution[option];
    const percent = (count / stats.total * 100).toFixed(1);
    const bar = '▒'.repeat(Math.round(count / maxAnswer * 30));
    console.log(`  ${optionLabels[option]}: ${bar} ${count}개 (${percent}%)`);
});

// 균형 평가
console.log('\n## ⚖️ 균형 평가');
const answerBalance = Object.values(stats.answerDistribution);
const maxAnswerCount = Math.max(...answerBalance);
const minAnswerCount = Math.min(...answerBalance);
const answerDiff = maxAnswerCount - minAnswerCount;

if (answerDiff <= 2) {
    console.log('✅ 정답 분포가 균형적입니다.');
} else if (answerDiff <= 4) {
    console.log('⚠️ 정답 분포가 약간 편향되어 있습니다.');
} else {
    console.log('❌ 정답 분포가 편향되어 있습니다. 조정이 필요할 수 있습니다.');
}

// 난이도 균형 평가
const difficultyValues = Object.values(stats.byDifficulty);
const maxDiffCount = Math.max(...difficultyValues);
const minDiffCount = Math.min(...difficultyValues.filter(v => v > 0));
const diffDiffRatio = minDiffCount ? maxDiffCount / minDiffCount : 999;

if (diffDiffRatio <= 2) {
    console.log('✅ 난이도 분포가 균형적입니다.');
} else if (diffDiffRatio <= 3) {
    console.log('⚠️ 난이도 분포가 약간 편향되어 있습니다.');
} else {
    console.log('❌ 난이도 분포가 편향되어 있습니다. 조정이 필요할 수 있습니다.');
}

// 상세 문제 목록
console.log('\n## 📝 문제 목록');
console.log('┌────┬─────────────────┬────────┬────────────────────────────────┬──────┐');
console.log('│ ID │ 카테고리        │ 난이도 │ 문제 (처음 30자)               │ 정답 │');
console.log('├────┼─────────────────┼────────┼────────────────────────────────┼──────┤');

rangeQuestions.forEach(q => {
    const questionPreview = q.question.length > 30 
        ? q.question.substring(0, 27) + '...' 
        : q.question.padEnd(30);
    const difficultyKor = q.difficulty === 'easy' ? '쉬움' : 
                          q.difficulty === 'medium' ? '보통' : '어려움';
    
    console.log(`│ ${String(q.id).padStart(2)} │ ${q.category.padEnd(15)} │ ${difficultyKor.padEnd(6)} │ ${questionPreview} │  ${q.correctAnswer}번  │`);
});
console.log('└────┴─────────────────┴────────┴────────────────────────────────┼──────┘');

// 추가 통계
console.log('\n## 📈 추가 통계');
console.log(`• 평균 설명 길이: ${stats.averageExplanationLength}자`);
console.log(`• 카테고리 수: ${Object.keys(stats.byCategory).length}개`);

// 카테고리별 정답 분포 상세
if (Object.keys(stats.byCategory).length > 1) {
    console.log('\n## 🔍 카테고리별 정답 분포 상세');
    Object.entries(stats.byCategory).forEach(([category, data]) => {
        console.log(`\n【${category}】`);
        const answerStr = [0, 1, 2, 3].map(i => 
            `${i+1}번: ${data.answers[i]}개`
        ).join(', ');
        console.log(`  정답 분포: ${answerStr}`);
        
        // 카테고리별 균형 평가
        const catAnswers = Object.values(data.answers);
        const catMaxAnswer = Math.max(...catAnswers);
        const catMinAnswer = Math.min(...catAnswers);
        
        if (catMaxAnswer - catMinAnswer > 2) {
            console.log(`  ⚠️ 이 카테고리의 정답이 특정 선택지에 편중되어 있습니다.`);
        }
    });
}

console.log('\n' + '═'.repeat(60));
console.log(`분석 완료: ${new Date().toLocaleString('ko-KR')}`);
```