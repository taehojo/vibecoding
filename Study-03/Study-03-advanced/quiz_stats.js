// Quiz statistics script
const fs = require('fs');
const questionsContent = fs.readFileSync('questions.js', 'utf8');

// Extract quizQuestions from the file content
const quizQuestions = eval(questionsContent + '; quizQuestions');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                    📊 퀴즈 통계 분석                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 전체 통계
console.log('📈 전체 통계');
console.log('─────────────');
console.log(`총 문제 수: ${quizQuestions.length}개`);

// 카테고리별 통계
const categories = {};
quizQuestions.forEach(q => {
    if (!categories[q.category]) {
        categories[q.category] = {
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            answers: [0, 0, 0, 0]
        };
    }
    categories[q.category].total++;
    categories[q.category][q.difficulty]++;
    categories[q.category].answers[q.correctAnswer]++;
});

console.log('\n📚 카테고리별 상세 통계');
console.log('─────────────────────');
Object.entries(categories).forEach(([cat, stats]) => {
    console.log(`\n${cat} (${stats.total}문제)`);
    console.log(`  난이도: 쉬움 ${stats.easy}개 | 보통 ${stats.medium}개 | 어려움 ${stats.hard}개`);
    
    // 정답 분포
    const answerDist = stats.answers.map((count, idx) => 
        `${idx+1}번: ${count}개(${Math.round(count/stats.total*100)}%)`
    ).join(' | ');
    console.log(`  정답분포: ${answerDist}`);
});

// 전체 정답 분포
const totalAnswerDist = [0, 0, 0, 0];
quizQuestions.forEach(q => {
    totalAnswerDist[q.correctAnswer]++;
});

console.log('\n📊 전체 정답 분포');
console.log('───────────────');
const maxCount = Math.max(...totalAnswerDist);
totalAnswerDist.forEach((count, idx) => {
    const percent = Math.round(count / quizQuestions.length * 100);
    const bar = '█'.repeat(Math.round(count / maxCount * 30));
    const spaces = ' '.repeat(30 - bar.length);
    console.log(`  ${idx+1}번: ${bar}${spaces} ${count}개 (${percent}%)`);
});

// 균형 평가
const minCount = Math.min(...totalAnswerDist);
const diff = maxCount - minCount;

console.log('\n🎯 균형 평가');
console.log('───────────');
if (diff <= 2) {
    console.log('✅ 정답 분포가 매우 균형적입니다!');
} else if (diff <= 4) {
    console.log('✅ 정답 분포가 대체로 균형적입니다.');
} else {
    console.log('⚠️  정답 분포가 편향되어 있습니다.');
    const lessUsed = totalAnswerDist
        .map((count, idx) => ({ idx: idx + 1, count }))
        .filter(item => item.count === minCount)
        .map(item => item.idx);
    console.log(`   ${lessUsed.join(', ')}번 선택지를 정답으로 하는 문제를 추가하면 좋습니다.`);
}

// 난이도별 분포
const difficultyStats = { easy: 0, medium: 0, hard: 0 };
quizQuestions.forEach(q => {
    difficultyStats[q.difficulty]++;
});

console.log('\n📐 난이도 분포');
console.log('─────────────');
Object.entries(difficultyStats).forEach(([diff, count]) => {
    const percent = Math.round(count / quizQuestions.length * 100);
    const label = diff === 'easy' ? '쉬움  ' : diff === 'medium' ? '보통  ' : '어려움';
    const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(difficultyStats)) * 30));
    const spaces = ' '.repeat(30 - bar.length);
    console.log(`  ${label}: ${bar}${spaces} ${count}개 (${percent}%)`);
});

// 카테고리별 난이도 균형
console.log('\n🔄 카테고리별 난이도 균형');
console.log('────────────────────────');
Object.entries(categories).forEach(([cat, stats]) => {
    const easyPercent = Math.round(stats.easy / stats.total * 100);
    const mediumPercent = Math.round(stats.medium / stats.total * 100);
    const hardPercent = Math.round(stats.hard / stats.total * 100);
    console.log(`  ${cat}: 쉬움 ${easyPercent}% | 보통 ${mediumPercent}% | 어려움 ${hardPercent}%`);
});

console.log('\n════════════════════════════════════════════════════════════════');