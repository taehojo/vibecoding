---
command: quiz-add
description: 퀴즈에 새 문제 추가
arguments:
  - name: category
    description: 문제 카테고리 (한국사/세계지리/과학/예술과문화)
    required: true
  - name: difficulty
    description: 난이도 (easy/medium/hard)
    required: true
---

```js
// Quiz Question Adder
// 사용법: /quiz-add [카테고리] [난이도]
// 예: /quiz-add 한국사 medium

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 파라미터 파싱
const args = process.argv.slice(2);
const category = args[0];
const difficulty = args[1];

// 유효한 카테고리와 난이도 확인
const validCategories = ['한국사', '세계지리', '과학', '예술과문화'];
const validDifficulties = ['easy', 'medium', 'hard'];

if (!category || !validCategories.includes(category)) {
    console.error('❌ 유효하지 않은 카테고리입니다.');
    console.log('   사용 가능한 카테고리: ' + validCategories.join(', '));
    process.exit(1);
}

if (!difficulty || !validDifficulties.includes(difficulty)) {
    console.error('❌ 유효하지 않은 난이도입니다.');
    console.log('   사용 가능한 난이도: easy, medium, hard');
    process.exit(1);
}

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

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 프롬프트 함수
const prompt = (question) => new Promise((resolve) => {
    rl.question(question, resolve);
});

// 검증 가이드라인 표시
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               📝 새 퀴즈 문제 추가                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📌 카테고리: ' + category);
console.log('📌 난이도: ' + difficulty + '\n');

console.log('⚠️  검증 가이드라인:');
console.log('1. 정답이 하나뿐인지 확인');
console.log('2. 최상급 표현에 기준 명시 (예: 면적 기준, 2024년 기준)');
console.log('3. 시간과 범위 명확히 (변할 수 있는 정보는 시점 명시)');
console.log('4. 의심스러운 정보는 2개 이상 출처 확인\n');

// 메인 함수
async function addNewQuestion() {
    try {
        // 문제 입력
        const question = await prompt('📝 문제를 입력하세요:\n> ');
        if (!question.trim()) {
            console.error('❌ 문제가 비어있습니다.');
            process.exit(1);
        }

        // 선택지 입력
        console.log('\n📋 4개의 선택지를 입력하세요:');
        const options = [];
        for (let i = 1; i <= 4; i++) {
            const option = await prompt(`  ${i}번 선택지: `);
            if (!option.trim()) {
                console.error('❌ 선택지가 비어있습니다.');
                process.exit(1);
            }
            options.push(option.trim());
        }

        // 정답 입력
        const correctAnswerInput = await prompt('\n✅ 정답 번호를 입력하세요 (1-4): ');
        const correctAnswer = parseInt(correctAnswerInput) - 1;
        
        if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
            console.error('❌ 유효하지 않은 정답 번호입니다.');
            process.exit(1);
        }

        // 설명 입력
        const explanation = await prompt('\n💡 정답 설명을 입력하세요:\n> ');
        if (!explanation.trim()) {
            console.error('❌ 설명이 비어있습니다.');
            process.exit(1);
        }

        // 새 문제 ID 계산
        const newId = Math.max(...quizQuestions.map(q => q.id)) + 1;

        // 새 문제 객체 생성
        const newQuestion = {
            id: newId,
            category: category,
            difficulty: difficulty,
            question: question.trim(),
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation.trim()
        };

        // 미리보기
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                    📋 새 문제 미리보기                          ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        
        console.log(`ID: ${newId}`);
        console.log(`카테고리: ${category}`);
        console.log(`난이도: ${difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}`);
        console.log(`\n문제: ${question.trim()}`);
        console.log('\n선택지:');
        options.forEach((opt, idx) => {
            const marker = idx === correctAnswer ? '✅' : '  ';
            console.log(`${marker} ${idx + 1}. ${opt}`);
        });
        console.log(`\n설명: ${explanation.trim()}`);

        // 확인
        const confirm = await prompt('\n이 문제를 추가하시겠습니까? (y/n): ');
        
        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ 추가가 취소되었습니다.');
            rl.close();
            return;
        }

        // questions.js 파일 업데이트
        // 카테고리별로 문제 그룹화
        const categorizedQuestions = {};
        quizQuestions.forEach(q => {
            if (!categorizedQuestions[q.category]) {
                categorizedQuestions[q.category] = [];
            }
            categorizedQuestions[q.category].push(q);
        });

        // 새 문제를 해당 카테고리에 추가
        if (!categorizedQuestions[category]) {
            categorizedQuestions[category] = [];
        }
        categorizedQuestions[category].push(newQuestion);

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

        // 현재 정답 분포 분석
        const updatedQuestions = [...quizQuestions, newQuestion];
        const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
        updatedQuestions.forEach(q => answerDist[q.correctAnswer]++);

        console.log('\n✅ 문제가 성공적으로 추가되었습니다!');
        console.log(`   총 문제 수: ${updatedQuestions.length}개`);
        console.log(`   ${category} 카테고리: ${categorizedQuestions[category].length}개\n`);
        
        // 정답 분포 표시
        console.log('📊 전체 정답 분포:');
        [0, 1, 2, 3].forEach(i => {
            const count = answerDist[i];
            const percent = (count / updatedQuestions.length * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(answerDist)) * 20));
            console.log(`   ${i + 1}번: ${bar} ${count}개 (${percent}%)`);
        });

        // 균형 평가
        const maxCount = Math.max(...Object.values(answerDist));
        const minCount = Math.min(...Object.values(answerDist));
        const diff = maxCount - minCount;

        if (diff > 4) {
            console.log('\n⚠️  정답 분포가 편향되어 있습니다. 균형 조정을 고려해보세요.');
            const lessUsed = Object.entries(answerDist)
                .filter(([k, v]) => v === minCount)
                .map(([k]) => parseInt(k) + 1);
            console.log(`   특히 ${lessUsed.join(', ')}번 선택지를 정답으로 하는 문제가 필요합니다.`);
        }

        rl.close();

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        rl.close();
        process.exit(1);
    }
}

// 실행
addNewQuestion();
```