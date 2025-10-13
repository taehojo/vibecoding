```js
// Quiz Validation Tool
// 사용법: /quiz-validate [카테고리]
// 카테고리를 지정하면 해당 카테고리만, 지정하지 않으면 전체 문제 검증

const fs = require('fs');
const path = require('path');

// questions.js 파일 읽기
const questionsPath = path.join(process.cwd(), 'questions.js');
let questionsContent = '';

try {
    questionsContent = fs.readFileSync(questionsPath, 'utf8');
} catch (error) {
    console.error('questions.js 파일을 읽을 수 없습니다:', error.message);
    process.exit(1);
}

// 카테고리 파라미터 처리
const category = '$ARGUMENTS'.trim();
const validateCategory = category || null;

// 애매한 표현 패턴들
const ambiguousPatterns = [
    { pattern: /가장/g, description: '최상급 표현', suggestions: ['측정 기준 명시 (예: 면적 기준, 인구 기준)'] },
    { pattern: /최초/g, description: '시간적 우선', suggestions: ['시점 명시 (예: 2024년 기준)', '지역 범위 명시'] },
    { pattern: /최대/g, description: '최댓값', suggestions: ['측정 단위 명시', '기준 시점 명시'] },
    { pattern: /최고/g, description: '최고 수준', suggestions: ['평가 기준 명시 (예: 권위, 규모, 등급)'] },
    { pattern: /최소/g, description: '최솟값', suggestions: ['측정 단위 명시', '포함 범위 명시'] },
    { pattern: /최다/g, description: '가장 많음', suggestions: ['집계 기준 명시', '시점 명시'] },
    { pattern: /최장/g, description: '가장 긴', suggestions: ['측정 방법 명시', '구간 기준 명시'] },
    { pattern: /최단/g, description: '가장 짧은', suggestions: ['측정 방법 명시', '조건 명시'] },
    { pattern: /가장.*큰/g, description: '크기 최상급', suggestions: ['크기 기준 명시 (예: 면적, 부피, 무게)'] },
    { pattern: /가장.*작은/g, description: '크기 최솟값', suggestions: ['크기 기준 명시 (예: 면적, 부피, 무게)'] },
    { pattern: /가장.*높은/g, description: '높이 최상급', suggestions: ['측정 기준 명시 (예: 해발고도, 지면 기준)'] },
    { pattern: /가장.*깊은/g, description: '깊이 최상급', suggestions: ['측정 기준 명시 (예: 최대 수심, 평균 수심)'] },
    { pattern: /가장.*많은/g, description: '수량 최상급', suggestions: ['집계 기준 명시 (예: 부피, 질량, 개수)'] }
];

// questions 배열 추출
let questions;
try {
    eval(questionsContent);
} catch (error) {
    console.error('questions.js 파싱 실패:', error.message);
    process.exit(1);
}

// 검증 결과 저장
const validationResults = [];
let totalQuestions = 0;
let problematicQuestions = 0;

// 카테고리별 또는 전체 문제 검증
questions.forEach((q, index) => {
    // 카테고리 필터링
    if (validateCategory && q.category !== validateCategory) {
        return;
    }
    
    totalQuestions++;
    const lineNumber = questionsContent.split(q.question)[0].split('\n').length;
    const issues = [];
    
    // 각 패턴 검사
    ambiguousPatterns.forEach(({ pattern, description, suggestions }) => {
        if (pattern.test(q.question)) {
            // 이미 기준이 명시되어 있는지 확인
            const hasCriteria = /\([^)]*기준[^)]*\)/.test(q.question) || 
                               /\([^)]*측정[^)]*\)/.test(q.question) ||
                               /\d{4}년/.test(q.question);
            
            if (!hasCriteria) {
                issues.push({
                    type: description,
                    match: q.question.match(pattern)[0],
                    suggestions: suggestions
                });
            }
        }
    });
    
    if (issues.length > 0) {
        problematicQuestions++;
        validationResults.push({
            lineNumber: lineNumber,
            category: q.category,
            question: q.question,
            answer: q.answer,
            issues: issues
        });
    }
});

// 보고서 생성
console.log('# 퀴즈 문제 검증 보고서\n');
console.log(`## 검증 범위: ${validateCategory || '전체 카테고리'}`);
console.log(`## 검증 일시: ${new Date().toISOString().split('T')[0]}\n`);

console.log('## 📊 검증 통계');
console.log(`- 검사한 문제 수: ${totalQuestions}개`);
console.log(`- 수정 필요 문제: ${problematicQuestions}개 (${(problematicQuestions/totalQuestions*100).toFixed(1)}%)`);
console.log(`- 정상 문제: ${totalQuestions - problematicQuestions}개\n`);

if (validationResults.length > 0) {
    console.log('## ⚠️ 기준 명시가 필요한 문제들\n');
    
    validationResults.forEach((result, idx) => {
        console.log(`### ${idx + 1}. [${result.category}] ${result.question}`);
        console.log(`📍 위치: 라인 ${result.lineNumber}`);
        console.log(`✅ 정답: ${result.answer}\n`);
        
        console.log('**발견된 문제점:**');
        result.issues.forEach(issue => {
            console.log(`- "${issue.match}" - ${issue.type}`);
        });
        
        console.log('\n**권장 수정사항:**');
        const allSuggestions = [...new Set(result.issues.flatMap(i => i.suggestions))];
        allSuggestions.forEach(suggestion => {
            console.log(`- ${suggestion}`);
        });
        
        // 수정 예시 제공
        console.log('\n**수정 예시:**');
        let modifiedQuestion = result.question;
        
        // 일반적인 수정 패턴 적용
        if (/가장.*큰/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (면적 기준)';
        } else if (/가장.*높은/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (해발고도 기준)';
        } else if (/가장.*깊은/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (최대 수심 기준)';
        } else if (/가장.*많은/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (부피 기준)';
        } else if (/최고/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion = modifiedQuestion.replace('최고', '최고위');
        } else if (/최초/.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (역사상)';
        }
        
        console.log(`"${modifiedQuestion}"\n`);
        console.log('---\n');
    });
} else {
    console.log('## ✅ 검증 결과\n');
    console.log('모든 문제가 명확한 기준을 가지고 있습니다! 🎉\n');
}

console.log('## 검증 기준\n');
console.log('다음 표현들을 포함한 문제를 검사했습니다:');
console.log('- 최상급 표현: 가장, 최초, 최대, 최고, 최소, 최다, 최장, 최단');
console.log('- 애매한 비교: 가장 큰, 가장 작은, 가장 높은, 가장 깊은, 가장 많은\n');

console.log('---');
console.log('*이 보고서는 CLAUDE.md의 퀴즈 문제 검증 가이드라인에 따라 작성되었습니다.*');
```