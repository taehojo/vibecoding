#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'student_data.json');

if (!fs.existsSync(dataPath)) {
    console.log('⚠️ 학생 데이터 파일이 없습니다.');
    process.exit(1);
}

const allStudents = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sorted = [...allStudents].sort((a, b) => b.averageScore - a.averageScore);
const studentsToCompare = [...sorted.slice(0, 3), ...sorted.slice(-3)];

console.log('👥 학생 성적 비교 분석');
console.log('='.repeat(80));

// 기본 정보
console.log('\n📋 기본 정보');
console.log('─'.repeat(80));
console.log('학생명      | 반    | 평균점수 | 등급 | 퀴즈횟수');
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    console.log(
        `${student.name.padEnd(10)} | ` +
        `${student.class.padEnd(5)} | ` +
        `${String(student.averageScore).padStart(8)}점 | ` +
        `${student.grade.padStart(4)} | ` +
        `${String(student.quizHistory.length).padStart(8)}`
    );
});

// 카테고리별 비교
const categories = ["한국사", "세계지리", "과학", "예술과 문화"];
console.log('\n📊 카테고리별 평균 정답률');
console.log('─'.repeat(80));
console.log('학생명      | ' + categories.map(c => c.padEnd(10)).join(' | '));
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    const categoryAvg = {};
    categories.forEach(cat => {
        let total = 0, count = 0;
        student.quizHistory.forEach(quiz => {
            if (quiz.categoryScores[cat]) {
                total += quiz.categoryScores[cat].percentage;
                count++;
            }
        });
        categoryAvg[cat] = count > 0 ? Math.round(total / count) : 0;
    });
    
    console.log(
        `${student.name.padEnd(10)} | ` +
        categories.map(cat => `${categoryAvg[cat]}%`.padEnd(10)).join(' | ')
    );
});

// 강점/약점 분석
console.log('\n💡 개별 강점/약점 분석');
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    const categoryAvg = {};
    categories.forEach(cat => {
        let total = 0, count = 0;
        student.quizHistory.forEach(quiz => {
            if (quiz.categoryScores[cat]) {
                total += quiz.categoryScores[cat].percentage;
                count++;
            }
        });
        categoryAvg[cat] = count > 0 ? total / count : 0;
    });
    
    const sorted = Object.entries(categoryAvg).sort((a, b) => b[1] - a[1]);
    const strength = sorted[0][0];
    const weakness = sorted[sorted.length - 1][0];
    
    console.log(`${student.name.padEnd(10)} | 강점: ${strength} | 약점: ${weakness}`);
});

console.log('\n' + '='.repeat(80));