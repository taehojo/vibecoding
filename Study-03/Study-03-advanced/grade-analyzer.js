#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'student_data.json');

if (!fs.existsSync(dataPath)) {
    console.log('⚠️ 학생 데이터 파일이 없습니다. student-data-generator.js를 먼저 실행하세요.');
    process.exit(1);
}

const students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📊 성적 분석 보고서');
console.log('='.repeat(60));

// 전체 통계
const totalStudents = students.length;
const avgScore = students.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents;

console.log('\n📈 전체 통계');
console.log(`  • 총 학생 수: ${totalStudents}명`);
console.log(`  • 전체 평균 점수: ${avgScore.toFixed(1)}점`);

// 등급별 분포 (상대평가)
const gradeDistribution = { A: 0, B: 0, C: 0, D: 0 };
students.forEach(s => {
    if (s.grade && s.grade !== 'F') {
        gradeDistribution[s.grade]++;
    }
});

console.log('\n📊 등급별 분포 (상대평가)');
const gradeInfo = {
    A: '상위 20%',
    B: '상위 21-40%', 
    C: '상위 41-70%',
    D: '하위 30%'
};

Object.entries(gradeDistribution).forEach(([grade, count]) => {
    const percentage = (count / totalStudents * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`  ${grade} (${gradeInfo[grade]}): ${bar} ${count}명 (${percentage}%)`);
});

// 반별 평균
const classStat = {};
students.forEach(s => {
    if (!classStat[s.class]) {
        classStat[s.class] = { total: 0, count: 0 };
    }
    classStat[s.class].total += s.averageScore;
    classStat[s.class].count++;
});

console.log('\n🏫 반별 평균 성적');
Object.entries(classStat).forEach(([className, stat]) => {
    const classAvg = (stat.total / stat.count).toFixed(1);
    console.log(`  ${className}: ${classAvg}점 (${stat.count}명)`);
});

// 카테고리별 평균
const categoryStats = {};
students.forEach(student => {
    student.quizHistory.forEach(quiz => {
        Object.entries(quiz.categoryScores).forEach(([cat, score]) => {
            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, count: 0 };
            }
            categoryStats[cat].total += score.percentage;
            categoryStats[cat].count++;
        });
    });
});

console.log('\n📚 카테고리별 평균 정답률');
Object.entries(categoryStats).forEach(([cat, stat]) => {
    const catAvg = (stat.total / stat.count).toFixed(1);
    const bar = '▪'.repeat(Math.floor(catAvg / 5));
    console.log(`  ${cat}: ${bar} ${catAvg}%`);
});

// 상위/하위 학생
const sortedStudents = [...students].sort((a, b) => b.averageScore - a.averageScore);

console.log('\n🏆 상위 5명');
sortedStudents.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.class}): ${s.averageScore}점 [${s.grade}]`);
});

console.log('\n📌 하위 5명 (개선 필요)');
sortedStudents.slice(-5).reverse().forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.class}): ${s.averageScore}점 [${s.grade}]`);
});

console.log('\n' + '='.repeat(60));