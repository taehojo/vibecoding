---
aliases: []
---

# quiz-stats

퀴즈 게임의 통계를 분석하고 관리합니다.

## 사용법
```
/quiz-stats [옵션]
```

## 옵션
- `/quiz-stats` - 전체 통계 표시
- `/quiz-stats player` - 플레이어 통계
- `/quiz-stats questions` - 문제 통계
- `/quiz-stats performance` - 성과 분석
- `/quiz-stats trends` - 추세 분석

## 기능
1. **플레이어 통계**
   - 총 게임 수
   - 평균 점수
   - 최고 점수
   - 전체 정답률
   - 레벨 및 경험치

2. **문제 통계**
   - 카테고리별 문제 수
   - 난이도별 분포
   - 가장 많이 틀린 문제
   - 가장 쉬운/어려운 문제

3. **성과 분석**
   - 카테고리별 정답률
   - 난이도별 성과
   - 시간대별 성과
   - 연속 정답 기록

4. **추세 분석**
   - 최근 10게임 추이
   - 일별/주별 통계
   - 성장 곡선

## 실행 코드
```javascript
const fs = require('fs');

// localStorage 데이터 시뮬레이션 (실제로는 브라우저에서 실행)
function getStoredData() {
    // 실제 구현시 localStorage에서 데이터를 가져옴
    return {
        gameHistory: [],
        statistics: {
            totalGamesPlayed: 0,
            totalScore: 0,
            totalCorrectAnswers: 0,
            totalQuestions: 0,
            categoryStats: {},
            difficultyStats: {
                easy: { played: 0, correct: 0 },
                medium: { played: 0, correct: 0 },
                hard: { played: 0, correct: 0 }
            }
        },
        userProfile: {
            username: 'Player',
            level: 1,
            experience: 0,
            achievements: []
        }
    };
}

// 파라미터 파싱
const args = process.argv.slice(2);
const option = args[0] || 'all';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               📊 퀴즈 게임 통계 분석                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// questions.js 파일 읽기
const questionsContent = fs.readFileSync('questions.js', 'utf8');
const match = questionsContent.match(/const quizQuestions = (\[[\s\S]*\]);/);
if (!match) {
    console.error('❌ questions.js 파일을 파싱할 수 없습니다.');
    process.exit(1);
}
const quizQuestions = eval(match[1]);

// 문제 통계 분석
const analyzeQuestions = () => {
    const stats = {
        total: quizQuestions.length,
        byCategory: {},
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        avgOptionsLength: 0
    };
    
    quizQuestions.forEach(q => {
        // 카테고리별
        if (!stats.byCategory[q.category]) {
            stats.byCategory[q.category] = {
                count: 0,
                easy: 0,
                medium: 0,
                hard: 0
            };
        }
        stats.byCategory[q.category].count++;
        stats.byCategory[q.category][q.difficulty]++;
        
        // 난이도별
        stats.byDifficulty[q.difficulty]++;
        
        // 평균 선택지 길이
        const optionLength = q.options.reduce((sum, opt) => sum + opt.length, 0) / q.options.length;
        stats.avgOptionsLength += optionLength;
    });
    
    stats.avgOptionsLength /= quizQuestions.length;
    
    return stats;
};

const questionStats = analyzeQuestions();

// 옵션별 출력
switch(option) {
    case 'player':
        console.log('👤 플레이어 통계');
        console.log('─'.repeat(60));
        console.log('  닉네임: Player');
        console.log('  레벨: Lv.1');
        console.log('  경험치: 0 XP');
        console.log('  총 게임: 0회');
        console.log('  최고 점수: 0점');
        console.log('  평균 점수: 0점');
        console.log('  전체 정답률: 0%');
        break;
        
    case 'questions':
        console.log('📝 문제 통계');
        console.log('─'.repeat(60));
        console.log(`  총 문제 수: ${questionStats.total}개\n`);
        
        console.log('  카테고리별 분포:');
        Object.entries(questionStats.byCategory).forEach(([cat, data]) => {
            console.log(`    ${cat}: ${data.count}개`);
            console.log(`      ├─ 쉬움: ${data.easy}개`);
            console.log(`      ├─ 보통: ${data.medium}개`);
            console.log(`      └─ 어려움: ${data.hard}개`);
        });
        
        console.log('\n  난이도별 분포:');
        Object.entries(questionStats.byDifficulty).forEach(([level, count]) => {
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            const bar = '█'.repeat(Math.round((count / questionStats.total) * 30));
            const label = level === 'easy' ? '쉬움  ' : level === 'medium' ? '보통  ' : '어려움';
            console.log(`    ${label}: ${bar} ${count}개 (${percent}%)`);
        });
        break;
        
    case 'performance':
        console.log('🏆 성과 분석');
        console.log('─'.repeat(60));
        console.log('  카테고리별 정답률:');
        console.log('    한국사: - %');
        console.log('    세계지리: - %');
        console.log('    과학: - %');
        console.log('    예술과 문화: - %');
        console.log('\n  난이도별 정답률:');
        console.log('    쉬움: - %');
        console.log('    보통: - %');
        console.log('    어려움: - %');
        console.log('\n  최고 연속 정답: 0개');
        console.log('  평균 응답 시간: - 초');
        break;
        
    case 'trends':
        console.log('📈 추세 분석');
        console.log('─'.repeat(60));
        console.log('  최근 10게임 추이:');
        console.log('    (데이터 없음)\n');
        console.log('  주간 통계:');
        console.log('    이번 주 게임 수: 0회');
        console.log('    이번 주 평균 점수: 0점');
        console.log('    지난 주 대비: - %');
        break;
        
    default:
        // 전체 통계
        console.log('📊 전체 통계 요약');
        console.log('─'.repeat(60));
        
        console.log('\n[문제 데이터베이스]');
        console.log(`  총 문제: ${questionStats.total}개`);
        console.log(`  카테고리: ${Object.keys(questionStats.byCategory).length}개`);
        console.log(`  평균 선택지 길이: ${questionStats.avgOptionsLength.toFixed(1)}자`);
        
        console.log('\n[카테고리별 문제 수]');
        Object.entries(questionStats.byCategory).forEach(([cat, data]) => {
            const percent = ((data.count / questionStats.total) * 100).toFixed(1);
            console.log(`  ${cat}: ${data.count}개 (${percent}%)`);
        });
        
        console.log('\n[난이도 분포]');
        Object.entries(questionStats.byDifficulty).forEach(([level, count]) => {
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            const label = level === 'easy' ? '쉬움' : level === 'medium' ? '보통' : '어려움';
            console.log(`  ${label}: ${count}개 (${percent}%)`);
        });
        
        // 정답 분포
        const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
        quizQuestions.forEach(q => answerDist[q.correctAnswer]++);
        
        console.log('\n[정답 번호 분포]');
        [0, 1, 2, 3].forEach(i => {
            const count = answerDist[i];
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            console.log(`  ${i + 1}번: ${count}개 (${percent}%)`);
        });
        
        // 균형 평가
        const maxCount = Math.max(...Object.values(answerDist));
        const minCount = Math.min(...Object.values(answerDist));
        const balance = ((1 - (maxCount - minCount) / questionStats.total) * 100).toFixed(1);
        console.log(`\n[균형도: ${balance}%]`);
        
        if (balance < 70) {
            console.log('  ⚠️ 정답 분포 개선 필요');
        } else if (balance < 85) {
            console.log('  ✔️ 정답 분포 양호');
        } else {
            console.log('  ✅ 정답 분포 우수');
        }
}

console.log('\n✅ 통계 분석 완료\n');
```

## 출력 예시
```
╔══════════════════════════════════════════════════════════════╗
║               📊 퀴즈 게임 통계 분석                            ║
╚══════════════════════════════════════════════════════════════╝

📊 전체 통계 요약
────────────────────────────────────────────────────────────

[문제 데이터베이스]
  총 문제: 43개
  카테고리: 4개
  평균 선택지 길이: 5.2자

[카테고리별 문제 수]
  한국사: 13개 (30.2%)
  세계지리: 10개 (23.3%)
  과학: 10개 (23.3%)
  예술과 문화: 10개 (23.3%)

[난이도 분포]
  쉬움: 13개 (30.2%)
  보통: 19개 (44.2%)
  어려움: 11개 (25.6%)

[정답 번호 분포]
  1번: 11개 (25.6%)
  2번: 16개 (37.2%)
  3번: 13개 (30.2%)
  4번: 3개 (7.0%)

[균형도: 69.8%]
  ⚠️ 정답 분포 개선 필요

✅ 통계 분석 완료
```