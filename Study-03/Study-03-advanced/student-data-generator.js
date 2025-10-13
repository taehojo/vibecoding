#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 학생 이름 목록
const studentNames = [
    "김민준", "이서연", "박지호", "정수민", "최예진",
    "강현우", "조은서", "윤도현", "임하윤", "장서준",
    "권지우", "한승민", "오유진", "서민재", "신하은",
    "배준서", "송다은", "양현서", "홍지민", "문서영"
];

// 성적 데이터 생성
function generateStudentData() {
    const students = [];
    
    studentNames.forEach((name, index) => {
        const student = {
            id: `STU${String(index + 1).padStart(3, '0')}`,
            name: name,
            class: Math.floor(index / 5) + 1 + "반",
            quizHistory: []
        };
        
        // 각 학생당 5-10개의 퀴즈 기록 생성
        const quizCount = Math.floor(Math.random() * 6) + 5;
        
        for (let i = 0; i < quizCount; i++) {
            const quizDate = new Date();
            quizDate.setDate(quizDate.getDate() - (quizCount - i) * 2);
            
            const totalQuestions = 10;
            const correctAnswers = Math.floor(Math.random() * (totalQuestions - 2)) + 3;
            
            const categories = ["한국사", "세계지리", "과학", "예술과 문화"];
            const categoryScores = {};
            
            categories.forEach(cat => {
                const catQuestions = Math.floor(totalQuestions / categories.length);
                const catCorrect = Math.floor(Math.random() * (catQuestions + 1));
                categoryScores[cat] = {
                    total: catQuestions,
                    correct: catCorrect,
                    percentage: Math.round((catCorrect / catQuestions) * 100)
                };
            });
            
            student.quizHistory.push({
                date: quizDate.toISOString().split('T')[0],
                totalQuestions: totalQuestions,
                correctAnswers: correctAnswers,
                score: Math.round((correctAnswers / totalQuestions) * 100),
                timeSpent: Math.floor(Math.random() * 600) + 300,
                categoryScores: categoryScores,
                difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)]
            });
        }
        
        // 평균 성적 계산
        const avgScore = Math.round(
            student.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / student.quizHistory.length
        );
        student.averageScore = avgScore;
        
        // 등급은 나중에 상대평가로 부여
        student.grade = "TBD"; // To Be Determined
        
        students.push(student);
    });
    
    // 상대평가로 등급 부여
    students.sort((a, b) => b.averageScore - a.averageScore);
    
    const totalStudents = students.length;
    students.forEach((student, index) => {
        const percentRank = ((index + 1) / totalStudents) * 100;
        
        if (percentRank <= 20) {
            student.grade = "A"; // 상위 20%
        } else if (percentRank <= 40) {
            student.grade = "B"; // 상위 21-40%
        } else if (percentRank <= 70) {
            student.grade = "C"; // 상위 41-70%
        } else {
            student.grade = "D"; // 하위 30%
        }
    });
    
    return students;
}

// 실행
console.log('📚 학생 데이터 생성 중...\n');

const studentData = generateStudentData();
const dataPath = path.join(process.cwd(), 'student_data.json');

fs.writeFileSync(dataPath, JSON.stringify(studentData, null, 2));

console.log('✅ 학생 데이터 생성 완료');
console.log(`📊 총 ${studentData.length}명의 학생 데이터 생성`);
console.log(`💾 저장 위치: ${dataPath}\n`);

// 등급 분포 출력 (상대평가)
const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
studentData.forEach(s => gradeCount[s.grade]++);

console.log('📈 등급 분포 (상대평가):');
console.log(`  A등급 (상위 20%): ${gradeCount.A}명`);
console.log(`  B등급 (상위 21-40%): ${gradeCount.B}명`);
console.log(`  C등급 (상위 41-70%): ${gradeCount.C}명`);
console.log(`  D등급 (하위 30%): ${gradeCount.D}명`);

module.exports = { generateStudentData };