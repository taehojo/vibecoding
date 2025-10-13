// 한국사 hard 난이도 문제 추가 스크립트
const fs = require('fs');
const path = require('path');

// questions.js 파일 읽기
const questionsPath = path.join(process.cwd(), 'questions.js');
const questionsContent = fs.readFileSync(questionsPath, 'utf8');

// questions 배열 추출
let quizQuestions;
eval(questionsContent);

// 새 문제 추가 (한국사 hard)
const newQuestion = {
    id: Math.max(...quizQuestions.map(q => q.id)) + 1,
    category: "한국사",
    difficulty: "hard",
    question: "조선 후기 세도정치 시대의 '삼정의 문란'에 포함되지 않는 것은?",
    options: ["전정", "군정", "환곡", "공납"],
    correctAnswer: 3,
    explanation: "삼정의 문란은 전정(토지세), 군정(군역), 환곡(환곡제)의 폐단을 지칭합니다. 공납은 대동법으로 이미 개혁되었습니다."
};

// 기존 문제에 새 문제 추가
quizQuestions.push(newQuestion);

// 카테고리별로 문제 그룹화
const categorizedQuestions = {};
quizQuestions.forEach(q => {
    if (!categorizedQuestions[q.category]) {
        categorizedQuestions[q.category] = [];
    }
    categorizedQuestions[q.category].push(q);
});

// 파일 내용 재구성
let newContent = 'const quizQuestions = [\n';

Object.entries(categorizedQuestions).forEach(([cat, questions], catIdx) => {
    if (catIdx > 0) newContent += '\n';
    newContent += `    // ${cat} (${questions.length}문제)\n`;
    
    questions.forEach((q, idx) => {
        newContent += '    {\n';
        newContent += `        id: ${q.id},\n`;
        newContent += `        category: "${q.category}",\n`;
        newContent += `        difficulty: "${q.difficulty}",\n`;
        newContent += `        question: "${q.question.replace(/"/g, '\\"')}",\n`;
        newContent += `        options: [`;
        newContent += q.options.map(opt => `"${opt.replace(/"/g, '\\"')}"`).join(', ');
        newContent += '],\n';
        newContent += `        correctAnswer: ${q.correctAnswer},\n`;
        newContent += `        explanation: "${q.explanation.replace(/"/g, '\\"')}"\n`;
        newContent += '    }';
        
        // 마지막 문제가 아니면 쉼표 추가
        if (idx < questions.length - 1 || catIdx < Object.keys(categorizedQuestions).length - 1) {
            newContent += ',';
        }
        newContent += '\n';
    });
});

newContent += '];\n';

// 파일 저장
fs.writeFileSync(questionsPath, newContent, 'utf8');

console.log('✅ 한국사 hard 문제가 추가되었습니다!');
console.log(`   문제 ID: ${newQuestion.id}`);
console.log(`   문제: ${newQuestion.question}`);
console.log(`   정답: ${newQuestion.options[newQuestion.correctAnswer]}`);