#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 파일 경로
const questionsPath = path.join(process.cwd(), 'questions.js');

// 카테고리별 새 문제 템플릿 (배열 형식에 맞게)
const newQuestions = [
    {
        category: "한국사",
        difficulty: "hard",
        question: "조선시대 4대 사화 중 가장 마지막에 일어난 것은?",
        options: ["무오사화", "갑자사화", "기묘사화", "을사사화"],
        correctAnswer: 3,
        explanation: "을사사화(1545년)는 명종 때 일어난 마지막 사화입니다."
    },
    {
        category: "세계지리",
        difficulty: "medium",
        question: "아프리카 대륙에서 면적이 가장 큰 국가는? (2024년 기준)",
        options: ["나이지리아", "남아프리카공화국", "알제리", "이집트"],
        correctAnswer: 2,
        explanation: "알제리는 약 238만km²로 아프리카에서 가장 큰 국가입니다."
    },
    {
        category: "과학",
        difficulty: "easy",
        question: "광합성에 필요한 기체는?",
        options: ["산소", "이산화탄소", "질소", "수소"],
        correctAnswer: 1,
        explanation: "식물은 이산화탄소와 물, 빛을 이용해 광합성을 합니다."
    },
    {
        category: "예술과 문화",
        difficulty: "medium",
        question: "레오나르도 다빈치의 '최후의 만찬'이 그려진 도시는?",
        options: ["로마", "피렌체", "밀라노", "베네치아"],
        correctAnswer: 2,
        explanation: "최후의 만찬은 밀라노의 산타 마리아 델레 그라치에 수도원에 있습니다."
    }
];

console.log('📋 일일 퀴즈 관리 작업 시작\n');
console.log('='.repeat(50));

// 1. 퀴즈 파일 구조 분석
console.log('\n1️⃣ 퀴즈 파일 구조 분석 중...');
let fileStructure = null;
let existingQuestions = [];
try {
    const fileContent = fs.readFileSync(questionsPath, 'utf8');
    
    // 배열 형식인지 확인
    if (fileContent.includes('const quizQuestions = [')) {
        fileStructure = 'array';
        console.log('  ✅ 파일 형식: 배열');
        
        // 기존 문제 로드 - CommonJS export 처리
        delete require.cache[require.resolve(questionsPath)];
        const questionsModule = require(questionsPath);
        
        // 배열인지 객체인지 확인하여 적절히 처리
        if (Array.isArray(questionsModule)) {
            existingQuestions = questionsModule;
        } else if (questionsModule.quizQuestions) {
            existingQuestions = questionsModule.quizQuestions;
        } else if (questionsModule.default) {
            existingQuestions = questionsModule.default;
        } else {
            existingQuestions = questionsModule;
        }
        
        console.log('  ✅ 기존 문제 로드 완료');
    } else {
        fileStructure = 'object';
        console.log('  ✅ 파일 형식: 객체');
    }
} catch (error) {
    console.log('  ❌ 파일 구조 분석 실패:', error.message);
    console.log('  🛑 작업 중단');
    process.exit(1);
}

// 2. 현재 문제 현황 확인
console.log('\n2️⃣ 현재 문제 현황 확인...');
let categoryStats = {};
let difficultyStats = { easy: 0, medium: 0, hard: 0 };
try {
    existingQuestions.forEach(q => {
        // 카테고리별 집계
        if (!categoryStats[q.category]) {
            categoryStats[q.category] = 0;
        }
        categoryStats[q.category]++;
        
        // 난이도별 집계
        if (q.difficulty) {
            difficultyStats[q.difficulty]++;
        }
    });
    
    console.log(`  📊 전체: ${existingQuestions.length}문제`);
    console.log('  📂 카테고리별:');
    for (const [cat, count] of Object.entries(categoryStats)) {
        console.log(`    - ${cat}: ${count}문제`);
    }
    console.log('  📈 난이도별:');
    console.log(`    - 쉬움: ${difficultyStats.easy}문제`);
    console.log(`    - 보통: ${difficultyStats.medium}문제`);
    console.log(`    - 어려움: ${difficultyStats.hard}문제`);
} catch (error) {
    console.log('  ❌ 현황 확인 실패:', error.message);
    console.log('  🛑 작업 중단');
    process.exit(1);
}

// 3. 카테고리별 분석
console.log('\n3️⃣ 부족한 카테고리 분석...');
const targetCount = 15; // 카테고리당 목표 문제 수
let needsMore = [];
try {
    for (const [cat, count] of Object.entries(categoryStats)) {
        if (count < targetCount) {
            needsMore.push(cat);
            console.log(`  ⚠️ ${cat}: ${targetCount - count}문제 추가 필요`);
        }
    }
    if (needsMore.length === 0) {
        console.log('  ✅ 모든 카테고리 충분');
    }
} catch (error) {
    console.log('  ❌ 분석 실패:', error.message);
    console.log('  🛑 작업 중단');
    process.exit(1);
}

// 4. 중복 검증
console.log('\n4️⃣ 중복 검증 중...');
let duplicates = [];
try {
    for (const newQ of newQuestions) {
        const isDuplicate = existingQuestions.some(existQ => 
            existQ.question.toLowerCase() === newQ.question.toLowerCase()
        );
        if (isDuplicate) {
            duplicates.push(newQ.question);
            console.log(`  ⚠️ 중복 발견: "${newQ.question.substring(0, 30)}..."`);
        }
    }
    if (duplicates.length === 0) {
        console.log('  ✅ 중복 없음');
    } else {
        console.log(`  ❌ ${duplicates.length}개 중복 발견`);
        console.log('  🛑 작업 중단');
        process.exit(1);
    }
} catch (error) {
    console.log('  ❌ 중복 검증 실패:', error.message);
    console.log('  🛑 작업 중단');
    process.exit(1);
}

// 5. 문제 추가 및 형식 검증
console.log('\n5️⃣ 새 문제 추가 중...');
let addedQuestions = [];
try {
    // 새 ID 생성
    const maxId = Math.max(...existingQuestions.map(q => q.id || 0));
    
    // 각 새 문제에 ID 추가하고 검증
    newQuestions.forEach((q, index) => {
        // 형식 검증
        if (!q.question || !q.options || q.correctAnswer === undefined || !q.explanation) {
            throw new Error(`문제 ${index + 1}: 필수 필드 누락`);
        }
        if (q.options.length !== 4) {
            throw new Error(`문제 ${index + 1}: 옵션이 4개가 아님`);
        }
        if (q.correctAnswer < 0 || q.correctAnswer >= 4) {
            throw new Error(`문제 ${index + 1}: 정답 인덱스 오류`);
        }
        
        // ID 추가
        q.id = maxId + index + 1;
        addedQuestions.push(q);
        console.log(`  ✅ ${q.category}: "${q.question.substring(0, 30)}..." 추가`);
    });
    
    // 파일에 추가
    let fileContent = fs.readFileSync(questionsPath, 'utf8');
    
    // 배열 끝 찾기 (마지막 ]; 앞에 추가)
    const lastBracketIndex = fileContent.lastIndexOf('];');
    if (lastBracketIndex === -1) {
        throw new Error('파일 형식 오류: 배열 종료 지점을 찾을 수 없음');
    }
    
    // 새 문제들을 문자열로 변환
    const newQuestionsStr = addedQuestions.map(q => 
        `,
    {
        id: ${q.id},
        category: "${q.category}",
        difficulty: "${q.difficulty}",
        question: "${q.question}",
        options: ${JSON.stringify(q.options)},
        correctAnswer: ${q.correctAnswer},
        explanation: "${q.explanation}"
    }`
    ).join('');
    
    // 파일 업데이트
    fileContent = fileContent.substring(0, lastBracketIndex) + 
                  newQuestionsStr + 
                  fileContent.substring(lastBracketIndex);
    
    fs.writeFileSync(questionsPath, fileContent);
    console.log(`  📝 총 ${addedQuestions.length}문제 추가 완료`);
    
} catch (error) {
    console.log('  ❌ 문제 추가 실패:', error.message);
    console.log('  🛑 작업 중단');
    process.exit(1);
}

// 6. 백업 생성
console.log('\n6️⃣ 백업 생성 중...');
try {
    // 새로운 전체 문제 배열 생성 (기존 + 새 문제)
    const allQuestions = [...existingQuestions, ...addedQuestions];
    const date = new Date().toISOString().split('T')[0];
    const backupPath = `backup_questions_${date}.json`;
    
    fs.writeFileSync(backupPath, JSON.stringify(allQuestions, null, 2));
    console.log(`  💾 백업 완료: ${backupPath}`);
} catch (error) {
    console.log('  ❌ 백업 실패:', error.message);
    // 백업 실패는 치명적이지 않으므로 계속 진행
}

// 7. 실행 결과 상세 보고
console.log('\n7️⃣ 실행 결과 보고');
console.log('='.repeat(50));
console.log('\n📊 일일 퀴즈 관리 작업 요약\n');

try {
    const date = new Date().toLocaleString('ko-KR');
    const updatedQuestions = require(questionsPath);
    const updatedStats = {};
    const updatedDifficultyStats = { easy: 0, medium: 0, hard: 0 };
    
    // 업데이트된 통계 계산
    updatedQuestions.forEach(q => {
        if (!updatedStats[q.category]) {
            updatedStats[q.category] = 0;
        }
        updatedStats[q.category]++;
        
        if (q.difficulty) {
            updatedDifficultyStats[q.difficulty]++;
        }
    });
    
    console.log(`📅 작업 일시: ${date}`);
    console.log(`\n✅ 작업 완료 내역:`);
    console.log(`  • 파일 구조 분석: 완료 (${fileStructure})`);
    console.log(`  • 중복 검증: 통과`);
    console.log(`  • 형식 검증: 통과`);
    console.log(`  • 문제 추가: ${addedQuestions.length}개`);
    console.log(`  • 백업 생성: 완료`);
    
    console.log(`\n📈 변경 전후 비교:`);
    console.log(`  • 전체 문제: ${existingQuestions.length}개 → ${updatedQuestions.length}개 (+${addedQuestions.length})`);
    
    console.log(`\n📂 카테고리별 현황:`);
    for (const [cat, count] of Object.entries(updatedStats)) {
        const before = categoryStats[cat] || 0;
        const change = count - before;
        const changeStr = change > 0 ? ` (+${change})` : '';
        console.log(`  • ${cat}: ${count}개${changeStr}`);
    }
    
    console.log(`\n📊 난이도별 분포:`);
    console.log(`  • 쉬움: ${updatedDifficultyStats.easy}개`);
    console.log(`  • 보통: ${updatedDifficultyStats.medium}개`);
    console.log(`  • 어려움: ${updatedDifficultyStats.hard}개`);
    
    console.log(`\n🆕 추가된 문제 목록:`);
    addedQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.category}/${q.difficulty}] ${q.question.substring(0, 40)}...`);
    });
    
    console.log('\n✨ 일일 퀴즈 관리 작업이 성공적으로 완료되었습니다!\n');
    
} catch (error) {
    console.log('❌ 보고서 생성 중 오류:', error.message);
}

console.log('='.repeat(50));