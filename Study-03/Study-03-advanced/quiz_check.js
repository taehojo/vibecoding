// Quiz validation script
const fs = require('fs');
const questionsContent = fs.readFileSync('questions.js', 'utf8');

// Extract quizQuestions from the file content
const quizQuestions = eval(questionsContent + '; quizQuestions');

console.log('📋 퀴즈 데이터 검증 결과');
console.log('========================');
console.log('✅ 총 문제 수:', quizQuestions.length);

// 카테고리별 집계
const categories = {};
quizQuestions.forEach(q => {
    if (!categories[q.category]) categories[q.category] = 0;
    categories[q.category]++;
});

console.log('\n📂 카테고리별 문제 수:');
Object.entries(categories).forEach(([cat, count]) => {
    console.log('  -', cat + ':', count + '문제');
});

// 중복 ID 검사
const ids = quizQuestions.map(q => q.id);
const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
if (duplicateIds.length > 0) {
    console.log('\n⚠️ 중복 ID 발견:', duplicateIds);
} else {
    console.log('\n✅ ID 중복 없음');
}

// 정답 범위 검사
const invalidAnswers = quizQuestions.filter(q => 
    q.correctAnswer < 0 || q.correctAnswer >= q.options.length
);
if (invalidAnswers.length > 0) {
    console.log('\n⚠️ 잘못된 정답 인덱스:', invalidAnswers.map(q => q.id));
} else {
    console.log('✅ 모든 정답 인덱스 정상');
}

// 난이도별 집계
const difficulties = {easy: 0, medium: 0, hard: 0};
quizQuestions.forEach(q => {
    if (difficulties.hasOwnProperty(q.difficulty)) {
        difficulties[q.difficulty]++;
    }
});

console.log('\n📊 난이도별 문제 수:');
Object.entries(difficulties).forEach(([diff, count]) => {
    const label = diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움';
    console.log('  -', label + ':', count + '문제');
});